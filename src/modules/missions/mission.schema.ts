import { z } from 'zod/v4'

export const createMissionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  xpReward: z.number().int().positive().optional().default(10),
  isGlobal: z.boolean().optional().default(true)
})

export const assignMissionSchema = z.object({
  missionId: z.string().uuid()
})

export const filterUserMissionSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'completed', 'failed']).optional()
})

export const missionIdSchema = z.object({
  id: z.string().uuid()
})

export const missionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  difficulty: z.string(),
  xpReward: z.number(),
  isGlobal: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
})

export const userMissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  missionId: z.string().uuid(),
  status: z.enum(['assigned', 'in_progress', 'completed', 'failed']),
  progress: z.number(),
  meta: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  mission: missionSchema.optional()
})

export type CreateMissionInput = z.infer<typeof createMissionSchema>
export type AssignMissionInput = z.infer<typeof assignMissionSchema>
export type FilterUserMissionInput = z.infer<typeof filterUserMissionSchema>
