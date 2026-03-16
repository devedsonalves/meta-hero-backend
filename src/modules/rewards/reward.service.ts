import { AppError } from '@/core/errors/app-error'
import {
  IReward,
  IUserReward,
  IRewardRepository,
  IUserRewardWithReward
} from './reward.types'
import { RewardRepository } from './reward.repository'

export class RewardService {
  private repository: IRewardRepository

  constructor() {
    this.repository = new RewardRepository()
  }

  async create(
    data: Omit<IReward, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IReward> {
    return await this.repository.save(data)
  }

  async listAll(): Promise<IReward[]> {
    return await this.repository.findAll()
  }

  async purchase(userId: string, rewardId: string): Promise<IUserReward> {
    const reward = await this.repository.findById(rewardId)
    if (!reward) {
      throw new AppError('Reward not found', 404)
    }

    // TODO: Implement balance check logic here if a currency system is added
    // e.g. if (user.balance < reward.cost) throw new AppError('Insufficient balance', 400)

    return await this.repository.saveUserReward(userId, rewardId)
  }

  async userRewards(userId: string): Promise<IUserRewardWithReward[]> {
    return await this.repository.findAllByUserId(userId)
  }
}
