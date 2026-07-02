"use server";

import { revalidateTag } from "next/cache";
import { CANVAS_CACHE_TAG } from "@/lib/canvas/client";

/**
 * Force-refresh all cached Canvas data. Marks every entry tagged "canvas" as
 * stale (Next 16 "max" = stale-while-revalidate): the next render serves cached
 * data and refetches from Canvas in the background, so a reload shows fresh
 * data. This is the on-demand escape hatch from the time-based TTLs.
 */
export async function refreshCanvas() {
  revalidateTag(CANVAS_CACHE_TAG, "max");
}
