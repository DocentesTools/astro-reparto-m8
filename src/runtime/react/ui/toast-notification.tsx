"use client";

import { Toaster, toast } from "sonner";

export function RepartoToastHost() {
  return <Toaster closeButton richColors position="bottom-right" />;
}

export const repartoToast = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  error: (title: string, description?: string) => toast.error(title, { description })
} as const;
