// Conversation orchestration - the brain of the hybrid AI + deterministic system
import type { ConversationContext, ConversationResponse, Message } from '@/lib/types/conversation';
import { db } from '@/lib/db';
import { detectJurisdiction, matchCategory, extractInputs, generateClarifyingQuestion } from './matcher';
import { evaluateRules } from '@/lib/rules/evaluator';

/**
 * Process a user message in the conversation
 * This is the main entry point for the hybrid AI flow
 */
export async function processMessage(
  context: ConversationContext,
  userMessage: string
): Promise<ConversationResponse> {
  // Add user message to history
  const newMessage: Message = {
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  };
  context.messages.push(newMessage);

  // Save message to database
  await saveMessage(context.conversationId, newMessage);

  // STEP 1: Detect jurisdiction if not already set
  if (!context.jurisdiction) {
    const jurisdiction = await detectJurisdiction(userMessage);

    if (jurisdiction) {
      context.jurisdiction = jurisdiction;
      await updateConversation(context);

      // Continue processing with jurisdiction set
      return await processWithJurisdiction(context, userMessage);
    } else {
      // Ask for jurisdiction
      const response: ConversationResponse = {
        type: 'question',
        message: 'What city or municipality are you located in?',
        context,
      };

      await saveAssistantMessage(context, response.message);
      return response;
    }
  }

  return await processWithJurisdiction(context, userMessage);
}

/**
 * Process message when jurisdiction is known
 */
async function processWithJurisdiction(
  context: ConversationContext,
  userMessage: string
): Promise<ConversationResponse> {
  // STEP 2: Match to category if not already set
  if (!context.category) {
    const matches = await matchCategory(userMessage, context.jurisdiction!);

    if (matches.length === 0) {
      const response: ConversationResponse = {
        type: 'error',
        message: `I couldn't find any rules related to your question in ${context.jurisdiction}. Could you rephrase or ask about a different topic?`,
        context,
      };

      await saveAssistantMessage(context, response.message);
      return response;
    }

    // Single high-confidence match
    if (matches.length === 1 && matches[0].confidence > 0.85) {
      context.category = matches[0].category;
      context.subcategory = matches[0].subcategory;
      context.requiredInputs = matches[0].requiredInputs;

      await updateConversation(context);

      // Continue to input collection
      return await collectInputs(context, userMessage);
    }

    // Multiple possibilities - ask user to clarify
    if (matches.length > 1) {
      const response: ConversationResponse = {
        type: 'clarification',
        message: 'I found a few possibilities. Which best matches your question?',
        options: matches.slice(0, 3).map(m => m.canonicalQuestion),
        context,
      };

      await saveAssistantMessage(context, response.message);
      return response;
    }

    // Low confidence match - ask for confirmation
    const topMatch = matches[0];
    const response: ConversationResponse = {
      type: 'clarification',
      message: `Are you asking about ${topMatch.subcategory || topMatch.category}?`,
      options: ['Yes', 'No, something else'],
      context,
    };

    await saveAssistantMessage(context, response.message);
    return response;
  }

  // STEP 3: Collect required inputs
  return await collectInputs(context, userMessage);
}

/**
 * Collect required inputs through conversation
 */
async function collectInputs(
  context: ConversationContext,
  userMessage: string
): Promise<ConversationResponse> {
  // Extract any inputs from the current message
  const missingInputs = context.requiredInputs.filter(
    input => !(input in context.collectedInputs)
  );

  if (missingInputs.length > 0) {
    const extracted = await extractInputs(userMessage, missingInputs, {
      category: context.category,
      subcategory: context.subcategory,
    });

    // Merge extracted inputs
    context.collectedInputs = { ...context.collectedInputs, ...extracted };
    await updateConversation(context);

    // Check if we still have missing inputs
    const stillMissing = missingInputs.filter(
      input => !(input in context.collectedInputs)
    );

    if (stillMissing.length > 0) {
      // Ask for the next missing input
      const nextInput = stillMissing[0];
      const question = await generateClarifyingQuestion(nextInput, {
        category: context.category,
        subcategory: context.subcategory,
        jurisdiction: context.jurisdiction,
        collectedInputs: context.collectedInputs,
      });

      const response: ConversationResponse = {
        type: 'question',
        message: question,
        context,
      };

      await saveAssistantMessage(context, response.message);
      return response;
    }
  }

  // STEP 4: All inputs collected - hand off to deterministic engine!
  return await evaluateAndRespond(context);
}

