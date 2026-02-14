import { z } from 'zod/v4';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().default(''),
  JWT_SECRET: z.string().default('secret'),
  JWT_EXPIRATION: z.string().default('1d'),
  COOKIE_SECRET: z.string().default('secret'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default(''),
  FRONTEND_URL: z.string().default('http://localhost:5173')
});

export const env = envSchema.parse(process.env);
