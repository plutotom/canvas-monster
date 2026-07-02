import { testConnection } from "@/lib/canvas/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const hasToken = !!process.env.CANVAS_TOKEN;
  const baseUrl = process.env.CANVAS_BASE_URL ?? "(not set)";
  const result = hasToken
    ? await testConnection()
    : { ok: false as const, error: "No token configured." };

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Connection
        </h2>
        <div
          className={`rounded-lg border p-4 ${
            result.ok
              ? "border-emerald-900/60 bg-emerald-950/30"
              : "border-red-900/60 bg-red-950/30"
          }`}
        >
          {result.ok ? (
            <>
              <p className="font-medium text-emerald-300">
                ● Connected
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                Authenticated as{" "}
                <span className="font-medium">{result.user?.name}</span> (id{" "}
                {result.user?.id}).
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-red-300">
                ● Not connected
                {"status" in result && result.status
                  ? ` (${result.status})`
                  : ""}
              </p>
              <p className="mt-1 font-mono text-xs text-red-300/80">
                {result.error}
              </p>
            </>
          )}
        </div>
        <dl className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Base URL</dt>
            <dd className="font-mono text-zinc-300">{baseUrl}</dd>
          </div>
          <div className="mt-2 flex justify-between">
            <dt className="text-zinc-500">Token</dt>
            <dd className="font-mono text-zinc-300">
              {hasToken ? "set (hidden)" : "not set"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Set your token
        </h2>
        <p className="text-sm text-zinc-400">
          The token is read server-side from <code>.env.local</code> and never
          exposed to the browser. To change it:
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-400">
          <li>
            In Canvas: <span className="text-zinc-300">Account → Settings →
            New Access Token</span>.
          </li>
          <li>
            Add it to <code>.env.local</code> at the project root:
          </li>
        </ol>
        <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
          {`CANVAS_TOKEN=your_token_here
CANVAS_BASE_URL=https://wheaton.instructure.com/api/v1`}
        </pre>
        <p className="text-sm text-zinc-400">
          Then restart the dev server and reload this page.
        </p>
      </section>
    </main>
  );
}
