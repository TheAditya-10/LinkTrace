// Applies db/schema.sql against Neon. Run once (and again after schema edits) via:
//   npx dotenv -e .env.local -- npx tsx scripts/migrate.ts
// Uses the direct/unpooled connection string — schema changes must not go through
// the pooled (-pooler) endpoint.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL_UNPOOLED
if (!url) {
  console.error('DATABASE_URL_UNPOOLED is not set — run via `dotenv -e .env.local -- tsx scripts/migrate.ts`')
  process.exit(1)
}

const schemaPath = path.join(import.meta.dirname, '..', 'db', 'schema.sql')
const schema = readFileSync(schemaPath, 'utf-8')

async function main() {
  const client = new Client(url)
  await client.connect()
  try {
    // Client (unlike the HTTP `neon()` tagged-template driver) speaks the real
    // Postgres wire protocol, so a multi-statement DDL string runs as-is.
    await client.query(schema)
    console.log('Schema applied.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
