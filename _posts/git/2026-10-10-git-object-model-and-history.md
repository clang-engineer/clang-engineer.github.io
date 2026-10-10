---
title       : "Git 내부 모델 — Object·Index·Ref와 History Rewrite"
description : "blob·tree·commit·tag와 HEAD·index의 책임을 구분하고, merge·rebase·reset·restore가 각각 무엇을 바꾸는지 commit graph로 이해한다."
date        : 2026-10-10 12:30:00 +0900
updated     : 2026-10-10 12:30:00 +0900
categories  : [git, "개념·비교"]
tags        : [git, object, commit, tree, index, rebase, merge, reset, restore]
pin         : false
hidden      : false
---

Git은 단순히 파일을 저장하는 시스템이 아니다. **내용을 담는 Object, 현재 선택된 스냅샷을 담는 Index, 이력을 가리키는 Ref**를 분리한다. 명령어를 외우기보다 무엇이 변하는지 추적하면 충돌·복구·이력 수정이 설명된다.

## 먼저 구분할 세 층

```text
Working Tree     실제 파일
Index            다음 commit을 위한 스냅샷 후보
HEAD / refs      현재 어떤 commit을 가리키는가
                 ↓
Object Database  blob / tree / commit / tag
```

Index는 단순 파일 목록이 아니다. 각 경로가 어떤 blob 및 메타데이터로 다음 스냅샷을 구성할지 기록한다. `git add -p`를 쓰면 Working Tree의 일부 변경만 Index로 가져올 수 있다. 그래서 **파일에 아직 남아 있는 수정과 지금 기록할 수정을 분리**할 수 있다.

## 네 가지 객체: blob·tree·commit·tag

| 객체 | 담는 정보 | 구분할 점 |
|---|---|---|
| Blob | 파일 내용의 바이트 | 파일 이름을 직접 저장하지 않음 |
| Tree | 경로 이름·모드·blob/tree 참조 | 디렉터리 스냅샷 |
| Commit | root tree·부모 commit·작성자·메시지 | 이력 그래프의 노드 |
| Annotated tag | 대상 객체·태그 작성자·메시지 | 가벼운 태그(ref)와 구분 |

```text
commit C ──tree──▶ root tree
   │                  ├─ README.md ─▶ blob
 parent                └─ src/ ─────▶ tree ─▶ blob
   ▼
commit B ──parent──▶ commit A
```

Git의 해시는 객체의 **형식·길이·내용**을 바탕으로 식별한다. 따라서 commit의 부모나 tree가 바뀌면 새 commit ID가 생긴다. 반대로 동일한 파일 내용은 여러 commit에서 같은 blob을 참조할 수 있다. 해시 알고리즘은 저장소 형식에 따라 SHA-1 또는 SHA-256일 수 있다.

직접 확인하려면:

```bash
git cat-file -t HEAD
git cat-file -p HEAD
git ls-tree HEAD
git rev-parse HEAD^{tree}
```

## HEAD·Branch·Ref는 객체와 다르다

보통 `HEAD`는 현재 브랜치 이름을 가리키는 symbolic ref이고, 그 브랜치 ref는 commit ID를 가리킨다.

```text
HEAD → refs/heads/main → commit C → parent B
```

Detached HEAD에서는 HEAD가 commit을 직접 가리킨다. **Branch는 commit 자체가 아니라 움직이는 이름표**다. `git switch`로 브랜치를 바꾸는 일과 `git commit`으로 새 객체를 만드는 일은 다른 연산이다.

## Merge와 Rebase: 그래프를 어떻게 바꾸는가

공통 조상 A에서 main의 B와 feature의 C가 분기했다고 하자.

```text
      B (main)
     /
A ──
     \
      C (feature)
```

일반적인 `git merge feature`는 두 부모를 가진 merge commit M을 만들 수 있다. 단, fast-forward가 가능하면 새 merge commit 없이 ref만 이동한다.

```text
A ─ B ─── M
 \       /
  ── C ─
```

반면 feature를 main에 `git rebase main`하면 C의 변경을 B 뒤에 다시 적용해 **새 commit C'**를 만든다.

```text
A ─ B ─ C'
 \
  C   (기존 객체는 당분간 남아 있을 수 있음)
```

Rebase는 부모가 바뀌므로 commit ID가 달라지고, 후손 커밋도 다시 만들어질 수 있다. 이미 공유한 이력을 재작성할 때는 협업 영향과 강제 push 위험을 고려해야 한다.

## Reset·Restore·Switch: 어느 상태를 움직이는가

| 명령 | 주로 바꾸는 것 | 기억할 점 |
|---|---|---|
| `git reset --soft <commit>` | 현재 branch ref/HEAD 위치 | Index·Working Tree는 유지 |
| `git reset --mixed <commit>` | ref + Index | 기본 reset 방식, Working Tree는 유지 |
| `git reset --hard <commit>` | ref + Index + Working Tree | 미커밋 변경 손실 위험 |
| `git restore --staged <path>` | Index의 경로 | 기본적으로 HEAD 버전으로 되돌림 |
| `git restore <path>` | Working Tree의 경로 | 기본적으로 Index 버전으로 되돌림 |
| `git switch <branch>` | HEAD와 필요 시 Index·Working Tree | 브랜치 이동 전 충돌할 변경이 있으면 거부될 수 있음 |

여기서 `reset`의 ref 이동 설명은 일반적인 브랜치 상태 기준이다. 경로를 지정한 `git reset <path>`는 브랜치를 이동하지 않고 Index의 경로를 갱신한다. `restore`도 `--source` 등 옵션에 따라 기준점이 달라진다.

부분 선택은 [hunk와 interactive staging]({% post_url git/2026-07-12-git-hunk-and-interactive-staging %})에서, 사라진 commit 복구는 [reflog]({% post_url git/2025-10-03-restore %})에서 상세히 다룬다.

## 왜 Jujutsu와 비교할 가치가 있는가

Git은 Index에서 **다음 커밋의 내용을 선별**한다. Jujutsu는 working-copy commit과 change/revision을 중심으로 이미 존재하는 변경을 **분할·수정·재배치**한다. 둘 다 변경을 통제할 수 있지만, 편집 대상이 다르다.

- Git: `git add -p`로 저장할 변경을 고른 뒤 commit 생성
- Jujutsu: `jj split`으로 변경을 둘 이상의 commit으로 나눔
- Git: commit hash는 특정 객체 버전을 식별
- Jujutsu: Commit ID와 별개로 Change ID를 관리

Git 모델에 익숙하다는 이유만으로 바꿀 필요도, 새로운 모델이 나온다는 이유만으로 Git을 고집할 필요도 없다. **Index가 주는 선별 제어와 변경 이력의 재작성 비용을 실제 작업에서 비교**하는 것이 판단 기준이다.

## 이어 읽기

- [Git 로드맵]({% post_url git/2026-10-01-git-roadmap %})
- [Git hunk와 부분 스테이징]({% post_url git/2026-07-12-git-hunk-and-interactive-staging %})
- [Jujutsu와 Git 작업 모델 비교]({% post_url git/2026-10-10-jujutsu-git-alternative %})
- [Git 공식 객체 문서](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
