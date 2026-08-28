import type { CostBasisSource } from "../mockPortfolio";

const costBasisSourceLabels: Record<CostBasisSource, string> = {
  PROVIDER_REPORTED: "provider 제공 원가",
  TRADE_LEDGER_DERIVED: "거래 원장 계산 원가",
  UNKNOWN: "원가 근거 확인 필요",
};

export function formatCurrency(value: number | null) {
  if (value === null) return "계산 불가";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function hasAverageCost(quantity: number, averagePrice: number) {
  return quantity > 0 && averagePrice > 0;
}

export function formatAverageCost(quantity: number, averagePrice: number) {
  return hasAverageCost(quantity, averagePrice) ? formatCurrency(averagePrice) : "계산 불가";
}

export function formatPercent(value: number | null) {
  if (value === null) return "데이터 부족";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getTone(value: number | null) {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "positive" : "negative";
}

export function formatCostBasisSource(source: CostBasisSource) {
  return costBasisSourceLabels[source];
}
