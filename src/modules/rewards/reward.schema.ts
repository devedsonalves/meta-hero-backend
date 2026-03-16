import { z } from 'zod/v4'

export const createRewardSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().positive(),
  icon: z.string().optional()
})

export const rewardIdSchema = z.object({
  id: z.string().uuid()
})

export const rewardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  cost: z.union([z.string(), z.number()]),
  icon: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
})

export const userRewardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  rewardId: z.string().uuid(),
  acquiredAt: z.union([z.string(), z.date()]),
  reward: rewardSchema.optional()
})

export type CreateRewardInput = z.infer<typeof createRewardSchema>
