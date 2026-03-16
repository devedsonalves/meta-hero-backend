import { DatabaseConnection } from '@/database/connection'
import { IGoal, IGoalRepository, IGoalFilters } from './goal.types'
import { goals } from '@/database/schema'
import { eq, and, lt } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class GoalRepository implements IGoalRepository {
  private db: PostgresJsDatabase<typeof schema>

  constructor() {
    this.db = DatabaseConnection.getInstance().getClient()
  }

  async save(
    data: Omit<IGoal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IGoal> {
    try {
      const [goal] = await this.db
        .insert(goals)
        .values({
          userId: data.userId,
          name: data.name,
          targetValue: data.targetValue.toString(),
          currentValue: (data.currentValue ?? 0).toString(),
          dueDate:
            data.dueDate instanceof Date
              ? data.dueDate.toISOString().split('T')[0]
              : data.dueDate,
          status: data.status || 'active',
          categoryId: data.categoryId || null,
          note: data.note || null
        })
        .returning()
      return goal as IGoal
    } catch (error) {
      throw new Error('Error saving goal: ' + error)
    }
  }

  async findById(id: string): Promise<IGoal | null> {
    try {
      const goal = await this.db.query.goals.findFirst({
        where: eq(goals.id, id)
      })

      return (goal as IGoal) || null
    } catch (error) {
      throw new Error('Error finding goal by id: ' + error)
    }
  }

  async findAllByUserId(
    userId: string,
    filters: IGoalFilters = {}
  ): Promise<IGoal[]> {
    try {
      const where = [eq(goals.userId, userId)]

      if (filters.status) {
        where.push(eq(goals.status, filters.status))
      }

      if (filters.dueBefore) {
        where.push(lt(goals.dueDate, filters.dueBefore))
      }

      const results = await this.db
        .select()
        .from(goals)
        .where(and(...where))
        .orderBy(goals.dueDate)

      return results as IGoal[]
    } catch (error) {
      throw new Error('Error finding all goals: ' + error)
    }
  }

  async deleteById(id: string, userId: string): Promise<void> {
    try {
      await this.db
        .delete(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    } catch (error) {
      throw new Error('Error deleting goal: ' + error)
    }
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<IGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<IGoal> {
    try {
      const updateData: Record<string, unknown> = { ...data }
      if (data.targetValue) updateData.targetValue = data.targetValue.toString()
      if (data.currentValue !== undefined)
        updateData.currentValue = data.currentValue.toString()
      if (data.dueDate) {
        updateData.dueDate =
          data.dueDate instanceof Date
            ? data.dueDate.toISOString().split('T')[0]
            : data.dueDate
      }

      const [updated] = await this.db
        .update(goals)
        .set(updateData)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning()

      if (!updated) {
        throw new Error('Goal not found or not owned by user')
      }

      return updated as IGoal
    } catch (error) {
      throw new Error('Error updating goal: ' + error)
    }
  }
}