/**
 * Evaluate rules using deterministic engine and return result
 */
async function evaluateAndRespond(
  context: ConversationContext
): Promise<ConversationResponse> {
  try {
    const result = await evaluateRules({
      jurisdiction: context.jurisdiction!,
      category: context.category!,
      subcategory: context.subcategory,
      inputs: context.collectedInputs,
    });

    // Mark conversation as completed
    context.status = 'completed';
    await updateConversation(context);

    // Save decision to database
    await db.decision.create({
      data: {
        jurisdictionId: result.jurisdictionId,
        category: context.category!,
        questionKey: context.subcategory || context.category!,
        inputs: context.collectedInputs,
        outcome: result.outcome,
        rationale: result.rationale,
        matchedRules: result.matchedRules,
        userId: context.userId,
      },
    });

    const response: ConversationResponse = {
      type: 'result',
      message: formatResultMessage(result.outcome, result.rationale),
      context,
      outcome: result.outcome as any,
      rationale: result.rationale,
      citations: result.citations,
    };

    await saveAssistantMessage(context, response.message);
    return response;

  } catch (error: any) {
    console.error('Rule evaluation failed:', error);

    const response: ConversationResponse = {
      type: 'error',
      message: 'I encountered an error evaluating the rules. Please try again or contact support.',
      context,
    };

    await saveAssistantMessage(context, response.message);
    return response;
  }
}

/**
 * Format result message based on outcome
 */
function formatResultMessage(outcome: string, rationale: string): string {
  const emoji = {
    ALLOWED: '✅',
    PROHIBITED: '❌',
    CONDITIONAL: '⚠️',
    RESTRICTED: '⚠️',
  }[outcome] || 'ℹ️';

  return `${emoji} **${outcome}**\n\n${rationale}`;
}

/**
 * Database helpers
 */
async function saveMessage(conversationId: string, message: Message) {
  await db.message.create({
    data: {
      conversationId,
      role: message.role,
      content: message.content,
      provider: message.provider,
      tokensUsed: message.tokensUsed,
      confidence: message.confidence,
    },
  });
}

async function saveAssistantMessage(context: ConversationContext, content: string) {
  const message: Message = {
    role: 'assistant',
    content,
    provider: context.primaryProvider,
    timestamp: new Date(),
  };

  context.messages.push(message);
  await saveMessage(context.conversationId, message);
}

async function updateConversation(context: ConversationContext) {
  await db.conversation.update({
    where: { id: context.conversationId },
    data: {
      jurisdiction: context.jurisdiction,
      category: context.category,
      subcategory: context.subcategory,
      collectedInputs: context.collectedInputs,
      status: context.status,
      updatedAt: new Date(),
      completedAt: context.status === 'completed' ? new Date() : null,
    },
  });
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId?: string,
  fingerprint?: string
): Promise<ConversationContext> {
  const conversation = await db.conversation.create({
    data: {
      userId,
      fingerprint,
      collectedInputs: {},
      status: 'active',
    },
  });

  return {
    conversationId: conversation.id,
    userId,
    fingerprint,
    collectedInputs: {},
    requiredInputs: [],
    messages: [],
    primaryProvider: 'gemini',
    fallbackUsed: false,
    status: 'active',
  };
}

/**
 * Load existing conversation from database
 */
export async function loadConversation(conversationId: string): Promise<ConversationContext | null> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  return {
    conversationId: conversation.id,
    userId: conversation.userId || undefined,
    fingerprint: conversation.fingerprint || undefined,
    jurisdiction: conversation.jurisdiction || undefined,
    category: conversation.category || undefined,
    subcategory: conversation.subcategory || undefined,
    collectedInputs: (conversation.collectedInputs as Record<string, any>) || {},
    requiredInputs: [], // Will be populated when category is matched
    messages: conversation.messages.map(m => ({
      role: m.role as any,
      content: m.content,
      provider: m.provider as any,
      tokensUsed: m.tokensUsed || undefined,
      confidence: m.confidence || undefined,
      timestamp: m.createdAt,
    })),
    primaryProvider: conversation.primaryProvider as any,
    fallbackUsed: conversation.fallbackUsed,
    status: conversation.status as any,
  };
}
