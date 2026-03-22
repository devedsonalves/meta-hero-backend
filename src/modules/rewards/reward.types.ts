export interface IReward {
  id: string
  name: string
  description: string
  cost: number | string
  icon: string | null
  imageUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IUserReward {
  id: string
  userId: string
  rewardId: string
  acquiredAt: Date
}

export interface IUserRewardWithReward extends IUserReward {
  reward?: IReward
}

export interface IRewardRepository {
  save(
    reward: Omit<IReward, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IReward>
  findAll(): Promise<IReward[]>
  findById(id: string): Promise<IReward | null>
  saveUserReward(userId: string, rewardId: string): Promise<IUserReward>
  findAllByUserId(userId: string): Promise<IUserRewardWithReward[]>
}
