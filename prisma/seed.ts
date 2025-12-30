import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample jurisdiction
  const jurisdiction = await prisma.jurisdiction.upsert({
    where: {
      name_state_county: {
        name: 'Denver',
        state: 'CO',
        county: 'Denver County',
      },
    },
    update: {},
    create: {
      name: 'Denver',
      type: 'city',
      state: 'CO',
      county: 'Denver County',
    },
  })

  console.log('Created jurisdiction:', jurisdiction.name)

  // Create animals ruleset
  const ruleset = await prisma.ruleset.upsert({
    where: {
      jurisdictionId_category_version: {
        jurisdictionId: jurisdiction.id,
        category: 'animals',
        version: 1,
      },
    },
    update: {},
    create: {
      jurisdictionId: jurisdiction.id,
      category: 'animals',
      version: 1,
      isActive: true,
    },
  })

  console.log('Created ruleset:', ruleset.category)

  // Create pitbull rule
  const pitbullRule = await prisma.rule.upsert({
    where: {
      rulesetId_key: {
        rulesetId: ruleset.id,
        key: 'pitbull_ownership',
      },
    },
    update: {},
    create: {
      rulesetId: ruleset.id,
      key: 'pitbull_ownership',
      description: 'Pitbull ownership regulations',
      outcome: 'CONDITIONAL',
      citation: 'Denver Municipal Code § 8-55',
      priority: 100,
      conditions: {
        type: 'all',
        checks: [
          {
            field: 'breed',
            operator: 'in',
            value: ['pitbull', 'american-pit-bull-terrier', 'staffordshire-bull-terrier'],
          },
          {
            field: 'hasPermit',
            operator: 'equals',
            value: true,
            message: 'Permit required for pitbull ownership',
          },
          {
            field: 'hasInsurance',
            operator: 'equals',
            value: true,
            message: 'Liability insurance required',
          },
          {
            field: 'isSpayedNeutered',
            operator: 'equals',
            value: true,
            message: 'Animal must be spayed/neutered',
          },
        ],
      },
    },
  })

  console.log('Created rule:', pitbullRule.key)
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
