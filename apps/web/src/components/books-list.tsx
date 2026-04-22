"use client";

import { useEffect, useState } from "react";

type BookRecord = {
  _id: string;
  title: string;
  author: string;
  status: string;
  sourceFileType: string;
  characterCount: number;
};

type BooksResponse =
  | { ok: true; data: { mode: "convex"; books: BookRecord[] } | { mode: "deferred"; reason: string; books: [] } }
  | { ok: false; error: string };

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
          This is the next step in the slice: render persisted book state when Convex is available, otherwise stay explicit about deferred mode.
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
                <li key={book._id} className="rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{book.title}</p>
                      <p className="text-xs text-zinc-400">{book.author} · {book.sourceFileType}</p>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{book.status}</span>
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
