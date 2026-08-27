export type DashboardSource = "PRESET" | "AI_PLANNER" | "USER_SAVED";
export type DashboardDataType = "stocks" | "portfolio_positions" | "trades" | "alert_rules" | "alert_events";
export type WidgetType =
  | "position_summary"
  | "position_table"
  | "position_cards"
  | "relative_return_chart"
  | "decision_timeline"
  | "alert_status_list";
export type ImplementedWidgetType = "position_summary" | "position_table" | "position_cards";

export type DashboardProviderSource = "MANUAL" | "BROKER_API" | "MARKET_API" | "IMPORT" | "MOCK";
export type DashboardDataStatus = "AVAILABLE" | "STALE" | "UNAVAILABLE";
export type DashboardLookupStatus =
  | "AVAILABLE"
  | "PARTIAL"
  | "STALE"
  | "UNAVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "PROVIDER_ERROR"
  | "UNSUPPORTED";
export type DashboardLookupType = "HOLDINGS" | "PRICE" | "MARKET_INDEX";
export type DashboardSnapshotRole = "CURRENT" | "DAY_BASELINE" | "HOLDING_PERIOD_BASELINE";
export type DashboardLookupResult = {
  lookup_type: DashboardLookupType;
  target_key: string;
  target_label?: string;
  snapshot_role?: DashboardSnapshotRole;
  lookup_status: DashboardLookupStatus;
};

export type DashboardProviderMetadata = {
  attribution: {
    provider: string;
    source: DashboardProviderSource;
    captured_at?: string;
    refreshed_at: string;
  };
  status: {
    data_status?: DashboardDataStatus;
    lookup_results?: DashboardLookupResult[];
  };
};

type DashboardDataRequirementBase = {
  key: string;
  provider_metadata?: DashboardProviderMetadata;
};

export type DashboardDataRequirement =
  | (DashboardDataRequirementBase & {
      type: "portfolio_positions";
      filters?: {
        holding_status: "HELD_OR_WATCHLISTED";
      };
    })
  | (DashboardDataRequirementBase & {
      type: Exclude<DashboardDataType, "portfolio_positions">;
      filters?: never;
    });

export type DashboardSchema = {
  schema_version: "1.0";
  dashboard_id: string;
  title: string;
  description?: string;
  source: DashboardSource;
  layout: {
    type: "responsive_grid";
    columns: {
      desktop: number;
      mobile: number;
    };
  };
  data_requirements: DashboardDataRequirement[];
  widgets: DashboardWidget[];
};

type BaseWidget = {
  widget_id: string;
  title: string;
  layout: WidgetLayout;
};

type SingleDataWidget = BaseWidget & {
  data_key: string;
};

type MultiDataWidget = BaseWidget & {
  data_keys: string[];
};

export type DashboardWidget =
  | (SingleDataWidget & {
      type: "position_summary";
      options: {
        show_unavailable_count: boolean;
        highlight_metric: "unrealized_profit_loss" | "relative_return_rate";
      };
    })
  | (SingleDataWidget & {
      type: "position_table";
      options: {
        columns: PositionTableColumn[];
        sort: {
          field: PositionTableColumn;
          direction: "asc" | "desc";
        };
        limit?: number;
      };
    })
  | (SingleDataWidget & {
      type: "position_cards";
      options: {
        primary_metric: "unrealized_profit_loss" | "relative_return_rate" | "stock_return_rate";
        show_memo_badge: boolean;
        filter_strength: "STRONG" | "WEAK" | "ALL";
      };
    })
  | (SingleDataWidget & {
      type: "relative_return_chart";
      options: {
        chart_type: "bar" | "ranked_bar";
        limit?: number;
        baseline?: "market_return_rate";
      };
    })
  | (SingleDataWidget & {
      type: "decision_timeline";
      options: {
        stock_id?: string;
        trade_types?: Array<"BUY" | "SELL">;
        show_profit_context: boolean;
      };
    })
  | (MultiDataWidget & {
      type: "alert_status_list";
      options: {
        status_filter: "TRIGGERED" | "NOT_TRIGGERED" | "UNAVAILABLE" | "ALL";
        group_by_stock: boolean;
      };
    });

