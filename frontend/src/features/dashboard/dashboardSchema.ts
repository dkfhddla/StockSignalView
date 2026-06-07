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

export type DashboardWidget =
  | {
      widget_id: string;
      type: "position_summary";
      title: string;
      data_key: string;
      layout: WidgetLayout;
      options: {
        show_unavailable_count: boolean;
        highlight_metric: "unrealized_profit_loss" | "relative_return_rate";
      };
    }
  | {
      widget_id: string;
      type: "position_table";
      title: string;
      data_key: string;
      layout: WidgetLayout;
      options: {
        columns: PositionTableColumn[];
        sort: {
          field: PositionTableColumn;
          direction: "asc" | "desc";
        };
        limit?: number;
      };
    }
  | {
      widget_id: string;
      type: "position_cards";
      title: string;
      data_key: string;
      layout: WidgetLayout;
      options: {
        primary_metric: "unrealized_profit_loss" | "relative_return_rate" | "stock_return_rate";
        show_memo_badge: boolean;
        filter_strength: "STRONG" | "WEAK" | "ALL";
      };
    };

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

const implementedWidgets: ImplementedWidgetType[] = ["position_summary", "position_table", "position_cards"];
const portfolioPositionWidgets: ImplementedWidgetType[] = ["position_summary", "position_table", "position_cards"];

export function validateDashboardSchema(schema: DashboardSchema): RendererStatus {
  if (schema.schema_version !== "1.0") return "INVALID_SCHEMA";

  const dataRequirements = new Map(
    schema.data_requirements.map((requirement) => [requirement.key, requirement.type]),
  );
  const hasInvalidWidget = schema.widgets.some((widget) => {
    if (!implementedWidgets.includes(widget.type)) return true;

    const dataType = dataRequirements.get(widget.data_key);
    if (!dataType) return true;
    if (portfolioPositionWidgets.includes(widget.type) && dataType !== "portfolio_positions") return true;

    if (widget.type === "position_table") {
      return !widget.options.columns.includes(widget.options.sort.field);
    }

    return false;
  });

  return hasInvalidWidget ? "INVALID_SCHEMA" : "READY";
}
