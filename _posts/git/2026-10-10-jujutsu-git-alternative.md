---
title       : "Jujutsu(jj) — Git의 복잡함을 다른 작업 모델로 풀기"
description : "Jujutsu의 change·revision·working-copy commit·operation log를 Git의 index·branch·rebase와 비교하고, Git 백엔드 및 jjui의 역할을 구분한다."
date        : 2026-10-10 12:00:00 +0900
updated     : 2026-10-10 12:00:00 +0900
categories  : [git, "개념·비교"]
tags        : [git, jujutsu, jj, jjui, vcs, version-control]
pin         : false
hidden      : false
---

Git은 파일의 버전을 저장하는 도구만은 아니다. **Working Tree, Index, Commit, Branch, HEAD**를 조합해 어떤 변경을 역사로 남길지 제어하는 인터페이스이기도 하다. Jujutsu(명령어 `jj`)는 같은 문제를 **change와 revision, 자동 스냅샷, 다시 쓸 수 있는 이력**이라는 다른 작업 모델로 다룬다.

이 글은 Git을 버려야 한다는 주장이 아니라, *왜 Git과 다른 모델이 가능한지* 이해하기 위한 비교다. 기본 명령은 [Devkit jj 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/jj.md)에 따로 둔다.

## 먼저 구분할 세 레이어

```text
버전 관리 모델        Git                 Jujutsu
                      │                   │
명령 인터페이스       git CLI              jj CLI
                      │                   │
대화형 UI            lazygit               jjui
```

- **Git**과 **Jujutsu**는 변경 이력을 다루는 모델/도구를 비교하는 대상이다.
- **lazygit**은 Git을 조작하는 TUI이고 **jjui**는 Jujutsu를 조작하는 TUI다.
- Jujutsu는 Git 저장소 형식을 백엔드로 활용할 수 있다. 그렇다고 단순히 Git 위에 화면만 바꿔 얹은 TUI는 아니다.

전체 위치는 [VCS Map]({% post_url developer-tools/2026-10-05-vcs-map %})에서 비교한다.

## Git의 index와 jj의 working-copy commit

Git의 일반적인 작업 흐름은 다음과 같다.

```text
파일 수정 → git add (Index에 선택) → git commit → Branch/HEAD 이동
```

여기서 **Working Tree의 내용**, **Index에서 선택된 내용**, **HEAD가 가리키는 commit**은 서로 구별된다. 부분 스테이징을 이용해 변경 덩어리를 정확히 고를 수 있지만, 매번 각 상태를 의식해야 한다.

jj는 작업 복사본 자체를 **working-copy commit**으로 취급하고 명령 실행 과정에서 변경을 자동으로 스냅샷한다. Git처럼 별도 index에 `git add`로 옮기는 단계가 기본 작업 모델의 중심이 아니다.

```text
Git:  Working Tree → Index → Commit
jj:   Working copy = 수정 가능한 working-copy commit (@)
```

그렇다고 '파일을 타이핑할 때마다 원격에 커밋된다'는 뜻은 아니다. 로컬 작업 상태를 jj가 관리하는 방식과, 공유할 이력을 북마크로 지정해 원격에 보내는 과정은 별개다.

## Change ID와 Commit ID

Git에서는 commit의 내용이나 부모가 달라지면 commit hash도 바뀐다. rebase나 amend 후 같은 논리적 변경을 추적할 때 hash가 달라져 불편할 수 있다.

jj는 두 식별자를 분리한다.

| 식별자 | 뜻 | 변경을 다시 썼을 때 |
|---|---|---|
| **Change ID** | 사용자가 다루는 논리적 변경의 정체성 | 같은 change를 수정하면 대체로 유지 |
| **Commit ID** | 특정 revision의 스냅샷 식별자 | 내용·부모가 바뀌면 변경 |

```text
같은 change
  revision A (commit ID: ...1)
      ↓ 수정·재작성
  revision B (commit ID: ...2)

Change ID는 유지, Commit ID는 달라질 수 있음
```

물론 모든 명령이 동일한 Change ID를 유지하는 것은 아니다. 새 change를 만들거나 복사하는 작업 등은 구분해야 한다. 핵심은 **변경의 정체성과 스냅샷의 정체성을 분리했다**는 설계다.

## 브랜치 대신 revision을 중심으로

Git은 HEAD와 branch를 중심으로 작업하기 쉽다. jj에서는 `jj log`로 revision graph를 탐색하고, `jj new`로 새 작업 change를 만들고, `jj edit`로 기존 change를 수정할 수 있다.

