import { DatabaseConnection } from '@/database/connection'
import { IRefreshToken, IAuthRepository } from './auth.types'
import { refreshTokens } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class AuthRepository implements IAuthRepository {
  private db: PostgresJsDatabase<typeof schema>

  constructor() {
    this.db = DatabaseConnection.getInstance().getClient()
  }

  public async save({
    hashedToken,
    userId,
    revoked
  }: Omit<IRefreshToken, 'id'>): Promise<IRefreshToken> {
    try {
      const [token] = await this.db
        .insert(refreshTokens)
        .values({
          hashedToken,
          userId,
          revoked: revoked || false
        })
        .returning()

      return token as IRefreshToken
    } catch (error) {
      throw new Error('Error saving refresh token to database: ' + error)
    }
  }

  public async findByHashedToken(
    hashedToken: string
  ): Promise<IRefreshToken | null> {
    try {
      const token = await this.db.query.refreshTokens.findFirst({
        where: eq(refreshTokens.hashedToken, hashedToken)
      })

      return (token as IRefreshToken) || null
    } catch (error) {
      throw new Error('Error finding refresh token by hashed token: ' + error)
    }
  }

  public async revokeAllTokensByUserId(userId: string): Promise<void> {
    try {
      await this.db
        .update(refreshTokens)
        .set({ revoked: true, updatedAt: new Date() })
        .where(eq(refreshTokens.userId, userId))
    } catch (error) {
      throw new Error('Error revoking refresh tokens for user: ' + error)
    }
  }

  public async update(id: string, revoked: boolean): Promise<IRefreshToken> {
    try {
      const [updatedToken] = await this.db
        .update(refreshTokens)
        .set({ revoked, updatedAt: new Date() })
        .where(eq(refreshTokens.id, id))
        .returning()

      return updatedToken as IRefreshToken
    } catch (error) {
      throw new Error('Error updating refresh token by ID: ' + error)
    }
  }

  public async updateByHashedToken(
    hashedToken: string,
    revoked: boolean
  ): Promise<IRefreshToken> {
    try {
      const [updatedToken] = await this.db
        .update(refreshTokens)
        .set({ revoked, updatedAt: new Date() })
        .where(eq(refreshTokens.hashedToken, hashedToken))
        .returning()

      return updatedToken as IRefreshToken
    } catch (error) {
      throw new Error('Error updating refresh token by hashed token: ' + error)
    }
  }
}
