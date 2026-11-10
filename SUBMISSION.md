# Submission

## Live Product

TODO — paste the Vercel deployment URL here after deployment.

## Walkthrough Video

TODO — paste the Loom or YouTube URL here after recording (3–5 minutes).

## Source Code

Included in this folder and available at:
https://github.com/Sravanthipanga/ajaia-docs (private repo — push pending; see below)

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
- Live deployment (TODO — deploy to Vercel)

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
- Add document deletion and confirmation (already implemented; polish the flow)
- Add Markdown export
- Add conflict/version handling
