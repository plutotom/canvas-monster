"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshCanvas } from "@/app/actions";
import { useToast } from "@/components/toast";

/** Shared Canvas cache refresh with success / error toasts. */
export function useRefreshCanvas() {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        await refreshCanvas();
        router.refresh();
        toast("Canvas data refreshed", "success");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to refresh Canvas data.";
        toast(msg, "error");
      }
    });
  }, [router, startTransition, toast]);

  return { refresh, pending };
}
