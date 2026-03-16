import { z } from 'zod/v4'

export const createGoalSchema = z.object({
  name: z.string().min(1),
  targetValue: z.number().positive(),
  currentValue: z.number().nonnegative().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  categoryId: z.string().optional(),
  note: z.string().optional()
})

export const updateGoalSchema = createGoalSchema.partial()

export const filterGoalSchema = z.object({
  status: z.enum(['active', 'achieved', 'cancelled']).optional(),
  dueBefore: z.string().optional()
})

export const goalIdSchema = z.object({
  id: z.string().uuid()
})

export const goalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  targetValue: z.union([z.string(), z.number()]),
  currentValue: z.union([z.string(), z.number()]),
  dueDate: z.union([z.string(), z.date()]),
  status: z.enum(['active', 'achieved', 'cancelled']),
  categoryId: z.string().nullable().optional(),
  note: z.string().nullable(),
  progress: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  updatedAt: z.union([z.string(), z.date()]).nullable().optional()
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type FilterGoalInput = z.infer<typeof filterGoalSchema>
