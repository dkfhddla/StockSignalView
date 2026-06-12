import assert from "node:assert/strict";
import test, { after } from "node:test";

import { createServer } from "vite";

const vite = await createServer({
  appType: "custom",
  configFile: false,
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});
const { validateDashboardSchema } = await vite.ssrLoadModule(
  "/src/features/dashboard/dashboardSchema.ts",
);

after(async () => {
  await vite.close();
});

function withFilters(filters, type = "portfolio_positions") {
  return {
    schema_version: "1.0",
    dashboard_id: "filter-contract",
    title: "Filter contract",
    source: "PRESET",
    layout: {
      type: "responsive_grid",
      columns: { desktop: 12, mobile: 1 },
    },
    data_requirements: [
      {
        key: "positions",
        type,
        filters,
      },
    ],
    widgets: [
      {
        widget_id: "summary",
        type: "position_summary",
        title: "Summary",
        data_key: "positions",
        layout: { desktop_span: 12, mobile_order: 1 },
        options: {
          show_unavailable_count: true,
          highlight_metric: "relative_return_rate",
        },
      },
    ],
  };
}

test("accepts the supported portfolio position filter", () => {
  const schema = withFilters({ holding_status: "HELD_OR_WATCHLISTED" });

  assert.equal(validateDashboardSchema(schema), "READY");
});

test("rejects unsupported filter keys", () => {
  const schema = withFilters({ endpoint: "https://example.com/feed" });

  assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
});

test("rejects unsupported holding status values", () => {
  const schema = withFilters({ holding_status: "ALL" });

  assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
});

test("rejects malformed filters without throwing", () => {
  const schema = withFilters(null);

  assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
});

test("rejects filters on non-portfolio data requirements", () => {
  const schema = withFilters({ holding_status: "HELD_OR_WATCHLISTED" }, "trades");

  assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
});
