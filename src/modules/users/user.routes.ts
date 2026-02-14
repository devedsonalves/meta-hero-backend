import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userSchema
} from './user.schema'
import { UserController } from './user.controller'
import { z } from 'zod/v4'

const messageSchema = z.object({ message: z.string() })

export class UserRoutes {
  public prefix_route = '/users'
  private controller: UserController

  constructor() {
    this.controller = new UserController()
  }

  public routes = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
  ) => {
    const fastifyWithZod = fastify.withTypeProvider<ZodTypeProvider>()

    fastifyWithZod.post(
      '/',
      {
        schema: {
          summary: 'Create user',
          description: 'Registers a new user in the system.',
          tags: ['Users'],
          body: createUserSchema,
          response: {
            201: z.object({
              message: z.string().describe('Success message'),
              data: userSchema.describe('The created user object')
            }),
            400: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.create(request)
    )

    fastifyWithZod.get(
      '/:id',
      {
        schema: {
          summary: 'Get user by ID',
          description: 'Retrieves details of a specific user.',
          tags: ['Users'],
          params: userIdSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: userSchema.describe('The user object')
            }),
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.findById(request)
    )

    fastifyWithZod.get(
      '/',
      {
        schema: {
          summary: 'List users',
          description: 'Returns a list of all registered users.',
          tags: ['Users'],
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: z.array(userSchema).describe('List of user objects')
            })
          }
        }
      },
      async (_request, _reply) => await this.controller.findAll()
    )

    fastifyWithZod.delete(
      '/:id',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Delete user',
          description:
            'Deletes a user account. Requires ownership of the account.',
          tags: ['Users'],
          params: userIdSchema,
          response: {
            204: messageSchema,
            403: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.deleteById(request)
    )

    fastifyWithZod.put(
      '/:id',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Update user',
          description:
            'Updates user profile information. Requires ownership of the account.',
          tags: ['Users'],
          params: userIdSchema,
          body: updateUserSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: userSchema.describe('The updated user object')
            }),
            403: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.update(request)
    )
  }
}
