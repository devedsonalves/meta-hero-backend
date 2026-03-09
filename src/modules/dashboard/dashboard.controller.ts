import { FastifyRequest } from 'fastify'
import {
  DashboardQueryInput,
  DashboardResponseOutput
} from './dashboard.schema'
import { DashboardService } from './dashboard.service'

export class DashboardController {
  private service: DashboardService

  constructor() {
    this.service = new DashboardService()
  }

  public async getSummary(
    request: FastifyRequest
  ): Promise<{ message: string; data: DashboardResponseOutput }> {
    const filters = request.query as DashboardQueryInput
    const userId = (request.user as { sub: string }).sub

    const data = await this.service.getDashboardData(userId, filters)

    return {
      message: 'Dashboard data retrieved successfully',
      data
    }
  }
}
