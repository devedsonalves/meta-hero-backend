import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  numeric,
  date,
  integer
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password'),
  authProvider: varchar('auth_provider', { length: 20 })
    .notNull()
    .default('local'),
  isActive: boolean('is_active').notNull().default(true),
  xp: numeric('xp', { precision: 10, scale: 2 }).notNull().default('0'),
  level: numeric('level', { precision: 10, scale: 2 }).notNull().default('1'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  hashedToken: text('hashedToken').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const transactions = pgTable('transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  date: date('date').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const goals = pgTable('goals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  targetValue: numeric('target_value', { precision: 12, scale: 2 }).notNull(),
  currentValue: numeric('current_value', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  dueDate: date('due_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  categoryId: varchar('category_id'), // Optional link to transaction category
  note: text('note').default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export const missions = pgTable('missions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default(''),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('easy'),
  type: varchar('type', { length: 50 }).notNull().default('manual'), // manual, saving, transaction_count, category_limit
  targetValue: numeric('target_value', { precision: 12, scale: 2 }).default(
    '0.00'
  ),
  targetCategory: varchar('target_category'),
  xpReward: integer('xp_reward').notNull().default(10),
  isGlobal: boolean('is_global').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export const userMissions = pgTable('user_missions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  missionId: text('mission_id')
    .references(() => missions.id, { onDelete: 'cascade' })
    .notNull(),
  status: varchar('status', { length: 50 }).notNull().default('assigned'),
  progress: integer('progress').notNull().default(0),
  meta: text('meta'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export const rewards = pgTable('rewards', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export const userRewards = pgTable('user_rewards', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  rewardId: text('reward_id')
    .references(() => rewards.id, { onDelete: 'cascade' })
    .notNull(),
  acquiredAt: timestamp('acquired_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  goals: many(goals),
  userMissions: many(userMissions),
  userRewards: many(userRewards)
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id]
  })
}))

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id]
  })
}))

export const missionsRelations = relations(missions, ({ many }) => ({
  userMissions: many(userMissions)
}))

export const userMissionsRelations = relations(userMissions, ({ one }) => ({
  user: one(users, {
    fields: [userMissions.userId],
    references: [users.id]
  }),
  mission: one(missions, {
    fields: [userMissions.missionId],
    references: [missions.id]
  })
}))

export const rewardsRelations = relations(rewards, ({ many }) => ({
  userRewards: many(userRewards)
}))

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id]
  }),
  reward: one(rewards, {
    fields: [userRewards.rewardId],
    references: [rewards.id]
  })
}))
