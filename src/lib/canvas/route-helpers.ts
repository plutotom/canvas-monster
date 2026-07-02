import "server-only";

import { NextResponse } from "next/server";
import { CanvasError } from "./client";

/**
 * Wrap a route handler body, turning CanvasError (and anything else) into a
 * consistent JSON error envelope so client pages can render sane error states.
 */
export async function handleCanvas<T>(
  fn: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof CanvasError) {
      return NextResponse.json(
        { error: err.message, status: err.status, url: err.url },
        { status: err.status >= 400 ? err.status : 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
