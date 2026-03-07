import { FastifyRequest } from 'fastify'
import { TransactionService } from './transaction.service'
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  FilterTransactionInput
} from './transaction.schema'
import { ITransaction } from './transaction.types'

export class TransactionController {
  private service: TransactionService

  constructor() {
    this.service = new TransactionService()
  }

  public async create(
    request: FastifyRequest
  ): Promise<{ message: string; data: ITransaction }> {
    const { type, category, value, date, description } =
      request.body as CreateTransactionInput
    const userId = (request.user as { sub: string }).sub

    const transaction = await this.service.create(userId, {
      type,
      category,
      value,
      date,
      description
    })

    return {
      message: 'Transaction created successfully',
      data: transaction
    }
  }

  public async findAll(
    request: FastifyRequest
  ): Promise<{ message: string; data: ITransaction[] }> {
    const filters = request.query as FilterTransactionInput
    const userId = (request.user as { sub: string }).sub

    const transactions = await this.service.findAllByUserId(userId, filters)

    return {
      message: 'Transactions retrieved successfully',
      data: transactions
    }
  }

  public async findById(
    request: FastifyRequest
  ): Promise<{ message: string; data: ITransaction }> {
    const { id } = request.params as { id: string }
    const userId = (request.user as { sub: string }).sub

    const transaction = await this.service.findById(id, userId)

    return {
      message: 'Transaction found successfully',
      data: transaction
    }
  }

  public async update(
    request: FastifyRequest
  ): Promise<{ message: string; data: ITransaction }> {
    const { id } = request.params as { id: string }
    const data = request.body as UpdateTransactionInput
    const userId = (request.user as { sub: string }).sub

    const transaction = await this.service.update(id, userId, data)

    return {
      message: 'Transaction updated successfully',
      data: transaction
    }
  }

  public async delete(request: FastifyRequest): Promise<{ message: string }> {
    const { id } = request.params as { id: string }
    const userId = (request.user as { sub: string }).sub

    await this.service.deleteById(id, userId)

    return {
      message: 'Transaction deleted successfully'
    }
  }
}
