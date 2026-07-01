import type { DashboardSchema } from "../features/dashboard/dashboardSchema";

const DEFAULT_DASHBOARD_ENDPOINT = "/dashboards/default";

export async function fetchDefaultDashboard(signal?: AbortSignal): Promise<DashboardSchema> {
  const response = await fetch(DEFAULT_DASHBOARD_ENDPOINT, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Default dashboard request failed with ${response.status}`);
  }

  return response.json() as Promise<DashboardSchema>;
}
