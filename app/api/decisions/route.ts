// API endpoint for evaluating decisions

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rulesEngine } from '@/lib/rules/engine'
import type { DecisionResult, UserInputs } from '@/lib/types/rules'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jurisdictionId, category, questionKey, inputs } = body as {
      jurisdictionId: string
      category: string
      questionKey: string
      inputs: UserInputs
    }

    // Validate inputs
    if (!jurisdictionId || !category || !questionKey || !inputs) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get jurisdiction
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    })

    if (!jurisdiction) {
      return NextResponse.json(
        { error: 'Jurisdiction not found' },
        { status: 404 }
      )
    }

    // Get active ruleset for category
    const ruleset = await prisma.ruleset.findFirst({
      where: {
        jurisdictionId,
        category,
        isActive: true,
      },
      include: {
        rules: {
          orderBy: { priority: 'desc' },
        },
      },
    })

    if (!ruleset) {
      return NextResponse.json(
        { error: 'No active ruleset found for this jurisdiction and category' },
        { status: 404 }
      )
    }

    // Evaluate all rules
    const evaluationResults = ruleset.rules.map((rule) =>
      rulesEngine.evaluateRule(rule, inputs)
    )

    // Determine final outcome
    const finalOutcome = rulesEngine.determineOutcome(evaluationResults)
    const rationale = rulesEngine.generateRationale(finalOutcome, evaluationResults)

    // Save decision
    const decision = await prisma.decision.create({
      data: {
        jurisdictionId,
        category,
        questionKey,
        inputs,
        outcome: finalOutcome,
        rationale,
        matchedRules: evaluationResults,
      },
    })

    const result: DecisionResult = {
      outcome: finalOutcome,
      rationale,
      matchedRules: evaluationResults,
      jurisdiction: {
        name: jurisdiction.name,
        state: jurisdiction.state,
      },
      category,
      questionKey,
    }

    return NextResponse.json({
      success: true,
      decisionId: decision.id,
      result,
    })
  } catch (error) {
    console.error('Decision API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
