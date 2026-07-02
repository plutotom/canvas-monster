import { getPreferenceValues } from "@raycast/api";
import type { CanvasAssignment, CanvasCourse, CanvasSubmission } from "./types";

interface Prefs {
  canvasToken: string;
  canvasBaseUrl: string;
}

export class CanvasError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CanvasError";
  }
}

function config() {
  const { canvasToken, canvasBaseUrl } = getPreferenceValues<Prefs>();
  const baseUrl = (
    canvasBaseUrl || "https://wheaton.instructure.com/api/v1"
  ).replace(/\/$/, "");
  return { token: canvasToken, baseUrl };
}

/** rel="next" URL from an RFC5988 Link header, if present. */
function nextLink(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function fetchOne(pathOrUrl: string): Promise<Response> {
  const { token, baseUrl } = config();
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${baseUrl}${pathOrUrl}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CanvasError(
      `Canvas ${res.status} ${res.statusText}${
        body ? ` — ${body.slice(0, 200)}` : ""
      }`,
      res.status,
    );
  }
  return res;
}

/** GET a paginated list, following rel="next" until exhausted or capped. */
export async function canvasGetAll<T>(
  path: string,
  maxPages = 20,
): Promise<T[]> {
  let url: string | null = path;
  const out: T[] = [];
  let pages = 0;

  while (url && pages < maxPages) {
    const res: Response = await fetchOne(url);
    const chunk = (await res.json()) as T[];
    out.push(...chunk);
    url = nextLink(res.headers.get("link"));
    pages += 1;
  }

  if (url) {
    console.warn(
      `[canvas] pagination cap of ${maxPages} hit for "${path}" (${out.length} items); may be truncated.`,
    );
  }
  return out;
}

/** The human web URL for a course (base host minus the /api/v1 suffix). */
export function courseWebUrl(courseId: number): string {
  const { baseUrl } = config();
  return `${baseUrl.replace(/\/api\/v1$/, "")}/courses/${courseId}`;
}

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

export function isSubmitted(a: CanvasAssignment): boolean {
  const s: CanvasSubmission | null | undefined = a.submission;
  if (!s) return false;
  return (
    s.workflow_state === "submitted" ||
    s.workflow_state === "graded" ||
    s.submitted_at != null
  );
}
