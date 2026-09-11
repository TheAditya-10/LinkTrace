-- LinkTrace schema. Mirrors src/types/index.ts closely so the read path can
-- reconstruct a CaseData object with minimal translation. Applied once via
-- scripts/migrate.ts against the direct (unpooled) connection string.

create table if not exists cases (
  id text primary key,
  name text not null,
  case_number text not null unique,
  status text not null check (status in ('active', 'under_review', 'closed')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  opened_date timestamptz not null,
  last_updated timestamptz not null default now(),
  summary text not null default '',
  lead_investigator text not null default '',
  jurisdiction text not null default ''
);

create table if not exists entities (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  type text not null,
  label text not null,
  aliases text[] not null default '{}',
  risk_score integer not null default 0,
  confidence real not null default 1,
  attributes jsonb not null default '{}',
  evidence_ids text[] not null default '{}',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists entities_case_id_idx on entities(case_id);

create table if not exists relationships (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  source_id text not null,
  target_id text not null,
  type text not null,
  label text not null,
  weight real not null default 0.5,
  occurrence_count integer not null default 1,
  predicted boolean not null default false,
  confidence real not null default 1,
  description text not null default '',
  evidence_ids text[] not null default '{}',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists relationships_case_id_idx on relationships(case_id);

create table if not exists evidence (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  source_type text not null,
  title text not null,
  excerpt text not null default '',
  timestamp timestamptz not null default now(),
  reliability text not null check (reliability in ('confirmed', 'probable', 'unverified')),
  related_entity_ids text[] not null default '{}',
  related_relationship_ids text[] not null default '{}',
  contradicts_evidence_id text,
  contradiction_note text
);
create index if not exists evidence_case_id_idx on evidence(case_id);

create table if not exists timeline_events (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  timestamp timestamptz not null default now(),
  type text not null,
  title text not null,
  description text not null default '',
  entity_ids text[] not null default '{}',
  relationship_id text
);
create index if not exists timeline_events_case_id_idx on timeline_events(case_id);

create table if not exists leads (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  entity_ids text[] not null,
  relationship_id text not null,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  reason text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists leads_case_id_idx on leads(case_id);

create table if not exists alerts (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  type text not null,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text not null default '',
  timestamp timestamptz not null default now(),
  read boolean not null default false,
  target_entity_id text,
  target_relationship_id text
);
create index if not exists alerts_case_id_idx on alerts(case_id);

create table if not exists documents (
  id text primary key,
  case_id text not null references cases(id) on delete cascade,
  blob_url text not null,
  pathname text not null,
  filename text not null,
  source_type text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  error_message text,
  entities_added integer,
  relationships_added integer,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists documents_case_id_idx on documents(case_id);
