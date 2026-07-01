import {
  validateDashboardSchema,
  type DashboardSchema,
} from "../features/dashboard/dashboardSchema";

const DEFAULT_DASHBOARD_ENDPOINT = "/dashboards/default";
const DASHBOARD_SCHEMA_VALIDATION_FAILED = "dashboard_schema_validation_failed";

export class DashboardSchemaValidationError extends Error {
  constructor() {
    super("Default dashboard response failed frontend schema validation");
    this.name = "DashboardSchemaValidationError";
  }
}

export async function fetchDefaultDashboard(signal?: AbortSignal): Promise<DashboardSchema> {
  const response = await fetch(DEFAULT_DASHBOARD_ENDPOINT, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const dashboard = await readDashboardResponse(response);

  if (!response.ok) {
    if (isDashboardSchemaValidationErrorResponse(dashboard)) {
      throw new DashboardSchemaValidationError();
    }

    throw new Error(`Default dashboard request failed with ${response.status}`);
  }

  if (validateDashboardSchema(dashboard) !== "READY") {
    throw new DashboardSchemaValidationError();
  }

  return dashboard as DashboardSchema;
}

async function readDashboardResponse(response: Response): Promise<unknown> {
  if (!hasJsonContentType(response)) {
    if (response.ok) {
      throw new Error("Default dashboard response was not JSON");
    }

    return null;
  }

  try {
    return await response.json();
  } catch {
    if (response.ok) {
      throw new DashboardSchemaValidationError();
    }

    return null;
  }
}

function isDashboardSchemaValidationErrorResponse(value: unknown) {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  return value.error.code === DASHBOARD_SCHEMA_VALIDATION_FAILED;
}

function hasJsonContentType(response: Response) {
  return response.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
