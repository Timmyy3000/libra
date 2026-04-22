# Libra

Libra is an open-source, self-hostable tool for turning books into character-aware audio experiences.

## What it does

Libra is built around a simple product flow:
1. upload a book
2. discover the cast
3. assign voices
4. generate the aura
5. play it back

This is **not** generic TTS and not a random AI toy. The point is directed, structured book-to-audio generation.

## v2 architecture

- **Next.js** for the product app and landing page
- **Convex** for application data and realtime state
- **Trigger.dev** for long-running orchestration
- **Cloudflare R2** for source files and generated audio assets
- **TypeScript** across the stack

## Product stance

Libra is personal-tool-first and self-hostable.

A hosted landing page and demo generations may exist, and SaaS can come later if there is real demand, but the repository should stay useful to someone who wants to run Libra for themselves.

## Workspace

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Repository layout

```txt
apps/web            # Next.js app + landing page
packages/shared     # shared zod schemas and domain contracts
convex/             # Convex schema and functions
trigger/            # Trigger.dev workflows
docs/               # architecture and self-hosting docs
scratchpad/         # local plans/notes/todos (gitignored)
```

## Current migration focus

The repo is being rebuilt around the first real vertical slice:
- upload a book
- store source file in R2
- create the book record in Convex
- run character discovery through Trigger.dev
- reflect live state in the UI
