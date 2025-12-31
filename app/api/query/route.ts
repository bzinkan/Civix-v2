// API endpoint for processing queries
import { NextRequest, NextResponse } from 'next/server';
import { createConversation, loadConversation, processMessage } from '@/lib/ai/conversation';
import { checkUsageLimit, incrementUsage } from '@/lib/auth/usage-limiter';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, fingerprint } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user session (if logged in)
    const session = await getServerSession();
    const userId = session?.user?.id;

    // Check usage limits BEFORE processing
    const usageCheck = await checkUsageLimit(userId, fingerprint);

    if (!usageCheck.allowed) {
      return NextResponse.json({
        type: 'paywall',
        message: usageCheck.requiresAuth
          ? `You've used your ${usageCheck.limit} free queries. Sign up to continue!`
          : `You've reached your monthly limit of ${usageCheck.limit} queries. Upgrade to continue!`,
        remaining: usageCheck.remaining,
        limit: usageCheck.limit,
        resetDate: usageCheck.resetDate,
        requiresAuth: usageCheck.requiresAuth,
      });
    }

    // Load or create conversation
    let context;
    if (conversationId) {
      context = await loadConversation(conversationId);
      if (!context) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      context = await createConversation(userId, fingerprint);
    }

    // Process the message
    const response = await processMessage(context, message);

    // If we got a result (query completed), increment usage
    if (response.type === 'result') {
      await incrementUsage(userId, fingerprint);
    }

    // Return response with updated context
    return NextResponse.json({
      ...response,
      conversationId: context.conversationId,
      usage: {
        remaining: usageCheck.remaining - (response.type === 'result' ? 1 : 0),
        limit: usageCheck.limit,
      },
    });

  } catch (error: any) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const context = await loadConversation(conversationId);

    if (!context) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversationId: context.conversationId,
      jurisdiction: context.jurisdiction,
      category: context.category,
      messages: context.messages,
      status: context.status,
    });

  } catch (error: any) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
