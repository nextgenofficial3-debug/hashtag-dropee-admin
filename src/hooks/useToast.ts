import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

function notify(toasts: Toast[]) {
  currentToasts = toasts;
  toastListeners.forEach((l) => l(toasts));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts);

  const toast = useCallback(
    ({ title, description, variant }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const newToasts = [...currentToasts, { id, title, description, variant }];
      notify(newToasts);

      // Auto-remove after 3s
      setTimeout(() => {
        notify(currentToasts.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return { toast, toasts };
}
