// API endpoint for fetching jurisdictions

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const jurisdictions = await prisma.jurisdiction.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ jurisdictions })
  } catch (error) {
    console.error('Jurisdictions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jurisdictions' },
      { status: 500 }
    )
  }
}
