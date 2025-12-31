// Conversation and AI types

export type AIProvider = 'gemini' | 'anthropic' | 'openai';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
  provider?: AIProvider;
  tokensUsed?: number;
  confidence?: number;
  timestamp?: Date;
}

export interface ConversationContext {
  conversationId: string;
  userId?: string;
  fingerprint?: string;

  // Conversation state
  jurisdiction?: string;
  category?: string;
  subcategory?: string;
  collectedInputs: Record<string, any>;
  requiredInputs: string[];

  // Message history
  messages: Message[];

  // AI tracking
  primaryProvider: AIProvider;
  fallbackUsed: boolean;

  // Status
  status: 'active' | 'completed' | 'abandoned';
}

export interface RuleMatch {
  category: string;
  subcategory?: string;
  confidence: number;
  requiredInputs: string[];
  canonicalQuestion: string;
  ruleKeys: string[];
}

export interface ConversationResponse {
  type: 'question' | 'clarification' | 'result' | 'error' | 'paywall';
  message: string;
  options?: string[];
  context: ConversationContext;

  // For result type
  outcome?: 'ALLOWED' | 'PROHIBITED' | 'CONDITIONAL' | 'RESTRICTED';
  rationale?: string;
  citations?: CitationData[];

  // For paywall
  pricingOptions?: PricingOption[];
}

export interface CitationData {
  ordinanceNumber: string;
  section: string;
  title?: string;
  text: string;
  url?: string;
  pageNumber?: number;
}

export interface PricingOption {
  type: 'one-time' | 'subscription';
  price: number;
  label: string;
  description?: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  tokensUsed?: number;
  confidence?: number;
  error?: string;
}

export interface InputExtractionResult {
  extracted: Record<string, any>;
  missingInputs: string[];
  confidence: number;
}
