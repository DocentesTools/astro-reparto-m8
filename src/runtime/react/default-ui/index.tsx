import type { ReactNode } from "react";
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
import {
  DepartmentHeadWorkspace,
  ProcessListView,
  VersionsView
} from "../DepartmentHeadWorkspace.js";
import {
  SharedScreenWorkspace,
  TeacherLanWorkspace
} from "../LanWorkspace.js";
import type { RepartoRuntimeConfig } from "../../config.js";
import type { ProcessSummary, TeacherLanSummary } from "../../schemas.js";

type ViewConfig = Partial<RepartoRuntimeConfig>;

function Shell({ children, config }: { children: ReactNode; config?: ViewConfig }) {
  return (
    <RepartoQueryProvider>
      <RepartoProvider config={config}>{children}</RepartoProvider>
    </RepartoQueryProvider>
  );
}

export function DepartmentHeadView({
  config,
  summary
}: {
  config?: ViewConfig;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <DepartmentHeadWorkspace summary={summary} />
    </Shell>
  );
}

export function ProcessesView({ config }: { config?: ViewConfig }) {
  return (
    <Shell config={config}>
      <ProcessListView />
    </Shell>
  );
}

export function RepartoVersionsView({ config }: { config?: ViewConfig }) {
  return (
    <Shell config={config}>
      <VersionsView />
    </Shell>
  );
}

export function TeacherLanView({
  config,
  processId,
  summary
}: {
  config?: ViewConfig;
  processId?: string;
  summary?: TeacherLanSummary | null;
}) {
  return (
    <Shell config={config}>
      <TeacherLanWorkspace processId={processId} summary={summary} />
    </Shell>
  );
}

export function SharedScreenView({
  config,
  processId,
  summary
}: {
  config?: ViewConfig;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <SharedScreenWorkspace processId={processId} summary={summary} />
    </Shell>
  );
}
