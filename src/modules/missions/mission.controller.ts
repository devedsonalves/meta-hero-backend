import { FastifyRequest } from 'fastify'
import { MissionService } from './mission.service'
import {
  CreateMissionInput,
  AssignMissionInput,
  FilterUserMissionInput
} from './mission.schema'

export class MissionController {
  private service: MissionService

  constructor() {
    this.service = new MissionService()
  }

  public async create(request: FastifyRequest) {
    const data = request.body as CreateMissionInput
    const mission = await this.service.createMission({
      ...data,
      description: data.description ?? null
    })

    return {
      message: 'Mission created successfully',
      data: mission
    }
  }

  public async assign(request: FastifyRequest) {
    const { missionId } = request.body as AssignMissionInput
    const userId = (request.user as { sub: string }).sub

    const assigned = await this.service.assignToUser(userId, missionId)

    return {
      message: 'Mission assigned successfully',
      data: assigned
    }
  }

  public async findAll(request: FastifyRequest) {
    const filters = request.query as FilterUserMissionInput
    const userId = (request.user as { sub: string }).sub

    const list = await this.service.listUserMissions(userId, filters)

    return {
      message: 'User missions retrieved successfully',
      data: list
    }
  }

  public async complete(request: FastifyRequest) {
    const { id } = request.params as { id: string }
    const userId = (request.user as { sub: string }).sub

    const updated = await this.service.markCompleted(userId, id)

    return {
      message: 'Mission completed successfully',
      data: updated
    }
  }
}
