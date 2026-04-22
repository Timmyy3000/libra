# Libra migration plan

## Decisions locked

- New repo, not a retrofit of the old FE repo
- Next.js monorepo
- Convex for primary app state and metadata
- Trigger.dev for long-running workflows
- Cloudflare R2 for storage
- Preserve the FE product flow: upload -> discover characters -> assign voices -> generate aura -> play aura

## Delivery order

1. Foundation and shared types
2. Landing page and app shell
3. Book upload into R2 + Convex record
4. Character discovery workflow
5. Voice catalog and casting
6. Script generation
7. Audio generation and playlist playback
8. OSS/self-hosting hardening
