import App from '@/app'
import { env } from '@/config/env'
import { errorHandler } from '@/core/errors/error-handler'
import { AuthRoutes } from '@/modules/auth/auth.routes'
import { TransactionRoutes } from '@/modules/transactions/transaction.routes'
import { UserRoutes } from '@/modules/users/user.routes'

export const app = new App({
  routes: [UserRoutes, AuthRoutes, TransactionRoutes]
})

errorHandler(app.getApp())

if (env.NODE_ENV !== 'test') {
  app.listen()
}
