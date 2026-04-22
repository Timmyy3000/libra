"use client";

import { useMemo, useState } from "react";

type UploadState =
  | { status: "idle" }
  | { status: "submitting" }
  | {
      status: "success";
      payload: {
        bookId: string;
        objectKey: string;
        sourceFileType: string;
        persistence:
          | { mode: "convex"; bookId: string; jobId: string }
          | { mode: "deferred"; reason: string; kickoff: { bookId: string; userId: string; sourceFileKey: string } };
      };
    }
  | { status: "error"; message: string };

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const fileSummary = useMemo(() => {
    if (!file) return null;

    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setState({ status: "error", message: "Choose a PDF, EPUB, or TXT file first." });
      return;
    }

    setState({ status: "submitting" });

    const response = await fetch("/api/uploads/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "text/plain",
        sizeBytes: file.size,
      }),
    });

    const payload = (await response.json()) as
      | {
          ok: true;
          data: {
            bookId: string;
            objectKey: string;
            sourceFileType: string;
            persistence:
              | { mode: "convex"; bookId: string; jobId: string }
              | { mode: "deferred"; reason: string; kickoff: { bookId: string; userId: string; sourceFileKey: string } };
          };
        }
      | { ok: false; error: string };

    if (!response.ok || !payload.ok) {
      setState({ status: "error", message: payload.ok ? "Failed to prepare upload." : payload.error });
      return;
    }

    setState({
      status: "success",
      payload: payload.data,
    });
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/30">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Upload prep slice</p>
        <h2 className="text-2xl font-semibold text-white">Prepare a source upload</h2>
        <p className="text-sm leading-7 text-zinc-300">
          This is the first real boundary in the rebuild: validate a book upload and get an R2 signed URL back.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-300">Book file</span>
          <input
            accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
            className="block w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-zinc-100"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>

        {fileSummary ? <p className="text-sm text-zinc-400">{fileSummary}</p> : null}

        <button
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          disabled={state.status === "submitting"}
          type="submit"
        >
          {state.status === "submitting" ? "Preparing…" : "Prepare upload"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
        {state.status === "idle" ? (
          <p className="text-zinc-400">No upload prepared yet.</p>
        ) : null}
        {state.status === "error" ? <p className="text-red-300">{state.message}</p> : null}
        {state.status === "success" ? (
          <div className="space-y-2 text-zinc-200">
            <p className="font-medium text-emerald-300">Upload prepared.</p>
            <p>bookId: {state.payload.bookId}</p>
            <p>objectKey: {state.payload.objectKey}</p>
            <p>sourceFileType: {state.payload.sourceFileType}</p>
            {state.payload.persistence.mode === "convex" ? (
              <>
                <p className="text-emerald-300">Book + job persisted through Convex.</p>
                <p>persistedBookId: {state.payload.persistence.bookId}</p>
                <p>jobId: {state.payload.persistence.jobId}</p>
              </>
            ) : (
              <>
                <p className="text-amber-300">Persistence deferred.</p>
                <p>{state.payload.persistence.reason}</p>
                <p>kickoff.bookId: {state.payload.persistence.kickoff.bookId}</p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
