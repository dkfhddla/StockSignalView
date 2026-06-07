# StockSignalView

AI와 소통하며 주식 흐름을 본다.

## 프로젝트 목적

StockSignalView는 거래 기록과 투자 메모, 시장 대비 상대성과 데이터를 기반으로 AI가 동적 투자 대시보드를 생성하는 투자 운영 시스템이다.

핵심 관점은 단순 수익률이 아니라 다음 질문이다.

> 시장(KOSPI/KOSDAQ) 대비 내 보유 종목과 투자 판단이 얼마나 강한가?

그리고 사용자는 이 질문을 고정 화면에서만 확인하지 않는다. 자연어로 묻고, 시스템은 검증 가능한 Dashboard Schema JSON을 생성하며, 프론트엔드는 허용된 위젯 렌더러로만 화면을 구성한다.

## 핵심 컨셉

```text
거래 기록
-> 투자 메모
-> 시장 대비 성과 분석
-> AI 질문
-> Dashboard Schema
-> 동적 투자 대시보드
-> 알림/뉴스/공시 확장
-> 자동매매 준비
```

## 초기 MVP 범위

- 종목 관리
- 거래 기록 관리
- 포트폴리오 계산
- KOSPI/KOSDAQ 대비 상대수익률 계산
- Dashboard Schema v1
- 기본 위젯 레지스트리
- 동적 대시보드 렌더러
- AI 대시보드 플래너의 검증 가능한 출력 계약
- 기본 알림 규칙

## 후속 확장 범위

- 뉴스 수집과 요약
- 공시 수집
- AI 기반 분석 요약 고도화
- 모바일/웹 AI 워크스페이스
- 실시간 시세 처리
- 증권사 API 연동과 dry-run 주문

## 문서

- [저장소 지도](MAP.md)
- [에이전트 시작점](AGENTS.md)
- [문서 표준](docs/guidelines/documentation-standard.md)
- [제품 요구사항](docs/product-requirements/stock-signal-view.md)
- [MVP 기반 사양](docs/specs/mvp-foundation.md)
- [Dashboard Schema v1](docs/dashboard-schema-v1.md)
- [위젯 레지스트리](docs/widget-registry.md)
- [AI 대시보드 플래너](docs/ai-dashboard-planner.md)
- [동적 뷰 렌더러](docs/dynamic-view-renderer.md)
- [아키텍처 개요](docs/arch/overview.md)
- [ADR 0001: 초기 로컬 웹 아키텍처](docs/adr/0001-initial-local-web-architecture.md)

## 현재 상태

이 저장소는 아직 실행 가능한 앱을 포함하지 않는다. 현재 단계는 AI 동적 대시보드 중심의 문서 계약과 구현 하위 폴더 골격을 먼저 세우고, 이후 FastAPI 백엔드와 React/Vite 프론트엔드를 구현하는 것이다.
