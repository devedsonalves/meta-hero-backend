import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createRewardSchema,
  rewardIdSchema,
  rewardSchema,
  userRewardSchema
} from './reward.schema'
import { RewardController } from './reward.controller'
import { z } from 'zod/v4'

const messageSchema = z.object({ message: z.string() })

export class RewardRoutes {
  public prefix_route = '/rewards'
  private controller: RewardController

  constructor() {
    this.controller = new RewardController()
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
          summary: 'Create reward (Admin)',
          description: 'Registers a new reward in the system.',
          tags: ['Rewards'],
          body: createRewardSchema,
          response: {
            201: z.object({
              message: z.string().describe('Success message'),
              data: rewardSchema.describe('The created reward object')
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
        schema: {
          summary: 'List available rewards',
          description: 'Returns a list of all available rewards.',
          tags: ['Rewards'],
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: z.array(rewardSchema).describe('List of reward objects')
            })
          }
        }
      },
      async (_request, _reply) => await this.controller.listAll()
    )

    fastifyWithZod.post(
      '/:id/purchase',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Purchase reward',
          description: 'Acquires a specific reward for the current user.',
          tags: ['Rewards'],
          params: rewardIdSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: userRewardSchema.describe(
                'The record of the acquired reward'
              )
            }),
            401: messageSchema,
            404: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.purchase(request)
    )

    fastifyWithZod.get(
      '/mine',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'List user rewards',
          description:
            'Returns a list of rewards purchased by the current user.',
          tags: ['Rewards'],
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: z
                .array(userRewardSchema)
                .describe('List of user reward records')
            }),
            401: messageSchema
          }
        }
      },
      async (request, _reply) => await this.controller.userRewards(request)
    )
  }
}
