import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createGoalSchema,
  updateGoalSchema,
  filterGoalSchema,
  goalIdSchema,
  goalSchema
} from './goal.schema'
import { GoalController } from './goal.controller'
import { z } from 'zod/v4'

const messageSchema = z.object({ message: z.string() })

export class GoalRoutes {
  public prefix_route = '/goals'
  private controller: GoalController

  constructor() {
    this.controller = new GoalController()
  }

  public routes = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
  ) => {
    const fastifyWithZod = fastify.withTypeProvider<ZodTypeProvider>()

    fastifyWithZod.post(
      '/',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Create goal',
          description: 'Registers a new goal in the system.',
          tags: ['Goals'],
          body: createGoalSchema,
          response: {
            201: z.object({
              message: z.string().describe('Success message'),
              data: goalSchema.describe('The created goal object')
            }),
            401: messageSchema
          }
        }
      },
      async (request, reply) => {
        const result = await this.controller.create(request)
        reply.code(201).send(result)
      }
    )

    fastifyWithZod.get(
      '/',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'List goals',
          description: 'Returns a list of all goals for the current user.',
          tags: ['Goals'],
          querystring: filterGoalSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: z.array(goalSchema).describe('List of goal objects')
            }),
            401: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.findAll(request)
    )

    fastifyWithZod.get(
      '/:id',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Get goal by ID',
          description: 'Retrieves details of a specific goal.',
          tags: ['Goals'],
          params: goalIdSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: goalSchema.describe('The goal object')
            }),
            401: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.findById(request)
    )

    fastifyWithZod.put(
      '/:id',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Update goal',
          description: 'Updates a specific goal.',
          tags: ['Goals'],
          params: goalIdSchema,
          body: updateGoalSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: goalSchema.describe('The updated goal object')
            }),
            401: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.update(request)
    )

    fastifyWithZod.delete(
      '/:id',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Delete goal',
          description: 'Deletes a specific goal.',
          tags: ['Goals'],
          params: goalIdSchema,
          response: {
            200: messageSchema,
            401: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.delete(request)
    )
  }
}
