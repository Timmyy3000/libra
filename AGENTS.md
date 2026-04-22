# AGENTS.md

This repository is built with agents in mind.

## What Libra is

Libra is an open-source, self-hostable tool for turning books into character-aware audio experiences.

Core idea:
- upload a book
- discover the cast
- assign voices
- generate an aura
- play it back as a structured audio experience

Libra is not generic text-to-speech and not a random AI demo. It is specifically about guided book-to-audio generation.

## Engineering conventions

### 1. Red-green-refactor TDD

Default to test-driven development:
- write a failing test first
- implement the smallest thing to make it pass
- refactor while keeping tests green

### 2. Plan before major features

Before implementing a major feature, create a detailed plan in `scratchpad/plans/`.

### 3. Keep scratch work out of git

Use `scratchpad/` for temporary working material:
- `scratchpad/plans/` for feature plans
- `scratchpad/notes/` for temporary implementation notes
- `scratchpad/todos/` for roadmap and checklist drafts
- `scratchpad/napkin.md` for quick durable notes to future sessions

`scratchpad/` must stay gitignored unless there is an explicit reason to publish something from it.

### 4. Keep the architecture honest

Current bias:
- Next.js for the product app and landing page
- Convex for app state and metadata
- Trigger.dev for long-running orchestration
- R2 for files and generated audio assets
- shared TypeScript contracts in workspace packages

Do not reintroduce the old split-stack mess.

### 5. Protect the product idea

Do not drift into building a generic media CRUD app.

Libra should feel like a focused tool for transforming books into directed, voice-cast audio experiences.

### 6. OSS and self-hosting matter

The repo should be usable by someone who wants to run Libra for themselves.

That means:
- docs should not be an afterthought
- `.env.example` should stay current
- storage and provider assumptions should be explicit
- local development should not be miserable

## Working style

When making changes:
- prefer small commits
- keep docs in sync with implementation
- update tests with behavior changes
- leave useful notes in `scratchpad/notes/` when future-you will benefit

## Product north star

A person should be able to self-host Libra, upload a book, cast voices, and say:

> This is my book-to-audio studio, and I control both the source text and the generation pipeline.
