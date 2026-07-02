"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";

type Tone = "default" | "success" | "error";
interface Toast {
  id: number;
  msg: string;
  tone: Tone;
}

const ToastContext = createContext<(msg: string, tone?: Tone) => void>(() => {});

/** Fire a transient toast. Safe to call from any client component under AppShell. */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, tone: Tone = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-5 bottom-5 z-[60] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="cm-row pointer-events-auto flex items-center gap-2 rounded-lg border border-line-strong bg-elevated px-3 py-2 text-[12px] shadow-2xl"
          >
            {t.tone === "success" && <Check size={14} style={{ color: "var(--cm-green)" }} />}
            {t.tone === "error" && <TriangleAlert size={14} style={{ color: "var(--cm-red)" }} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
