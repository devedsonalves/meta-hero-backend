import { z } from 'zod/v4'

export const dashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>

const summaryDataSchema = z.object({
  userName: z.string(),
  currentBalance: z.number(),
  savingsGoal: z.number(),
  monthlyCosts: z.number(),
  completedMissions: z.number()
})

const goalProgressSchema = z.array(
  z.object({
    name: z.string(),
    value: z.number(),
    color: z.string()
  })
)

const chartDataSchema = z.array(
  z.object({
    name: z.string(),
    value: z.number()
  })
)

const expensesSummarySchema = z.array(
  z.object({
    name: z.string(),
    revenue: z.number(),
    expenses: z.number()
  })
)

export const dashboardResponseSchema = z.object({
  summary: summaryDataSchema,
  goalProgress: goalProgressSchema,
  missionHistory: chartDataSchema,
  expensesSummary: expensesSummarySchema,
  byCategory: chartDataSchema
})

export type DashboardResponseOutput = z.infer<typeof dashboardResponseSchema>
