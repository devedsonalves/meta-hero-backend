import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'

import { authenticate } from './hooks'
import { setAuthCookies, clearAuthCookies } from './utils'
import { OAuth2Namespace } from '@fastify/oauth2'
import { AppError } from '@/core/errors/app-error'

export interface AuthPluginOptions {
  jwtSecret: string
  accessTokenName: string
  refreshTokenName: string
  cookiePath?: string
}

async function authPlugin(server: FastifyInstance, options: AuthPluginOptions) {
  if (!options.jwtSecret) {
    throw new AppError('JWT secret is required', 401)
  }

  await server.register(fastifyCookie)

  await server.register(fastifyJwt, {
    secret: options.jwtSecret,
    cookie: {
      cookieName: options.accessTokenName,
      signed: false
    }
  })

  server.decorate('config', {
    ...server.config,
    ACCESS_TOKEN_NAME: options.accessTokenName,
    REFRESH_TOKEN_NAME: options.refreshTokenName
  })

  server.decorate('authenticate', authenticate)

  server.decorateReply('setAuthCookies', function (tokens) {
    setAuthCookies(this, tokens, {
      accessTokenName: options.accessTokenName,
      refreshTokenName: options.refreshTokenName,
      path: options.cookiePath
    })
  })

  server.decorateReply('clearAuthCookies', function () {
    clearAuthCookies(this, {
      accessTokenName: options.accessTokenName,
      refreshTokenName: options.refreshTokenName,
      path: options.cookiePath
    })
  })
}

export default fastifyPlugin(authPlugin)

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      ACCESS_TOKEN_NAME: string
      REFRESH_TOKEN_NAME: string
    }
    authenticate: typeof authenticate
  }
  interface FastifyReply {
    setAuthCookies: (tokens: {
      accessToken: string
      refreshToken: string
    }) => void
    clearAuthCookies: () => void
  }
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
}
