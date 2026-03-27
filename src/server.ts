import App from '@/app'
import { env } from '@/config/env'
import { errorHandler } from '@/core/errors/error-handler'
import { AuthRoutes } from '@/modules/auth/auth.routes'
import { TransactionRoutes } from '@/modules/transactions/transaction.routes'
import { GoalRoutes } from '@/modules/goals/goal.routes'
import { MissionRoutes } from '@/modules/missions/mission.routes'
import { RewardRoutes } from '@/modules/rewards/reward.routes'
import { UserRoutes } from '@/modules/users/user.routes'
import { DashboardRoutes } from '@/modules/dashboard/dashboard.routes'

export const app = new App({
  routes: [
    UserRoutes,
    AuthRoutes,
    TransactionRoutes,
    DashboardRoutes,
    GoalRoutes,
    MissionRoutes,
    RewardRoutes
  ]
})

errorHandler(app.getApp())

if (env.NODE_ENV !== 'test') {
  app.listen()
}
