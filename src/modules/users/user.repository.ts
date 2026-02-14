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

  async save({ name, email, password, authProvider }: IUser): Promise<IUser> {
    try {
      const [user] = await this.db
        .insert(users)
        .values({
          name,
          email,
          password: password || null,
          authProvider: authProvider || 'local'
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          authProvider: users.authProvider,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
      return user
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
        const { password: _, ...userWithoutPassword } = user
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

      const { password: _, ...userWithoutPassword } = user
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
    const { id, name, email, password } = user
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
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          authProvider: users.authProvider,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
      return updatedUser
    } catch (error) {
      throw new Error('Error updating user: ' + error)
    }
  }
}
