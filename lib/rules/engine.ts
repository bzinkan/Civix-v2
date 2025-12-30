// Core rules engine - evaluates conditions and produces deterministic outcomes

import type {
  RuleCondition,
  ConditionGroup,
  RuleEvaluationResult,
  UserInputs,
  RuleOutcome,
} from '@/lib/types/rules'

export class RulesEngine {
  /**
   * Evaluate a single condition against user inputs
   */
  private evaluateCondition(
    condition: RuleCondition,
    inputs: UserInputs
  ): { passed: boolean; message?: string } {
    const fieldValue = inputs[condition.field]
    const { operator, value } = condition

    let passed = false

    switch (operator) {
      case 'equals':
        passed = fieldValue === value
        break
      case 'notEquals':
        passed = fieldValue !== value
        break
      case 'greaterThan':
        passed = Number(fieldValue) > Number(value)
        break
      case 'lessThan':
        passed = Number(fieldValue) < Number(value)
        break
      case 'in':
        passed = Array.isArray(value) && value.includes(fieldValue)
        break
      case 'notIn':
        passed = Array.isArray(value) && !value.includes(fieldValue)
        break
      case 'contains':
        passed = String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
        break
      case 'regex':
        passed = new RegExp(value).test(String(fieldValue))
        break
      default:
        throw new Error(`Unknown operator: ${operator}`)
    }

    return {
      passed,
      message: condition.message,
    }
  }

  /**
   * Evaluate a condition group (all/any logic)
   */
  private evaluateConditionGroup(
    group: ConditionGroup,
    inputs: UserInputs
  ): { passed: boolean; failedConditions: string[]; passedConditions: string[] } {
    const failedConditions: string[] = []
    const passedConditions: string[] = []

    for (const check of group.checks) {
      if ('type' in check) {
        // Nested group
        const result = this.evaluateConditionGroup(check, inputs)
        failedConditions.push(...result.failedConditions)
        passedConditions.push(...result.passedConditions)
      } else {
        // Single condition
        const result = this.evaluateCondition(check, inputs)
        if (result.passed) {
          passedConditions.push(result.message || `${check.field} ${check.operator} ${check.value}`)
        } else {
          failedConditions.push(result.message || `${check.field} ${check.operator} ${check.value}`)
        }
      }
    }

    const passed =
      group.type === 'all'
        ? failedConditions.length === 0
        : passedConditions.length > 0

    return { passed, failedConditions, passedConditions }
  }

  /**
   * Evaluate a single rule against user inputs
   */
  evaluateRule(
    rule: {
      key: string
      description: string
      outcome: RuleOutcome
      conditions: any
      citation?: string | null
      priority: number
    },
    inputs: UserInputs
  ): RuleEvaluationResult {
    const conditionGroup = rule.conditions as ConditionGroup
    const { passed, failedConditions, passedConditions } = this.evaluateConditionGroup(
      conditionGroup,
      inputs
    )

    return {
      outcome: rule.outcome as RuleOutcome,
      matched: passed,
      failedConditions,
      passedConditions,
      ruleKey: rule.key,
      description: rule.description,
      citation: rule.citation || undefined,
    }
  }

  /**
   * Determine final outcome from multiple rule evaluations
   * Priority order: PROHIBITED > RESTRICTED > CONDITIONAL > ALLOWED
   */
  determineOutcome(results: RuleEvaluationResult[]): RuleOutcome {
    const matchedResults = results.filter((r) => r.matched)

    if (matchedResults.length === 0) {
      return 'ALLOWED'
    }

    // Priority order
    if (matchedResults.some((r) => r.outcome === 'PROHIBITED')) {
      return 'PROHIBITED'
    }
    if (matchedResults.some((r) => r.outcome === 'RESTRICTED')) {
      return 'RESTRICTED'
    }
    if (matchedResults.some((r) => r.outcome === 'CONDITIONAL')) {
      return 'CONDITIONAL'
    }

    return 'ALLOWED'
  }

  /**
   * Generate human-readable rationale
   */
  generateRationale(outcome: RuleOutcome, results: RuleEvaluationResult[]): string {
    const matchedResults = results.filter((r) => r.matched)

    if (matchedResults.length === 0) {
      return 'No restrictions found. This action is allowed under current regulations.'
    }

    const primary = matchedResults[0]
    const failedCount = primary.failedConditions.length

    switch (outcome) {
      case 'PROHIBITED':
        return `This is prohibited under ${primary.description}. ${
          primary.citation ? `See ${primary.citation}.` : ''
        }`
      case 'RESTRICTED':
        return `This is restricted. ${primary.description}. ${
          primary.citation ? `Citation: ${primary.citation}.` : ''
        }`
      case 'CONDITIONAL':
        return `This is allowed with conditions. ${failedCount} requirement(s) must be met: ${primary.failedConditions.join(
          ', '
        )}. ${primary.citation ? `Citation: ${primary.citation}.` : ''}`
      case 'ALLOWED':
        return 'This is allowed under current regulations.'
      default:
        return 'Unable to determine outcome.'
    }
  }
}

export const rulesEngine = new RulesEngine()
