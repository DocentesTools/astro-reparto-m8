import type { ReactNode } from "react";

import type { RepartoDictionary } from "../i18n/index.js";
import type { PlanValidationMessage } from "../schemas.js";
import {
  repartoListClass,
  repartoListItemClass
} from "./styles.js";

export type ProcessValidationFinding = Pick<
  PlanValidationMessage,
  "code" | "message"
> &
  Partial<Pick<PlanValidationMessage, "entity_id" | "entity_type" | "severity">> & {
    /** Optional catalog-authored detail shown below the finding headline. */
    details?: ReactNode;
  };

export type ProcessValidationStage =
  | "assignment"
  | "feasibility"
  | "planning";

/**
 * The single renderer for every validation finding shown by the package.
 *
 * A service-owned code remains available to tests and skins as machine data,
 * but is never repeated as visible prose. Callers may replace a service
 * message with catalog-authored text before passing a finding (the closed
 * feasibility vocabulary does this) and may attach catalog-authored details.
 */
export function ProcessValidationList({
  dict,
  emptyMessage,
  listName,
  messages,
  stage
}: {
  dict: RepartoDictionary;
  emptyMessage?: string;
  listName?: string;
  messages: readonly ProcessValidationFinding[];
  stage: ProcessValidationStage;
}) {
  if (messages.length === 0) {
    return (
      <p
        className="mt-3 text-sm text-muted-foreground"
        data-reparto-slot={`${stage}-validations-empty`}
      >
        {emptyMessage ?? dict.dashboard.state.noValidations}
      </p>
    );
  }

  return (
    <ul
      className={repartoListClass}
      data-reparto-list={listName ?? `${stage}-validations`}
      data-reparto-slot={`${stage}-validations`}
    >
      {messages.map((message, index) => (
        <li
          className={repartoListItemClass}
          data-reparto-validation-code={message.code}
          data-reparto-validation-entity={message.entity_type}
          data-reparto-validation-severity={message.severity}
          // The service assigns a finding no id, and two distinct findings can
          // share code, entity and severity. The report is a static read, so
          // the index only breaks that residual tie for this list's lifetime.
          // eslint-disable-next-line @eslint-react/no-array-index-key
          key={`${message.code}-${message.entity_id ?? "none"}-${index}`}
        >
          <strong className="block">{message.message}</strong>
          {message.details}
        </li>
      ))}
    </ul>
  );
}