export type WidgetLayout = {
  desktop_span: number;
  mobile_order: number;
};

export type PositionTableColumn =
  | "stock_name"
  | "market"
  | "held_quantity"
  | "average_cost"
  | "market_value"
  | "unrealized_profit_loss"
  | "realized_profit_loss"
  | "position_weight"
  | "stock_return_rate"
  | "market_return_rate"
  | "relative_return_rate"
  | "strength_status"
  | "calculation_status";

export type RendererStatus = "READY" | "INVALID_SCHEMA";

const registeredWidgets: WidgetType[] = [
  "position_summary",
  "position_table",
  "position_cards",
  "relative_return_chart",
  "decision_timeline",
  "alert_status_list",
];
const implementedWidgets: ImplementedWidgetType[] = ["position_summary", "position_table", "position_cards"];
const portfolioPositionWidgets: WidgetType[] = [
  "position_summary",
  "position_table",
  "position_cards",
  "relative_return_chart",
];
const positionTableColumns: PositionTableColumn[] = [
  "stock_name",
  "market",
  "held_quantity",
  "average_cost",
  "market_value",
  "unrealized_profit_loss",
  "realized_profit_loss",
  "position_weight",
  "stock_return_rate",
  "market_return_rate",
  "relative_return_rate",
  "strength_status",
  "calculation_status",
];
const providerSources: DashboardProviderSource[] = ["MANUAL", "BROKER_API", "MARKET_API", "IMPORT", "MOCK"];
const dataStatuses: DashboardDataStatus[] = ["AVAILABLE", "STALE", "UNAVAILABLE"];
const lookupStatuses: DashboardLookupStatus[] = [
  "AVAILABLE",
  "PARTIAL",
  "STALE",
  "UNAVAILABLE",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "PROVIDER_ERROR",
  "UNSUPPORTED",
];
const lookupTypes: DashboardLookupType[] = ["HOLDINGS", "PRICE", "MARKET_INDEX"];
const snapshotRoles: DashboardSnapshotRole[] = ["CURRENT", "DAY_BASELINE", "HOLDING_PERIOD_BASELINE"];

export function validateDashboardSchema(schema: unknown): RendererStatus {
  if (!isRecord(schema)) return "INVALID_SCHEMA";
  if (!isSchemaRootValid(schema)) return "INVALID_SCHEMA";
  if (schema.schema_version !== "1.0") return "INVALID_SCHEMA";
  if (!Array.isArray(schema.data_requirements) || schema.data_requirements.length === 0) {
    return "INVALID_SCHEMA";
  }
  if (!Array.isArray(schema.widgets) || schema.widgets.length === 0) {
    return "INVALID_SCHEMA";
  }
  if (schema.data_requirements.some((requirement) => !isDataRequirementValid(requirement))) {
    return "INVALID_SCHEMA";
  }
  if (schema.widgets.some((widget) => !isWidgetShapeValid(widget))) {
    return "INVALID_SCHEMA";
  }

  const dataRequirements = schema.data_requirements as DashboardDataRequirement[];
  const widgets = schema.widgets as DashboardWidget[];
  if (
    schema.source === "AI_PLANNER" &&
    dataRequirements.some((requirement) => requirement.provider_metadata === undefined)
  ) {
    return "INVALID_SCHEMA";
  }
  const dataRequirementKeys = dataRequirements.map((requirement) => requirement.key);
  const widgetIds = widgets.map((widget) => widget.widget_id);
  if (!hasUniqueValues(dataRequirementKeys) || !hasUniqueValues(widgetIds)) {
    return "INVALID_SCHEMA";
  }

  const dataRequirementTypes = new Map(
    dataRequirements.map((requirement) => [requirement.key, requirement.type]),
  );
  const hasInvalidWidget = widgets.some((widget) => {
    return !isWidgetBindingValid(widget, dataRequirementTypes) || !areOptionsValid(widget);
  });

  return hasInvalidWidget ? "INVALID_SCHEMA" : "READY";
}

export function isImplementedWidgetType(type: WidgetType): type is ImplementedWidgetType {
  return implementedWidgets.includes(type as ImplementedWidgetType);
}

