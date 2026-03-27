import { DatabaseConnection } from '@/database/connection'
import {
  IMission,
  IUserMission,
  IMissionRepository,
  IMissionFilters,
  IUserMissionWithMission
} from './mission.types'
import { missions, userMissions } from '@/database/schema'
import { eq, and } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class MissionRepository implements IMissionRepository {
  private db: PostgresJsDatabase<typeof schema>

  constructor() {
    this.db = DatabaseConnection.getInstance().getClient()
  }

  async saveMission(
    data: Omit<IMission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IMission> {
    try {
      const [mission] = await this.db
        .insert(missions)
        .values({
          title: data.title,
          description: data.description || '',
          difficulty: data.difficulty,
          xpReward: data.xpReward,
          isGlobal: data.isGlobal
        })
        .returning()
      return mission as IMission
    } catch (error) {
      throw new Error('Error saving mission: ' + error)
    }
  }

  async findMissionById(id: string): Promise<IMission | null> {
    try {
      const mission = await this.db.query.missions.findFirst({
        where: eq(missions.id, id)
      })
      return (mission as IMission) || null
    } catch (error) {
      throw new Error('Error finding mission: ' + error)
    }
  }

  async assignToUser(
    data: Omit<IUserMission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IUserMission> {
    try {
      const [assigned] = await this.db
        .insert(userMissions)
        .values({
          userId: data.userId,
          missionId: data.missionId,
          status: data.status || 'assigned',
          progress: data.progress || 0,
          meta: data.meta || null
        })
        .returning()
      return assigned as IUserMission
    } catch (error) {
      throw new Error('Error assigning mission: ' + error)
    }
  }

  async findUserMissionById(id: string): Promise<IUserMission | null> {
    try {
      const um = await this.db.query.userMissions.findFirst({
        where: eq(userMissions.id, id)
      })
      return (um as IUserMission) || null
    } catch (error) {
      throw new Error('Error finding user mission: ' + error)
    }
  }

  async findAllUserMissions(
    userId: string,
    filters: IMissionFilters = {}
  ): Promise<IUserMissionWithMission[]> {
    try {
      const where = [eq(userMissions.userId, userId)]
      if (filters.status) {
        where.push(eq(userMissions.status, filters.status))
      }

      const results = await this.db.query.userMissions.findMany({
        where: and(...where),
        with: {
          mission: true
        },
        orderBy: (um, { desc }) => [desc(um.createdAt)]
      })

      return results as IUserMissionWithMission[]
    } catch (error) {
      throw new Error('Error finding all user missions: ' + error)
    }
  }

  async updateUserMission(
    id: string,
    data: Partial<IUserMission>
  ): Promise<IUserMission> {
    try {
      const [updated] = await this.db
        .update(userMissions)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(userMissions.id, id))
        .returning()

      if (!updated) {
        throw new Error('User mission not found')
      }

      return updated as IUserMission
    } catch (error) {
      throw new Error('Error updating user mission: ' + error)
    }
  }
}
