export interface ITransaction {
  id: string
  userId: string
  type: string
  category: string
  value: string | number
  date: string | Date
  description?: string | null
  createdAt?: Date | null
}

export interface ITransactionFilters {
  type?: 'receita' | 'despesa'
  category?: string
  startDate?: string
  endDate?: string
}

export interface ITransactionRepository {
  save(
    transaction: Omit<ITransaction, 'id' | 'createdAt'>
  ): Promise<ITransaction>
  findById(id: string): Promise<ITransaction | null>
  findAllByUserId(
    userId: string,
    filters?: ITransactionFilters
  ): Promise<ITransaction[]>
  deleteById(id: string, userId: string): Promise<void>
  update(
    id: string,
    userId: string,
    data: Partial<Omit<ITransaction, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ITransaction>
}
