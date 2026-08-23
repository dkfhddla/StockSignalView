import { Holding } from "../mockPortfolio";
import { PositionTableColumn } from "../dashboardSchema";
import { formatCostBasisSource, formatCurrency, formatPercent, getTone } from "./formatters";
import { StatusBadge } from "./StatusBadge";

type PositionTableOptions = {
  columns: PositionTableColumn[];
  sort: {
    field: PositionTableColumn;
    direction: "asc" | "desc";
  };
  limit?: number;
};

type ColumnDefinition = {
  key: PositionTableColumn;
  header: string;
  numeric?: boolean;
  render: (holding: Holding) => React.ReactNode;
  sortValue: (holding: Holding) => number | string | null;
};

const columns: ColumnDefinition[] = [
  {
    key: "stock_name",
    header: "종목",
    render: (holding) => (
      <>
        <strong>{holding.name}</strong>
        <span>{holding.code}</span>
      </>
    ),
    sortValue: (holding) => holding.name,
  },
  { key: "market", header: "시장", render: (holding) => holding.market, sortValue: (holding) => holding.market },
  {
    key: "held_quantity",
    header: "수량",
    numeric: true,
    render: (holding) => holding.quantity.toLocaleString("ko-KR"),
    sortValue: (holding) => holding.quantity,
  },
  {
    key: "average_cost",
    header: "평균가",
    numeric: true,
    render: (holding) => (
      <span className="average-cost">
        <span className="average-cost-value">{formatCurrency(holding.averagePrice)}</span>
        {holding.costBasisSource ? (
          <span className="cost-basis-source">{formatCostBasisSource(holding.costBasisSource)}</span>
        ) : null}
      </span>
    ),
    sortValue: (holding) => holding.averagePrice,
  },
  {
    key: "market_value",
    header: "평가금액",
    numeric: true,
    render: (holding) => formatCurrency(holding.valuation),
    sortValue: (holding) => holding.valuation,
  },
  {
    key: "unrealized_profit_loss",
    header: "평가손익",
    numeric: true,
    render: (holding) => (
      <span className={getTone(holding.unrealizedProfit)}>{formatCurrency(holding.unrealizedProfit)}</span>
    ),
    sortValue: (holding) => holding.unrealizedProfit,
  },
  {
    key: "realized_profit_loss",
    header: "실현손익",
    numeric: true,
    render: (holding) => <span className={getTone(holding.realizedProfit)}>{formatCurrency(holding.realizedProfit)}</span>,
    sortValue: (holding) => holding.realizedProfit,
  },
  {
    key: "position_weight",
    header: "비중",
    numeric: true,
    render: (holding) => (holding.weight === null ? "-" : `${holding.weight.toFixed(1)}%`),
    sortValue: (holding) => holding.weight,
  },
  {
    key: "stock_return_rate",
    header: "종목 수익률",
    numeric: true,
    render: (holding) => <span className={getTone(holding.stockReturn)}>{formatPercent(holding.stockReturn)}</span>,
    sortValue: (holding) => holding.stockReturn,
  },
  {
    key: "market_return_rate",
    header: "시장 수익률",
    numeric: true,
    render: (holding) => <span className={getTone(holding.marketReturn)}>{formatPercent(holding.marketReturn)}</span>,
    sortValue: (holding) => holding.marketReturn,
  },
  {
    key: "relative_return_rate",
    header: "상대수익률",
    numeric: true,
    render: (holding) => (
      <span className={`emphasis ${getTone(holding.relativeReturn)}`}>{formatPercent(holding.relativeReturn)}</span>
    ),
    sortValue: (holding) => holding.relativeReturn,
  },
  {
    key: "strength_status",
    header: "강약",
    render: (holding) => {
      if (holding.relativeReturn === null) return "미산출";
      return holding.relativeReturn > 0 ? "강세" : "약세";
    },
    sortValue: (holding) => holding.relativeReturn,
  },
  {
    key: "calculation_status",
    header: "상태",
    render: (holding) => <StatusBadge holding={holding} />,
    sortValue: (holding) => holding.alertState,
  },
];

export function PositionTable({
  options,
  positions,
  title,
}: {
  options: PositionTableOptions;
  positions: Holding[];
  title: string;
}) {
  const selectedColumns = options.columns
    .map((columnKey) => columns.find((column) => column.key === columnKey))
    .filter((column): column is ColumnDefinition => Boolean(column));
  const sortColumn = columns.find((column) => column.key === options.sort.field);
  const sortedPositions = [...positions]
    .sort((a, b) => compareValues(sortColumn?.sortValue(a), sortColumn?.sortValue(b), options.sort.direction))
    .slice(0, options.limit ?? positions.length);

  return (
    <section className="desktop-table" aria-label="보유 종목 표">
      <h2 className="widget-title">{title}</h2>
      <table>
        <thead>
          <tr>
            {selectedColumns.map((column) => (
              <th className={column.numeric ? "numeric" : undefined} key={column.key}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map((holding) => (
            <tr key={holding.id}>
              {selectedColumns.map((column) => (
                <td className={column.numeric ? "numeric" : undefined} key={column.key}>
                  {column.render(holding)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function compareValues(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
  direction: "asc" | "desc",
) {
  if (left === null || left === undefined) return 1;
  if (right === null || right === undefined) return -1;

  const order = left > right ? 1 : left < right ? -1 : 0;
  return direction === "asc" ? order : -order;
}
