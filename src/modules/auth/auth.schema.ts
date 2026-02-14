import { z } from 'zod/v4'

export const loginSchema = z.object({
  email: z
    .string({ message: 'E-mail is required' })
    .email('Invalid E-mail')
    .min(1, 'E-mail is required')
    .describe('User email address'),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long')
    .describe('User password (min 6 characters)')
})

export const messageResponseSchema = z.object({
  message: z.string().describe('Response message')
})

export const userResponseSchema = z.object({
  id: z.string().describe('User unique identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email'),
  createdAt: z.date().describe('Account creation date'),
  updatedAt: z.date().describe('Last account update date')
})

export type loginInput = z.infer<typeof loginSchema>
