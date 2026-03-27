import { users } from '@/database/schema'
import { eq, sql } from 'drizzle-orm'
import { PostgresJsTransaction } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class UserProgressService {
  /**
   * Level benchmarks from PRODUCT.md
   */
  private static readonly LEVEL_BENCHMARKS = [
    { level: 1, minXp: 0 },
    { level: 2, minXp: 100 },
    { level: 3, minXp: 250 },
    { level: 4, minXp: 450 },
    { level: 5, minXp: 700 },
    { level: 10, minXp: 2000 }
  ]

  public async addXpToUserTx(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: PostgresJsTransaction<typeof schema, any>,
    userId: string,
    xpToAdd: number
  ): Promise<void> {
    // 1. Get current user progress
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        xp: true,
        level: true
      }
    })

    if (!user) return

    const newXp = Number(user.xp) + xpToAdd
    const newLevel = this.calculateLevel(newXp)

    // 2. Update user
    await tx
      .update(users)
      .set({
        xp: newXp,
        level: newLevel,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
  }

  public async addCoinsToUserTx(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: PostgresJsTransaction<typeof schema, any>,
    userId: string,
    coinsToAdd: number
  ): Promise<void> {
    await tx
      .update(users)
      .set({
        heroCoins: sql`${users.heroCoins} + ${coinsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
  }

  private calculateLevel(xp: number): number {
    const currentLevel = 1

    // Simple progression based on benchmarks
    if (xp >= 2000) return 10
    if (xp >= 700) return 5
    if (xp >= 450) return 4
    if (xp >= 250) return 3
    if (xp >= 100) return 2

    return currentLevel
  }
}