function isDataRequirementValid(requirement: unknown): requirement is DashboardDataRequirement {
  if (!isRecord(requirement)) return false;
  if (typeof requirement.key !== "string" || requirement.key.trim() === "") return false;
  if (!isDashboardDataType(requirement.type)) return false;
  if (!hasOnlyOptionKeys(requirement, ["key", "type", "filters", "provider_metadata"])) return false;
  if (requirement.provider_metadata === undefined) {
    if (Object.hasOwn(requirement, "provider_metadata")) return false;
  } else if (!isProviderMetadataValid(requirement.provider_metadata)) {
    return false;
  }
  if (requirement.filters === undefined) {
    return !Object.hasOwn(requirement, "filters");
  }
  if (requirement.type !== "portfolio_positions") return false;
  if (!isRecord(requirement.filters)) return false;

  return (
    hasOnlyOptionKeys(requirement.filters, ["holding_status"]) &&
    requirement.filters.holding_status === "HELD_OR_WATCHLISTED"
  );
}

function isProviderMetadataValid(metadata: unknown): metadata is DashboardProviderMetadata {
  if (!isRecord(metadata)) return false;
  if (!hasOnlyOptionKeys(metadata, ["attribution", "status"])) return false;
  if (!isRecord(metadata.attribution) || !isRecord(metadata.status)) return false;
  if (!hasOnlyOptionKeys(metadata.attribution, ["provider", "source", "captured_at", "refreshed_at"])) {
    return false;
  }
  if (typeof metadata.attribution.provider !== "string" || metadata.attribution.provider.trim() === "") {
    return false;
  }
  if (!isProviderSource(metadata.attribution.source)) return false;
  if (!isAwareTimestamp(metadata.attribution.refreshed_at)) return false;
  if (metadata.attribution.captured_at === undefined) {
    if (Object.hasOwn(metadata.attribution, "captured_at")) return false;
  } else if (!isAwareTimestamp(metadata.attribution.captured_at)) {
    return false;
  }
  if (!hasOnlyOptionKeys(metadata.status, ["data_status", "lookup_results"])) return false;
  if (metadata.status.lookup_results === undefined) {
    if (Object.hasOwn(metadata.status, "lookup_results")) return false;
    if (["BROKER_API", "MARKET_API"].includes(metadata.attribution.source)) return false;
  } else {
    if (
      !Array.isArray(metadata.status.lookup_results) ||
      metadata.status.lookup_results.length === 0 ||
      !metadata.status.lookup_results.every(isLookupResultValid)
    ) {
      return false;
    }
    const lookupTargets = metadata.status.lookup_results.map(
      (result) => `${result.lookup_type}:${result.target_key.trim()}:${result.snapshot_role ?? ""}`,
    );
    if (!hasUniqueValues(lookupTargets)) return false;
  }
  if (metadata.attribution.source === "MANUAL" && metadata.status.lookup_results !== undefined) {
    return false;
  }
  if (metadata.status.data_status === undefined) {
    return !Object.hasOwn(metadata.status, "data_status");
  }
  if (!isDataStatus(metadata.status.data_status)) return false;

  return (
    !["AVAILABLE", "STALE"].includes(metadata.status.data_status) ||
    metadata.attribution.captured_at !== undefined
  );
}

function isWidgetShapeValid(widget: unknown): widget is DashboardWidget {
  if (!isRecord(widget)) return false;
  if (typeof widget.widget_id !== "string" || widget.widget_id.trim() === "") return false;
  if (typeof widget.title !== "string" || widget.title.trim() === "") return false;
  if (!isWidgetType(widget.type)) return false;
  if (!isRecord(widget.layout)) return false;
  if (!hasOnlyOptionKeys(widget.layout, ["desktop_span", "mobile_order"])) return false;
  if (!isPositiveInteger(widget.layout.desktop_span) || !isPositiveInteger(widget.layout.mobile_order)) return false;
  if (widget.type === "alert_status_list") {
    return (
      hasOnlyOptionKeys(widget, ["widget_id", "type", "title", "data_keys", "layout", "options"]) &&
      Array.isArray(widget.data_keys) &&
      widget.data_keys.every((dataKey) => typeof dataKey === "string" && dataKey.trim() !== "")
    );
  }

  return (
    hasOnlyOptionKeys(widget, ["widget_id", "type", "title", "data_key", "layout", "options"]) &&
    typeof widget.data_key === "string" &&
    widget.data_key.trim() !== ""
  );
}

