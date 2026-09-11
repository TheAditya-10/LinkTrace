// Inserts the three original fixture cases into Neon so they keep appearing
// in the case list after the switch from static fixtures to a real backend.
// Run once via: npx dotenv -e .env.local -- npx tsx scripts/seed.ts
import { neon } from '@neondatabase/serverless'
import { allCaseData } from '../src/data'
import type { CaseData } from '../src/types'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set — run via `dotenv -e .env.local -- tsx scripts/seed.ts`')
  process.exit(1)
}
const sql = neon(url)

async function seedCase(data: CaseData) {
  const c = data.case
  const existing = (await sql`select id from cases where id = ${c.id}`) as { id: string }[]
  if (existing.length > 0) {
    console.log(`Skipping ${c.id} — already seeded.`)
    return
  }

  await sql`
    insert into cases (id, name, case_number, status, risk_level, opened_date, last_updated, summary, lead_investigator, jurisdiction)
    values (${c.id}, ${c.name}, ${c.caseNumber}, ${c.status}, ${c.riskLevel}, ${c.openedDate}, ${c.lastUpdated}, ${c.summary}, ${c.leadInvestigator}, ${c.jurisdiction})
  `

  for (const e of data.entities) {
    await sql`
      insert into entities (id, case_id, type, label, aliases, risk_score, confidence, attributes, evidence_ids, first_seen, last_seen)
      values (${e.id}, ${c.id}, ${e.type}, ${e.label}, ${e.aliases}, ${e.riskScore}, ${e.confidence}, ${JSON.stringify(e.attributes)}, ${e.evidenceIds}, ${e.firstSeen}, ${e.lastSeen})
    `
  }
  for (const r of data.relationships) {
    await sql`
      insert into relationships (id, case_id, source_id, target_id, type, label, weight, occurrence_count, predicted, confidence, description, evidence_ids, first_seen, last_seen)
      values (${r.id}, ${c.id}, ${r.sourceId}, ${r.targetId}, ${r.type}, ${r.label}, ${r.weight}, ${r.occurrenceCount}, ${r.predicted}, ${r.confidence}, ${r.description}, ${r.evidenceIds}, ${r.firstSeen}, ${r.lastSeen})
    `
  }
  for (const ev of data.evidence) {
    await sql`
      insert into evidence (id, case_id, source_type, title, excerpt, timestamp, reliability, related_entity_ids, related_relationship_ids, contradicts_evidence_id, contradiction_note)
      values (${ev.id}, ${c.id}, ${ev.sourceType}, ${ev.title}, ${ev.excerpt}, ${ev.timestamp}, ${ev.reliability}, ${ev.relatedEntityIds}, ${ev.relatedRelationshipIds}, ${ev.contradictsEvidenceId ?? null}, ${ev.contradictionNote ?? null})
    `
  }
  for (const t of data.timeline) {
    await sql`
      insert into timeline_events (id, case_id, timestamp, type, title, description, entity_ids, relationship_id)
      values (${t.id}, ${c.id}, ${t.timestamp}, ${t.type}, ${t.title}, ${t.description}, ${t.entityIds}, ${t.relationshipId ?? null})
    `
  }
  for (const l of data.leads) {
    await sql`
      insert into leads (id, case_id, entity_ids, relationship_id, priority, reason, created_at)
      values (${l.id}, ${c.id}, ${l.entityIds}, ${l.relationshipId}, ${l.priority}, ${l.reason}, ${l.createdAt})
    `
  }
  for (const a of data.alerts) {
    await sql`
      insert into alerts (id, case_id, type, priority, title, description, timestamp, read, target_entity_id, target_relationship_id)
      values (${a.id}, ${c.id}, ${a.type}, ${a.priority}, ${a.title}, ${a.description}, ${a.timestamp}, ${a.read}, ${a.targetEntityId ?? null}, ${a.targetRelationshipId ?? null})
    `
  }
  console.log(`Seeded ${c.id} (${data.entities.length} entities, ${data.relationships.length} relationships).`)
}

async function main() {
  for (const data of allCaseData) {
    await seedCase(data)
  }
}

main()
  .then(() => console.log('Done.'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
