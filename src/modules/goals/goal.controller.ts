import { FastifyRequest } from 'fastify'
import { GoalService } from './goal.service'
import {
  CreateGoalInput,
  UpdateGoalInput,
  FilterGoalInput
} from './goal.schema'
import { IGoal } from './goal.types'

export class GoalController {
  private service: GoalService

  constructor() {
    this.service = new GoalService()
  }

  public async create(
    request: FastifyRequest
  ): Promise<{ message: string; data: IGoal }> {
    const { name, targetValue, currentValue, dueDate, note } =
      request.body as CreateGoalInput
    const userId = (request.user as { sub: string }).sub

    const goal = await this.service.create(userId, {
      name,
      targetValue,
      currentValue: currentValue ?? 0,
      dueDate,
      categoryId: (request.body as CreateGoalInput).categoryId ?? null,
      note: note ?? null
    })

    return {
      message: 'Goal created successfully',
      data: goal
    }
  }

  public async findAll(
    request: FastifyRequest
  ): Promise<{ message: string; data: (IGoal & { progress: number })[] }> {
    const filters = request.query as FilterGoalInput
    const userId = (request.user as { sub: string }).sub

    const goals = await this.service.findAllByUserId(userId, filters)

    return {
      message: 'Goals retrieved successfully',
      data: goals
    }
  }

  public async findById(
    request: FastifyRequest
  ): Promise<{ message: string; data: IGoal & { progress: number } }> {
    const { id } = request.params as { id: string }
    const userId = (request.user as { sub: string }).sub

    const goal = await this.service.findById(id, userId)

    return {
      message: 'Goal found successfully',
      data: {
        ...goal,
        progress: this.service.calculateProgress(goal)
      }
    }
  }

  public async update(
    request: FastifyRequest
  ): Promise<{ message: string; data: IGoal }> {
    const { id } = request.params as { id: string }
    const data = request.body as UpdateGoalInput
    const userId = (request.user as { sub: string }).sub

    const goal = await this.service.update(id, userId, data)

    return {
      message: 'Goal updated successfully',
      data: goal
    }
  }

  public async delete(request: FastifyRequest): Promise<{ message: string }> {
    const { id } = request.params as { id: string }
    const userId = (request.user as { sub: string }).sub

    await this.service.deleteById(id, userId)

    return {
      message: 'Goal deleted successfully'
    }
  }
}
