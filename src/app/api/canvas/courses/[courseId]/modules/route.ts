import { getCourseModules } from "@/lib/canvas/client";
import { handleCanvas } from "@/lib/canvas/route-helpers";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  return handleCanvas(async () => {
    const { courseId } = await params;
    return getCourseModules(Number(courseId));
  });
}
