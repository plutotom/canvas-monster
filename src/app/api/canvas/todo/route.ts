import { getTodo } from "@/lib/canvas/client";
import { handleCanvas } from "@/lib/canvas/route-helpers";

export const dynamic = "force-dynamic";

export function GET() {
  return handleCanvas(() => getTodo());
}
