import type { ReactNode } from "react";

import {
  DashboardDataRequirement,
  DashboardDataStatus,
  DashboardLookupResult,
  DashboardLookupStatus,
  DashboardLookupType,
  DashboardSnapshotRole,
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
  const requirements = getWidgetDataRequirements(widget, dataRequirements);
  const metadataPanel = (
    <ProviderMetadataPanel
      requirements={requirements}
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

  const resolvedPositions = resolvePositionAvailability(positions, requirements);
  if (resolvedPositions.unavailable) {
    return (
      <WidgetFrame metadataPanel={metadataPanel} visibility={getWidgetVisibility(widget.type)}>
        <ProviderDataUnavailable title={widget.title} />
      </WidgetFrame>
    );
  }

  switch (widget.type) {
    case "position_summary":
      return (
        <WidgetFrame metadataPanel={metadataPanel}>
          <PositionSummary options={widget.options} positions={resolvedPositions.positions} title={widget.title} />
        </WidgetFrame>
      );
    case "position_table":
      return (
        <WidgetFrame metadataPanel={metadataPanel} visibility={getWidgetVisibility(widget.type)}>
          <PositionTable options={widget.options} positions={resolvedPositions.positions} title={widget.title} />
        </WidgetFrame>
      );
    case "position_cards":
      return (
        <WidgetFrame metadataPanel={metadataPanel} visibility={getWidgetVisibility(widget.type)}>
          <PositionCards options={widget.options} positions={resolvedPositions.positions} title={widget.title} />
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

function getWidgetVisibility(widgetType: DashboardWidget["type"]) {
  if (widgetType === "position_table") return "desktop-only";
  if (widgetType === "position_cards") return "mobile-only";
  return undefined;
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
      ? [{ dataKey: requirement.key, dataType: requirement.type, metadata: requirement.provider_metadata }]
      : [],
  );

  if (entries.length === 0) return null;

  return (
    <aside className="provider-metadata" aria-label={`${title} 데이터 출처`}>
      {entries.map(({ dataKey, dataType, metadata }) => (
        <ProviderMetadataEntry
          dataKey={dataKey}
          dataType={dataType}
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
  dataType,
  metadata,
  showDataKey,
}: {
  dataKey: string;
  dataType: DashboardDataRequirement["type"];
  metadata: DashboardProviderMetadata;
  showDataKey: boolean;
}) {
  const { attribution, status } = metadata;
  const capturedAtLabel = dataType === "portfolio_positions" ? "보유 현황 기준" : "값 기준";

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
            <dt>{capturedAtLabel}</dt>
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
      {status.data_status || status.lookup_results ? (
        <div className="provider-statuses" aria-label="데이터 상태">
          {status.data_status ? <DataStatusBadge status={status.data_status} /> : null}
          {status.lookup_results?.map((result) => (
            <LookupResultBadge
              key={`${result.lookup_type}:${result.target_key}:${result.snapshot_role ?? ""}`}
              result={result}
            />
          ))}
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

const lookupTypeLabels: Record<DashboardLookupType, string> = {
  HOLDINGS: "보유 조회",
  PRICE: "가격 조회",
  MARKET_INDEX: "시장 지수 조회",
};

const snapshotRoleLabels: Record<DashboardSnapshotRole, string> = {
  CURRENT: "현재값",
  DAY_BASELINE: "당일 기준",
  HOLDING_PERIOD_BASELINE: "보유기간 기준",
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

function LookupResultBadge({ result }: { result: DashboardLookupResult }) {
  const targetLabel = result.target_label
    ? `${lookupTypeLabels[result.lookup_type]} · ${result.target_label}`
    : lookupTypeLabels[result.lookup_type];
  const displayLabel = result.snapshot_role
    ? `${targetLabel} · ${snapshotRoleLabels[result.snapshot_role]}`
    : targetLabel;

  return (
    <span className="provider-lookup-result">
      <span className="provider-lookup-target">{displayLabel}</span>
      <LookupStatusBadge status={result.lookup_status} />
    </span>
  );
}

const unavailableLookupStatuses: DashboardLookupStatus[] = [
  "UNAVAILABLE",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "PROVIDER_ERROR",
  "UNSUPPORTED",
];

function resolvePositionAvailability(
  positions: Holding[],
  requirements: DashboardDataRequirement[],
) {
  const lookupEntries = requirements.flatMap((requirement) => {
    const metadata = requirement.provider_metadata;
    return metadata
      ? (metadata.status.lookup_results ?? []).map((result) => ({
          dataStatus: metadata.status.data_status,
          result,
        }))
      : [];
  });
  const holdingsEntries = lookupEntries.filter(({ result }) => result.lookup_type === "HOLDINGS");
  const unavailableHoldingsEntries = holdingsEntries.filter(({ result }) =>
    unavailableLookupStatuses.includes(result.lookup_status),
  );
  if (holdingsEntries.length > 0 && holdingsEntries.length === unavailableHoldingsEntries.length) {
    return { unavailable: true, positions: [] };
  }

  const unavailableAccountKeys = new Set(
    unavailableHoldingsEntries.map(({ result }) => result.target_key),
  );
  const availableAccountKeys = new Set(
    holdingsEntries
      .filter(({ result }) => result.lookup_status === "AVAILABLE")
      .map(({ result }) => result.target_key),
  );
  const availablePositions =
    unavailableAccountKeys.size === 0
      ? positions
      : positions.filter(
          (holding) =>
            holding.providerAccountKey !== undefined && availableAccountKeys.has(holding.providerAccountKey),
        );
  if (positions.length > 0 && availablePositions.length === 0) {
    return { unavailable: true, positions: [] };
  }

  const resolvedPositions = lookupEntries.reduce(
    (resolvedPositions, { dataStatus, result }) => {
      const snapshotUnavailable =
        unavailableLookupStatuses.includes(result.lookup_status) || dataStatus === "UNAVAILABLE";
      if (!snapshotUnavailable) return resolvedPositions;

      if (result.lookup_type === "PRICE") {
        return resolvedPositions.map((holding) =>
          holding.id === result.target_key ? toUnavailablePricePosition(holding, result.snapshot_role) : holding,
        );
      }
      if (result.lookup_type === "MARKET_INDEX") {
        return resolvedPositions.map((holding) =>
          holding.market === result.target_key ? toUnavailableMarketPosition(holding) : holding,
        );
      }
      return resolvedPositions;
    },
    availablePositions,
  );

  return { unavailable: false, positions: resolvedPositions };
}

function toUnavailablePricePosition(holding: Holding, snapshotRole: DashboardSnapshotRole | undefined): Holding {
  if (snapshotRole === "HOLDING_PERIOD_BASELINE") {
    return {
      ...holding,
      stockReturn: null,
      relativeReturn: null,
      alertState: "데이터 부족",
    };
  }
  if (snapshotRole !== "CURRENT") return holding;
  return {
    ...holding,
    currentPrice: null,
    valuation: null,
    unrealizedProfit: null,
    stockReturn: null,
    relativeReturn: null,
    weight: null,
    alertState: "데이터 부족",
  };
}

function toUnavailableMarketPosition(holding: Holding): Holding {
  return {
    ...holding,
    marketReturn: null,
    relativeReturn: null,
    alertState: "데이터 부족",
  };
}

function ProviderDataUnavailable({ title }: { title: string }) {
  return (
    <section className="widget-placeholder" aria-label={title}>
      <h2 className="widget-title">{title}</h2>
      <p>보유 데이터를 표시할 수 없습니다.</p>
    </section>
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
