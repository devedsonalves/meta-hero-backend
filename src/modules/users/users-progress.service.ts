import { users } from '@/database/schema'
import { eq, sql } from 'drizzle-orm'
import { PostgresJsTransaction } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class UserProgressService {
  public async addXpToUserTx(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: PostgresJsTransaction<typeof schema, any>,
    userId: string,
    xpToAdd: number
  ): Promise<void> {
    await tx
      .update(users)
      .set({
        xp: sql`${users.xp} + ${xpToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
  }
}
