"use client";

import { StateEmpty } from "@/components/m8-ui/state-empty";
import { StateError } from "@/components/m8-ui/state-error";
import { StateLoading } from "@/components/m8-ui/state-loading";
import { StateUnauthorized } from "@/components/m8-ui/state-unauthorized";

export type RepartoStatePanelState =
  | "empty"
  | "error"
  | "loading"
  | "ready"
  | "unauthorized";

export interface RepartoStatePanelLabels {
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
  loadingLabel: string;
  retry: string;
  unauthorizedTitle: string;
  unauthorizedDescription: string;
}

const DEFAULT_LABELS: RepartoStatePanelLabels = {
  emptyTitle: "No reparto data",
  emptyDescription: "Select or create a reparto process to continue.",
  errorTitle: "Reparto unavailable",
  errorDescription: "The reparto service could not be reached.",
  loadingLabel: "Loading reparto data",
  retry: "Retry",
  unauthorizedTitle: "Authentication required",
  unauthorizedDescription: "Sign in with an account allowed to access reparto."
};

export interface RepartoStatePanelProps {
  state: RepartoStatePanelState;
  labels?: Partial<RepartoStatePanelLabels>;
  error?: unknown;
  onRetry?: () => void;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export function RepartoStatePanel({
  error,
  labels,
  onRetry,
  state
}: RepartoStatePanelProps) {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  if (state === "ready") return null;
  if (state === "loading") {
    return <StateLoading title={resolvedLabels.loadingLabel} />;
  }
  if (state === "error") {
    return (
      <StateError
        title={resolvedLabels.errorTitle}
        description={errorMessage(error, resolvedLabels.errorDescription)}
        retryLabel={resolvedLabels.retry}
        onRetry={onRetry}
      />
    );
  }
  if (state === "unauthorized") {
    return (
      <StateUnauthorized
        title={resolvedLabels.unauthorizedTitle}
        description={resolvedLabels.unauthorizedDescription}
      />
    );
  }
  return (
    <StateEmpty
      title={resolvedLabels.emptyTitle}
      description={resolvedLabels.emptyDescription}
    />
  );
}

export default RepartoStatePanel;
