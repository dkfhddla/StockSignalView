import { Holding } from "../mockPortfolio";
import {
  formatAverageCost,
  formatCostBasisSource,
  formatCurrency,
  formatPercent,
  getTone,
  hasAverageCost,
} from "./formatters";
import { StatusBadge } from "./StatusBadge";

type PositionCardsOptions = {
  primary_metric: "unrealized_profit_loss" | "relative_return_rate" | "stock_return_rate";
  show_memo_badge: boolean;
  filter_strength: "STRONG" | "WEAK" | "ALL";
};

export function PositionCards({
  options,
  positions,
  title,
}: {
  options: PositionCardsOptions;
  positions: Holding[];
  title: string;
}) {
  const visiblePositions = positions.filter((holding) => matchesStrengthFilter(holding, options.filter_strength));
  const primaryMetric = getPrimaryMetric(options.primary_metric);

  return (
    <section className="mobile-cards" aria-label={title}>
      {visiblePositions.map((holding) => (
        <article className="holding-card" key={holding.id}>
          <div className="card-heading">
            <div>
              <strong>{holding.name}</strong>
              <span>
                {holding.code} · {holding.market}
              </span>
            </div>
            <StatusBadge holding={holding} />
          </div>
          <dl className="card-metrics">
            <div>
              <dt>{primaryMetric.label}</dt>
              <dd className={getTone(primaryMetric.value(holding))}>{primaryMetric.format(holding)}</dd>
            </div>
            <div>
              <dt>상대수익률</dt>
              <dd className={getTone(holding.relativeReturn)}>{formatPercent(holding.relativeReturn)}</dd>
            </div>
            <div className="card-average-cost">
              <dt>평균가</dt>
              <dd className="average-cost">
                <span className="average-cost-value">{formatAverageCost(holding.quantity, holding.averagePrice)}</span>
                {hasAverageCost(holding.quantity, holding.averagePrice) && holding.costBasisSource ? (
                  <span className="cost-basis-source">{formatCostBasisSource(holding.costBasisSource)}</span>
                ) : null}
              </dd>
            </div>
          </dl>
          {options.show_memo_badge && holding.memo ? <span className="memo-badge">메모 있음</span> : null}
          <p>{holding.memo}</p>
        </article>
      ))}
    </section>
  );
}

function matchesStrengthFilter(holding: Holding, filter: PositionCardsOptions["filter_strength"]) {
  if (filter === "ALL") return true;
  if (holding.relativeReturn === null) return false;
  return filter === "STRONG" ? holding.relativeReturn > 0 : holding.relativeReturn <= 0;
}

function getPrimaryMetric(metric: PositionCardsOptions["primary_metric"]) {
  switch (metric) {
    case "stock_return_rate":
      return {
        label: "종목 수익률",
        value: (holding: Holding) => holding.stockReturn,
        format: (holding: Holding) => formatPercent(holding.stockReturn),
      };
    case "relative_return_rate":
      return {
        label: "상대수익률",
        value: (holding: Holding) => holding.relativeReturn,
        format: (holding: Holding) => formatPercent(holding.relativeReturn),
      };
    default:
      return {
        label: "평가손익",
        value: (holding: Holding) => holding.unrealizedProfit,
        format: (holding: Holding) => formatCurrency(holding.unrealizedProfit),
      };
  }
}
