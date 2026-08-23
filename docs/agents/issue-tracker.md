# 이슈 트래커: GitHub

이 저장소의 이슈와 PRD는 GitHub Issues에서 관리한다. 모든 작업에는 `gh` CLI를
사용한다.

## 규칙

- **이슈 생성**: `gh issue create --title "..." --body "..."`
- **이슈 조회**: `gh issue view <number> --comments`
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments`
- **댓글 작성**: `gh issue comment <number> --body "..."`
- **라벨 추가·제거**: `gh issue edit <number> --add-label "..."` 또는
  `--remove-label "..."`
- **이슈 종료**: `gh issue close <number> --comment "..."`
- 여러 줄 본문은 PowerShell here-string 또는 `--body-file`을 사용한다.
- 저장소는 현재 작업 디렉터리의 `git remote -v`에서 추론한다.

## Pull requests as a triage surface

**PRs as a request surface: no.**

외부 PR은 기능 요청이나 트리아지 대기열로 취급하지 않는다.

GitHub Issues와 PR은 번호 공간을 공유하므로 `#42`가 어느 유형인지 불분명하면
`gh pr view 42`를 먼저 실행하고, 실패하면 `gh issue view 42`를 실행한다.

## 스킬이 “이슈 트래커에 게시”하라고 할 때

GitHub Issue를 생성한다.

## 스킬이 “관련 티켓을 가져오라”고 할 때

`gh issue view <number> --comments`를 실행한다.

## Wayfinding 작업

`wayfinder` 스킬은 지도 이슈 하나와 하위 티켓을 사용한다.

- **지도**: `wayfinder:map` 라벨을 가진 단일 이슈. Notes, Decisions-so-far,
  Fog 내용을 보관한다.
- **하위 티켓**: GitHub 하위 이슈로 지도에 연결한다. 하위 이슈를 사용할 수
  없으면 지도 본문의 작업 목록에 추가하고 티켓 상단에 `Part of #<map>`을
  기록한다.
- **유형 라벨**: `wayfinder:research`, `wayfinder:prototype`,
  `wayfinder:grilling`, `wayfinder:task`를 사용한다.
- **차단 관계**: GitHub 네이티브 이슈 의존성을 우선 사용한다. 사용할 수 없으면
  티켓 상단에 `Blocked by: #<n>, #<n>`을 기록한다.
- **작업 후보**: 열려 있고, 담당자가 없으며, 미해결 차단 이슈가 없는 첫 번째
  하위 티켓을 선택한다.
- **작업 선점**: `gh issue edit <n> --add-assignee @me`
- **완료**: 답변을 댓글로 남기고 티켓을 닫은 뒤, 지도 이슈의
  Decisions-so-far에 컨텍스트 링크를 추가한다.
