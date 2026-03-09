import { DatabaseConnection } from '@/database/connection'
import { transactions, users } from '@/database/schema'
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
    const completedMissions = 0

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

    const savingsGoal = 0

    const summary = {
      userName: user.name,
      currentBalance,
      savingsGoal,
      monthlyCosts,
      completedMissions
    }

    const goalProgress = [
      { name: 'Fracassadas', value: 0, color: '#FF5B5B' },
      { name: 'Concluídas', value: 0, color: '#00B074' },
      { name: 'Restantes', value: 100, color: '#2D9CDB' }
    ]

    const byCategory = Array.from(byCategoryMap.entries()).map(
      ([name, value]) => ({
        name,
        value
      })
    )

    const missionHistory = [
      { name: 'Dom', value: 0 },
      { name: 'Seg', value: 0 },
      { name: 'Ter', value: 0 },
      { name: 'Qua', value: 0 },
      { name: 'Qui', value: 0 },
      { name: 'Sex', value: 0 },
      { name: 'Sáb', value: 0 }
    ]

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

    return {
      summary,
      goalProgress,
      missionHistory,
      expensesSummary,
      byCategory
    }
  }
}
