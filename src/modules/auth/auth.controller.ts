import { FastifyReply, FastifyRequest } from 'fastify'
import { loginInput } from './auth.schema'
import { AuthService } from './auth.service'
import { AppError } from '@/core/errors/app-error'
import { IGoogleToken, IGoogleUserProfile } from './auth.types'
import { env } from '@/config/env'
import { UserService } from '../users/user.service'

export class AuthController {
  private service: AuthService
  private userService: UserService

  constructor() {
    this.service = new AuthService()
    this.userService = new UserService()
  }

  public async login(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { email, password } = request.body as loginInput

    const user = await this.service.validateUser(email, password)

    if (!user.id) {
      throw new AppError('E-mail or password is incorrect', 401)
    }

    const accessToken = await reply.jwtSign(
      { sub: user.id },
      { expiresIn: '15m' }
    )
    const refreshToken = await this.service.createAndStoreRefreshToken(user.id)

    reply.setAuthCookies({ accessToken, refreshToken })

    return reply.status(200).send({
      message: 'Login successful'
    })
  }

  public async refreshToken(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const refreshTokenFromCookie =
      request.cookies[request.server.config.REFRESH_TOKEN_NAME]

    if (!refreshTokenFromCookie) {
      return reply.code(401).send({ message: 'Refresh token not found' })
    }

    try {
      const userId = await this.service.resolveRefreshToken(
        refreshTokenFromCookie
      )

      const newAccessToken = await reply.jwtSign(
        { sub: userId },
        { expiresIn: '15m' }
      )
      const newRefreshToken =
        await this.service.createAndStoreRefreshToken(userId)

      reply.setAuthCookies({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      })

      return reply.send({
        message: 'Tokens refreshed successfully'
      })
    } catch (error) {
      reply.clearAuthCookies()
      reply.code(401).send(error)
    }
  }

  public async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const refreshToken =
      request.cookies[request.server.config.REFRESH_TOKEN_NAME]

    if (refreshToken) {
      await this.service.revokeRefreshToken(refreshToken)
    }

    reply.clearAuthCookies()
    return reply.status(200).send({
      message: 'Logged out successfully'
    })
  }

  public async getMe(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const requestUser = request.user as { sub: string }
    const user = await this.userService.findById(requestUser.sub)
    if (!user) {
      throw new AppError('User not found', 404)
    }
    return reply.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  }

  public async googleCallback(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token }: { token: IGoogleToken } =
        await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request
        )

      const googleProfileResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      )
      const googleProfile: IGoogleUserProfile =
        await googleProfileResponse.json()

      const user = await this.service.handleGoogleOAuth(googleProfile)

      if (!user.id) {
        throw new AppError('Failed to authenticate with Google', 401)
      }

      const accessToken = await reply.jwtSign(
        { sub: user.id },
        { expiresIn: '15m' }
      )

      const refreshToken = await this.service.createAndStoreRefreshToken(
        user.id
      )

      reply.setAuthCookies({ accessToken, refreshToken })

      return reply.redirect(`${env.FRONTEND_URL}/dashboard`)
    } catch {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`)
    }
  }
}
