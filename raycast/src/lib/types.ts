// Narrow Canvas REST types — only the fields the extension uses.

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}

export interface CanvasSubmission {
  workflow_state: string; // "submitted" | "graded" | "unsubmitted" | ...
  submitted_at: string | null;
  missing: boolean;
}

export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string | null; // HTML
  posted_at: string | null;
  html_url: string;
}

export interface CanvasAssignment {
  id: number;
  course_id: number;
  name: string;
  due_at: string | null;
  points_possible: number | null;
  html_url: string;
  submission?: CanvasSubmission | null;
}
