import { DatabaseConnection } from '@/database/connection'
import {
  ITransaction,
  ITransactionRepository,
  ITransactionFilters
} from './transaction.types'
import { transactions } from '@/database/schema'
import { eq, and, between } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class TransactionRepository implements ITransactionRepository {
  private db: PostgresJsDatabase<typeof schema>

  constructor() {
    this.db = DatabaseConnection.getInstance().getClient()
  }

  async save(
    data: Omit<ITransaction, 'id' | 'createdAt'>
  ): Promise<ITransaction> {
    try {
      const [transaction] = await this.db
        .insert(transactions)
        .values({
          userId: data.userId,
          type: data.type,
          category: data.category,
          value: data.value.toString(),
          date:
            data.date instanceof Date
              ? data.date.toISOString().split('T')[0]
              : data.date,
          description: data.description || null
        })
        .returning()
      return transaction as ITransaction
    } catch (error) {
      throw new Error('Error saving transaction: ' + error)
    }
  }

  async findById(id: string): Promise<ITransaction | null> {
    try {
      const transaction = await this.db.query.transactions.findFirst({
        where: eq(transactions.id, id)
      })

      return (transaction as ITransaction) || null
    } catch (error) {
      throw new Error('Error finding transaction by id: ' + error)
    }
  }

  async findAllByUserId(
    userId: string,
    filters: ITransactionFilters = {}
  ): Promise<ITransaction[]> {
    try {
      const where = [eq(transactions.userId, userId)]

      if (filters.type) {
        where.push(eq(transactions.type, filters.type))
      }

      if (filters.category) {
        where.push(eq(transactions.category, filters.category))
      }

      if (filters.startDate && filters.endDate) {
        where.push(
          between(transactions.date, filters.startDate, filters.endDate)
        )
      }

      const results = await this.db
        .select()
        .from(transactions)
        .where(and(...where))
        .orderBy(transactions.date)

      return results as ITransaction[]
    } catch (error) {
      throw new Error('Error finding all transactions: ' + error)
    }
  }

  async deleteById(id: string, userId: string): Promise<void> {
    try {
      await this.db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    } catch (error) {
      throw new Error('Error deleting transaction: ' + error)
    }
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<ITransaction, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ITransaction> {
    try {
      const updateData: Record<string, unknown> = { ...data }
      if (data.value) updateData.value = data.value.toString()
      if (data.date) {
        updateData.date =
          data.date instanceof Date
            ? data.date.toISOString().split('T')[0]
            : data.date
      }

      const [updated] = await this.db
        .update(transactions)
        .set(updateData)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning()

      if (!updated) {
        throw new Error('Transaction not found or not owned by user')
      }

      return updated as ITransaction
    } catch (error) {
      throw new Error('Error updating transaction: ' + error)
    }
  }
}
