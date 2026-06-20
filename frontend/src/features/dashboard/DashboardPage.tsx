import { useEffect, useMemo, useState } from "react";
import { Holding, holdings } from "./mockPortfolio";
import { DashboardRenderer } from "./DashboardRenderer";
import { portfolioOverviewPreset } from "./presetDashboard";
import type { DashboardSchema } from "./dashboardSchema";
import { DashboardSchemaValidationError, fetchDefaultDashboard } from "../../lib/dashboardApi";

type FilterKey = "전체" | "보유" | "관심" | "강세" | "약세" | "알림 발생";

const matchesFilter = (holding: Holding, filter: FilterKey) => {
  switch (filter) {
    case "보유":
      return holding.quantity > 0;
    case "관심":
      return holding.favorite;
    case "강세":
      return holding.relativeReturn !== null && holding.relativeReturn > 0;
    case "약세":
      return holding.relativeReturn !== null && holding.relativeReturn <= 0;
    case "알림 발생":
      return holding.alertState !== "정상";
    default:
      return true;
  }
};

export function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("전체");
  const [schema, setSchema] = useState<DashboardSchema>(portfolioOverviewPreset);
  const [schemaSourceMessage, setSchemaSourceMessage] = useState("백엔드 대시보드 계약 확인 중");
  const [schemaLoadFailed, setSchemaLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchDefaultDashboard(controller.signal)
      .then((defaultDashboard) => {
        setSchema(defaultDashboard);
        setSchemaSourceMessage("백엔드 검증 Dashboard Schema");
        setSchemaLoadFailed(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof DashboardSchemaValidationError) {
          setSchemaLoadFailed(true);
          return;
        }
        setSchema(portfolioOverviewPreset);
        setSchemaSourceMessage("백엔드 미연결 · 로컬 프리셋 Dashboard Schema");
        setSchemaLoadFailed(false);
      });

    return () => controller.abort();
  }, []);

  const visibleHoldings = useMemo(() => {
    return holdings
      .filter((holding) => matchesFilter(holding, activeFilter))
      .sort((a, b) => (b.relativeReturn ?? -Infinity) - (a.relativeReturn ?? -Infinity));
  }, [activeFilter]);

  return (
    <main className="app-shell">
      {schemaLoadFailed ? (
        <section className="renderer-error">
          <strong>대시보드 스키마를 표시할 수 없습니다.</strong>
          <p>백엔드 기본 대시보드 응답이 프론트엔드 검증을 통과하지 못했습니다.</p>
        </section>
      ) : (
        <DashboardRenderer
          activeFilter={activeFilter}
          onFilterChange={(filter) => setActiveFilter(filter as FilterKey)}
          positions={visibleHoldings}
          schemaSourceMessage={schemaSourceMessage}
          summaryPositions={holdings}
          schema={schema}
        />
      )}
    </main>
  );
}
