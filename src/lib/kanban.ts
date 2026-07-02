import type { CanvasModuleItem } from "@/lib/canvas/types";

// Client-safe shared kanban types + helpers. No server-only imports here so the
// client board can use LANES / types. Server-only board assembly lives in
// ./kanban-build.ts.

export type Lane = "read" | "watch" | "do" | "done";

export const LANES: { id: Lane; label: string }[] = [
  { id: "read", label: "To Read" },
  { id: "watch", label: "Watch" },
  { id: "do", label: "Do" },
  { id: "done", label: "Done" },
];

/** Module item types that aren't actionable cards (headings, dividers). */
export const SKIP_TYPES = new Set(["SubHeader"]);

/**
 * Auto-place a module item into a lane by its Canvas type. Canvas has no
 * "video" type — video lives inside Pages/Files/external tools — so Watch is a
 * best-effort guess (external links/tools) that the user corrects by dragging.
 */
export function defaultLane(item: CanvasModuleItem): Lane {
  switch (item.type) {
    case "Assignment":
    case "Quiz":
    case "Discussion":
      return "do";
    case "ExternalUrl":
    case "ExternalTool":
      return "watch";
    case "File":
    case "Page":
      return "read";
    default:
      return "read";
  }
}

export function itemKey(courseId: number, itemId: number): string {
  return `${courseId}:${itemId}`;
}

export interface KanbanCard {
  itemKey: string;
  courseId: number;
  courseCode: string;
  title: string;
  type: string;
  url: string;
  lane: Lane;
  /** Canvas shows a submission for this assignment — drove the auto-Done. */
  submitted: boolean;
  /** Lane came from a manual drag, not the heuristic. */
  manual: boolean;
}
