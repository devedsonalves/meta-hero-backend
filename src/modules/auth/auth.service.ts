import { AppError } from '@/core/errors/app-error'
import { UserRepository } from '../users/user.repository'
import { IUser, IUserRepository } from '../users/user.types'
import { PasswordHash } from '@/shared/utils/password-hash'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { IAuthRepository, IGoogleUserProfile } from './auth.types'
import { AuthRepository } from './auth.repository'

export class AuthService {
  private userRepository: IUserRepository
  private repository: IAuthRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.repository = new AuthRepository()
  }

  public async validateUser(email: string, password: string): Promise<IUser> {
    const user = await this.userRepository.findByEmail(email, true)
    if (!user || !user.password) {
      throw new AppError('E-mail or password is incorrect', 401)
    }

    const isPasswordValid = await PasswordHash.compare(password, user.password)

    if (!isPasswordValid) {
      throw new AppError('E-mail or password is incorrect', 401)
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  public async createAndStoreRefreshToken(userId: string): Promise<string> {
    const refreshToken = randomBytes(64).toString('hex')
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex')

    await this.repository.save({
      hashedToken,
      userId,
      revoked: false
    })

    return refreshToken
  }

  public async resolveRefreshToken(tokenFromCookie: string) {
    const hashedToken = createHash('sha256')
      .update(tokenFromCookie)
      .digest('hex')

    const storedToken = await this.repository.findByHashedToken(hashedToken)

    if (!storedToken) {
      throw new AppError('Refresh token not found', 404)
    }

    if (storedToken.revoked) {
      await this.repository.revokeAllTokensByUserId(storedToken.userId)
      //eslint-disable-next-line no-console
      console.warn(
        `SECURITY ALERT: Re-use of revoked refresh token for user ${storedToken.userId}`
      )
      throw new AppError('Refresh token has been revoked', 401)
    }

    await this.repository.update(storedToken.id, true)

    return storedToken.userId
  }

  public async revokeRefreshToken(tokenFromCookie: string) {
    try {
      const hashedToken = createHash('sha256')
        .update(tokenFromCookie)
        .digest('hex')
      await this.repository.updateByHashedToken(hashedToken, true)
    } catch {
      //eslint-disable-next-line no-console
      console.log('Token to revoke not found, user is effectively logged out.')
    }
  }

  async handleGoogleOAuth(profile: IGoogleUserProfile): Promise<IUser> {
    const { email, name } = profile

    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      if (existingUser.authProvider === 'local') {
        throw new AppError(
          'This email is already registered with a password. Please log in locally.',
          400
        )
      }
      return existingUser
    }

    const newUser = await this.userRepository.save({
      id: randomUUID(),
      name,
      email,
      authProvider: 'google',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return newUser
  }
}
