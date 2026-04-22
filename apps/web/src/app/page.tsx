import { bookSchema } from "@libra/shared";
import { BooksList } from "@/components/books-list";
import { UploadForm } from "@/components/upload-form";

const productStates = [
  "Upload a book",
  "Discover the cast",
  "Assign voices",
  "Generate the aura",
  "Play it back",
] as const;

const exampleBook = bookSchema.parse({
  id: "sample",
  userId: "demo-user",
  title: "A Christmas Carol",
  author: "Charles Dickens",
  sourceFileType: "epub",
  sourceFile: {
    key: "books/sample/source/a-christmas-carol.epub",
    bucket: "libra-demo",
    contentType: "application/epub+zip",
    sizeBytes: 1024,
  },
  status: "uploaded",
  characterCount: 0,
});

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-12 sm:px-10">
      <section className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-300">
            Open source · self-hostable · personal-tool-first
          </span>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Libra turns books into character-aware audio experiences.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              This repo is the TypeScript rebuild: Next.js for the app, Convex for realtime state,
              Trigger.dev for long-running orchestration, and R2 for source files and generated audio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-200">
            <span className="rounded-full bg-zinc-900 px-4 py-2">Next.js</span>
            <span className="rounded-full bg-zinc-900 px-4 py-2">Convex</span>
            <span className="rounded-full bg-zinc-900 px-4 py-2">Trigger.dev</span>
            <span className="rounded-full bg-zinc-900 px-4 py-2">Cloudflare R2</span>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/30">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">First vertical slice</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-200">
            <div className="flex items-center justify-between rounded-2xl bg-zinc-950 px-4 py-3">
              <span>{exampleBook.title}</span>
              <span className="text-zinc-400">{exampleBook.status}</span>
            </div>
            <ul className="space-y-2">
              {productStates.map((state, index) => (
                <li key={state} className="flex items-center gap-3 rounded-2xl border border-zinc-800 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-200">
                    {index + 1}
                  </span>
                  <span>{state}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">Source of truth</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Convex will own books, characters, auras, jobs, and script-line state. R2 holds the blobs.
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">Workflow engine</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Trigger.dev will drive discovery, scripting, audio generation, retries, and progress updates.
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">OSS stance</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Personal tool first. Hosted demos later. If someone wants to self-host Libra, the repo should make that realistic.
          </p>
        </article>
      </section>

      <section>
        <UploadForm />
      </section>

      <section>
        <BooksList />
      </section>
    </main>
  );
}
