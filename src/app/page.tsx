import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">canvas-monster</h1>
        <p className="mt-2 text-zinc-500">
          A cleaner UI over Wheaton&apos;s Canvas LMS. Scaffold stage — Canvas
          API client and route handlers are wired.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold">Getting started</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600">
          <li>Create a Canvas token: Account → Settings → New Access Token.</li>
          <li>
            Put it in <code>.env.local</code> as <code>CANVAS_TOKEN</code>.
          </li>
          <li>Restart the dev server.</li>
          <li>
            Open{" "}
            <Link href="/debug" className="text-blue-600 underline">
              /debug
            </Link>{" "}
            to confirm real data flows.
          </li>
        </ol>
      </div>

      <nav className="flex gap-4 text-sm">
        <Link href="/debug" className="text-blue-600 underline">
          Debug
        </Link>
      </nav>
    </main>
  );
}
