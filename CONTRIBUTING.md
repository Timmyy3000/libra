# Contributing to Libra

Thanks for contributing.

Libra is an open-source, self-hostable tool for turning books into character-aware audio experiences.

## Before you build

Read:
- `README.md`
- `AGENTS.md`
- relevant docs in `docs/`

## Engineering rules

- Use red-green-refactor TDD by default
- Keep docs in sync with implementation
- Prefer small, focused commits
- Plan major features before building them
- Keep self-hosting reality in mind when making architectural choices

## Scratch work

Use the gitignored `scratchpad/` directory for:
- plans
- temporary notes
- todo drafts
- napkin notes for future sessions

Do not commit scratchpad contents unless there is an explicit reason to publish them.

## Local setup

```bash
pnpm install
pnpm dev
```

## Quality checks

Run these before opening a PR:

```bash
pnpm lint
pnpm test
pnpm build
```

## Commit style

Prefer conventional-ish commit messages, for example:
- `feat: add book upload flow`
- `fix: handle failed trigger workflow state`
- `docs: clarify self-hosted storage setup`
- `test: cover job state transitions`
