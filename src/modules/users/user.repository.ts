import { DatabaseConnection } from '@/database/connection'
import { IUser, IUserRepository } from './user.types'
import { users } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class UserRepository implements IUserRepository {
  private db: PostgresJsDatabase<typeof schema>

  constructor() {
    this.db = DatabaseConnection.getInstance().getClient()
  }

  async save(userData: IUser): Promise<IUser> {
    const { name, email, password, authProvider, xp, level, heroCoins } =
      userData
    try {
      const [user] = await this.db
        .insert(users)
        .values({
          name,
          email,
          password: password || null,
          authProvider: authProvider || 'local',
          xp: xp || 0,
          level: level || 1,
          heroCoins: heroCoins || 0
        })
        .returning()
      return user as unknown as IUser
    } catch (error) {
      throw new Error('Error saving user to database: ' + error)
    }
  }

  async findByEmail(
    email: string,
    returnPassword: boolean = false
  ): Promise<IUser | null> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.email, email)
      })

      if (!user) return null

      if (!returnPassword) {
        const { ...userWithoutPassword } = user
        return userWithoutPassword as IUser
      }

      return user as IUser
    } catch (error) {
      throw new Error('Error finding user by email: ' + error)
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, id)
      })

      if (!user) return null

      const { ...userWithoutPassword } = user
      return userWithoutPassword as IUser
    } catch (error) {
      throw new Error('Error finding user by ID: ' + error)
    }
  }

  async findAll(): Promise<IUser[]> {
    try {
      const allUsers = await this.db.query.users.findMany()
      return allUsers.map(({ password: _, ...u }) => u as IUser)
    } catch (error) {
      throw new Error('Error finding all users: ' + error)
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.db.delete(users).where(eq(users.id, id))
    } catch (error) {
      throw new Error('Error deleting user by ID: ' + error)
    }
  }

  async update(user: IUser): Promise<IUser> {
    const { id, name, email, password, xp, level, heroCoins } = user
    if (!id) {
      throw new Error('User ID is required for update')
    }

    try {
      const [updatedUser] = await this.db
        .update(users)
        .set({
          name,
          email,
          password: password || undefined,
          xp,
          level,
          heroCoins,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning()
      return updatedUser as unknown as IUser
    } catch (error) {
      throw new Error('Error updating user: ' + error)
    }
  }
}
