// Minimal Canvas LMS REST API types — only the fields canvas-monster consumes.
// Canvas returns many more; we keep these narrow and grow them as pages need data.

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  start_at: string | null;
  end_at: string | null;
}

export interface CanvasAssignment {
  id: number;
  course_id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number | null;
  html_url: string;
  has_submitted_submissions: boolean;
  submission?: CanvasSubmission | null;
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  score: number | null;
  grade: string | null;
  submitted_at: string | null;
  workflow_state: string; // "submitted" | "unsubmitted" | "graded" | ...
  late: boolean;
  missing: boolean;
}

export interface CanvasModuleItem {
  id: number;
  title: string;
  type: string; // "Assignment" | "Page" | "File" | "Discussion" | ...
  html_url: string;
  content_id?: number;
}

export interface CanvasModule {
  id: number;
  name: string;
  position: number;
  state: string; // "locked" | "unlocked" | "started" | "completed"
  items?: CanvasModuleItem[];
}

export interface CanvasTodoItem {
  type: string; // "grading" | "submitting"
  assignment: CanvasAssignment;
  course_id: number;
  html_url: string;
  ignore: string;
}

export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string | null; // HTML
  posted_at: string | null;
  html_url: string;
  author?: { display_name?: string };
}

export interface CanvasEnrollment {
  id: number;
  course_id: number;
  type: string;
  grades: {
    current_score: number | null;
    current_grade: string | null;
    final_score: number | null;
    final_grade: string | null;
  };
}
