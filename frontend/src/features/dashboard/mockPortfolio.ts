export type Market = "KOSPI" | "KOSDAQ";
export type AlertState = "정상" | "알림" | "데이터 부족";
export type CostBasisSource = "PROVIDER_REPORTED" | "TRADE_LEDGER_DERIVED" | "UNKNOWN";

export type Holding = {
  id: string;
  providerAccountKey?: string;
  name: string;
  code: string;
  market: Market;
  quantity: number;
  averagePrice: number;
  costBasisSource?: CostBasisSource;
  currentPrice: number | null;
  valuation: number | null;
  unrealizedProfit: number | null;
  realizedProfit: number;
  stockReturn: number | null;
  marketReturn: number | null;
  relativeReturn: number | null;
  weight: number | null;
  favorite: boolean;
  memo: string;
  alertState: AlertState;
  dataSource: "모의 데이터" | "수동 입력";
};

export const holdings: Holding[] = [
  {
    id: "005930",
    name: "삼성전자",
    code: "005930",
    market: "KOSPI",
    quantity: 12,
    averagePrice: 73500,
    currentPrice: 78100,
    valuation: 937200,
    unrealizedProfit: 55200,
    realizedProfit: 0,
    stockReturn: 6.26,
    marketReturn: 1.84,
    relativeReturn: 4.42,
    weight: 38.6,
    favorite: true,
    memo: "반도체 업황 회복 확인 후 추가 매수 검토",
    alertState: "정상",
    dataSource: "모의 데이터",
  },
  {
    id: "035720",
    name: "카카오",
    code: "035720",
    market: "KOSPI",
    quantity: 18,
    averagePrice: 48700,
    currentPrice: 45200,
    valuation: 813600,
    unrealizedProfit: -63000,
    realizedProfit: 12500,
    stockReturn: -7.19,
    marketReturn: 1.84,
    relativeReturn: -9.03,
    weight: 33.5,
    favorite: false,
    memo: "플랫폼 비용 구조 개선 여부 확인 필요",
    alertState: "알림",
    dataSource: "수동 입력",
  },
  {
    id: "247540",
    name: "에코프로비엠",
    code: "247540",
    market: "KOSDAQ",
    quantity: 5,
    averagePrice: 168000,
    currentPrice: 136400,
    valuation: 682000,
    unrealizedProfit: -158000,
    realizedProfit: 0,
    stockReturn: -18.81,
    marketReturn: -3.12,
    relativeReturn: -15.69,
    weight: 28.1,
    favorite: true,
    memo: "손절 기준 근접, 수급 반전 전까지 관망",
    alertState: "알림",
    dataSource: "모의 데이터",
  },
  {
    id: "000660",
    name: "SK하이닉스",
    code: "000660",
    market: "KOSPI",
    quantity: 0,
    averagePrice: 0,
    currentPrice: null,
    valuation: null,
    unrealizedProfit: null,
    realizedProfit: 93000,
    stockReturn: null,
    marketReturn: 1.84,
    relativeReturn: null,
    weight: null,
    favorite: true,
    memo: "관심 유지, 기준가 데이터 입력 필요",
    alertState: "데이터 부족",
    dataSource: "수동 입력",
  },
];
