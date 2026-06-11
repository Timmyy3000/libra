"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BookStateSummary } from "@libra/shared";

type BooksResponse =
  | { ok: true; data: { mode: "convex"; books: BookStateSummary[] } | { mode: "deferred"; reason: string; books: [] } }
  | { ok: false; error: string };

function formatStep(step: string) {
  return step.replace(/_/g, " ");
}

function formatStage(stage: string) {
  return stage.replace(/_/g, " ");
}

function stageClass(stage: string) {
  if (stage === "ready_for_playback") return "bg-emerald-950 text-emerald-200";
  if (stage === "blocked") return "bg-red-950 text-red-200";
  if (stage === "ready_for_casting") return "bg-amber-950 text-amber-200";
  return "bg-zinc-800 text-zinc-300";
}

export function BooksList() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; payload: BooksResponse & { ok: true } }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch("/api/books");
      const payload = (await response.json()) as BooksResponse;

      if (cancelled) return;

      if (!response.ok || !payload.ok) {
        setState({
          status: "error",
          message: payload.ok ? "Failed to load books." : payload.error,
        });
        return;
      }

      setState({ status: "success", payload });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/30">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Books state</p>
        <h2 className="text-2xl font-semibold text-white">Current book records</h2>
        <p className="text-sm leading-7 text-zinc-300">
          The slice now surfaces persisted books, their latest discovery job, and any discovered characters already written back into Convex.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
        {state.status === "loading" ? <p className="text-zinc-400">Loading books…</p> : null}
        {state.status === "error" ? <p className="text-red-300">{state.message}</p> : null}
        {state.status === "success" && state.payload.data.mode === "deferred" ? (
          <div className="space-y-2 text-zinc-300">
            <p className="text-amber-300">Convex list deferred.</p>
            <p>{state.payload.data.reason}</p>
          </div>
        ) : null}
        {state.status === "success" && state.payload.data.mode === "convex" ? (
          state.payload.data.books.length > 0 ? (
            <ul className="space-y-3">
              {state.payload.data.books.map((book) => (
                <li key={book.id} className="rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <Link href={`/books/${book.id}`} className="font-medium text-white hover:text-indigo-200">
                        {book.title}
                      </Link>
                      <p className="text-xs text-zinc-400">
                        {book.author} · {book.sourceFileType} · {book.characterCount} characters
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">book: {book.status}</span>
                      <span className={`rounded-full px-3 py-1 ${stageClass(book.playbackStage)}`}>
                        stage: {formatStage(book.playbackStage)}
                      </span>
                      {book.playbackReadiness === "ready" ? (
                        <span className="rounded-full bg-emerald-900 px-3 py-1 text-emerald-200">playback ready</span>
                      ) : null}
                      {book.currentJob ? (
                        <span className="rounded-full bg-indigo-950 px-3 py-1 text-indigo-200">
                          job: {book.currentJob.status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {book.currentJob ? (
                    <div className="mt-4 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                        <span>{book.currentJob.jobType}</span>
                        <span>
                          {book.currentJob.progressCurrent}/{book.currentJob.progressTotal || 0}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-200">{formatStep(book.currentJob.step)}</p>
                      <div className="h-2 rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-indigo-400 transition-all"
                          style={{
                            width: `${
                              book.currentJob.progressTotal > 0
                                ? Math.min(100, (book.currentJob.progressCurrent / book.currentJob.progressTotal) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-zinc-500">No workflow job has been attached yet.</p>
                  )}

                  <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">Discovered characters</p>
                      <span className="text-xs text-zinc-400">{book.characters.length}</span>
                    </div>
                    {book.characters.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {book.characters.map((character) => (
                          <li key={character.id} className="rounded-xl border border-zinc-800 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-zinc-100">{character.name}</p>
                              <span className="text-xs text-zinc-500">{character.sampleLineCount} lines</span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-400">{character.description || "No description yet."}</p>
                            {character.aliases.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {character.aliases.map((alias) => (
                                  <span key={alias} className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300">
                                    {alias}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-zinc-500">No discovered characters have been written yet.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-400">No persisted books yet.</p>
          )
        ) : null}
      </div>
    </div>
  );
}
