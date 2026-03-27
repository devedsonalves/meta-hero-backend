import { DatabaseConnection } from '@/database/connection'
import { transactions, users, goals, userMissions } from '@/database/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { DashboardQueryInput } from './dashboard.schema'
import { AppError } from '@/core/errors/app-error'

export class DashboardService {
  public async getDashboardData(userId: string, filters: DashboardQueryInput) {
    const db = DatabaseConnection.getInstance().getClient()

    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const { startDate, endDate } = filters

    const conditions = [eq(transactions.userId, userId)]

    if (startDate) {
      conditions.push(gte(transactions.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate))
    }

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions))

    let currentBalance = 0
    let monthlyCosts = 0

    const byCategoryMap = new Map<string, number>()
    const expensesMap = new Map<string, { revenue: number; expenses: number }>()

    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez'
    ]

    monthNames.forEach((name) => {
      expensesMap.set(name, { revenue: 0, expenses: 0 })
    })

    userTransactions.forEach((t) => {
      const val = Number(t.value)
      const dateObj = new Date(t.date)

      let monthStr = 'Mês'
      if (!isNaN(dateObj.getTime())) {
        monthStr = monthNames[dateObj.getMonth()]
      }

      const expEntry = expensesMap.get(monthStr) || { revenue: 0, expenses: 0 }

      if (t.type === 'revenue' || t.type === 'receita') {
        currentBalance += val
        expEntry.revenue += val
      } else {
        currentBalance -= val
        monthlyCosts += val
        expEntry.expenses += val

        const cat = t.category || 'Outros'
        byCategoryMap.set(cat, (byCategoryMap.get(cat) || 0) + val)
      }

      expensesMap.set(monthStr, expEntry)
    })

    // Fetch dynamic goals
    const dbGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))

    const activeGoals = dbGoals.filter((g) => g.status === 'active')
    const completedGoals = dbGoals.filter((g) => g.status === 'achieved')
    const failedGoals = dbGoals.filter((g) => g.status === 'cancelled')

    const totalSavingsGoal = dbGoals.reduce((acc, goal) => {
      const progress =
        (Number(goal.currentValue) / Number(goal.targetValue)) * 100
      return acc + Math.min(progress, 100)
    }, 0)

    const savingsGoal = dbGoals.length
      ? Math.round(totalSavingsGoal / dbGoals.length)
      : 0

    // Fetch dynamic missions
    const dbMissions = await db.query.userMissions.findMany({
      where: eq(userMissions.userId, userId),
      with: {
        mission: true
      }
    })

    const completedMissionsCount = dbMissions.filter(
      (m) => m.status === 'completed'
    ).length

    const summary = {
      userName: user.name,
      currentBalance,
      savingsGoal,
      monthlyCosts,
      completedMissions: completedMissionsCount
    }

    const totalGoalsCount = dbGoals.length || 1
    const goalProgress = [
      {
        name: 'Fracassadas',
        value: Math.round((failedGoals.length / totalGoalsCount) * 100),
        color: '#FF5B5B'
      },
      {
        name: 'Concluídas',
        value: Math.round((completedGoals.length / totalGoalsCount) * 100),
        color: '#00B074'
      },
      {
        name: 'Ativas',
        value: Math.round((activeGoals.length / totalGoalsCount) * 100),
        color: '#2D9CDB'
      }
    ]

    const missionCounts = [0, 0, 0, 0, 0, 0, 0]
    dbMissions.forEach((m) => {
      if (m.status === 'completed' && m.updatedAt) {
        const dateObj = new Date(m.updatedAt)
        const isInRange =
          (!startDate || dateObj >= new Date(startDate)) &&
          (!endDate || dateObj <= new Date(endDate))

        if (isInRange) {
          missionCounts[dateObj.getDay()]++
        }
      }
    })

    const missionHistory = [
      { name: 'Dom', value: missionCounts[0] },
      { name: 'Seg', value: missionCounts[1] },
      { name: 'Ter', value: missionCounts[2] },
      { name: 'Qua', value: missionCounts[3] },
      { name: 'Qui', value: missionCounts[4] },
      { name: 'Sex', value: missionCounts[5] },
      { name: 'Sáb', value: missionCounts[6] }
    ]

    const byCategory = Array.from(byCategoryMap.entries()).map(
      ([name, value]) => ({
        name,
        value
      })
    )

    const expensesSummary = Array.from(expensesMap.entries()).map(
      ([name, data]) => ({
        name,
        revenue: data.revenue,
        expenses: data.expenses
      })
    )

    if (expensesSummary.length === 0) {
      expensesSummary.push({ name: 'Atual', revenue: 0, expenses: 0 })
    }

    // Sort goals and missions for the dashboard
    const latestGoals = dbGoals
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((g) => ({
        ...g,
        progress: (Number(g.currentValue) / Number(g.targetValue)) * 100
      }))

    return {
      summary,
      goalProgress,
      missionHistory,
      expensesSummary,
      byCategory,
      goals: latestGoals.slice(0, 5),
      missions: dbMissions.slice(0, 5)
    }
  }
}
