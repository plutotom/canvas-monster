import "server-only";

import { unstable_cache } from "next/cache";
import type {
  CanvasAnnouncement,
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

  // Don't silently truncate: if a rel="next" link remains, we stopped early.
  if (url) {
    console.warn(
      `[canvas] Pagination cap of ${maxPages} pages hit for "${path}" ` +
        `(${out.length} items collected); results may be truncated. ` +
        `Raise maxPages if this course legitimately has more.`,
    );
  }

  return out;
}

// ---- Typed convenience wrappers -------------------------------------------
//
// Each read is wrapped in unstable_cache: a server-side data cache keyed by the
// function's key parts + arguments. Repeated page loads/navigations within the
// revalidate window reuse the cached Canvas response instead of re-hitting the
// API — this is what protects the ~700 req/hr rate limit, not client caching.
// Because the cache is shared, the dashboard and calendar reuse the same
// per-course assignment fetches. All entries share the "canvas" tag so a single
// revalidateTag("canvas") (the Refresh button) busts everything on demand.

/** Time-based revalidation windows, tuned to how often each entity changes. */
export const CANVAS_TTL = {
  courses: 3600, // rarely changes mid-term
  content: 600, // assignments, modules, announcements
  grades: 300,
  todo: 180, // most time-sensitive
} as const;

export const CANVAS_CACHE_TAG = "canvas";

export const getActiveCourses = unstable_cache(
  (): Promise<CanvasCourse[]> =>
    canvasGetAll<CanvasCourse>(
      "/courses?enrollment_state=active&per_page=100",
    ),
  ["canvas:active-courses"],
  { revalidate: CANVAS_TTL.courses, tags: [CANVAS_CACHE_TAG, "courses"] },
);

export const getCourseAssignments = unstable_cache(
  (courseId: number): Promise<CanvasAssignment[]> =>
    canvasGetAll<CanvasAssignment>(
      `/courses/${courseId}/assignments?include[]=submission&per_page=100`,
    ),
  ["canvas:course-assignments"],
  { revalidate: CANVAS_TTL.content, tags: [CANVAS_CACHE_TAG, "assignments"] },
);

export const getCourseModules = unstable_cache(
  (courseId: number): Promise<CanvasModule[]> =>
    canvasGetAll<CanvasModule>(
      `/courses/${courseId}/modules?include[]=items&per_page=100`,
    ),
  ["canvas:course-modules"],
  { revalidate: CANVAS_TTL.content, tags: [CANVAS_CACHE_TAG, "modules"] },
);

export const getSelfEnrollments = unstable_cache(
  (courseId: number): Promise<CanvasEnrollment[]> =>
    canvasGetAll<CanvasEnrollment>(
      `/courses/${courseId}/enrollments?user_id=self`,
    ),
  ["canvas:self-enrollments"],
  { revalidate: CANVAS_TTL.grades, tags: [CANVAS_CACHE_TAG, "grades"] },
);

export const getTodo = unstable_cache(
  (): Promise<CanvasTodoItem[]> =>
    canvasGetAll<CanvasTodoItem>("/users/self/todo?per_page=100"),
  ["canvas:todo"],
  { revalidate: CANVAS_TTL.todo, tags: [CANVAS_CACHE_TAG, "todo"] },
);

export const getCourse = unstable_cache(
  (courseId: number): Promise<CanvasCourse> =>
    canvasGet<CanvasCourse>(`/courses/${courseId}`),
  ["canvas:course"],
  { revalidate: CANVAS_TTL.courses, tags: [CANVAS_CACHE_TAG, "courses"] },
);

export const getCourseAnnouncements = unstable_cache(
  (courseId: number): Promise<CanvasAnnouncement[]> =>
    canvasGetAll<CanvasAnnouncement>(
      `/courses/${courseId}/discussion_topics?only_announcements=true&per_page=20`,
    ),
  ["canvas:course-announcements"],
  { revalidate: CANVAS_TTL.content, tags: [CANVAS_CACHE_TAG, "announcements"] },
);

/** Verify the token/base URL by making one cheap authenticated call. */
export async function testConnection(): Promise<{
  ok: boolean;
  user?: { id: number; name: string };
  error?: string;
  status?: number;
}> {
  try {
    const user = await canvasGet<{ id: number; name: string }>(
      "/users/self",
    );
    return { ok: true, user };
  } catch (err) {
    if (err instanceof CanvasError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
