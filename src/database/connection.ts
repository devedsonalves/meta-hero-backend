import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/config/env'
import * as schema from './schema'

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private db: PostgresJsDatabase<typeof schema>
  private queryClient: postgres.Sql

  private constructor() {
    this.queryClient = postgres(env.DATABASE_URL)
    this.db = drizzle(this.queryClient, { schema })
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }

    return DatabaseConnection.instance
  }

  public getClient(): PostgresJsDatabase<typeof schema> {
    return this.db
  }

  public async disconnect(): Promise<void> {
    await this.queryClient.end()
  }
}
