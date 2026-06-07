import { DashboardSchema } from "./dashboardSchema";

export const portfolioOverviewPreset: DashboardSchema = {
  schema_version: "1.0",
  dashboard_id: "portfolio-overview",
  title: "시장 대비 보유 종목 점검",
  description: "보유 종목의 손익과 상대수익률을 함께 확인한다.",
  source: "PRESET",
  layout: {
    type: "responsive_grid",
    columns: {
      desktop: 12,
      mobile: 1,
    },
  },
  data_requirements: [
    {
      key: "positions",
      type: "portfolio_positions",
      filters: {
        holding_status: "HELD_OR_WATCHLISTED",
      },
    },
  ],
  widgets: [
    {
      widget_id: "portfolio-summary",
      type: "position_summary",
      title: "포트폴리오 요약",
      data_key: "positions",
      layout: {
        desktop_span: 12,
        mobile_order: 1,
      },
      options: {
        show_unavailable_count: true,
        highlight_metric: "relative_return_rate",
      },
    },
    {
      widget_id: "relative-return-table",
      type: "position_table",
      title: "상대수익률 순위",
      data_key: "positions",
      layout: {
        desktop_span: 12,
        mobile_order: 3,
      },
      options: {
        columns: [
          "stock_name",
          "market",
          "held_quantity",
          "average_cost",
          "market_value",
          "unrealized_profit_loss",
          "stock_return_rate",
          "market_return_rate",
          "relative_return_rate",
          "position_weight",
          "calculation_status",
        ],
        sort: {
          field: "relative_return_rate",
          direction: "desc",
        },
      },
    },
    {
      widget_id: "mobile-position-cards",
      type: "position_cards",
      title: "종목 카드",
      data_key: "positions",
      layout: {
        desktop_span: 12,
        mobile_order: 2,
      },
      options: {
        primary_metric: "relative_return_rate",
        show_memo_badge: true,
        filter_strength: "ALL",
      },
    },
  ],
};
