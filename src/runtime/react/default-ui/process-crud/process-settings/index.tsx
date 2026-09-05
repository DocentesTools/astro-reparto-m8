import {
  RepartoRouteGuard,
  Shell,
  useDict,
  WithSelectedProcess,
  type EntityViewProps
} from "../shared.js";
import { useRepartoProcess } from "../../../hooks.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import { repartoFieldCaptionClass } from "../../../styles.js";
import { RepartoToastHost } from "../../../ui/toast-notification.js";

import { ProcessReopenControl } from "./reopen.js";
import { ProcessSettingsForm } from "./settings-form.js";

/**
 * Process settings on their own route (§8.2 step 7).
 *
 * `AssignmentProcessUpdateSchema` and the `update` / `reopen` wrappers were all
 * in place; nothing called either, so a process was create-only, the Stage 3
 * LAN and direct-selection surfaces could never be switched on, and a closed
 * process refused every child write with no way to comply (audit findings
 * `S2-03`, `S2-05`).
 */
export function RepartoProcessSettingsView({
  config,
  locale,
  processId
}: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} processId={processId} route="processSettings">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedId) => (
            <RepartoProcessSettingsContent locale={locale} processId={resolvedId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoProcessSettingsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const processQuery = useRepartoProcess(processId);
  const process = processQuery.data ?? null;

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="process-settings"
      data-reparto-group="process"
    >
      <RepartoToastHost />
      <header>
        <h1 className="font-semibold">{dict.processSettings.pageTitle}</h1>
        <p className={repartoFieldCaptionClass}>
          {dict.processSettings.description}
        </p>
      </header>
      {/*
        The status is shown, never offered. `update_process` refuses a `status`
        field outright (HTTP 400, "owned by the transition endpoint") and
        `create_meeting_session` sets `MEETING_OPEN` itself, so a status control
        here would be both rejected and a second mover racing the meeting path.
      */}
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="process-status"
      >
        <h2 className="font-semibold">{dict.processSettings.statusTitle}</h2>
        {processQuery.isLoading ? (
          <p data-reparto-state="loading" role="status">
            {dict.processSettings.loading}
          </p>
        ) : processQuery.isError ? (
          <p
            className="text-sm text-destructive"
            data-reparto-state="unavailable"
            role="alert"
          >
            {processQuery.error instanceof Error
              ? processQuery.error.message
              : dict.processSettings.unavailable}
          </p>
        ) : process ? (
          <p data-reparto-slot="process-status">
            {formatRepartoMessage(dict.processSettings.statusLine, {
              status: dict.entity.assignmentProcess.status[process.status]
            })}
          </p>
        ) : null}
        <p className={repartoFieldCaptionClass}>
          {dict.processSettings.statusOwnedElsewhere}
        </p>
      </section>
      <ProcessSettingsForm locale={locale} processId={processId} />
      <ProcessReopenControl locale={locale} processId={processId} />
    </main>
  );
}
