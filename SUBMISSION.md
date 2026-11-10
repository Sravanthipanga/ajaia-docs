# Submission

## Live Product

https://ajaia-docs-five-rose.vercel.app/

Live deployment uses Supabase Postgres (project `ajaia-docs`, US East, tables `users` / `documents` / `document_shares`, seeded with Avery Johnson and Jordan Lee). End-to-end verified 2026-11-10: create, auto-save, refresh/reopen, and delete all work against real Postgres.

## Walkthrough Video

https://www.loom.com/share/b17fcd54e86b4bbfaa7b03469b1ab3c3

## Source Code

Included in this folder and available at:
https://github.com/Sravanthipanga/ajaia-docs

## Test Accounts

- Avery Johnson: avery@example.com
- Jordan Lee: jordan@example.com

Use the user switcher in the application. No password is required.

## Included Files

- Source code
- README.md
- architecture.md
- AI_WORKFLOW.md
- walkthrough-url.txt
- Screenshots (TODO — add after deployment)
- Database schema (`supabase/schema.sql`)
- Automated tests (`tests/`)

## Working Features

- Create and rename documents
- Rich-text editing
- Auto-save and persistence
- TXT and Markdown import
- Ownership
- Document sharing
- Owned and shared document lists
- View and edit permissions
- Validation and error handling
- Automated tests
- Live deployment — https://ajaia-docs-five-rose.vercel.app/ (Supabase Postgres, verified end to end 2026-11-10)

## Intentional Limitations

- Mocked user switching instead of full authentication
- No real-time simultaneous editing
- No comments or version history
- TXT and Markdown import only

## Tests

Run `npm test`. At build time (2026-11-10, local verification):
3 test files, 16 tests, all passing — permission logic, file/title
validation, Markdown conversion, and a DocumentCard render test.
See the build report for the exact output.

## Next 2-4 Hours

- Add Supabase authentication and RLS
- Add optimistic updates
- Polish the document-delete confirmation flow (delete is already implemented)
- Add Markdown export
- Add conflict/version handling
