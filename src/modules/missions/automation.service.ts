import { DatabaseConnection } from '@/database/connection'
import { transactions, goals, userMissions } from '@/database/schema'
import { eq, and, sum, count } from 'drizzle-orm'
import { UserProgressService } from '@/modules/users/users-progress.service'
import { PostgresJsTransaction } from 'drizzle-orm/postgres-js'
import * as schema from '@/database/schema'

export class AutomationService {
  private progressService: UserProgressService

  constructor() {
    this.progressService = new UserProgressService()
  }

  /**
   * Main entry point called after any transaction change
   */
  public async handleTransactionChange(userId: string): Promise<void> {
    const db = DatabaseConnection.getInstance().getClient()

    await db.transaction(async (tx) => {
      // 1. Update Linked Goals
      await this.syncGoalsProgress(tx, userId)

      // 2. Update Automated Missions
      await this.syncMissionsProgress(tx, userId)
    })
  }

  /**
   * Recalculates currentValue for goals linked to categories
   */
  private async syncGoalsProgress(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: PostgresJsTransaction<typeof schema, any>,
    userId: string
  ): Promise<void> {
    // Find all active goals with a category link
    const activeGoals = await tx.query.goals.findMany({
      where: and(eq(goals.userId, userId), eq(goals.status, 'active'))
    })

    for (const goal of activeGoals) {
      if (!goal.categoryId) continue

      // Sum all income transactions for this category
      // (Assuming goals are "saving" goals, so we look for income or specific category deposits)
      const [result] = await tx
        .select({ total: sum(transactions.value) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.category, goal.categoryId),
            eq(transactions.type, 'receita')
          )
        )

      const totalReached = Number(result.total || 0)

      const newStatus =
        totalReached >= Number(goal.targetValue) ? 'achieved' : 'active'

      await tx
        .update(goals)
        .set({
          currentValue: totalReached.toString(),
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(goals.id, goal.id))

      // If just achieved, we could eventually reward XP here too
      if (newStatus === 'achieved' && goal.status === 'active') {
        await this.progressService.addXpToUserTx(tx, userId, 100) // Bonus for goal achievement
      }
    }
  }

  /**
   * Checks mission conditions (e.g. "Create 5 transactions")
   */
  private async syncMissionsProgress(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: PostgresJsTransaction<typeof schema, any>,
    userId: string
  ): Promise<void> {
    // Find all in_progress missions for the user
    const activeUserMissions = await tx.query.userMissions.findMany({
      where: and(
        eq(userMissions.userId, userId),
        eq(userMissions.status, 'in_progress')
      ),
      with: {
        mission: true
      }
    })

    for (const um of activeUserMissions) {
      if (!um.mission) continue

      let currentProgress = um.progress
      let shouldComplete = false

      switch (um.mission.type) {
        case 'transaction_count': {
          const [txCount] = await tx
            .select({ val: count() })
            .from(transactions)
            .where(eq(transactions.userId, userId))

          currentProgress = Math.min(
            100,
            Math.round(
              (Number(txCount.val) / Number(um.mission.targetValue || 1)) * 100
            )
          )
          shouldComplete = currentProgress >= 100
          break
        }

        case 'saving': {
          const [totalSaved] = await tx
            .select({ total: sum(transactions.value) })
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, userId),
                eq(transactions.type, 'receita')
              )
            )

          const saved = Number(totalSaved.total || 0)
          currentProgress = Math.min(
            100,
            Math.round((saved / Number(um.mission.targetValue || 1)) * 100)
          )
          shouldComplete = currentProgress >= 100
          break
        }

        case 'category_limit':
          // Logic for "Spend less than X in Y category"
          // This would usually be checked at end of month, or dynamically valid
          break
      }

      if (currentProgress !== um.progress || shouldComplete) {
        await tx
          .update(userMissions)
          .set({
            progress: currentProgress,
            status: shouldComplete ? 'completed' : 'in_progress',
            updatedAt: new Date()
          })
          .where(eq(userMissions.id, um.id))

        if (shouldComplete && um.status !== 'completed') {
          await this.progressService.addXpToUserTx(
            tx,
            userId,
            Number(um.mission.xpReward || 0)
          )
        }
      }
    }
  }
}
