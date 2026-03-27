export interface IMission {
  id: string
  title: string
  description: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'manual' | 'saving' | 'transaction_count' | 'category_limit'
  targetValue?: number | string
  targetCategory?: string | null
  xpReward: number
  isGlobal: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IUserMission {
  id: string
  userId: string
  missionId: string
  status: 'assigned' | 'in_progress' | 'completed' | 'failed'
  progress: number
  meta: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IUserMissionWithMission extends IUserMission {
  mission?: IMission
}

export interface IMissionFilters {
  status?: 'assigned' | 'in_progress' | 'completed' | 'failed'
}

export interface IMissionRepository {
  saveMission(
    mission: Omit<IMission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IMission>
  findMissionById(id: string): Promise<IMission | null>
  assignToUser(
    data: Omit<IUserMission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IUserMission>
  findUserMissionById(id: string): Promise<IUserMission | null>
  findAllUserMissions(
    userId: string,
    filters?: IMissionFilters
  ): Promise<IUserMissionWithMission[]>
  updateUserMission(
    id: string,
    data: Partial<IUserMission>
  ): Promise<IUserMission>
}
