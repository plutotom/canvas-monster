import { getDashboard } from "@/lib/canvas/dashboard";
import { handleCanvas } from "@/lib/canvas/route-helpers";

export const dynamic = "force-dynamic";

export function GET() {
  return handleCanvas(() => getDashboard());
}
