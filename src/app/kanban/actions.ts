"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { laneOverrides } from "@/lib/db/schema";
import type { Lane } from "@/lib/kanban";
import { LANES } from "@/lib/kanban";

const VALID = new Set(LANES.map((l) => l.id));

/**
 * Persist a manual lane move for one module item. Upserts an override row
 * (marked manual, so it wins over submission-based auto-Done). No-ops with a
 * thrown error if the DB isn't configured, so the client can surface it.
 */
export async function moveItem(itemKey: string, lane: Lane): Promise<void> {
  if (!db) {
    throw new Error(
      "No database configured — set DATABASE_URL to persist lanes.",
    );
  }
  if (!VALID.has(lane)) {
    throw new Error(`Invalid lane: ${lane}`);
  }
  const courseId = itemKey.split(":")[0] ?? "";

  await db
    .insert(laneOverrides)
    .values({ itemKey, courseId, lane, manual: true })
    .onConflictDoUpdate({
      target: laneOverrides.itemKey,
      set: { lane, manual: true, updatedAt: new Date() },
    });

  revalidatePath("/kanban");
}
