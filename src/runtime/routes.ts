export type RepartoRouteFragments = {
  dashboard?: string | false;
  meeting?: string | false;
};

export type BuiltRepartoRoutes = {
  dashboard: string | false;
  meeting: string | false;
};

export function buildRepartoRoutes(
  routes: RepartoRouteFragments = {}
): BuiltRepartoRoutes {
  return {
    dashboard: routes.dashboard ?? "/reparto",
    meeting: routes.meeting ?? "/reparto/meeting/[processId]"
  };
}
