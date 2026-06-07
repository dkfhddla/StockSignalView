import { DashboardSchema, DashboardWidget, validateDashboardSchema } from "./dashboardSchema";
import { Holding } from "./mockPortfolio";
import { PositionCards } from "./widgets/PositionCards";
import { PositionSummary } from "./widgets/PositionSummary";
import { PositionTable } from "./widgets/PositionTable";

type DashboardRendererProps = {
  schema: DashboardSchema;
  positions: Holding[];
  summaryPositions: Holding[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

const filters = ["전체", "보유", "관심", "강세", "약세", "알림 발생"];

export function DashboardRenderer({
  schema,
  positions,
  summaryPositions,
  activeFilter,
  onFilterChange,
}: DashboardRendererProps) {
  const status = validateDashboardSchema(schema);

  if (status === "INVALID_SCHEMA") {
    return (
      <section className="renderer-error">
        <strong>대시보드 스키마를 표시할 수 없습니다.</strong>
        <p>지원하지 않는 위젯 또는 데이터 연결이 포함되어 있습니다.</p>
      </section>
    );
  }

  return (
    <>
      <header className="top-bar">
        <div>
          <p className="eyebrow">StockSignalView · {schema.source}</p>
          <h1>{schema.title}</h1>
          {schema.description ? <p className="page-description">{schema.description}</p> : null}
        </div>
        <button className="primary-action" type="button">거래 추가</button>
      </header>

      <section className="toolbar" aria-label="대시보드 필터">
        <div className="filter-group">
          {filters.map((filter) => (
            <button
              className={filter === activeFilter ? "filter-button active" : "filter-button"}
              key={filter}
              onClick={() => onFilterChange(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
        <span className="data-note">마지막 갱신: 2026-06-08 00:00 · 수동/모의 데이터</span>
      </section>

      {schema.widgets.map((widget) => (
        <WidgetRenderer
          key={widget.widget_id}
          positions={widget.type === "position_summary" ? summaryPositions : positions}
          widget={widget}
        />
      ))}
    </>
  );
}

function WidgetRenderer({ widget, positions }: { widget: DashboardWidget; positions: Holding[] }) {
  switch (widget.type) {
    case "position_summary":
      return <PositionSummary options={widget.options} positions={positions} title={widget.title} />;
    case "position_table":
      return <PositionTable options={widget.options} positions={positions} title={widget.title} />;
    case "position_cards":
      return <PositionCards options={widget.options} positions={positions} title={widget.title} />;
  }
}
