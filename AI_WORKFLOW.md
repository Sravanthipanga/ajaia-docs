# AI Workflow

## Tools Used

- Muse (Meta's personal AI agent, Muse Spark model) — used as the
  coding assistant for this build, via its subagent build session.
  No other AI coding assistant was used for this project.

## Where AI Accelerated the Work

AI helped me:
- Decompose the assignment
- Compare implementation approaches
- Generate an initial database schema
- Scaffold Tiptap integration
- Identify edge cases
- Generate initial tests
- Review documentation

## Outputs I Changed or Rejected

I rejected a real-time WebSocket collaboration proposal because
it introduced unnecessary delivery risk for the timebox.

I changed the initial save strategy from saving on every editor
update to debounced auto-save to reduce database traffic.

I strengthened AI-generated permission logic by validating
authorization in the data operation rather than relying only on
disabled UI controls.

I added a local demo store behind the same data-layer interface
after finding that no Supabase credentials were available at build
time, so the app could still be run and verified end to end
without credentials; the Supabase path remains the real
persistence path when the env vars are set.

## Verification

I:
- Reviewed all generated code
- Ran automated tests
- Tested refresh persistence
- Tested owner and shared-user workflows
- Tested supported and unsupported uploads
- Tested the deployed application in a private browser (to be done
  after Vercel deployment — not yet deployed)
- Verified failure and empty states manually
