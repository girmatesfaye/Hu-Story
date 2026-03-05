import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastVariant } from "../components/TopToast";

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

const defaultToastState: ToastState = {
  visible: false,
  message: "",
  variant: "error",
};

export function useTopToast(durationMs = 2600) {
  const [toast, setToast] = useState<ToastState>(defaultToastState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast((previous) => ({ ...previous, visible: false }));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        visible: true,
        message,
        variant,
      });

      timeoutRef.current = setTimeout(() => {
        setToast((previous) => ({ ...previous, visible: false }));
        timeoutRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
