import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { AuthController } from './auth.controller'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  loginSchema,
  messageResponseSchema,
  userResponseSchema
} from './auth.schema'

export class AuthRoutes {
  public prefix_route = '/auth'
  private controller: AuthController

  constructor() {
    this.controller = new AuthController()
  }

  public routes = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
  ) => {
    const fastifyWithZod = fastify.withTypeProvider<ZodTypeProvider>()

    fastifyWithZod.post(
      '/login',
      {
        schema: {
          summary: 'Authenticate user',
          description:
            'Authenticates a user using email and password, returning tokens via cookies.',
          tags: ['Auth'],
          body: loginSchema,
          response: {
            200: messageResponseSchema,
            401: messageResponseSchema
          }
        }
      },
      (request, reply) => this.controller.login(request, reply)
    )

    fastifyWithZod.post(
      '/refresh',
      {
        schema: {
          summary: 'Refresh sessions',
          description:
            'Generates new access and refresh tokens using a valid refresh token cookie.',
          tags: ['Auth'],
          response: {
            200: messageResponseSchema,
            401: messageResponseSchema
          }
        }
      },
      (request, reply) => this.controller.refreshToken(request, reply)
    )

    fastifyWithZod.post(
      '/logout',
      {
        schema: {
          summary: 'Sign out',
          description:
            'Revokes the current refresh token and clears authentication cookies.',
          tags: ['Auth'],
          response: {
            200: messageResponseSchema
          }
        }
      },
      (request, reply) => this.controller.logout(request, reply)
    )

    fastifyWithZod.get(
      '/me',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Get session profile',
          description:
            'Returns the profile data of the currently authenticated user.',
          tags: ['Auth'],
          response: {
            200: userResponseSchema,
            401: messageResponseSchema,
            404: messageResponseSchema
          }
        }
      },
      (request, reply) => this.controller.getMe(request, reply)
    )

    fastifyWithZod.get(
      '/google/callback',
      {
        schema: {
          summary: 'Google OAuth Callback',
          description: 'Internal endpoint for Google OAuth2 redirection.',
          hide: true,
          tags: ['Auth']
        }
      },
      (request, reply) => this.controller.googleCallback(request, reply)
    )
  }
}
