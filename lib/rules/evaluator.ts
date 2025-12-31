// Bridge between AI conversation and deterministic rules engine
import { db } from '@/lib/db';
import { rulesEngine } from './engine';

export interface EvaluationRequest {
  jurisdiction: string;
  category: string;
  subcategory?: string;
  inputs: Record<string, any>;
}

export interface EvaluationResult {
  outcome: 'ALLOWED' | 'PROHIBITED' | 'CONDITIONAL' | 'RESTRICTED';
  rationale: string;
  matchedRules: any[];
  citations: any[];
  jurisdictionId: string;
}

/**
 * Main evaluation function - called after AI conversation collects all inputs
 */
export async function evaluateRules(request: EvaluationRequest): Promise<EvaluationResult> {
  const { jurisdiction, category, subcategory, inputs } = request;

  // Find jurisdiction
  const jurisdictionRecord = await db.jurisdiction.findFirst({
    where: {
      name: {
        equals: jurisdiction,
        mode: 'insensitive',
      },
    },
  });

  if (!jurisdictionRecord) {
    throw new Error(`Jurisdiction not found: ${jurisdiction}`);
  }

  // Find ruleset
  const ruleset = await db.ruleset.findFirst({
    where: {
      jurisdictionId: jurisdictionRecord.id,
      category,
      isActive: true,
    },
    include: {
      rules: {
        where: subcategory
          ? { subcategory }
          : {},
        include: {
          citations: true,
        },
      },
    },
  });

  if (!ruleset || ruleset.rules.length === 0) {
    throw new Error(`No rules found for ${category} in ${jurisdiction}`);
  }

  // Evaluate each rule using the deterministic engine
  const results = ruleset.rules.map(rule => {
    return rulesEngine.evaluateRule(rule, inputs);
  });

  // Determine final outcome
  const outcome = rulesEngine.determineOutcome(results);

  // Generate rationale
  const rationale = rulesEngine.generateRationale(outcome, results);

  // Collect matched rules and citations
  const matchedRules = results
    .filter(r => r.matched)
    .map(r => ({
      key: r.ruleKey,
      description: r.description,
      outcome: r.outcome,
      citation: r.citation,
    }));

  const citations = ruleset.rules
    .filter(rule => results.find(r => r.ruleKey === rule.key && r.matched))
    .flatMap(rule => rule.citations)
    .map(citation => ({
      ordinanceNumber: citation.ordinanceNumber,
      section: citation.section,
      title: citation.title || undefined,
      text: citation.text,
      url: citation.url || undefined,
      pageNumber: citation.pageNumber || undefined,
    }));

  return {
    outcome,
    rationale,
    matchedRules,
    citations,
    jurisdictionId: jurisdictionRecord.id,
  };
}
