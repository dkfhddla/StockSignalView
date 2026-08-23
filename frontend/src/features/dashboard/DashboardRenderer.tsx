import type { ReactNode } from "react";

import {
  DashboardDataRequirement,
  DashboardDataStatus,
  DashboardLookupStatus,
  DashboardProviderMetadata,
  DashboardProviderSource,
  DashboardSchema,
  DashboardWidget,
  isImplementedWidgetType,
  validateDashboardSchema,
  WidgetType,
} from "./dashboardSchema";
import { Holding } from "./mockPortfolio";
import { PositionCards } from "./widgets/PositionCards";
import { PositionSummary } from "./widgets/PositionSummary";
import { PositionTable } from "./widgets/PositionTable";

type DashboardRendererProps = {
  schema: DashboardSchema;
  positions: Holding[];
  schemaSourceMessage: string;
  summaryPositions: Holding[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

const filters = ["전체", "보유", "관심", "강세", "약세", "알림 발생"];

export function DashboardRenderer({
  schema,
  positions,
  schemaSourceMessage,
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

  const dataRequirements = new Map(
    schema.data_requirements.map((requirement) => [requirement.key, requirement]),
  );

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
        <span className="data-note">{schemaSourceMessage} · 샘플 포지션 데이터</span>
      </section>

      {schema.widgets.map((widget) => (
        <WidgetRenderer
          dataRequirements={dataRequirements}
          key={widget.widget_id}
          positions={widget.type === "position_summary" ? summaryPositions : positions}
          widget={widget}
        />
      ))}
    </>
  );
}

function WidgetRenderer({
  dataRequirements,
  widget,
  positions,
}: {
  dataRequirements: Map<string, DashboardDataRequirement>;
  widget: DashboardWidget;
  positions: Holding[];
}) {
  const metadataPanel = (
    <ProviderMetadataPanel
      requirements={getWidgetDataRequirements(widget, dataRequirements)}
      title={widget.title}
    />
  );

  if (!isImplementedWidgetType(widget.type)) {
    return (
      <WidgetFrame metadataPanel={metadataPanel}>
        <RegisteredWidgetPlaceholder title={widget.title} type={widget.type} />
      </WidgetFrame>
    );
  }

  switch (widget.type) {
    case "position_summary":
      return (
        <WidgetFrame metadataPanel={metadataPanel}>
          <PositionSummary options={widget.options} positions={positions} title={widget.title} />
        </WidgetFrame>
      );
    case "position_table":
      return (
        <WidgetFrame metadataPanel={metadataPanel} visibility="desktop-only">
          <PositionTable options={widget.options} positions={positions} title={widget.title} />
        </WidgetFrame>
      );
    case "position_cards":
      return (
        <WidgetFrame metadataPanel={metadataPanel} visibility="mobile-only">
          <PositionCards options={widget.options} positions={positions} title={widget.title} />
        </WidgetFrame>
      );
  }
}

function WidgetFrame({
  children,
  metadataPanel,
  visibility,
}: {
  children: ReactNode;
  metadataPanel: ReactNode;
  visibility?: "desktop-only" | "mobile-only";
}) {
  const className = visibility ? `dashboard-widget ${visibility}` : "dashboard-widget";

  return (
    <div className={className}>
      {metadataPanel}
      {children}
    </div>
  );
}

function getWidgetDataRequirements(
  widget: DashboardWidget,
  dataRequirements: Map<string, DashboardDataRequirement>,
) {
  const dataKeys = widget.type === "alert_status_list" ? widget.data_keys : [widget.data_key];

  return dataKeys
    .map((dataKey) => dataRequirements.get(dataKey))
    .filter((requirement): requirement is DashboardDataRequirement => requirement !== undefined);
}

function ProviderMetadataPanel({
  requirements,
  title,
}: {
  requirements: DashboardDataRequirement[];
  title: string;
}) {
  const entries = requirements.flatMap((requirement) =>
    requirement.provider_metadata
      ? [{ dataKey: requirement.key, metadata: requirement.provider_metadata }]
      : [],
  );

  if (entries.length === 0) return null;

  return (
    <aside className="provider-metadata" aria-label={`${title} 데이터 출처`}>
      {entries.map(({ dataKey, metadata }) => (
        <ProviderMetadataEntry
          dataKey={dataKey}
          key={dataKey}
          metadata={metadata}
          showDataKey={entries.length > 1}
        />
      ))}
    </aside>
  );
}

function ProviderMetadataEntry({
  dataKey,
  metadata,
  showDataKey,
}: {
  dataKey: string;
  metadata: DashboardProviderMetadata;
  showDataKey: boolean;
}) {
  const { attribution, status } = metadata;

  return (
    <div className="provider-metadata-entry">
      <div className="provider-identity">
        {showDataKey ? <span className="provider-data-key">{dataKey}</span> : null}
        <strong>{attribution.provider}</strong>
        <span>{providerSourceLabels[attribution.source]}</span>
      </div>
      <dl className="provider-timestamps">
        {attribution.captured_at ? (
          <div>
            <dt>값 기준</dt>
            <dd>
              <time dateTime={attribution.captured_at}>{formatProviderTimestamp(attribution.captured_at)}</time>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>마지막 갱신</dt>
          <dd>
            <time dateTime={attribution.refreshed_at}>{formatProviderTimestamp(attribution.refreshed_at)}</time>
          </dd>
        </div>
      </dl>
      {status.data_status || status.lookup_status ? (
        <div className="provider-statuses" aria-label="데이터 상태">
          {status.data_status ? <DataStatusBadge status={status.data_status} /> : null}
          {status.lookup_status ? <LookupStatusBadge status={status.lookup_status} /> : null}
        </div>
      ) : null}
    </div>
  );
}

const providerSourceLabels: Record<DashboardProviderSource, string> = {
  MANUAL: "수동 입력",
  BROKER_API: "증권사 API",
  MARKET_API: "시장 데이터 API",
  IMPORT: "가져온 데이터",
  MOCK: "모의 데이터",
};

const dataStatusLabels: Record<DashboardDataStatus, string> = {
  AVAILABLE: "값 최신",
  STALE: "값 갱신 지연",
  UNAVAILABLE: "데이터 부족",
};

const lookupStatusLabels: Record<DashboardLookupStatus, string> = {
  AVAILABLE: "조회 정상",
  PARTIAL: "일부 데이터",
  STALE: "조회 지연",
  UNAVAILABLE: "조회 결과 없음",
  UNAUTHORIZED: "인증 실패",
  FORBIDDEN: "권한 없음",
  PROVIDER_ERROR: "provider 오류",
  UNSUPPORTED: "provider 미지원",
};

function DataStatusBadge({ status }: { status: DashboardDataStatus }) {
  const tone = status === "AVAILABLE" ? "normal" : status === "STALE" ? "warning" : "error";

  return (
    <span className={`provider-status-badge ${tone}`} title={`data_status: ${status}`}>
      {dataStatusLabels[status]}
    </span>
  );
}

function LookupStatusBadge({ status }: { status: DashboardLookupStatus }) {
  const tone = status === "AVAILABLE" ? "normal" : ["PARTIAL", "STALE"].includes(status) ? "warning" : "error";

  return (
    <span className={`provider-status-badge ${tone}`} title={`lookup_status: ${status}`}>
      {lookupStatusLabels[status]}
    </span>
  );
}

const providerTimestampFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatProviderTimestamp(timestamp: string) {
  return providerTimestampFormatter.format(new Date(timestamp));
}

function RegisteredWidgetPlaceholder({ title, type }: { title: string; type: WidgetType }) {
  return (
    <section className="widget-placeholder" aria-label={title}>
      <h2 className="widget-title">{title}</h2>
      <p>
        <code>{type}</code> 위젯은 Dashboard Schema v1에 등록되어 있지만 이 MVP 화면 조각에서는 아직 시각
        렌더링을 제공하지 않습니다.
      </p>
    </section>
  );
}
