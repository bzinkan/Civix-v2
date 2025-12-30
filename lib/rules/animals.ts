// Animal-specific rule implementations
// This file contains the question definitions and input schemas for animal regulations

import { z } from 'zod'

export const animalQuestions = {
  pitbull_ownership: {
    key: 'pitbull_ownership',
    title: 'Can I own a pitbull at this address?',
    description: 'Check if pitbull ownership is allowed in your jurisdiction',
    category: 'animals',
    inputSchema: z.object({
      breed: z.enum([
        'pitbull',
        'american-pit-bull-terrier',
        'staffordshire-bull-terrier',
        'american-staffordshire-terrier',
        'other',
      ]),
      hasPermit: z.boolean(),
      hasInsurance: z.boolean(),
      isSpayedNeutered: z.boolean(),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().length(2),
    }),
    fields: [
      {
        name: 'breed',
        label: 'Dog Breed',
        type: 'select',
        options: [
          { value: 'pitbull', label: 'Pitbull' },
          { value: 'american-pit-bull-terrier', label: 'American Pit Bull Terrier' },
          { value: 'staffordshire-bull-terrier', label: 'Staffordshire Bull Terrier' },
          { value: 'american-staffordshire-terrier', label: 'American Staffordshire Terrier' },
          { value: 'other', label: 'Other breed' },
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
        name: 'hasPermit',
        label: 'Do you have a breed-specific permit?',
        type: 'checkbox',
        required: true,
      },
      {
        name: 'hasInsurance',
        label: 'Do you have liability insurance?',
        type: 'checkbox',
        required: true,
      },
      {
        name: 'isSpayedNeutered',
        label: 'Is the animal spayed/neutered?',
        type: 'checkbox',
        required: true,
      },
    ],
  },
} as const

export type AnimalQuestionKey = keyof typeof animalQuestions
