// Core types for the Civix rules engine

export type RuleOutcome = 'ALLOWED' | 'RESTRICTED' | 'PROHIBITED' | 'CONDITIONAL'

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'regex'

export interface RuleCondition {
  field: string
  operator: ConditionOperator
  value: any
  message?: string
}

export interface ConditionGroup {
  type: 'all' | 'any'
  checks: (RuleCondition | ConditionGroup)[]
}

export interface RuleEvaluationResult {
  outcome: RuleOutcome
  matched: boolean
  failedConditions: string[]
  passedConditions: string[]
  ruleKey: string
  description: string
  citation?: string
}

export interface DecisionResult {
  outcome: RuleOutcome
  rationale: string
  matchedRules: RuleEvaluationResult[]
  jurisdiction: {
    name: string
    state: string
  }
  category: string
  questionKey: string
}

export interface UserInputs {
  [key: string]: any
}