jj의 **bookmark**는 Git branch와 비슷하게 이름이 붙은 참조이지만, jj에서는 모든 로컬 작업마다 북마크를 만들 필요가 없다. 협업할 변경을 Git 원격과 주고받을 때 bookmark가 중요한 연결 지점이 된다.

| 질문 | Git에서 흔한 접근 | jj에서 흔한 접근 |
|---|---|---|
| 현재 상태 | `git status` | `jj status` |
| 그래프 보기 | `git log --graph` | `jj log` |
| 새 작업 시작 | branch 생성·이동 | `jj new` |
| 이전 변경 수정 | amend / interactive rebase | `jj edit` / `jj squash` |
| 잘못된 조작 복구 | reflog 등을 확인 | `jj op log`, `jj undo` |

명령이 1:1로 같은 의미라는 뜻은 아니다. 특히 `jj new`를 단순히 `git switch -c`와 동일시하면 혼란스럽다.

## 충돌을 어떻게 바라보는가

Git에서 merge/rebase 중 충돌이 생기면 해결 전까지 작업 흐름이 멈추는 경우가 많다. jj는 **충돌이 담긴 revision을 기록하고 이후에도 다른 이력 작업을 이어 갈 수 있는 모델**을 제공한다.

즉, 충돌이 자동으로 없어지는 것이 아니다. 충돌 해결을 잠시 미뤄도 revision graph를 편집할 수 있다는 뜻이다. 최종적으로 Git으로 내보내거나 통합할 때는 충돌 해소가 필요할 수 있다.

## Operation log: 이력을 다시 쓰는 조작도 이력으로

Git의 reflog는 참조와 HEAD 이동을 추적해 복구하는 데 매우 유용하다. jj는 `jj op log`로 **저장소에 가한 조작의 기록**을 보여 주고, `jj undo`로 직전 조작을 되돌리는 흐름을 제공한다.

```text
파일의 변경 이력     revision / commit graph
jj를 조작한 이력     operation log
```

이 두 층을 구분하는 점이 흥미롭다. 기존 revision을 다시 쓰는 기능을 적극 활용하려면, **그 이력 편집 행위 자체를 복구할 수 있어야 한다**는 설계에 가깝다. 다만 모든 외부 효과(예: 이미 push한 원격 상태)까지 자동 복구되는 것은 아니다.

## GitHub와 함께 쓸 수 있나?

가능하다. Git 백엔드를 활용하는 저장소에서 jj로 로컬 이력을 다루고, bookmark를 통해 Git 원격과 동기화할 수 있다.

```text
내 작업 방식       jj / Jujutsu
로컬 저장 형식     Git backend 사용 가능
원격 협업         Git remote / GitHub
TUI              jjui (선택)
```

다만 Git 호환성이 **명령·index·hooks·IDE 확장까지 동일함**을 뜻하지는 않는다. Git 명령과 jj 명령을 같은 작업 복사본에서 섞을 때는 동기화 방식과 도구 지원 범위를 확인해야 한다. 기존 조직의 Git CI/PR 규칙도 그대로 고려해야 한다.

## 언제 도입할 만할까?

| 상황 | 판단 |
|---|---|
| Git 명령과 팀 흐름에 불편이 없다 | 굳이 바꿀 필요 없다 |
| 과거 변경 수정·squash·rebase가 잦다 | jj의 change 중심 모델을 시험할 만하다 |
| 여러 작업을 유연하게 오가고 싶다 | revision graph와 자동 스냅샷이 유용할 수 있다 |
| Git index의 hunk 단위 선택이 중요하다 | jj의 변경 분리·합치기 흐름과 실제 사용성을 비교해야 한다 |
| Git 통합 도구·스크립트 의존도가 높다 | 호환성 확인 비용이 생긴다 |

**결론:** Jujutsu의 가치는 Git 명령을 몇 개 줄이는 데 있지 않다. 사용자가 매번 조율하던 index·HEAD·branch의 일부 복잡성을 다른 모델로 옮기고, 변경 이력을 **수정 가능한 작업 공간**처럼 다루려는 시도에 있다.

## 이어 읽기

- [Git 로드맵]({% post_url git/2026-10-01-git-roadmap %}) — Git의 기본 상태·이력 모델
- [VCS Map]({% post_url developer-tools/2026-10-05-vcs-map %}) — SVN, Git, Jujutsu 및 TUI의 레이어
- [Devkit jj 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/jj.md) — 기본 명령과 실험 루틴
- [Jujutsu 공식 문서](https://docs.jj-vcs.dev/latest/) · [jjui](https://github.com/idursun/jjui)
