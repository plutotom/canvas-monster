import Link from "next/link";
import { getActiveCourses } from "@/lib/canvas/client";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";
import type { CanvasCourse } from "@/lib/canvas/types";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let courses: CanvasCourse[] | undefined;
  let error: LoadError | null = null;
  try {
    courses = await getActiveCourses();
  } catch (err) {
    error = toLoadError(err, !!process.env.CANVAS_TOKEN);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">Courses</h1>
      {error ? (
        <ErrorBox error={error} />
      ) : courses && courses.length === 0 ? (
        <p className="text-zinc-400">No active courses.</p>
      ) : (
        <div className="space-y-2">
          {courses?.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <p className="font-medium text-zinc-100">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.course_code}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
