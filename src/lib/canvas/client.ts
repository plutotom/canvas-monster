import "server-only";

import type {
  CanvasAssignment,
  CanvasCourse,
  CanvasEnrollment,
  CanvasModule,
  CanvasTodoItem,
} from "./types";

/**
 * Server-only Canvas LMS REST API client.
 *
 * The personal access token never leaves the server — every Canvas call goes
 * through here, invoked from Route Handlers. Handles auth, pagination (Link
 * header), and a couple of typed convenience wrappers.
 */

export class CanvasError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "CanvasError";
  }
}

function config() {
  const token = process.env.CANVAS_TOKEN;
  const baseUrl = process.env.CANVAS_BASE_URL;
  if (!token) {
    throw new CanvasError(
      "CANVAS_TOKEN is not set. Add it to .env.local.",
      500,
      "",
    );
  }
  if (!baseUrl) {
    throw new CanvasError(
      "CANVAS_BASE_URL is not set. Add it to .env.local.",
      500,
      "",
    );
  }
  return { token, baseUrl: baseUrl.replace(/\/$/, "") };
}

/** Parse the RFC5988 Link header and return the rel="next" URL, if any. */
function nextLink(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch a single Canvas endpoint. `path` may be a bare path ("/courses") or a
 * fully-qualified URL (used internally when following pagination links).
 */
async function fetchOne(path: string): Promise<Response> {
  const { token, baseUrl } = config();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    // Canvas is the source of truth; let route handlers decide caching.
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CanvasError(
      `Canvas API ${res.status} ${res.statusText} for ${url}${
        body ? ` — ${body.slice(0, 300)}` : ""
      }`,
      res.status,
      url,
    );
  }
  return res;
}

/** GET a single (non-paginated) resource. */
export async function canvasGet<T>(path: string): Promise<T> {
  const res = await fetchOne(path);
  return (await res.json()) as T;
}

/**
 * GET a paginated list, following rel="next" links until exhausted.
 * `maxPages` guards against pathological loops / huge result sets.
 */
export async function canvasGetAll<T>(
  path: string,
  maxPages = 20,
): Promise<T[]> {
  const { baseUrl } = config();
  let url: string | null = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const out: T[] = [];
  let pages = 0;

  while (url && pages < maxPages) {
    const res: Response = await fetchOne(url);
    const chunk = (await res.json()) as T[];
    out.push(...chunk);
    url = nextLink(res.headers.get("link"));
    pages += 1;
  }
  return out;
}

// ---- Typed convenience wrappers -------------------------------------------

export function getActiveCourses(): Promise<CanvasCourse[]> {
  return canvasGetAll<CanvasCourse>(
    "/courses?enrollment_state=active&per_page=100",
  );
}

export function getCourseAssignments(
  courseId: number,
): Promise<CanvasAssignment[]> {
  return canvasGetAll<CanvasAssignment>(
    `/courses/${courseId}/assignments?include[]=submission&per_page=100`,
  );
}

export function getCourseModules(courseId: number): Promise<CanvasModule[]> {
  return canvasGetAll<CanvasModule>(
    `/courses/${courseId}/modules?include[]=items&per_page=100`,
  );
}

export function getSelfEnrollments(
  courseId: number,
): Promise<CanvasEnrollment[]> {
  return canvasGetAll<CanvasEnrollment>(
    `/courses/${courseId}/enrollments?user_id=self`,
  );
}

export function getTodo(): Promise<CanvasTodoItem[]> {
  return canvasGetAll<CanvasTodoItem>("/users/self/todo?per_page=100");
}
