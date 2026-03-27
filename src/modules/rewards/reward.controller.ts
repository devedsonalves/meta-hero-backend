import { FastifyRequest } from 'fastify'
import { RewardService } from './reward.service'
import { CreateRewardInput } from './reward.schema'

export class RewardController {
  private service: RewardService

  constructor() {
    this.service = new RewardService()
  }

  public async create(request: FastifyRequest) {
    const data = request.body as CreateRewardInput
    const reward = await this.service.create({
      ...data,
      icon: data.icon ?? null
    })

    return {
      message: 'Reward created successfully',
      data: reward
    }
  }

  public async listAll() {
    const list = await this.service.listAll()

    return {
      message: 'Rewards retrieved successfully',
      data: list
    }
  }

  public async purchase(request: FastifyRequest) {
    const { id: rewardId } = request.params as { id: string }
    const userId = (request.user as { sub: string }).sub

    const result = await this.service.purchase(userId, rewardId)

    return {
      message: 'Reward acquired successfully',
      data: result
    }
  }

  public async userRewards(request: FastifyRequest) {
    const userId = (request.user as { sub: string }).sub
    const list = await this.service.userRewards(userId)

    return {
      message: 'User rewards retrieved successfully',
      data: list
    }
  }
}
