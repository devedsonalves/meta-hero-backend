import { z } from 'zod/v4'

export const userSchema = z.object({
  id: z.string().describe('User unique identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email address'),
  authProvider: z
    .string()
    .describe('Authentication provider (local, google, etc.)'),
  createdAt: z.date().describe('Account creation date'),
  updatedAt: z.date().describe('Last account update date')
})

export const createUserSchema = z.object({
  email: z
    .string({ message: 'E-mail is required' })
    .email('Invalid E-mail')
    .min(1, 'E-mail is required')
    .describe('User email address'),
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required')
    .describe('User full name'),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long')
    .describe('User password (min 6 characters)')
})

export const userIdSchema = z.object({
  id: z
    .string({ message: 'ID is required' })
    .uuid('Invalid UUID format')
    .min(1, 'ID is required')
    .describe('User unique identifier')
})

export const updateUserSchema = createUserSchema.partial()

export type CreateUserInput = z.infer<typeof createUserSchema>
