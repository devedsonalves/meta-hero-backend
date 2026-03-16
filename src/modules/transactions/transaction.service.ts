import { AppError } from '@/core/errors/app-error'
import {
  ITransaction,
  ITransactionRepository,
  ITransactionFilters
} from './transaction.types'
import { TransactionRepository } from './transaction.repository'
import { AutomationService } from '../missions/automation.service'

export class TransactionService {
  private repository: ITransactionRepository
  private automationService: AutomationService

  constructor() {
    this.repository = new TransactionRepository()
    this.automationService = new AutomationService()
  }

  public async create(
    userId: string,
    data: Omit<ITransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<ITransaction> {
    const transaction = await this.repository.save({
      ...data,
      userId
    })

    // Trigger automation in background/after save
    void this.automationService.handleTransactionChange(userId)

    return transaction
  }

  public async findById(id: string, userId: string): Promise<ITransaction> {
    const transaction = await this.repository.findById(id)

    if (!transaction || transaction.userId !== userId) {
      throw new AppError('Transaction not found', 404)
    }

    return transaction
  }

  public async findAllByUserId(
    userId: string,
    filters: ITransactionFilters
  ): Promise<ITransaction[]> {
    return await this.repository.findAllByUserId(userId, filters)
  }

  public async deleteById(id: string, userId: string): Promise<void> {
    const transaction = await this.repository.findById(id)

    if (!transaction || transaction.userId !== userId) {
      throw new AppError('Transaction not found', 404)
    }

    await this.repository.deleteById(id, userId)
  }

  public async update(
    id: string,
    userId: string,
    data: Partial<Omit<ITransaction, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ITransaction> {
    const transaction = await this.repository.findById(id)

    if (!transaction || transaction.userId !== userId) {
      throw new AppError('Transaction not found', 404)
    }

    const updatedTransaction = await this.repository.update(id, userId, data)

    // Trigger automation
    void this.automationService.handleTransactionChange(userId)

    return updatedTransaction
  }
}
