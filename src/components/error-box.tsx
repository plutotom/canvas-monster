import Link from "next/link";
import { CanvasError } from "@/lib/canvas/client";

export interface LoadError {
  message: string;
  status?: number;
  noToken?: boolean;
}

/** Normalise any thrown error into a renderable shape. */
export function toLoadError(err: unknown, hasToken: boolean): LoadError {
  if (err instanceof CanvasError) {
    return { message: err.message, status: err.status, noToken: !hasToken };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

const HINTS: Record<number, string> = {
  401: "Token is missing or invalid. Check it on the Settings page.",
  403: "Access forbidden — the token may lack permission or Canvas is rate-limiting (≈700 req/hr).",
  404: "Not found — the course or resource may not exist for this account.",
};

export function ErrorBox({ error }: { error: LoadError }) {
  const hint = error.status ? HINTS[error.status] : undefined;
  return (
    <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
      <p className="font-medium">
        Couldn&apos;t load Canvas data{error.status ? ` (${error.status})` : ""}
      </p>
      <p className="mt-1 font-mono text-xs text-red-300/80">{error.message}</p>
      {hint && <p className="mt-2 text-red-200/80">{hint}</p>}
      {error.noToken && (
        <p className="mt-2 text-red-200/80">
          Set <code>CANVAS_TOKEN</code> in <code>.env.local</code> and restart —
          see{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          .
        </p>
      )}
    </div>
  );
}
