"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BookStateSummary } from "@libra/shared";

type BookResponse =
  | { ok: true; data: { mode: "convex"; book: BookStateSummary } | { mode: "deferred"; reason: string; book: null } }
  | { ok: false; error: string };

type CharacterDraft = {
  name: string;
  description: string;
  aliases: string;
};

type MutationResponse = { ok: true; data: { mode: "convex" | "deferred"; reason?: string } } | { ok: false; error: string };

function format(value: string) {
  return value.replace(/_/g, " ");
}

function aliasesText(aliases: string[]) {
  return aliases.join("\n");
}

export function BookDetailClient({ bookId }: { bookId: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; book: BookStateSummary; drafts: Record<string, CharacterDraft>; notice?: string }
    | { status: "deferred"; reason: string }
  >({ status: "loading" });
  const [busyCharacterId, setBusyCharacterId] = useState<string | null>(null);

  const load = useCallback(async (notice?: string) => {
    const response = await fetch(`/api/books/${bookId}`);
    const payload = (await response.json()) as BookResponse;

    if (!response.ok || !payload.ok) {
      setState({ status: "error", message: payload.ok ? "Failed to load book." : payload.error });
      return;
    }

    if (payload.data.mode === "deferred") {
      setState({ status: "deferred", reason: payload.data.reason });
      return;
    }

    const drafts = Object.fromEntries(
      payload.data.book.characters.map((character) => [
        character.id,
        {
          name: character.name,
          description: character.description,
          aliases: aliasesText(character.aliases),
        },
      ]),
    );

    setState({ status: "success", book: payload.data.book, drafts, ...(notice ? { notice } : {}) });
  }, [bookId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  function updateDraft(characterId: string, patch: Partial<CharacterDraft>) {
    setState((current) => {
      if (current.status !== "success") return current;
      return {
        ...current,
        drafts: {
          ...current.drafts,
          [characterId]: {
            ...(current.drafts[characterId] ?? { name: "", description: "", aliases: "" }),
            ...patch,
          },
        },
      };
    });
  }

  async function saveCharacter(characterId: string) {
    if (state.status !== "success") return;
    const draft = state.drafts[characterId];
    if (!draft) return;

    setBusyCharacterId(characterId);
    const response = await fetch(`/api/books/${bookId}/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description,
        aliases: draft.aliases.split(/[\n,]/).map((alias) => alias.trim()).filter(Boolean),
      }),
    });
    const payload = (await response.json()) as MutationResponse;
    setBusyCharacterId(null);

    if (!response.ok || !payload.ok) {
      setState({ status: "error", message: payload.ok ? "Failed to save character." : payload.error });
      return;
    }

    await load(payload.data.mode === "deferred" ? payload.data.reason : "Character saved.");
  }

  async function deleteCharacter(characterId: string) {
    setBusyCharacterId(characterId);
    const response = await fetch(`/api/books/${bookId}/characters/${characterId}`, { method: "DELETE" });
    const payload = (await response.json()) as MutationResponse;
    setBusyCharacterId(null);

    if (!response.ok || !payload.ok) {
      setState({ status: "error", message: payload.ok ? "Failed to delete character." : payload.error });
      return;
    }

    await load(payload.data.mode === "deferred" ? payload.data.reason : "Character deleted.");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/" className="text-sm text-indigo-300 hover:text-indigo-200">← Back to books</Link>

        {state.status === "loading" ? <p className="text-zinc-400">Loading book…</p> : null}
        {state.status === "error" ? <p className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-red-200">{state.message}</p> : null}
        {state.status === "deferred" ? <p className="rounded-2xl border border-amber-900 bg-amber-950/40 p-4 text-amber-200">{state.reason}</p> : null}

        {state.status === "success" ? (
          <>
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Book review</p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">{state.book.title}</h1>
                  <p className="mt-1 text-zinc-400">{state.book.author} · {state.book.sourceFileType}</p>
                </div>
                <button onClick={() => void load("Refreshed.")} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                  Refresh
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-zinc-800 px-3 py-1">status: {format(state.book.status)}</span>
                <span className="rounded-full bg-indigo-950 px-3 py-1 text-indigo-200">stage: {format(state.book.playbackStage)}</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1">characters: {state.book.characters.length}</span>
              </div>
              {state.book.currentJob ? (
                <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>{state.book.currentJob.jobType}</span>
                    <span>{state.book.currentJob.progressCurrent}/{state.book.currentJob.progressTotal}</span>
                  </div>
                  <p className="mt-2 text-zinc-100">{format(state.book.currentJob.step)} · {state.book.currentJob.status}</p>
                </div>
              ) : null}
              {state.notice ? <p className="mt-4 text-sm text-emerald-300">{state.notice}</p> : null}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Discovered characters</h2>
              {state.book.characters.length === 0 ? <p className="text-zinc-500">No characters have been discovered yet.</p> : null}
              {state.book.characters.map((character) => {
                const draft = state.drafts[character.id];
                return (
                  <article key={character.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-zinc-300">
                        <span>Name</span>
                        <input value={draft?.name ?? ""} onChange={(event) => updateDraft(character.id, { name: event.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-400" />
                      </label>
                      <label className="space-y-2 text-sm text-zinc-300">
                        <span>Aliases, one per line or comma separated</span>
                        <textarea value={draft?.aliases ?? ""} onChange={(event) => updateDraft(character.id, { aliases: event.target.value })} rows={3} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-400" />
                      </label>
                    </div>
                    <label className="mt-4 block space-y-2 text-sm text-zinc-300">
                      <span>Description</span>
                      <textarea value={draft?.description ?? ""} onChange={(event) => updateDraft(character.id, { description: event.target.value })} rows={3} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-400" />
                    </label>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                      <span>{character.sampleLineCount} sample lines{character.assignedVoiceId ? ` · voice ${character.assignedVoiceId}` : ""}</span>
                      <div className="flex gap-2">
                        <button disabled={busyCharacterId === character.id} onClick={() => void saveCharacter(character.id)} className="rounded-full bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-50">Save</button>
                        <button disabled={busyCharacterId === character.id} onClick={() => void deleteCharacter(character.id)} className="rounded-full border border-red-900 px-4 py-2 font-medium text-red-200 hover:bg-red-950 disabled:opacity-50">Delete</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
