import { Holding } from "../mockPortfolio";

export function StatusBadge({ holding }: { holding: Holding }) {
  const className = holding.alertState === "정상" ? "status-badge" : "status-badge warning";

  return (
    <span className={className}>
      {holding.alertState}
      {holding.dataSource === "모의 데이터" ? " · 모의" : ""}
    </span>
  );
}
