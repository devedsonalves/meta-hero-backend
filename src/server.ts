import { errorHandler } from '@/core/errors/error-handler'
import App from '@/app'
import { UserRoutes } from './modules/users/user.routes'
import { AuthRoutes } from './modules/auth/auth.routes'
import { env } from '@/config/env'

export const app = new App({
  routes: [UserRoutes, AuthRoutes]
})

errorHandler(app.getApp())

if (env.NODE_ENV !== 'test') {
  app.listen()
}
