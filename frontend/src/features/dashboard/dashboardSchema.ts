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
  data_requirements: Array<{
    key: string;
    type: DashboardDataType;
    filters?: Record<string, string>;
  }>;
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

export function validateDashboardSchema(schema: DashboardSchema): RendererStatus {
  if (schema.schema_version !== "1.0") return "INVALID_SCHEMA";

  const dataRequirements = new Map(
    schema.data_requirements.map((requirement) => [requirement.key, requirement.type]),
  );
  const hasInvalidWidget = schema.widgets.some((widget) => {
    return !registeredWidgets.includes(widget.type) || !isWidgetBindingValid(widget, dataRequirements) || !areOptionsValid(widget);
  });

  return hasInvalidWidget ? "INVALID_SCHEMA" : "READY";
}

export function isImplementedWidgetType(type: WidgetType): type is ImplementedWidgetType {
  return implementedWidgets.includes(type as ImplementedWidgetType);
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
  return requiredTypes.every((requiredType) => {
    return dataKeys.some((dataKey) => dataRequirements.get(dataKey) === requiredType);
  });
}

function areOptionsValid(widget: DashboardWidget) {
  switch (widget.type) {
    case "position_summary":
      return (
        hasOnlyOptionKeys(widget.options, ["show_unavailable_count", "highlight_metric"]) &&
        ["unrealized_profit_loss", "relative_return_rate"].includes(widget.options.highlight_metric)
      );
    case "position_table":
      return (
        hasOnlyOptionKeys(widget.options, ["columns", "sort", "limit"]) &&
        widget.options.columns.every((column) => positionTableColumns.includes(column)) &&
        positionTableColumns.includes(widget.options.sort.field) &&
        widget.options.columns.includes(widget.options.sort.field) &&
        ["asc", "desc"].includes(widget.options.sort.direction)
      );
    case "position_cards":
      return (
        hasOnlyOptionKeys(widget.options, ["primary_metric", "show_memo_badge", "filter_strength"]) &&
        ["unrealized_profit_loss", "relative_return_rate", "stock_return_rate"].includes(widget.options.primary_metric) &&
        ["STRONG", "WEAK", "ALL"].includes(widget.options.filter_strength)
      );
    case "relative_return_chart":
      return (
        hasOnlyOptionKeys(widget.options, ["chart_type", "limit", "baseline"]) &&
        ["bar", "ranked_bar"].includes(widget.options.chart_type) &&
        (widget.options.baseline === undefined || widget.options.baseline === "market_return_rate")
      );
    case "decision_timeline":
      return (
        hasOnlyOptionKeys(widget.options, ["stock_id", "trade_types", "show_profit_context"]) &&
        (widget.options.trade_types === undefined ||
          widget.options.trade_types.every((tradeType) => ["BUY", "SELL"].includes(tradeType)))
      );
    case "alert_status_list":
      return (
        hasOnlyOptionKeys(widget.options, ["status_filter", "group_by_stock"]) &&
        ["TRIGGERED", "NOT_TRIGGERED", "UNAVAILABLE", "ALL"].includes(widget.options.status_filter)
      );
  }
}

function hasOnlyOptionKeys(options: object, allowedKeys: string[]) {
  return Object.keys(options).every((key) => allowedKeys.includes(key));
}
