import { z } from 'zod/v4'

export const createTransactionSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  category: z.string().min(1),
  value: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  description: z.string().optional()
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const filterTransactionSchema = z.object({
  type: z.enum(['receita', 'despesa']).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export const transactionIdSchema = z.object({
  id: z.string().uuid()
})

export const transactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['receita', 'despesa']),
  category: z.string(),
  value: z.union([z.string(), z.number()]),
  date: z.string(),
  description: z.string().nullable(),
  createdAt: z.date().nullable().optional()
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type FilterTransactionInput = z.infer<typeof filterTransactionSchema>
