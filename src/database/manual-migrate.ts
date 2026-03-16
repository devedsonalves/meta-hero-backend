/* eslint-disable no-console */
import { DatabaseConnection } from './connection'
import { sql } from 'drizzle-orm'

async function runMigration() {
  const dbConnection = DatabaseConnection.getInstance()
  const db = dbConnection.getClient()

  try {
    console.log('🚀 Running manual schema update...')

    await db.execute(
      sql`ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "category_id" varchar;`
    )
    await db.execute(
      sql`ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "type" varchar DEFAULT 'manual' NOT NULL;`
    )
    await db.execute(
      sql`ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "target_value" numeric(12, 2) DEFAULT '0.00';`
    )
    await db.execute(
      sql`ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "target_category" varchar;`
    )

    console.log('✅ Schema updated successfully!')
  } catch (error) {
    console.error('❌ Error during manual migration:', error)
  } finally {
    await dbConnection.disconnect()
    process.exit(0)
  }
}

runMigration()
