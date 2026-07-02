import { testConnection } from "@/lib/canvas/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const hasToken = !!process.env.CANVAS_TOKEN;
  const baseUrl = process.env.CANVAS_BASE_URL ?? "(not set)";
  const result = hasToken
    ? await testConnection()
    : { ok: false as const, error: "No token configured." };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-[11px] font-medium tracking-wider text-faint uppercase">
          Connection
        </h2>
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: `color-mix(in oklch, ${result.ok ? "var(--cm-green)" : "var(--cm-red)"}, transparent 60%)`,
            background: `color-mix(in oklch, ${result.ok ? "var(--cm-green)" : "var(--cm-red)"}, transparent 90%)`,
          }}
        >
          {result.ok ? (
            <>
              <p className="font-medium" style={{ color: "var(--cm-green)" }}>
                ● Connected
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Authenticated as{" "}
                <span className="font-medium text-foreground">
                  {result.user?.name}
                </span>{" "}
                (id {result.user?.id}).
              </p>
            </>
          ) : (
            <>
              <p className="font-medium" style={{ color: "var(--cm-red)" }}>
                ● Not connected
                {"status" in result && result.status
                  ? ` (${result.status})`
                  : ""}
              </p>
              <p
                className="mt-1 font-mono text-xs opacity-80"
                style={{ color: "var(--cm-red)" }}
              >
                {result.error}
              </p>
            </>
          )}
        </div>
        <dl className="rounded-lg border border-line bg-panel p-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-faint">Base URL</dt>
            <dd className="font-mono text-muted-foreground">{baseUrl}</dd>
          </div>
          <div className="mt-2 flex justify-between">
            <dt className="text-faint">Token</dt>
            <dd className="font-mono text-muted-foreground">
              {hasToken ? "set (hidden)" : "not set"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-medium tracking-wider text-faint uppercase">
          Set your token
        </h2>
        <p className="text-[13px] text-muted-foreground">
          The token is read server-side from <code>.env.local</code> and never
          exposed to the browser. To change it:
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-[13px] text-muted-foreground">
          <li>
            In Canvas:{" "}
            <span className="text-foreground">
              Account → Settings → New Access Token
            </span>
            .
          </li>
          <li>
            Add it to <code>.env.local</code> at the project root:
          </li>
        </ol>
        <pre className="overflow-x-auto rounded-lg border border-line bg-panel p-4 text-xs text-muted-foreground">
          {`CANVAS_TOKEN=your_token_here
CANVAS_BASE_URL=https://wheaton.instructure.com/api/v1`}
        </pre>
        <p className="text-[13px] text-muted-foreground">
          Then restart the dev server and reload this page.
        </p>
      </section>
    </div>
  );
}