function isWidgetBindingValid(widget: DashboardWidget, dataRequirements: Map<string, DashboardDataType>) {
  if (widget.type === "alert_status_list") {
    return hasRequiredDataKeys(widget.data_keys, dataRequirements, ["alert_rules", "alert_events"]);
  }

  const dataType = dataRequirements.get(widget.data_key);
  if (!dataType) return false;
  if (portfolioPositionWidgets.includes(widget.type)) return dataType === "portfolio_positions";
  if (widget.type === "decision_timeline") return dataType === "trades";

  return false;
}

function hasRequiredDataKeys(
  dataKeys: string[],
  dataRequirements: Map<string, DashboardDataType>,
  requiredTypes: DashboardDataType[],
) {
  const boundTypes = dataKeys.map((dataKey) => dataRequirements.get(dataKey));
  return (
    dataKeys.length === requiredTypes.length &&
    boundTypes.every((dataType): dataType is DashboardDataType => dataType !== undefined) &&
    requiredTypes.every((requiredType) => boundTypes.includes(requiredType))
  );
}

function areOptionsValid(widget: DashboardWidget) {
  switch (widget.type) {
    case "position_summary":
      return (
        hasOnlyOptionKeys(widget.options, ["show_unavailable_count", "highlight_metric"]) &&
        typeof widget.options.show_unavailable_count === "boolean" &&
        ["unrealized_profit_loss", "relative_return_rate"].includes(widget.options.highlight_metric)
      );
    case "position_table":
      return (
        hasOnlyOptionKeys(widget.options, ["columns", "sort", "limit"]) &&
        hasOnlyOptionKeys(widget.options.sort, ["field", "direction"]) &&
        Array.isArray(widget.options.columns) &&
        widget.options.columns.every((column) => positionTableColumns.includes(column)) &&
        positionTableColumns.includes(widget.options.sort.field) &&
        widget.options.columns.includes(widget.options.sort.field) &&
        ["asc", "desc"].includes(widget.options.sort.direction) &&
        isOptionalPositiveNumber(widget.options.limit)
      );
    case "position_cards":
      return (
        hasOnlyOptionKeys(widget.options, ["primary_metric", "show_memo_badge", "filter_strength"]) &&
        ["unrealized_profit_loss", "relative_return_rate", "stock_return_rate"].includes(widget.options.primary_metric) &&
        typeof widget.options.show_memo_badge === "boolean" &&
        ["STRONG", "WEAK", "ALL"].includes(widget.options.filter_strength)
      );
    case "relative_return_chart":
      return (
        hasOnlyOptionKeys(widget.options, ["chart_type", "limit", "baseline"]) &&
        ["bar", "ranked_bar"].includes(widget.options.chart_type) &&
        (widget.options.baseline === undefined || widget.options.baseline === "market_return_rate") &&
        isOptionalPositiveNumber(widget.options.limit)
      );
    case "decision_timeline":
      return (
        hasOnlyOptionKeys(widget.options, ["stock_id", "trade_types", "show_profit_context"]) &&
        typeof widget.options.show_profit_context === "boolean" &&
        (widget.options.stock_id === undefined || typeof widget.options.stock_id === "string") &&
        (widget.options.trade_types === undefined ||
          (Array.isArray(widget.options.trade_types) &&
          widget.options.trade_types.every((tradeType) => ["BUY", "SELL"].includes(tradeType)))
        )
      );
    case "alert_status_list":
      return (
        hasOnlyOptionKeys(widget.options, ["status_filter", "group_by_stock"]) &&
        ["TRIGGERED", "NOT_TRIGGERED", "UNAVAILABLE", "ALL"].includes(widget.options.status_filter) &&
        typeof widget.options.group_by_stock === "boolean"
      );
  }
}

