import assert from "node:assert/strict";
import test, { after } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
const { DashboardRenderer } = await vite.ssrLoadModule(
  "/src/features/dashboard/DashboardRenderer.tsx",
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

function providerMetadata() {
  return {
    attribution: {
      provider: "Toss Securities",
      source: "BROKER_API",
      captured_at: "2026-08-24T09:00:00+09:00",
      refreshed_at: "2026-08-24T09:01:00+09:00",
    },
    status: {
      data_status: "STALE",
      lookup_results: [
        {
          lookup_type: "HOLDINGS",
          target_key: "account-primary",
          target_label: "주 계좌",
          lookup_status: "UNAUTHORIZED",
        },
      ],
    },
  };
}

function withProviderMetadata(metadata = providerMetadata()) {
  const schema = validSchema();
  schema.data_requirements[0].provider_metadata = metadata;
  return schema;
}

function renderDashboard(schema, positions = []) {
  return renderToStaticMarkup(
    createElement(DashboardRenderer, {
      activeFilter: "전체",
      onFilterChange: () => {},
      positions,
      schema,
      schemaSourceMessage: "테스트 스키마",
      summaryPositions: positions,
    }),
  );
}

test("accepts the supported portfolio position filter", () => {
  const schema = validSchema();

  assert.equal(validateDashboardSchema(schema), "READY");
});

test("accepts provider attribution and independent statuses", () => {
  const schema = withProviderMetadata();

  assert.equal(validateDashboardSchema(schema), "READY");
});

test("rejects malformed provider metadata", () => {
  const missingAttribution = providerMetadata();
  delete missingAttribution.attribution;

  const blankProvider = providerMetadata();
  blankProvider.attribution.provider = " ";

  const invalidSource = providerMetadata();
  invalidSource.attribution.source = "REMOTE";

  const timezoneMissing = providerMetadata();
  timezoneMissing.attribution.refreshed_at = "2026-08-24T09:01:00";

  const numericTimestamp = providerMetadata();
  numericTimestamp.attribution.refreshed_at = 0;

  const invalidCalendarDate = providerMetadata();
  invalidCalendarDate.attribution.refreshed_at = "2026-02-30T09:01:00Z";

  const invalidDataStatus = providerMetadata();
  invalidDataStatus.status.data_status = "FRESH";

  const invalidLookupStatus = providerMetadata();
  invalidLookupStatus.status.lookup_results[0].lookup_status = "ERROR";

  const invalidLookupType = providerMetadata();
  invalidLookupType.status.lookup_results[0].lookup_type = "ACCOUNT";

  const blankTargetKey = providerMetadata();
  blankTargetKey.status.lookup_results[0].target_key = " ";

  const nullTargetLabel = providerMetadata();
  nullTargetLabel.status.lookup_results[0].target_label = null;

  const emptyLookupResults = providerMetadata();
  emptyLookupResults.status.lookup_results = [];

  const duplicateLookupTarget = providerMetadata();
  duplicateLookupTarget.status.lookup_results.push({
    ...duplicateLookupTarget.status.lookup_results[0],
  });

  const missingProviderLookupResults = providerMetadata();
  delete missingProviderLookupResults.status.lookup_results;

  const legacyScalarLookupStatus = providerMetadata();
  delete legacyScalarLookupStatus.status.lookup_results;
  legacyScalarLookupStatus.status.lookup_status = "AVAILABLE";

  const missingCapturedAt = providerMetadata();
  delete missingCapturedAt.attribution.captured_at;

  const manualProviderLookupStatus = providerMetadata();
  manualProviderLookupStatus.attribution.source = "MANUAL";

  const unsupportedStatusField = providerMetadata();
  unsupportedStatusField.status.unexpected = "unsupported";

  const explicitNull = providerMetadata();
  explicitNull.status.data_status = null;

  for (const metadata of [
    missingAttribution,
    blankProvider,
    invalidSource,
    timezoneMissing,
    numericTimestamp,
    invalidCalendarDate,
    invalidDataStatus,
    invalidLookupStatus,
    invalidLookupType,
    blankTargetKey,
    nullTargetLabel,
    emptyLookupResults,
    duplicateLookupTarget,
    missingProviderLookupResults,
    legacyScalarLookupStatus,
    missingCapturedAt,
    manualProviderLookupStatus,
    unsupportedStatusField,
    explicitNull,
  ]) {
    assert.equal(validateDashboardSchema(withProviderMetadata(metadata)), "INVALID_SCHEMA");
  }
});

test("accepts local attribution without provider lookup results", () => {
  const schema = withProviderMetadata({
    attribution: {
      provider: "StockSignalView",
      source: "MANUAL",
      refreshed_at: "2026-08-24T09:01:00+09:00",
    },
    status: {},
  });

  assert.equal(validateDashboardSchema(schema), "READY");
  assert.match(renderDashboard(schema), /수동 입력/);
});

test("requires attribution for AI planner dashboards", () => {
  const unattributed = validSchema();
  unattributed.source = "AI_PLANNER";
  unattributed.description = "출처 없는 provider 요약";

  const attributed = withProviderMetadata();
  attributed.source = "AI_PLANNER";

  assert.equal(validateDashboardSchema(unattributed), "INVALID_SCHEMA");
  assert.equal(validateDashboardSchema(attributed), "READY");
});

test("renders provider attribution and composite status badges", () => {
  const markup = renderDashboard(withProviderMetadata());

  assert.match(markup, /Toss Securities/);
  assert.match(markup, /증권사 API/);
  assert.match(markup, /값 기준/);
  assert.match(markup, /마지막 갱신/);
  assert.match(markup, /값 갱신 지연/);
  assert.match(markup, /보유 조회/);
  assert.match(markup, /주 계좌/);
  assert.match(markup, /인증 실패/);
  assert.doesNotMatch(markup, /account-primary/);
});

test("renders every supported data and lookup status", () => {
  const dataStatusLabels = {
    AVAILABLE: "값 최신",
    STALE: "값 갱신 지연",
    UNAVAILABLE: "데이터 부족",
  };
  const lookupStatusLabels = {
    AVAILABLE: "조회 정상",
    PARTIAL: "일부 데이터",
    STALE: "조회 지연",
    UNAVAILABLE: "조회 결과 없음",
    UNAUTHORIZED: "인증 실패",
    FORBIDDEN: "권한 없음",
    PROVIDER_ERROR: "provider 오류",
    UNSUPPORTED: "provider 미지원",
  };

  for (const [status, label] of Object.entries(dataStatusLabels)) {
    const metadata = providerMetadata();
    metadata.status.data_status = status;
    assert.match(renderDashboard(withProviderMetadata(metadata)), new RegExp(label));
  }

  for (const [status, label] of Object.entries(lookupStatusLabels)) {
    const metadata = providerMetadata();
    metadata.status.lookup_results[0].lookup_status = status;
    assert.match(renderDashboard(withProviderMetadata(metadata)), new RegExp(label));
  }
});

test("renders each lookup result with a safe target label", () => {
  const metadata = providerMetadata();
  metadata.status.lookup_results.push(
    {
      lookup_type: "PRICE",
      target_key: "sensitive-provider-symbol",
      target_label: "삼성전자",
      lookup_status: "STALE",
    },
    {
      lookup_type: "MARKET_INDEX",
      target_key: "market-kospi",
      target_label: "KOSPI",
      lookup_status: "PROVIDER_ERROR",
    },
  );
  const markup = renderDashboard(withProviderMetadata(metadata));

  assert.match(markup, /가격 조회/);
  assert.match(markup, /삼성전자/);
  assert.match(markup, /시장 지수 조회/);
  assert.match(markup, /KOSPI/);
  assert.doesNotMatch(markup, /sensitive-provider-symbol/);
  assert.doesNotMatch(markup, /market-kospi/);
});

test("renders cost basis source beside average cost in table and cards", () => {
  const schema = validSchema();
  schema.widgets = [
    {
      widget_id: "positions-table",
      type: "position_table",
      title: "보유 종목",
      data_key: "positions",
      layout: { desktop_span: 12, mobile_order: 1 },
      options: {
        columns: ["stock_name", "average_cost"],
        sort: { field: "average_cost", direction: "desc" },
      },
    },
    {
      widget_id: "positions-cards",
      type: "position_cards",
      title: "보유 종목 카드",
      data_key: "positions",
      layout: { desktop_span: 12, mobile_order: 2 },
      options: {
        primary_metric: "relative_return_rate",
        show_memo_badge: false,
        filter_strength: "ALL",
      },
    },
  ];
  const positions = [
    ["provider", "PROVIDER_REPORTED"],
    ["ledger", "TRADE_LEDGER_DERIVED"],
    ["unknown", "UNKNOWN"],
  ].map(([id, costBasisSource], index) => ({
    id,
    name: `테스트 종목 ${index + 1}`,
    code: `00000${index + 1}`,
    market: "KOSPI",
    quantity: 1,
    averagePrice: 10000 + index,
    costBasisSource,
    currentPrice: 11000,
    valuation: 11000,
    unrealizedProfit: 1000,
    realizedProfit: 0,
    stockReturn: 10,
    marketReturn: 1,
    relativeReturn: 9,
    weight: 33.3,
    favorite: false,
    memo: "",
    alertState: "정상",
    dataSource: "모의 데이터",
  }));
  const markup = renderDashboard(schema, positions);

  assert.match(markup, /provider 제공 원가/);
  assert.match(markup, /거래 원장 계산 원가/);
  assert.match(markup, /원가 근거 확인 필요/);
});

test("does not render unattributed AI summaries", () => {
  const schema = validSchema();
  schema.source = "AI_PLANNER";
  schema.description = "출처 없는 provider 요약";
  const markup = renderDashboard(schema);

  assert.match(markup, /대시보드 스키마를 표시할 수 없습니다/);
  assert.doesNotMatch(markup, /출처 없는 provider 요약/);
});

test("renders schema strings as escaped text", () => {
  const schema = withProviderMetadata();
  schema.title = "<script>alert('dashboard')</script>";
  schema.data_requirements[0].provider_metadata.attribution.provider =
    "<img src=x onerror=alert('provider')>";
  schema.data_requirements[0].provider_metadata.status.lookup_results[0].target_label =
    "<svg onload=alert('target')>";
  const markup = renderDashboard(schema);

  assert.doesNotMatch(markup, /<script>/);
  assert.doesNotMatch(markup, /<img/);
  assert.doesNotMatch(markup, /<svg/);
  assert.match(markup, /&lt;script&gt;/);
  assert.match(markup, /&lt;img/);
  assert.match(markup, /&lt;svg/);
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

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

test("fetches and returns a validated default dashboard", async () => {
  const schema = validSchema();

  await withMockFetch(
    async () => jsonResponse(schema, { status: 200 }),
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
    async () => jsonResponse({}, { status: 200 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, DashboardSchemaValidationError);
    },
  );
});
test("rejects malformed default dashboard JSON as schema validation failure", async () => {
  await withMockFetch(
    async () => new Response("not json", { headers: { "Content-Type": "application/json" }, status: 200 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, DashboardSchemaValidationError);
    },
  );
});

test("treats OK non-JSON dashboard responses as request failures", async () => {
  await withMockFetch(
    async () => new Response("<!doctype html>", { headers: { "Content-Type": "text/html" }, status: 200 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, /Default dashboard response was not JSON/);
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
    async () => jsonResponse(errorResponse, { status: 500 }),
    async () => {
      await assert.rejects(fetchDefaultDashboard, DashboardSchemaValidationError);
    },
  );
});
