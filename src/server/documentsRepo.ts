// Server-only persistence for uploaded case documents (PDFs stored in Vercel Blob).
import { randomUUID } from 'node:crypto'
import { sql } from './db.js'
import type { EvidenceSourceType } from '../types/index.js'

export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'

export interface DocumentRow {
  id: string
  caseId: string
  blobUrl: string
  pathname: string
  filename: string
  sourceType: EvidenceSourceType
  status: DocumentStatus
  errorMessage: string | null
  entitiesAdded: number | null
  relationshipsAdded: number | null
  uploadedAt: string
  processedAt: string | null
}

function fromRow(r: Record<string, unknown>): DocumentRow {
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    blobUrl: r.blob_url as string,
    pathname: r.pathname as string,
    filename: r.filename as string,
    sourceType: r.source_type as EvidenceSourceType,
    status: r.status as DocumentStatus,
    errorMessage: (r.error_message as string | null) ?? null,
    entitiesAdded: r.entities_added === null ? null : Number(r.entities_added),
    relationshipsAdded: r.relationships_added === null ? null : Number(r.relationships_added),
    uploadedAt: new Date(r.uploaded_at as string).toISOString(),
    processedAt: r.processed_at ? new Date(r.processed_at as string).toISOString() : null,
  }
}

export async function createDocument(input: {
  caseId: string
  blobUrl: string
  pathname: string
  filename: string
  sourceType: EvidenceSourceType
}): Promise<DocumentRow> {
  const id = `doc-${randomUUID().slice(0, 8)}`
  const rows = (await sql()`
    insert into documents (id, case_id, blob_url, pathname, filename, source_type, status)
    values (${id}, ${input.caseId}, ${input.blobUrl}, ${input.pathname}, ${input.filename}, ${input.sourceType}, 'pending')
    returning *
  `) as unknown as Record<string, unknown>[]
  return fromRow(rows[0])
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  extra: { errorMessage?: string; entitiesAdded?: number; relationshipsAdded?: number } = {},
): Promise<void> {
  await sql()`
    update documents set
      status = ${status},
      error_message = ${extra.errorMessage ?? null},
      entities_added = ${extra.entitiesAdded ?? null},
      relationships_added = ${extra.relationshipsAdded ?? null},
      processed_at = case when ${status} in ('done', 'error') then now() else processed_at end
    where id = ${id}
  `
}
