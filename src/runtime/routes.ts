export type RepartoRouteFragments = {
  dashboard?: string | false;
  meeting?: string | false;
  processList?: string | false;
  teacherView?: string | false;
  sharedScreen?: string | false;
  versions?: string | false;
  exports?: string | false;
  schools?: string | false;
  academicYears?: string | false;
  departments?: string | false;
  teacherRoster?: string | false;
};

export type BuiltRepartoRoutes = {
  dashboard: string | false;
  meeting: string | false;
  processList: string | false;
  teacherView: string | false;
  sharedScreen: string | false;
  versions: string | false;
  exports: string | false;
  schools: string | false;
  academicYears: string | false;
  departments: string | false;
  teacherRoster: string | false;
};

export function buildRepartoRoutes(
  routes: RepartoRouteFragments = {}
): BuiltRepartoRoutes {
  return {
    dashboard: routes.dashboard ?? "/reparto",
    meeting: routes.meeting ?? "/reparto/meeting/[processId]",
    processList: routes.processList ?? "/reparto/processes",
    teacherView: routes.teacherView ?? "/reparto/processes/[processId]/my-view",
    sharedScreen: routes.sharedScreen ?? "/reparto/processes/[processId]/shared",
    versions: routes.versions ?? "/reparto/processes/[processId]/versions",
    exports: routes.exports ?? "/reparto/processes/[processId]/exports",
    schools: routes.schools ?? "/reparto/setup/schools",
    academicYears: routes.academicYears ?? "/reparto/setup/academic-years",
    departments: routes.departments ?? "/reparto/setup/departments",
    teacherRoster: routes.teacherRoster ?? "/reparto/setup/teacher-roster"
  };
}

export type RepartoRouteName = keyof BuiltRepartoRoutes;