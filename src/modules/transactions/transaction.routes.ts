import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createTransactionSchema,
  updateTransactionSchema,
  filterTransactionSchema,
  transactionIdSchema,
  transactionSchema
} from './transaction.schema'
import { TransactionController } from './transaction.controller'
import { z } from 'zod/v4'

const messageSchema = z.object({ message: z.string() })

export class TransactionRoutes {
  public prefix_route = '/transactions'
  private controller: TransactionController

  constructor() {
    this.controller = new TransactionController()
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
          summary: 'Create transaction',
          description: 'Registers a new transaction in the system.',
          tags: ['Transactions'],
          body: createTransactionSchema,
          response: {
            201: z.object({
              message: z.string().describe('Success message'),
              data: transactionSchema.describe('The created transaction object')
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
          summary: 'List transactions',
          description:
            'Returns a list of all transactions for the current user.',
          tags: ['Transactions'],
          querystring: filterTransactionSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: z
                .array(transactionSchema)
                .describe('List of transaction objects')
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
          summary: 'Get transaction by ID',
          description: 'Retrieves details of a specific transaction.',
          tags: ['Transactions'],
          params: transactionIdSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: transactionSchema.describe('The transaction object')
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
          summary: 'Update transaction',
          description: 'Updates a specific transaction.',
          tags: ['Transactions'],
          params: transactionIdSchema,
          body: updateTransactionSchema,
          response: {
            200: z.object({
              message: z.string().describe('Success message'),
              data: transactionSchema.describe('The updated transaction object')
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
          summary: 'Delete transaction',
          description: 'Deletes a specific transaction.',
          tags: ['Transactions'],
          params: transactionIdSchema,
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
