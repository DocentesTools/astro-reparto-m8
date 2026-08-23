// Resolves every installed skin the way a consumer would.
//
// The skin files themselves are copied in by `scripts/verify-registry-consumer.mjs`
// from the generated `registry/r/*.json`, at the same `target` paths a shadcn
// install would use, and `tsconfig.json`'s `include` typechecks each of them.
// This file adds the check `include` cannot make on its own: that every export
// a skin publishes is reachable through the *installed* path its siblings and a
// host import it by. Reparto's views take required process data, so they are
// referenced rather than mounted — inventing a process here would test the
// fixture's imagination, not the package.
import { RepartoAcademicYearDialog } from "./components/fa-reparto/reparto-academic-year-dialog";
import { RepartoClassroomStagesRegistryView } from "./components/fa-reparto/reparto-classroom-stages-view";
import { RepartoCrudTable } from "./components/fa-reparto/reparto-crud-table";
import { RepartoDeleteConfirm } from "./components/fa-reparto/reparto-delete-confirm";
import { RepartoDepartmentDialog } from "./components/fa-reparto/reparto-department-dialog";
import { RepartoFkSelect } from "./components/fa-reparto/reparto-fk-select";
import {
  RepartoProcessesTable,
  buildRepartoProcessColumns,
} from "./components/fa-reparto/reparto-processes-table";
import { RepartoSchoolDialog } from "./components/fa-reparto/reparto-school-dialog";
import {
  RepartoDashboardView,
  RepartoExportsView,
  RepartoMeetingView,
  RepartoMyView,
  RepartoProcessesView,
  RepartoSharedView,
  RepartoVersionsView,
} from "./components/fa-reparto/reparto-starter-views";
import { RepartoStatePanel } from "./components/fa-reparto/reparto-state-panel";
import { RepartoTeacherRosterDialog } from "./components/fa-reparto/reparto-teacher-roster-dialog";

export const installedSkins = {
  RepartoAcademicYearDialog,
  RepartoClassroomStagesRegistryView,
  RepartoCrudTable,
  RepartoDashboardView,
  RepartoDeleteConfirm,
  RepartoDepartmentDialog,
  RepartoExportsView,
  RepartoFkSelect,
  RepartoMeetingView,
  RepartoMyView,
  RepartoProcessesTable,
  RepartoProcessesView,
  RepartoSchoolDialog,
  RepartoSharedView,
  RepartoStatePanel,
  RepartoTeacherRosterDialog,
  RepartoVersionsView,
  buildRepartoProcessColumns,
};
