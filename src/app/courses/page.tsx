import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getActiveCourses } from "@/lib/canvas/client";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";
import { Dot } from "@/components/ui/pill";
import type { CanvasCourse } from "@/lib/canvas/types";

export const dynamic = "force-dynamic";

const COURSE_COLORS = ["#8b7cf6", "#4aa3df", "#2fbf9f", "#e2b53d", "#eb5757", "#a06bf5"];
const courseColor = (id: number) => COURSE_COLORS[id % COURSE_COLORS.length];

export default async function CoursesPage() {
  let courses: CanvasCourse[] | undefined;
  let error: LoadError | null = null;
  try {
    courses = await getActiveCourses();
  } catch (err) {
    error = toLoadError(err, !!process.env.CANVAS_TOKEN);
  }

  return (
    <div className="py-2">
      <div className="mb-2 flex items-baseline justify-between px-4 pt-1">
        <h1 className="text-[15px] font-semibold">Courses</h1>
        <p className="text-[12px] text-faint">{courses?.length ?? 0} active</p>
      </div>

      {error ? (
        <div className="px-4 py-4">
          <ErrorBox error={error} />
        </div>
      ) : courses && courses.length === 0 ? (
        <p className="px-4 py-6 text-muted-foreground">No active courses.</p>
      ) : (
        <div className="px-2">
          {courses?.map((c, i) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="cm-row group flex items-center gap-3 rounded-lg px-4 py-2.5 hover:bg-elevated"
              style={{ animationDelay: `${i * 26}ms` }}
            >
              <Dot color={courseColor(c.id)} className="h-2 w-2" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{c.name}</p>
              </div>
              <span className="font-mono text-[11px] text-faint">{c.course_code}</span>
              <ChevronRight size={15} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
