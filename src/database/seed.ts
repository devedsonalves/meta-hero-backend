/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { DatabaseConnection } from './connection'
import {
  users,
  goals,
  missions,
  userMissions,
  transactions,
  rewards
} from './schema'
import { eq, sql, and } from 'drizzle-orm'
import bcrypt from 'bcrypt'

async function seed() {
  const dbConnection = DatabaseConnection.getInstance()
  const db = dbConnection.getClient()

  console.log('🌱 Starting database seeding...')

  try {
    // 1. Create or get the main user
    const userEmail = 'edson@email.com'
    let user = await db.query.users.findFirst({
      where: eq(users.email, userEmail)
    })

    if (!user) {
      console.log(`👤 User ${userEmail} not found. Creating...`)
      const hashedPassword = await bcrypt.hash('123456', 10)
      const [newUser] = await db
        .insert(users)
        .values({
          name: 'Edson',
          email: userEmail,
          password: hashedPassword,
          xp: '150',
          level: '5'
        })
        .returning()
      user = newUser
      console.log('✅ User created.')
    } else {
      console.log('✅ User already exists.')
    }

    const userId = user.id

    // 2. Clear some existing data for this user to avoid duplicates if re-running
    // (Optional: depending on whether you want to stack data or start fresh)
    // For this seed, we'll just add new data.

    // 3. Goals
    console.log('🎯 Seeding goals...')
    const goalData = [
      {
        userId,
        name: 'Reserva de Emergência',
        targetValue: '10000.00',
        currentValue: '2500.00',
        dueDate: new Date(new Date().getFullYear() + 1, 0, 1)
          .toISOString()
          .split('T')[0],
        status: 'active',
        note: 'Garantir tranquilidade financeira.'
      },
      {
        userId,
        name: 'Novo PC Gamer',
        targetValue: '7500.00',
        currentValue: '1200.00',
        dueDate: new Date(new Date().getFullYear(), 11, 25)
          .toISOString()
          .split('T')[0],
        status: 'active',
        note: 'Configuração RTX 4070.'
      },
      {
        userId,
        name: 'Meta de Investimento 2026',
        targetValue: '50000.00',
        currentValue: '50000.00',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'achieved',
        note: 'Meta batida com antecedência!'
      }
    ]

    for (const goal of goalData) {
      const existing = await db.query.goals.findFirst({
        where: (g, { and, eq }) =>
          and(eq(g.userId, userId), eq(g.name, goal.name))
      })
      if (!existing) {
        await db.insert(goals).values(goal as any)
      }
    }

    // 4. Missions
    console.log('⚔️ Seeding missions...')
    const missionData = [
      {
        title: 'Poupador Iniciante',
        description: 'Economize R$ 100,00 em uma única semana.',
        difficulty: 'easy',
        type: 'saving',
        targetValue: '100.00',
        xpReward: 50,
        isGlobal: true
      },
      {
        title: 'Analista de Gastos',
        description: 'Categorize 10 transações no total.',
        difficulty: 'medium',
        type: 'transaction_count',
        targetValue: '10',
        xpReward: 100,
        isGlobal: true
      },
      {
        title: 'Mestre do Orçamento',
        description: 'Tenha 50 transações registradas.',
        difficulty: 'hard',
        type: 'transaction_count',
        targetValue: '50',
        xpReward: 500,
        isGlobal: true
      }
    ]

    const insertedMissions = []
    for (const mission of missionData) {
      let m = await db.query.missions.findFirst({
        where: eq(missions.title, mission.title)
      })
      if (!m) {
        const [newM] = await db
          .insert(missions)
          .values(mission as any)
          .returning()
        m = newM
      } else {
        // Update existing mission with new fields
        await db
          .update(missions)
          .set(mission as any)
          .where(eq(missions.id, m.id))
      }
      insertedMissions.push(m)
    }

    // 5. User Missions
    console.log('📜 Assigning missions to user...')
    for (const m of insertedMissions) {
      const existing = await db.query.userMissions.findFirst({
        where: (um, { and, eq }) =>
          and(eq(um.userId, userId), eq(um.missionId, m.id))
      })
      if (!existing) {
        await db.insert(userMissions).values({
          userId,
          missionId: m.id,
          status:
            m.title === 'Poupador Iniciante' ? 'completed' : 'in_progress',
          progress: m.title === 'Poupador Iniciante' ? 100 : 30
        })
      }
    }

    // 6. Transactions
    console.log('💰 Seeding transactions...')

    // Fix existing wrong records if any
    await db.execute(
      sql`UPDATE transactions SET type = 'receita' WHERE type = 'income'`
    )
    await db.execute(
      sql`UPDATE transactions SET type = 'despesa' WHERE type = 'expense'`
    )

    const transactionData = [
      {
        userId,
        type: 'receita',
        category: 'Salário',
        value: '5000.00',
        date: new Date().toISOString().split('T')[0],
        description: 'Salário Mensal'
      },
      {
        userId,
        type: 'despesa',
        category: 'Alimentação',
        value: '150.00',
        date: new Date().toISOString().split('T')[0],
        description: 'Jantar de Celebração'
      },
      {
        userId,
        type: 'despesa',
        category: 'Aluguel',
        value: '1200.00',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 5)
          .toISOString()
          .split('T')[0],
        description: 'Aluguel'
      },
      {
        userId,
        type: 'receita',
        category: 'Freelance',
        value: '800.00',
        date: new Date().toISOString().split('T')[0],
        description: 'Projeto MetaHero UI'
      }
    ]

    for (const tx of transactionData) {
      // Check if similar transaction exists to avoid duplicates on multiple seeds
      const [existing] = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.description, tx.description),
            eq(transactions.value, tx.value)
          )
        )
        .limit(1)

      if (!existing) {
        await db.insert(transactions).values(tx as any)
      }
    }

    // 7. Rewards
    console.log('🏆 Seeding rewards...')
    const rewardData = [
      {
        name: 'Selo de Herói de Bronze',
        description: 'Concedido por completar suas primeiras 5 missões.',
        cost: '100.00',
        icon: 'Shield'
      },
      {
        name: 'Tema Dark Gold',
        description: 'Uma interface personalizada para usuários avançados.',
        cost: '500.00',
        icon: 'Palette'
      }
    ]

    for (const reward of rewardData) {
      const existing = await db.query.rewards.findFirst({
        where: eq(rewards.name, reward.name)
      })
      if (!existing) {
        await db.insert(rewards).values(reward as any)
      }
    }

    console.log('✨ Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
  } finally {
    await dbConnection.disconnect()
    process.exit(0)
  }
}

seed()
