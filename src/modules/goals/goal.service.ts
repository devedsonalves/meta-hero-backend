import { AppError } from '@/core/errors/app-error'
import { IGoal, IGoalRepository, IGoalFilters } from './goal.types'
import { GoalRepository } from './goal.repository'

export class GoalService {
  private repository: IGoalRepository

  constructor() {
    this.repository = new GoalRepository()
  }

  public async create(
    userId: string,
    data: Omit<IGoal, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<IGoal> {
    const goal = await this.repository.save({
      ...data,
      userId,
      status: 'active'
    })
    return goal
  }

  public async findById(id: string, userId: string): Promise<IGoal> {
    const goal = await this.repository.findById(id)

    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404)
    }

    return goal
  }

  public async findAllByUserId(
    userId: string,
    filters: IGoalFilters
  ): Promise<(IGoal & { progress: number })[]> {
    const goals = await this.repository.findAllByUserId(userId, filters)
    return goals.map((goal) => ({
      ...goal,
      progress: this.calculateProgress(goal)
    }))
  }

  public async deleteById(id: string, userId: string): Promise<void> {
    const goal = await this.repository.findById(id)

    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404)
    }

    await this.repository.deleteById(id, userId)
  }

  public async update(
    id: string,
    userId: string,
    data: Partial<Omit<IGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<IGoal> {
    const goal = await this.repository.findById(id)

    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404)
    }

    const updatedGoal = await this.repository.update(id, userId, data)
    return updatedGoal
  }

  public calculateProgress(goal: IGoal): number {
    const current = Number(goal.currentValue ?? 0)
    const target = Number(goal.targetValue ?? 1)
    return Math.min(100, Math.round((current / target) * 100))
  }
}
