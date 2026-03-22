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

  // Type helper for mission joined with userMission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private missionOf(um: any): any {
    return um.mission
  }

  /**
   * Main entry point called after any transaction change
   */
  public async handleTransactionChange(userId: string): Promise<void> {
    const db = DatabaseConnection.getInstance().getClient()

    await db.transaction(async (tx) => {
      // 0. Award basic XP for the transaction (+5 XP as per PRODUCT.md)
      await this.progressService.addXpToUserTx(tx, userId, 5)

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

      // If just achieved, award XP as per PRODUCT.md (+100 XP)
      if (newStatus === 'achieved' && goal.status === 'active') {
        await this.progressService.addXpToUserTx(tx, userId, 100)
        // Also award Hero Coins for goal completion? (Optional but recommended)
        await this.progressService.addCoinsToUserTx(tx, userId, 50)
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
      const mission = this.missionOf(um)
      if (!mission) continue

      let currentProgress = um.progress
      let shouldComplete = false

      switch (mission.type) {
        case 'transaction_count': {
          const [txCount] = await tx
            .select({ val: count() })
            .from(transactions)
            .where(eq(transactions.userId, userId))

          currentProgress = Math.min(
            100,
            Math.round(
              (Number(txCount.val) / Number(mission.targetValue || 1)) * 100
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
            Math.round((saved / Number(mission.targetValue || 1)) * 100)
          )
          shouldComplete = currentProgress >= 100
          break
        }

        case 'category_limit':
          // Logic for "Spend less than X in Y category"
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
          // Award XP
          await this.progressService.addXpToUserTx(
            tx,
            userId,
            Number(mission.xpReward || 0)
          )

          // Award Hero Coins
          if (mission.coinReward && Number(mission.coinReward) > 0) {
            await this.progressService.addCoinsToUserTx(
              tx,
              userId,
              Number(mission.coinReward)
            )
          }
        }
      }
    }
  }
}
