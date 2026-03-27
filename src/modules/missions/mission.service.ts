import { AppError } from '@/core/errors/app-error'
import {
  IMission,
  IUserMission,
  IMissionRepository,
  IMissionFilters,
  IUserMissionWithMission
} from './mission.types'
import { MissionRepository } from './mission.repository'
import { UserProgressService } from '@/modules/users/users-progress.service'
import { DatabaseConnection } from '@/database/connection'
import { userMissions, missions } from '@/database/schema'
import { eq } from 'drizzle-orm'

export class MissionService {
  private repository: IMissionRepository
  private progressService: UserProgressService

  constructor() {
    this.repository = new MissionRepository()
    this.progressService = new UserProgressService()
  }

  async createMission(
    data: Omit<IMission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IMission> {
    return await this.repository.saveMission(data)
  }

  async assignToUser(userId: string, missionId: string): Promise<IUserMission> {
    const mission = await this.repository.findMissionById(missionId)
    if (!mission) {
      throw new AppError('Mission not found', 404)
    }

    return await this.repository.assignToUser({
      userId,
      missionId,
      status: 'assigned',
      progress: 0,
      meta: null
    })
  }

  async listUserMissions(
    userId: string,
    filters?: IMissionFilters
  ): Promise<IUserMissionWithMission[]> {
    return await this.repository.findAllUserMissions(userId, filters)
  }

  async markCompleted(
    userId: string,
    userMissionId: string
  ): Promise<IUserMission> {
    const db = DatabaseConnection.getInstance().getClient()

    return await db.transaction(async (tx) => {
      // Find the user mission
      const um = await tx.query.userMissions.findFirst({
        where: eq(userMissions.id, userMissionId)
      })

      if (!um) {
        throw new AppError('User mission not found', 404)
      }

      if (um.userId !== userId) {
        throw new AppError('Not allowed', 403)
      }

      if (um.status === 'completed') {
        return um as IUserMission
      }

      // Find the mission details to get XP reward
      const m = await tx.query.missions.findFirst({
        where: eq(missions.id, um.missionId)
      })

      if (!m) {
        throw new AppError('Mission not found', 404)
      }

      // Update user mission status
      const [updated] = await tx
        .update(userMissions)
        .set({
          status: 'completed',
          progress: 100,
          updatedAt: new Date()
        })
        .where(eq(userMissions.id, userMissionId))
        .returning()

      // Add XP to user
      await this.progressService.addXpToUserTx(
        tx,
        userId,
        Number(m.xpReward || 0)
      )

      return updated as IUserMission
    })
  }
}
