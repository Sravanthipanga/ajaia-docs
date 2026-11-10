# Architecture Note

## Priorities

I prioritized a coherent end-to-end document workflow:
creation, rich-text editing, persistence, import, and sharing.

## Architecture

- Next.js provides the UI and server-side application layer.
- Tiptap provides structured rich-text editing.
- Supabase Postgres stores users, documents, and sharing records.
- Vercel hosts the application.

The client never talks to Supabase directly. Pages call the Next.js
Route Handlers under `src/app/api/` (`documents`, `shares`, `upload`),
which call the data layer in `src/lib/store.ts`. That layer has two
backends behind one interface: Supabase Postgres when
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set,
and an in-memory demo store (seeded with the two users) when they are
not, so the app can be run and reviewed without credentials. The demo
store lives for the server process lifetime.

## Content Storage

Editor content is stored as Tiptap JSON in a PostgreSQL JSONB
column so formatting and document structure survive refreshes.
The same JSON shape is used by the demo store, so switching backends
does not change the editor.

## Sharing Model

Each document has one owner. Additional users receive view or
edit permission through document_shares. Access is resolved in one
place, `src/lib/permissions.ts` (`resolveAccess`): owner can view,
edit, rename, share, and delete; a shared editor can view and edit
content; a shared viewer can view only; an unshared user gets no
access. The API routes and data layer enforce this; the UI only
hides buttons based on the same result.

## Scope Decisions

I used seeded users instead of implementing full authentication.
I supported TXT and Markdown import instead of DOCX because this
allowed me to concentrate on a reliable core workflow.

## Production Improvements

- Supabase Auth
- Row Level Security
- Real-time collaboration
- Version history
- Conflict detection
- Audit logging
