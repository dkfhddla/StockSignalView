# StockSignalView

AI와 소통하며 주식 흐름을 본다.

## 프로젝트 목적

StockSignalView는 개인 투자자가 거래 기록, 투자 메모, 시장 대비 상대성과를 체계적으로 관리하기 위한 투자 운영 시스템이다.

핵심 관점은 단순 수익률이 아니라 다음 질문이다.

> 시장(KOSPI/KOSDAQ) 대비 내 보유 종목과 투자 판단이 얼마나 강한가?

## 핵심 컨셉

```text
거래 기록
-> 투자 메모
-> 시장 대비 성과 분석
-> 알림
-> 뉴스/공시/AI 기능 확장
-> 자동매매 준비
```

## 초기 MVP 범위

- 종목 관리
- 거래 기록 관리
- 포트폴리오 계산
- KOSPI/KOSDAQ 대비 상대수익률 계산
- 기본 대시보드
- 기본 알림 규칙

## 후속 확장 범위

- 뉴스 수집과 요약
- 공시 수집
- AI 기반 분석 요약
- 자연어 기반 동적 뷰
- 실시간 시세 처리
- 증권사 API 연동과 dry-run 주문

## 문서

- [저장소 지도](MAP.md)
- [제품 요구사항](docs/product-requirements/stock-signal-view.md)
- [MVP 기반 사양](docs/specs/mvp-foundation.md)
- [아키텍처 개요](docs/arch/overview.md)
- [ADR 0001: 초기 로컬 웹 아키텍처](docs/adr/0001-initial-local-web-architecture.md)

## 현재 상태

이 저장소는 아직 실행 가능한 앱을 포함하지 않는다. 현재 단계는 문서와 구현 하위 폴더 골격을 먼저 세우고, 이후 FastAPI 백엔드와 React/Vite 프론트엔드를 구현하는 것이다.
