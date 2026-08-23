# 기여 규칙

이 문서는 에이전트가 따라야 하는 커밋, Merge Request, 브랜치 작성 규칙의 단일
기준이다.

## 커밋 및 Merge Request 규칙

커밋은 Conventional Commit 형식을 사용합니다.

- 형식: `<type>(<scope>): <description>`
- 제목은 50자 이내, 명령형, 첫 글자 대문자, 마침표 없이 작성합니다.
- 단순하지 않은 변경은 빈 줄 뒤 본문으로 배경과 이유를 설명하고, 본문은 72자에서 줄바꿈합니다.
- 독립적인 변경은 별도 커밋으로 분리합니다.
- 타입은 `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `chore`, `revert` 중에서 선택합니다.
- 스코프는 가능하면 영향 범위를 드러내도록 지정합니다. 예: `camera`,
  `sequencer`, `timeline`, `remote`, `ui`, `build`.

Merge Request 제목은 변경 목적이 드러나도록 `type: description` 형식으로
작성합니다. 본문은 모든 줄을 100자 이내로 유지하고, 다음 구조를 사용합니다.

```md
## Summary
변경 내용과 목적을 1~2문장으로 요약

## Problem
문제, 재현 조건, 사용자·기술적 영향, 관련 이슈

## Solution
해결 접근, 핵심 결정, 대안과 선택 이유

## Changes Made
파일 경로와 줄 번호를 포함한 주요 변경 이유

## Additional Notes
호환성 파괴 여부, 성능 영향, 문서 변경, 리뷰 중점 영역
```

MR을 만들기 전에 관련 빌드와 테스트를 실행하고, 실제 결과를 MR 설명에
기록합니다. 호환성 파괴, 알려진 한계, 성능 영향과 리뷰가 필요한 복잡한
영역은 반드시 명시합니다.

### MR 이슈 연계

MR은 관련 이슈를 반드시 연결합니다.

- `## Problem` 마지막에 관련 GitHub 이슈를 `Related: #123` 형식으로 기록합니다.
  다른 저장소의 이슈는 `Related: owner/repository#123` 형식을 사용합니다.
- MR 병합으로 이슈의 모든 완료 조건이 충족될 때만 `Closes #123`을 사용합니다.
  다른 저장소의 이슈는 `Closes owner/repository#123` 형식을 사용합니다. 일부만
  해결하면 `Related:`를 사용하고 남은 작업을 명시합니다.
- 이슈의 완료 조건 또는 수용 기준을 `## Changes Made`와 테스트 결과에
  대응시켜, 각 요구사항의 구현·검증 근거를 추적 가능하게 작성합니다.
- 이슈가 없거나 새 이슈가 필요한 후속 작업을 발견하면, MR에 그 사유와
  후속 이슈 ID 또는 생성 필요 여부를 기록합니다.

## 브랜치 명명 규칙

브랜치는 Conventional Branch Naming을 사용하며, 소문자 kebab-case로 작성합니다.

- 형식: `<type>/<issue-id>-<short-description>`
- 이슈가 없을 때: `<type>/<short-description>`
- `<short-description>`은 작업 목적을 3~6개 단어로 간결하게 표현합니다.
- 공백, 밑줄, 대문자, 특수문자, 모호한 이름(`update`, `misc`, `test`)은 사용하지
  않습니다.
- 하나의 브랜치에는 하나의 독립적인 작업 목적만 포함합니다.

허용 타입:

- `feat`: 사용자 기능 추가
- `fix`: 버그 수정
- `refactor`: 동작 변경 없는 구조 개선
- `docs`: 문서 변경
- `test`: 테스트 추가·수정
- `perf`: 성능 개선
- `chore`: 빌드·도구·의존성 등 유지보수
- `hotfix`: 긴급 운영 수정
- `release`: 릴리스 준비

예시:

```text
feat/cinev-1234-camera-hdr-support
fix/cinev-2345-sequencer-duplicate-tracks
refactor/timeline-section-composition
docs/update-build-test-guide
hotfix/remote-session-crash
```
