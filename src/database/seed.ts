/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { DatabaseConnection } from './connection'
import {
  users,
  goals,
  missions,
  userMissions,
  transactions,
  rewards,
  achievements
} from './schema'
import { eq, and } from 'drizzle-orm'
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
          xp: 150,
          level: 2,
          heroCoins: 50
        })
        .returning()
      user = newUser
      console.log('✅ User created.')
    } else {
      console.log('✅ User already exists. Updating initial stats...')
      const [updatedUser] = await db
        .update(users)
        .set({
          xp: 150,
          level: 2,
          heroCoins: 50
        })
        .where(eq(users.email, userEmail))
        .returning()
      user = updatedUser
    }

    const userId = user.id

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
        coinReward: 10,
        isGlobal: true,
        imageUrl:
          'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400&h=400&fit=crop'
      },
      {
        title: 'Analista de Gastos',
        description: 'Categorize 10 transações no total.',
        difficulty: 'medium',
        type: 'transaction_count',
        targetValue: '10',
        xpReward: 100,
        coinReward: 25,
        isGlobal: true,
        imageUrl:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400&h=400&fit=crop'
      },
      {
        title: 'Mestre do Orçamento',
        description: 'Tenha 50 transações registradas.',
        difficulty: 'hard',
        type: 'transaction_count',
        targetValue: '50',
        xpReward: 500,
        coinReward: 100,
        isGlobal: true,
        imageUrl:
          'https://images.unsplash.com/photo-1454165833767-1306e1499021?q=80&w=400&h=400&fit=crop'
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
      const existing = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.description, tx.description),
          eq(transactions.value, tx.value)
        )
      })

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
        icon: 'Shield',
        imageUrl:
          'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=400&h=400&fit=crop'
      },
      {
        name: 'Tema Dark Gold',
        description: 'Uma interface personalizada para usuários avançados.',
        cost: '500.00',
        icon: 'Palette',
        imageUrl:
          'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&h=400&fit=crop'
      },
      {
        name: 'Avatar: Guardião do Tesouro',
        description: 'Um avatar exclusivo para seu perfil.',
        cost: '250.00',
        icon: 'User',
        imageUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&h=400&fit=crop'
      },
      {
        name: 'Planilha Mestra Premium',
        description: 'Ferramenta avançada para controle de dividendos.',
        cost: '1000.00',
        icon: 'Table',
        imageUrl:
          'https://images.unsplash.com/photo-1543286386-713bcd549661?q=80&w=400&h=400&fit=crop'
      }
    ]

    for (const reward of rewardData) {
      const existing = await db.query.rewards.findFirst({
        where: eq(rewards.name, reward.name)
      })
      if (!existing) {
        await db.insert(rewards).values(reward as any)
      } else {
        await db
          .update(rewards)
          .set(reward as any)
          .where(eq(rewards.id, existing.id))
      }
    }

    // 8. Achievements
    console.log('🏅 Seeding achievements...')
    const achievementData = [
      {
        name: 'Primeira de Muitas',
        description: 'Registrou sua primeira despesa.',
        xpReward: 50,
        coinReward: 10,
        icon: 'Star'
      },
      {
        name: 'Planejador Heróico',
        description: 'Criou sua primeira meta financeira.',
        xpReward: 50,
        coinReward: 10,
        icon: 'Target'
      },
      {
        name: 'Mão de Vaca de Ouro',
        description: 'Economizou 1000 reais no total.',
        xpReward: 200,
        coinReward: 50,
        icon: 'Coins'
      }
    ]

    for (const ach of achievementData) {
      const existing = await db.query.achievements.findFirst({
        where: eq(achievements.name, ach.name)
      })
      if (!existing) {
        await db.insert(achievements).values(ach as any)
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
