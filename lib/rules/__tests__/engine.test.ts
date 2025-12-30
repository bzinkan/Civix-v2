import { RulesEngine } from '../engine'
import type { RuleOutcome } from '@/lib/types/rules'

describe('RulesEngine', () => {
  let engine: RulesEngine

  beforeEach(() => {
    engine = new RulesEngine()
  })

  describe('evaluateRule', () => {
    it('should evaluate a simple equals condition correctly', () => {
      const rule = {
        key: 'test_rule',
        description: 'Test rule',
        outcome: 'ALLOWED' as RuleOutcome,
        conditions: {
          type: 'all' as const,
          checks: [
            {
              field: 'hasPermit',
              operator: 'equals' as const,
              value: true,
            },
          ],
        },
        citation: null,
        priority: 100,
      }

      const inputs = { hasPermit: true }
      const result = engine.evaluateRule(rule, inputs)

      expect(result.matched).toBe(true)
      expect(result.outcome).toBe('ALLOWED')
      expect(result.failedConditions).toHaveLength(0)
    })

    it('should fail when condition is not met', () => {
      const rule = {
        key: 'test_rule',
        description: 'Test rule',
        outcome: 'CONDITIONAL' as RuleOutcome,
        conditions: {
          type: 'all' as const,
          checks: [
            {
              field: 'hasPermit',
              operator: 'equals' as const,
              value: true,
              message: 'Permit is required',
            },
          ],
        },
        citation: null,
        priority: 100,
      }

      const inputs = { hasPermit: false }
      const result = engine.evaluateRule(rule, inputs)

      expect(result.matched).toBe(false)
      expect(result.failedConditions).toContain('Permit is required')
    })

    it('should evaluate "in" operator correctly', () => {
      const rule = {
        key: 'breed_check',
        description: 'Breed restriction',
        outcome: 'RESTRICTED' as RuleOutcome,
        conditions: {
          type: 'all' as const,
          checks: [
            {
              field: 'breed',
              operator: 'in' as const,
              value: ['pitbull', 'rottweiler', 'doberman'],
            },
          ],
        },
        citation: null,
        priority: 100,
      }

      const inputs = { breed: 'pitbull' }
      const result = engine.evaluateRule(rule, inputs)

      expect(result.matched).toBe(true)
      expect(result.outcome).toBe('RESTRICTED')
    })
  })

  describe('determineOutcome', () => {
    it('should prioritize PROHIBITED over other outcomes', () => {
      const results = [
        {
          outcome: 'ALLOWED' as RuleOutcome,
          matched: true,
          failedConditions: [],
          passedConditions: [],
          ruleKey: 'rule1',
          description: 'Rule 1',
        },
        {
          outcome: 'PROHIBITED' as RuleOutcome,
          matched: true,
          failedConditions: [],
          passedConditions: [],
          ruleKey: 'rule2',
          description: 'Rule 2',
        },
      ]

      const outcome = engine.determineOutcome(results)
      expect(outcome).toBe('PROHIBITED')
    })

    it('should return ALLOWED when no rules match', () => {
      const results = [
        {
          outcome: 'RESTRICTED' as RuleOutcome,
          matched: false,
          failedConditions: ['Failed check'],
          passedConditions: [],
          ruleKey: 'rule1',
          description: 'Rule 1',
        },
      ]

      const outcome = engine.determineOutcome(results)
      expect(outcome).toBe('ALLOWED')
    })
  })

  describe('generateRationale', () => {
    it('should generate rationale for PROHIBITED outcome', () => {
      const results = [
        {
          outcome: 'PROHIBITED' as RuleOutcome,
          matched: true,
          failedConditions: [],
          passedConditions: [],
          ruleKey: 'prohibition_rule',
          description: 'This activity is prohibited',
          citation: 'Code Section 123',
        },
      ]

      const rationale = engine.generateRationale('PROHIBITED', results)
      expect(rationale).toContain('prohibited')
      expect(rationale).toContain('Code Section 123')
    })

    it('should generate rationale for CONDITIONAL outcome', () => {
      const results = [
        {
          outcome: 'CONDITIONAL' as RuleOutcome,
          matched: true,
          failedConditions: ['Need permit', 'Need insurance'],
          passedConditions: [],
          ruleKey: 'conditional_rule',
          description: 'Allowed with conditions',
        },
      ]

      const rationale = engine.generateRationale('CONDITIONAL', results)
      expect(rationale).toContain('2 requirement(s)')
      expect(rationale).toContain('Need permit')
      expect(rationale).toContain('Need insurance')
    })
  })
})
