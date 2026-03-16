export interface IGoal {
  id: string
  userId: string
  name: string
  targetValue: number | string
  currentValue: number | string
  dueDate: string | Date
  status: 'active' | 'achieved' | 'cancelled'
  categoryId?: string | null
  note: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface IGoalFilters {
  status?: 'active' | 'achieved' | 'cancelled'
  dueBefore?: string
}

export interface IGoalRepository {
  save(goal: Omit<IGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<IGoal>
  findById(id: string): Promise<IGoal | null>
  findAllByUserId(userId: string, filters?: IGoalFilters): Promise<IGoal[]>
  deleteById(id: string, userId: string): Promise<void>
  update(
    id: string,
    userId: string,
    data: Partial<Omit<IGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<IGoal>
}
