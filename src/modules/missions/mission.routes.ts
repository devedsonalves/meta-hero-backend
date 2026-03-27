import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createMissionSchema,
  assignMissionSchema,
  filterUserMissionSchema,
  missionIdSchema,
  userMissionSchema,
  missionSchema
} from './mission.schema'
import { MissionController } from './mission.controller'
import { z } from 'zod/v4'

const messageSchema = z.object({ message: z.string() })

export class MissionRoutes {
  public prefix_route = '/missions'
  private controller: MissionController

  constructor() {
    this.controller = new MissionController()
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
          summary: 'Create mission (Admin)',
          description: 'Registers a new mission in the system.',
          tags: ['Missions'],
          body: createMissionSchema,
          response: {
            201: z.object({
              message: z.string().describe('Success message'),
              data: missionSchema.describe('The created mission object')
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

    fastifyWithZod.post(
      '/assign',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Assign mission to user',
          description: 'Assigns a specific mission to the current user.',
          tags: ['Missions'],
          body: assignMissionSchema,
          response: {
            201: z.object({
              message: z.string().describe('Success message'),
              data: userMissionSchema.describe(
                'The assigned user mission object'
              )
            }),
            401: messageSchema
          }
        }
      },
      async (request, reply) => {
        const result = await this.controller.assign(request)
        reply.code(201).send(result)
      }
    )

    fastifyWithZod.get(
      '/',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'List user missions',
          description:
            'Returns a list of all missions assigned to the current user.',
          tags: ['Missions'],
          querystring: filterUserMissionSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: z
                .array(userMissionSchema)
                .describe('List of user mission objects')
            }),
            401: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.findAll(request)
    )

    fastifyWithZod.post(
      '/:id/complete',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Mark mission as completed',
          description: 'Marks a user mission as completed and rewards XP.',
          tags: ['Missions'],
          params: missionIdSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: userMissionSchema.describe(
                'The completed user mission object'
              )
            }),
            401: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.complete(request)
    )
  }
}
