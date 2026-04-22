# Libra

Libra is an open-source personal tool for turning books into character-aware audio experiences.

## v2 architecture

- **Next.js** for the product app and landing page
- **Convex** for application data and realtime state
- **Trigger.dev** for long-running orchestration
- **Cloudflare R2** for source files and generated audio assets
- **TypeScript** across the stack

## Product direction

Libra is personal-tool-first and self-hostable. A hosted demo may exist, and SaaS can come later, but the repo should stay useful to someone who wants to run it for themselves.

## Workspace

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```
