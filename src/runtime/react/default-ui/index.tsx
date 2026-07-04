import type { ReactNode } from "react";
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
import {
  DepartmentHeadWorkspace,
  ProcessListView,
  VersionsView
} from "../DepartmentHeadWorkspace.js";
import type { RepartoRuntimeConfig } from "../../config.js";

type ViewConfig = Partial<RepartoRuntimeConfig>;

function Shell({ children, config }: { children: ReactNode; config?: ViewConfig }) {
  return (
    <RepartoQueryProvider>
      <RepartoProvider config={config}>{children}</RepartoProvider>
    </RepartoQueryProvider>
  );
}

export function DepartmentHeadView({ config }: { config?: ViewConfig }) {
  return (
    <Shell config={config}>
      <DepartmentHeadWorkspace />
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
