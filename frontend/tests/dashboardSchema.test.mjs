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
const { DashboardSchemaValidationError, fetchDefaultDashboard } = await vite.ssrLoadModule(
  "/src/lib/dashboardApi.ts",
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

function validSchema() {
  return withFilters({ holding_status: "HELD_OR_WATCHLISTED" });
}

test("accepts the supported portfolio position filter", () => {
  const schema = validSchema();

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

test("rejects empty data requirements and widgets", () => {
  const emptyDataRequirements = validSchema();
  emptyDataRequirements.data_requirements = [];

  const emptyWidgets = validSchema();
  emptyWidgets.widgets = [];

  assert.equal(validateDashboardSchema(emptyDataRequirements), "INVALID_SCHEMA");
  assert.equal(validateDashboardSchema(emptyWidgets), "INVALID_SCHEMA");
});

test("rejects duplicate data requirement keys and widget ids", () => {
  const duplicateDataKey = validSchema();
  duplicateDataKey.data_requirements.push({ ...duplicateDataKey.data_requirements[0] });

  const duplicateWidgetId = validSchema();
  duplicateWidgetId.widgets.push({ ...duplicateWidgetId.widgets[0] });

  assert.equal(validateDashboardSchema(duplicateDataKey), "INVALID_SCHEMA");
  assert.equal(validateDashboardSchema(duplicateWidgetId), "INVALID_SCHEMA");
});

test("rejects malformed schema structures without throwing", () => {
  const malformedCases = [
    null,
    {},
    { ...validSchema(), data_requirements: null },
    { ...validSchema(), data_requirements: [null] },
    { ...validSchema(), widgets: null },
    { ...validSchema(), widgets: [null] },
  ];

  for (const schema of malformedCases) {
    assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
  }
});

test("rejects malformed widget options without throwing", () => {
  const missingOptions = validSchema();
  delete missingOptions.widgets[0].options;

  const nullOptions = validSchema();
  nullOptions.widgets[0].options = null;

  const missingSort = validSchema();
  missingSort.widgets[0] = {
    ...missingSort.widgets[0],
    type: "position_table",
    options: {
      columns: ["relative_return_rate"],
    },
  };

  const nullSort = validSchema();
  nullSort.widgets[0] = {
    ...nullSort.widgets[0],
    type: "position_table",
    options: {
      columns: ["relative_return_rate"],
      sort: null,
    },
  };

  for (const schema of [missingOptions, nullOptions, missingSort, nullSort]) {
    assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
  }
});

test("rejects missing or invalid root fields", () => {
  const missingTitle = validSchema();
  delete missingTitle.title;

  const blankDashboardId = validSchema();
  blankDashboardId.dashboard_id = " ";

  const invalidSource = validSchema();
  invalidSource.source = "REMOTE";

  for (const schema of [missingTitle, blankDashboardId, invalidSource]) {
    assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
  }
});

test("rejects invalid layout contracts", () => {
  const missingLayout = validSchema();
  delete missingLayout.layout;

  const invalidLayoutType = validSchema();
  invalidLayoutType.layout.type = "fixed_grid";

  const zeroDesktopColumns = validSchema();
  zeroDesktopColumns.layout.columns.desktop = 0;

  const fractionalMobileColumns = validSchema();
  fractionalMobileColumns.layout.columns.mobile = 1.5;

  for (const schema of [missingLayout, invalidLayoutType, zeroDesktopColumns, fractionalMobileColumns]) {
    assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
  }
});

test("rejects extra keys outside allowed schema contracts", () => {
  const extraRootKey = validSchema();
  extraRootKey.endpoint = "https://example.com/feed";

  const extraLayoutKey = validSchema();
  extraLayoutKey.layout.script = "alert(1)";

  const extraRequirementKey = validSchema();
  extraRequirementKey.data_requirements[0].query = "DROP TABLE trades";

  const extraWidgetKey = validSchema();
  extraWidgetKey.widgets[0].html = "<script>alert(1)</script>";

  for (const schema of [extraRootKey, extraLayoutKey, extraRequirementKey, extraWidgetKey]) {
    assert.equal(validateDashboardSchema(schema), "INVALID_SCHEMA");
  }
});
async function withMockFetch(fetchImplementation, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImplementation;

  try {
    await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("fetches and returns a validated default dashboard", async () => {
  const schema = validSchema();

  await withMockFetch(
    async () => new Response(JSON.stringify(schema), { status: 200 }),
    async () => {
      assert.deepEqual(await fetchDefaultDashboard(), schema);
    },
  );
});

test("rejects non-OK default dashboard responses", async () => {
  await withMockFetch(
    async () => new Response("{}", { status: 500 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, /Default dashboard request failed with 500/);
    },
  );
});

test("rejects default dashboard responses that fail frontend schema validation", async () => {
  await withMockFetch(
    async () => new Response(JSON.stringify({}), { status: 200 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, DashboardSchemaValidationError);
    },
  );
});
test("rejects malformed default dashboard JSON as schema validation failure", async () => {
  await withMockFetch(
    async () => new Response("not json", { status: 200 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, DashboardSchemaValidationError);
    },
  );
});

test("maps backend default dashboard validation errors to schema validation failure", async () => {
  const errorResponse = {
    error: {
      code: "dashboard_schema_validation_failed",
      message: "The default dashboard schema failed validation.",
    },
  };

  await withMockFetch(
    async () => new Response(JSON.stringify(errorResponse), { status: 500 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, DashboardSchemaValidationError);
    },
  );
});
