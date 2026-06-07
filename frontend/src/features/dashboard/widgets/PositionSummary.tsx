import { Holding } from "../mockPortfolio";
import { formatCurrency, formatPercent, getTone } from "./formatters";

type PositionSummaryOptions = {
  show_unavailable_count: boolean;
  highlight_metric: "unrealized_profit_loss" | "relative_return_rate";
};

export function PositionSummary({
  options,
  positions,
  title,
}: {
  options: PositionSummaryOptions;
  positions: Holding[];
  title: string;
}) {
  const owned = positions.filter((holding) => holding.quantity > 0);
  const totalValuation = owned.reduce((sum, holding) => sum + (holding.valuation ?? 0), 0);
  const totalUnrealized = owned.reduce((sum, holding) => sum + (holding.unrealizedProfit ?? 0), 0);
  const totalRealized = positions.reduce((sum, holding) => sum + holding.realizedProfit, 0);
  const weightedRelative = owned.reduce((sum, holding) => {
    if (holding.relativeReturn === null || holding.weight === null) return sum;
    return sum + holding.relativeReturn * (holding.weight / 100);
  }, 0);
  const unavailableCount = positions.filter((holding) => holding.alertState === "데이터 부족").length;
  const highlightProfit = options.highlight_metric === "unrealized_profit_loss";
  const highlightRelative = options.highlight_metric === "relative_return_rate";

  return (
    <section aria-label={title}>
      <h2 className="widget-title">{title}</h2>
      <div className="summary-grid">
      <SummaryTile label="총 평가금액" value={formatCurrency(totalValuation)} />
      <SummaryTile
        highlighted={highlightProfit}
        label="총 평가손익"
        value={formatCurrency(totalUnrealized)}
        tone={getTone(totalUnrealized)}
      />
      <SummaryTile label="실현손익" value={formatCurrency(totalRealized)} tone={getTone(totalRealized)} />
      <SummaryTile
        highlighted={highlightRelative}
        label="평균 상대수익률"
        value={formatPercent(weightedRelative)}
        tone={getTone(weightedRelative)}
      />
      {options.show_unavailable_count ? (
        <SummaryTile label="계산 불가 종목" value={`${unavailableCount.toLocaleString("ko-KR")}개`} />
      ) : null}
      </div>
    </section>
  );
}

function SummaryTile({
  highlighted = false,
  label,
  value,
  tone = "neutral",
}: {
  highlighted?: boolean;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <article className={highlighted ? "summary-tile highlighted" : "summary-tile"}>
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </article>
  );
}
