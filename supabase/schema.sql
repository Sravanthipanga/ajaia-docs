-- Ajaia Docs — Supabase Postgres schema.
-- Run this in Supabase → SQL Editor, then set
-- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- in .env.local (see .env.example). Do not commit .env.local.

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Document',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  permission text not null default 'edit'
    check (permission in ('view', 'edit')),
  created_at timestamptz not null default now(),
  unique(document_id, user_id)
);

create index documents_owner_idx
  on documents(owner_id);

create index document_shares_user_idx
  on document_shares(user_id);

create index document_shares_document_idx
  on document_shares(document_id);

-- Seeded users. The app uses these fixed ids (see src/lib/seed.ts)
-- so the local demo store and the Supabase rows agree.
insert into users (id, name, email)
values
  ('11111111-1111-1111-1111-111111111111', 'Avery Johnson', 'avery@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Jordan Lee', 'jordan@example.com')
on conflict (email) do nothing;