function hasOnlyOptionKeys(options: unknown, allowedKeys: string[]) {
  return isRecord(options) && Object.keys(options).every((key) => allowedKeys.includes(key));
}

function isOptionalPositiveNumber(value: number | undefined) {
  return value === undefined || isPositiveInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSchemaRootValid(schema: Record<string, unknown>) {
  if (!hasOnlyOptionKeys(schema, ["schema_version", "dashboard_id", "title", "description", "source", "layout", "data_requirements", "widgets"])) {
    return false;
  }
  if (typeof schema.dashboard_id !== "string" || schema.dashboard_id.trim() === "") return false;
  if (typeof schema.title !== "string" || schema.title.trim() === "") return false;
  if (schema.description !== undefined && typeof schema.description !== "string") return false;
  if (!isDashboardSource(schema.source)) return false;
  if (!isRecord(schema.layout)) return false;
  if (!hasOnlyOptionKeys(schema.layout, ["type", "columns"])) return false;
  if (schema.layout.type !== "responsive_grid") return false;
  if (!isRecord(schema.layout.columns)) return false;
  if (!hasOnlyOptionKeys(schema.layout.columns, ["desktop", "mobile"])) return false;
  return isPositiveInteger(schema.layout.columns.desktop) && isPositiveInteger(schema.layout.columns.mobile);
}

function isDashboardSource(value: unknown): value is DashboardSource {
  return value === "PRESET" || value === "AI_PLANNER" || value === "USER_SAVED";
}

function isDashboardDataType(value: unknown): value is DashboardDataType {
  return (
    value === "stocks" ||
    value === "portfolio_positions" ||
    value === "trades" ||
    value === "alert_rules" ||
    value === "alert_events"
  );
}

function isProviderSource(value: unknown): value is DashboardProviderSource {
  return typeof value === "string" && providerSources.includes(value as DashboardProviderSource);
}

function isDataStatus(value: unknown): value is DashboardDataStatus {
  return typeof value === "string" && dataStatuses.includes(value as DashboardDataStatus);
}

function isLookupStatus(value: unknown): value is DashboardLookupStatus {
  return typeof value === "string" && lookupStatuses.includes(value as DashboardLookupStatus);
}

function isLookupResultValid(value: unknown): value is DashboardLookupResult {
  if (!isRecord(value)) return false;
  if (!hasOnlyOptionKeys(value, ["lookup_type", "target_key", "target_label", "snapshot_role", "lookup_status"])) {
    return false;
  }
  if (!isLookupType(value.lookup_type)) return false;
  if (typeof value.target_key !== "string" || value.target_key.trim() === "") return false;
  if (value.target_label === undefined) {
    if (Object.hasOwn(value, "target_label")) return false;
  } else if (typeof value.target_label !== "string" || value.target_label.trim() === "") {
    return false;
  }
  const requiresSnapshotRole = value.lookup_type !== "HOLDINGS";
  if (value.snapshot_role === undefined) {
    if (Object.hasOwn(value, "snapshot_role")) return false;
    if (requiresSnapshotRole) return false;
  } else if (!requiresSnapshotRole || !isSnapshotRole(value.snapshot_role)) {
    return false;
  }
  return isLookupStatus(value.lookup_status);
}

function isLookupType(value: unknown): value is DashboardLookupType {
  return typeof value === "string" && lookupTypes.includes(value as DashboardLookupType);
}

function isSnapshotRole(value: unknown): value is DashboardSnapshotRole {
  return typeof value === "string" && snapshotRoles.includes(value as DashboardSnapshotRole);
}

function isAwareTimestamp(value: unknown) {
  if (typeof value !== "string") return false;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-](\d{2}):(\d{2}))$/,
  );
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);

  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month) &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 23 &&
    offsetMinute <= 59
  );
}

function daysInMonth(year: number, month: number) {
  if (month === 2) {
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return isLeapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isWidgetType(value: unknown): value is WidgetType {
  return typeof value === "string" && registeredWidgets.includes(value as WidgetType);
}

function hasUniqueValues(values: string[]) {
  return values.length === new Set(values).size;
}

function isPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
