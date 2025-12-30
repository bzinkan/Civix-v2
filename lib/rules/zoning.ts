// Zoning-specific rule implementations
// This file contains the question definitions and input schemas for zoning regulations

import { z } from 'zod'

export const zoningQuestions = {
  fence_installation: {
    key: 'fence_installation',
    title: 'Can I install a fence at this property?',
    description: 'Check fence height, setback, and material requirements',
    category: 'zoning',
    inputSchema: z.object({
      location: z.enum(['front-yard', 'side-yard', 'back-yard']),
      height: z.number().min(1).max(20),
      material: z.enum(['wood', 'vinyl', 'chain-link', 'wrought-iron', 'other']),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().length(2),
      zoningDistrict: z.string().optional(),
    }),
    fields: [
      {
        name: 'location',
        label: 'Fence Location',
        type: 'select',
        options: [
          { value: 'front-yard', label: 'Front Yard' },
          { value: 'side-yard', label: 'Side Yard' },
          { value: 'back-yard', label: 'Back Yard' },
        ],
        required: true,
      },
      {
        name: 'height',
        label: 'Fence Height (feet)',
        type: 'number',
        min: 1,
        max: 20,
        required: true,
      },
      {
        name: 'material',
        label: 'Fence Material',
        type: 'select',
        options: [
          { value: 'wood', label: 'Wood' },
          { value: 'vinyl', label: 'Vinyl' },
          { value: 'chain-link', label: 'Chain Link' },
          { value: 'wrought-iron', label: 'Wrought Iron' },
          { value: 'other', label: 'Other' },
        ],
        required: true,
      },
      {
        name: 'address',
        label: 'Property Address',
        type: 'text',
        required: true,
      },
      {
        name: 'city',
        label: 'City',
        type: 'text',
        required: true,
      },
      {
        name: 'state',
        label: 'State',
        type: 'text',
        maxLength: 2,
        required: true,
      },
      {
        name: 'zoningDistrict',
        label: 'Zoning District (if known)',
        type: 'text',
        required: false,
      },
    ],
  },
} as const

export type ZoningQuestionKey = keyof typeof zoningQuestions
