# Ajaia Docs

## Live Application

https://ajaia-docs-five-rose.vercel.app/

Live deployment uses Supabase Postgres (project `ajaia-docs`, US East) — see "Demo mode" below for the local fallback when Supabase is not configured.

## Walkthrough Video

TODO — paste the Loom walkthrough URL here after recording (3–5 minutes).

## Overview

Ajaia Docs is a lightweight collaborative document editor built with Next.js, TypeScript, Tiptap, Supabase, and Vercel. It prioritises a complete document workflow — creation, rich-text editing, persistence, import, and sharing — over attempting to reproduce every Google Docs feature.

## Core Features

- Create and rename documents (title: 1–120 characters, saved on Enter / blur)
- Rich-text editing with Tiptap: bold, italic, underline, Heading 1/2/3, paragraph, bullet and ordered lists, undo/redo
- Save and reopen — content is stored as Tiptap JSON in a PostgreSQL `jsonb` column (or in the local demo store when Supabase is not configured; see below)
- Auto-save with visible status: debounced ~800 ms after the last edit, showing `Saving…`, `Saved at 2:14 PM`, or `Unable to save. Retry`
- Import `.txt` and `.md` files (max 1 MB, filename without extension becomes the title; basic Markdown headings and lists are converted)
- Ownership and sharing: owner can view/edit/rename/share/delete; shared editors can edit content; shared viewers can view only; unshared users get an access-denied state. Permissions are enforced in the API/data layer, not only in the UI.
- “My Documents” and “Shared With Me” lists, with ownership badges and relative updated timestamps
- Validation and friendly error messages for titles, imports, sharing, and save failures
- Automated tests (Vitest): permission logic, file/title validation, Markdown conversion, and a DocumentCard render test
- Loading skeletons, empty states, 404 and access-denied states, and a confirmation before deleting a document

## Technology Stack

- Next.js 16 (App Router, `src/` directory, Turbopack) + TypeScript + Tailwind CSS 4
- Tiptap (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-underline`), with `immediatelyRender: false` to avoid Next.js hydration mismatches
- Supabase Postgres via `@supabase/supabase-js`
- Validation with Zod; icons with lucide-react; relative dates with date-fns
- Vitest + Testing Library + jsdom for tests

## Seeded Users

Authentication is intentionally simulated with two seeded users so the assessment focuses on document workflows, persistence, sharing logic, and usability. Production authentication would be implemented using Supabase Auth with database-level row security (RLS). Use the user switcher in the app header — no password is required.

- Avery Johnson: avery@example.com
- Jordan Lee: jordan@example.com

## Local Setup

```sh
npm install
npm run dev
```

Open http://localhost:3000

### Demo mode (no Supabase yet)

If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set, the app runs in local demo mode backed by an in-memory store seeded with the two users above. Documents persist for the lifetime of the running server (they survive a page refresh, which is what the save/reopen flow needs) but not across a server restart. Set the Supabase variables to use real Postgres persistence.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. Do not commit `.env.local`.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Database Setup

1. Create a Supabase project.
2. In Supabase → SQL Editor, run `supabase/schema.sql` (creates `users`, `documents`, `document_shares`, indexes, and seeds Avery Johnson and Jordan Lee).
3. In Project Settings → API, copy the Project URL and anon public key into `.env.local`.
4. Restart `npm run dev`.

## Running Tests

```sh
npm test
```

Expected: 3 test files, 16 tests, all passing (permission logic, file/title validation, Markdown conversion, DocumentCard render). Test output is recorded in `SUBMISSION.md` / the build notes.

Note: Vitest 5's peer range for `@types/node` conflicts with the `@types/node` version scaffolded by create-next-app, so `.npmrc` sets `legacy-peer-deps=true` to keep `npm install` reproducible.

## Product Decisions

- Stored Tiptap JSON, not only HTML, so headings, marks, and lists survive refreshes in structured form.
- Debounced auto-save (~800 ms) instead of saving on every keystroke, to reduce database traffic.
- Simulated users instead of full authentication, to concentrate the timebox on a reliable core workflow.
- Supported TXT and Markdown import instead of DOCX, for the same reason.
- Permissions are resolved in one helper (`src/lib/permissions.ts`, `resolveAccess`) and enforced in the API routes / data layer (`src/lib/store.ts`); the UI only hides buttons based on the same result.

## Known Limitations

- Mocked user switching instead of full authentication (no Supabase Auth / RLS yet)
- No real-time simultaneous editing
- No comments, suggestion mode, or version history
- TXT and Markdown import only (no DOCX); Markdown import converts headings and lists, but inline `**bold**` / `*italic*` markers are kept as plain text
- In demo mode (no Supabase env vars), documents live only for the server's lifetime
- No PDF export

## What I Would Build Next

- Supabase Auth + Row Level Security
- Optimistic updates
- Document deletion is implemented; next would be Markdown export
- Version history / conflict handling
- Real-time collaboration
