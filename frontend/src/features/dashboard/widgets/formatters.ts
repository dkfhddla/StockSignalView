export function formatCurrency(value: number | null) {
  if (value === null) return "계산 불가";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number | null) {
  if (value === null) return "데이터 부족";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getTone(value: number | null) {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "positive" : "negative";
}
