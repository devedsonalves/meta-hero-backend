import { env } from '@/config/env'
import { FastifyReply } from 'fastify'

interface ICookieOptions {
  accessTokenName: string
  refreshTokenName: string
  path?: string
}

export function setAuthCookies(
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string },
  options: ICookieOptions
): void {
  const { accessToken, refreshToken } = tokens
  const { accessTokenName, refreshTokenName, path = '/' } = options

  reply.setCookie(accessTokenName, accessToken, {
    path,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  reply.setCookie(refreshTokenName, refreshToken, {
    path: path,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
}

export function clearAuthCookies(
  reply: FastifyReply,
  options: ICookieOptions
): void {
  const { accessTokenName, refreshTokenName, path = '/' } = options

  reply.clearCookie(accessTokenName, { path })
  reply.clearCookie(refreshTokenName, { path })
}
