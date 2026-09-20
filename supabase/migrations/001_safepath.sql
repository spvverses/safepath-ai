create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;

create table if not exists public.knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  source text not null default 'user',
  embedding extensions.vector(384),
  created_at timestamptz not null default now()
);
create index if not exists knowledge_fts on public.knowledge using gin(to_tsvector('english', content));
create index if not exists knowledge_embedding_hnsw on public.knowledge using hnsw (embedding vector_cosine_ops);

create table if not exists public.route_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  origin jsonb not null,
  destination jsonb not null,
  selected_route jsonb,
  safety_score integer,
  created_at timestamptz not null default now()
);
alter table public.knowledge enable row level security;
alter table public.route_events enable row level security;
-- The application uses the server-side service role for writes/reads.
-- Add authenticated-user policies later if you introduce Supabase Auth.
