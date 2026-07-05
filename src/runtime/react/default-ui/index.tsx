import type { ReactNode } from "react";
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
import {
  DepartmentHeadWorkspace,
  ExportCenterView as ExportCenterWorkspace,
  ProcessListView,
  VersionsView
} from "../DepartmentHeadWorkspace.js";
import {
  SharedScreenWorkspace,
  TeacherLanWorkspace
} from "../LanWorkspace.js";
import type { RepartoRuntimeConfig } from "../../config.js";
import type {
  AssignmentProcessStatus,
  ExportArtifactPublic,
  MeetingSessionPublic,
  ProcessSummary,
  ProcessVersionPublic,
  TeacherLanSummary,
  VersionComparison
} from "../../schemas.js";

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

export function RepartoVersionsView({
  comparison,
  config,
  versions
}: {
  comparison?: VersionComparison;
  config?: ViewConfig;
  versions?: ProcessVersionPublic[];
}) {
  return (
    <Shell config={config}>
      <VersionsView comparison={comparison} versions={versions} />
    </Shell>
  );
}

export function RepartoExportCenterView({
  config,
  exports,
  processId,
  processStatus,
  summary
}: {
  config?: ViewConfig;
  exports?: ExportArtifactPublic[];
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  return (
    <Shell config={config}>
      <ExportCenterWorkspace
        exports={exports}
        processId={processId}
        processStatus={processStatus}
        summary={summary}
      />
    </Shell>
  );
}

export function TeacherLanView({
  config,
  meetingSession,
  processId,
  requirementAssignedHours,
  requirementRequiredHours,
  summary
}: {
  config?: ViewConfig;
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary?: TeacherLanSummary | null;
}) {
  return (
    <Shell config={config}>
      <TeacherLanWorkspace
        meetingSession={meetingSession}
        processId={processId}
        requirementAssignedHours={requirementAssignedHours}
        requirementRequiredHours={requirementRequiredHours}
        summary={summary}
      />
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
