// Category and rule matching using AI
import { callAI } from './providers';
import type { RuleMatch, Message } from '@/lib/types/conversation';
import { db } from '@/lib/db';

/**
 * Detect jurisdiction from user message
 */
export async function detectJurisdiction(
  userMessage: string
): Promise<string | null> {
  const systemPrompt = `You are a jurisdiction detector for a regulatory compliance system.
Extract the city/jurisdiction from the user's message.
Return ONLY the jurisdiction name in format "City, State" (e.g., "Cincinnati, OH").
If no jurisdiction is mentioned, return "UNKNOWN".`;

  const response = await callAI(
    [{ role: 'user', content: userMessage }],
    {
      systemPrompt,
      temperature: 0,
      maxTokens: 50,
    }
  );

  const jurisdiction = response.content.trim();

  if (jurisdiction === 'UNKNOWN' || !jurisdiction.includes(',')) {
    return null;
  }

  // Verify jurisdiction exists in database
  const exists = await db.jurisdiction.findFirst({
    where: {
      name: {
        equals: jurisdiction,
        mode: 'insensitive',
      },
    },
  });

  return exists ? exists.name : null;
}

/**
 * Match user question to rule categories
 */
export async function matchCategory(
  userMessage: string,
  jurisdiction: string
): Promise<RuleMatch[]> {
  // Get available categories for this jurisdiction
  const rulesets = await db.ruleset.findMany({
    where: {
      jurisdiction: {
        name: jurisdiction,
      },
      isActive: true,
    },
    include: {
      rules: {
        select: {
          category: true,
          subcategory: true,
          canonicalQuestions: true,
          keywords: true,
          requiredInputs: true,
          key: true,
        },
      },
      jurisdiction: {
        select: {
          name: true,
        },
      },
    },
  });

  if (rulesets.length === 0) {
    return [];
  }

  // Build context for AI
  const categoriesContext = rulesets.map(ruleset => {
    const subcategories = new Set<string>();
    const examples = new Map<string, string[]>();

    ruleset.rules.forEach(rule => {
      if (rule.subcategory) {
        subcategories.add(rule.subcategory);
        if (!examples.has(rule.subcategory)) {
          examples.set(rule.subcategory, []);
        }
        if (rule.canonicalQuestions.length > 0) {
          examples.get(rule.subcategory)?.push(rule.canonicalQuestions[0]);
        }
      }
    });

    return {
      category: ruleset.category,
      subcategories: Array.from(subcategories),
      examples,
    };
  });

  const systemPrompt = `You are a regulatory question classifier for ${jurisdiction}.
Your job is to match user questions to the correct rule category and subcategory.

Available categories and subcategories:
${categoriesContext.map(cat => `
${cat.category}:
${Array.from(cat.subcategories).map(sub => {
  const exampleQuestions = cat.examples.get(sub) || [];
  return `  - ${sub}${exampleQuestions.length > 0 ? `\n    Examples: ${exampleQuestions.slice(0, 2).join('; ')}` : ''}`;
}).join('\n')}
`).join('\n')}

Respond with a JSON array of matches, ranked by confidence (0.0 to 1.0):
[
  {
    "category": "category_name",
    "subcategory": "subcategory_name",
    "confidence": 0.95,
    "reasoning": "brief explanation"
  }
]

Return empty array [] if no good match (confidence < 0.5).
Return up to 3 best matches.`;

  const response = await callAI(
    [{ role: 'user', content: `User question: "${userMessage}"` }],
    {
      systemPrompt,
      temperature: 0,
      maxTokens: 500,
      useProModel: false, // Use fast model for matching
    }
  );

  let matches;
  try {
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.error('Failed to parse AI category match response');
    return [];
  }

  // Enrich matches with required inputs from database
  const enrichedMatches: RuleMatch[] = [];

  for (const match of matches) {
    if (match.confidence < 0.5) continue;

    // Find rules for this category/subcategory
    const matchingRules = rulesets
      .find(rs => rs.category === match.category)
      ?.rules.filter(r => !match.subcategory || r.subcategory === match.subcategory);

    if (!matchingRules || matchingRules.length === 0) continue;

    // Collect all required inputs and rule keys
    const requiredInputsSet = new Set<string>();
    const ruleKeys: string[] = [];
    let canonicalQuestion = matchingRules[0]?.canonicalQuestions?.[0] || match.subcategory || match.category;

    matchingRules.forEach(rule => {
      ruleKeys.push(rule.key);
      rule.requiredInputs.forEach(input => requiredInputsSet.add(input));
    });

    enrichedMatches.push({
      category: match.category,
      subcategory: match.subcategory,
      confidence: match.confidence,
      requiredInputs: Array.from(requiredInputsSet),
      canonicalQuestion,
      ruleKeys,
    });
  }

  return enrichedMatches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Extract structured inputs from user message
 */
export async function extractInputs(
  userMessage: string,
  missingInputs: string[],
  context: { category?: string; subcategory?: string }
): Promise<Record<string, any>> {
  const systemPrompt = `You are extracting structured data from user responses.

Context: ${context.category || 'general'}${context.subcategory ? ` > ${context.subcategory}` : ''}

Required inputs to extract:
${missingInputs.map(input => `- ${input}`).join('\n')}

Extract any values you can find from the user's message.
Respond with JSON object mapping input names to values.
Only include inputs you found - omit missing ones.

Example:
{
  "fenceHeight": 6,
  "fenceLocation": "backyard",
  "propertyZone": "residential"
}

If you cannot extract any values, return empty object: {}`;

  const response = await callAI(
    [{ role: 'user', content: userMessage }],
    {
      systemPrompt,
      temperature: 0,
      maxTokens: 200,
    }
  );

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    console.error('Failed to parse input extraction response');
    return {};
  }
}

/**
 * Generate clarifying question for missing input
 */
export async function generateClarifyingQuestion(
  missingInput: string,
  context: {
    category?: string;
    subcategory?: string;
    jurisdiction?: string;
    collectedInputs?: Record<string, any>;
  }
): Promise<string> {
  const systemPrompt = `You are helping users answer regulatory compliance questions for ${context.jurisdiction || 'their jurisdiction'}.

Context:
- Category: ${context.category || 'unknown'}
- Subcategory: ${context.subcategory || 'unknown'}
- Already collected: ${JSON.stringify(context.collectedInputs || {})}

Generate a clear, friendly question to collect this missing input: "${missingInput}"

Requirements:
- Be conversational and helpful
- Be specific to the regulatory context
- Keep it under 20 words
- Don't use technical jargon
- Don't repeat information already collected

Return ONLY the question text, nothing else.`;

  const response = await callAI(
    [{ role: 'user', content: `Generate question for: ${missingInput}` }],
    {
      systemPrompt,
      temperature: 0.3, // Slight creativity for natural language
      maxTokens: 100,
    }
  );

  return response.content.trim();
}
