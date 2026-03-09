import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import {
  dashboardQuerySchema,
  dashboardResponseSchema
} from './dashboard.schema'
import { DashboardController } from './dashboard.controller'

const messageSchema = z.object({ message: z.string() })

export class DashboardRoutes {
  public prefix_route = '/dashboard'
  private controller: DashboardController

  constructor() {
    this.controller = new DashboardController()
  }

  public routes = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
  ) => {
    const fastifyWithZod = fastify.withTypeProvider<ZodTypeProvider>()

    fastifyWithZod.get(
      '/summary',
      {
        preHandler: [fastify.authenticate],
        schema: {
          summary: 'Get dashboard summary',
          description:
            'Returns all necessary info for dashboard page based on user transactions.',
          tags: ['Dashboard'],
          querystring: dashboardQuerySchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: dashboardResponseSchema.describe(
                'Dashboard dynamically built data'
              )
            }),
            401: messageSchema
          }
        }
      },
      async (request, reply) => {
        const result = await this.controller.getSummary(request)
        reply.code(200).send(result)
      }
    )
  }
}
