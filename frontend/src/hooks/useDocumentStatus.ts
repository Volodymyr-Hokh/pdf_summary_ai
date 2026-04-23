import { useCallback, useEffect, useRef, useState } from "react";
import { getDocument } from "../api/client";
import type { DocumentResponse } from "../types";

const TERMINAL_STATES = new Set(["completed", "failed"]);

export function useDocumentStatus(id: string | null) {
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const attemptRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    startTimeRef.current = Date.now();
    attemptRef.current = 0;

    const poll = async () => {
      try {
        const result = await getDocument(id);
        setDoc(result);
        if (TERMINAL_STATES.has(result.status)) {
          stop();
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        stop();
        return;
      }

      attemptRef.current += 1;
      const elapsed = Date.now() - startTimeRef.current;
      const delay = elapsed > 30_000 ? 5_000 : 2_000;
      timerRef.current = setTimeout(poll, delay);
    };

    poll();

    return stop;
  }, [id, stop]);

  return { doc, error };
}
