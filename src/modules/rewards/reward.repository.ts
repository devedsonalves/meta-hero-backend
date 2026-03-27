import { DatabaseConnection } from '@/database/connection'
import {
  IReward,
  IUserReward,
  IRewardRepository,
  IUserRewardWithReward
} from './reward.types'
import { rewards, userRewards } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class RewardRepository implements IRewardRepository {
  private db: PostgresJsDatabase<typeof schema>

  constructor() {
    this.db = DatabaseConnection.getInstance().getClient()
  }

  async save(
    data: Omit<IReward, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IReward> {
    try {
      const [reward] = await this.db
        .insert(rewards)
        .values({
          name: data.name,
          description: data.description,
          cost: data.cost.toString(),
          icon: data.icon || null
        })
        .returning()
      return reward as IReward
    } catch (error) {
      throw new Error('Error saving reward: ' + error)
    }
  }

  async findAll(): Promise<IReward[]> {
    try {
      return (await this.db.select().from(rewards)) as IReward[]
    } catch (error) {
      throw new Error('Error finding rewards: ' + error)
    }
  }

  async findById(id: string): Promise<IReward | null> {
    try {
      const reward = await this.db.query.rewards.findFirst({
        where: eq(rewards.id, id)
      })
      return (reward as IReward) || null
    } catch (error) {
      throw new Error('Error finding reward: ' + error)
    }
  }

  async saveUserReward(userId: string, rewardId: string): Promise<IUserReward> {
    try {
      const [purchase] = await this.db
        .insert(userRewards)
        .values({
          userId,
          rewardId
        })
        .returning()
      return purchase as IUserReward
    } catch (error) {
      throw new Error('Error saving user reward: ' + error)
    }
  }

  async findAllByUserId(userId: string): Promise<IUserRewardWithReward[]> {
    try {
      const results = await this.db.query.userRewards.findMany({
        where: eq(userRewards.userId, userId),
        with: {
          reward: true
        }
      })
      return results as IUserRewardWithReward[]
    } catch (error) {
      throw new Error('Error finding user rewards: ' + error)
    }
  }
}
