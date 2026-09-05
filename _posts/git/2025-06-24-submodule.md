---
title       : Git Submodule — 저장소 안에 다른 저장소의 특정 커밋을 연결하는 구조
description : "Git Submodule을 단순한 저장소 포함 기능이 아니라 상위 저장소가 다른 저장소의 특정 커밋을 gitlink로 가리키는 구조로 이해하고 clone·update·작업 흐름과 detached HEAD 함정을 정리한다."
date        : 2025-06-24 10:00:00 +0900
updated     : 2026-09-05 19:20:00 +0900
categories  : [git, "저장소·운영"]
tags        : [submodule, gitmodules, gitlink]
pin         : false
hidden      : false
---

Git Submodule은 다른 Git 저장소를 현재 프로젝트 아래에 배치하는 기능이다. 하지만 핵심은 파일을 복사해 포함하는 것이 아니라 **상위 저장소(Superproject)가 하위 저장소의 특정 Commit SHA를 가리킨다**는 데 있다.

```text
Superproject
├─ 일반 파일
├─ 일반 디렉터리
└─ sub1 ──→ 다른 Git 저장소의 Commit A
```

이 구조를 먼저 이해하면 왜 clone 뒤에 별도 초기화가 필요하고, `git submodule update` 후 detached HEAD가 되며, 하위 저장소에서 새 commit을 만든 뒤 상위 저장소에서도 다시 commit해야 하는지가 한 번에 연결된다.

## 1. Submodule은 무엇을 저장하나

상위 저장소는 Submodule 디렉터리의 파일 내용을 자신의 일반 tree로 저장하지 않는다. 대신 해당 경로에 **gitlink라는 특수 entry로 특정 Commit SHA를 기록**한다.

```text
Superproject Commit
       ↓
sub1 경로의 gitlink
       ↓
Submodule Commit SHA
       ↓
외부 저장소의 실제 파일 Tree
```

`.gitmodules`에는 Submodule의 경로와 원격 저장소 정보가 기록된다.

```ini
[submodule "sub1"]
    path = sub1
    url = https://github.com/clang-engineer/sub1
```

역할을 구분하면:

```text
.gitmodules
→ 어디에서 Submodule 저장소를 가져올지 설명

gitlink
→ Superproject가 어떤 Commit을 사용해야 하는지 기록
```

이다.

## 2. 추가할 때 실제로 일어나는 일

```bash
git submodule add https://github.com/clang-engineer/sub1 sub1
git commit -m "add sub1 submodule"
```

이 작업은 단순히 `sub1/` 디렉터리를 생성하는 것이 아니다.

```text
원격 저장소 Clone
       ↓
sub1 Working Tree 생성
       ↓
.gitmodules에 경로·URL 기록
       ↓
Index에 sub1 gitlink 기록
       ↓
Superproject Commit
```

그래서 Submodule의 버전은 상위 저장소의 commit과 함께 고정된다.

## 3. Clone만 하면 왜 끝나지 않나

일반 clone은 Superproject가 가리키는 gitlink를 알 수 있지만 Submodule 저장소의 실제 object와 working tree까지 자동으로 준비하지 않을 수 있다.

처음부터 함께 받으려면:

```bash
git clone --recurse-submodules <repo>
```

이미 clone했다면:

```bash
git submodule update --init --recursive
```

를 사용한다.

흐름은:

```text
.gitmodules 읽기
   ↓ --init
Submodule 설정 등록
   ↓
저장소 가져오기
   ↓ --update
Superproject가 기록한 SHA Checkout
   ↓ --recursive
중첩 Submodule도 반복
```

이다.

## 4. 왜 Detached HEAD가 되는가

`git submodule update`의 목적은 "main 브랜치 최신으로 이동"이 아니라 **상위 저장소가 기록한 정확한 Commit SHA를 재현**하는 것이다.

```text
Superproject
    ↓
"sub1은 abc123이어야 한다"
    ↓
git submodule update
    ↓
abc123 직접 Checkout
    ↓
Detached HEAD
```

따라서 detached HEAD 자체는 오류가 아니라 Submodule의 재현성 모델에서 자연스러운 상태다.

문제는 그 상태에서 새 commit을 만들고 브랜치에 연결하지 않은 채 작업을 끝내는 경우다.

## 5. Submodule에서 직접 수정할 때의 흐름

Submodule 자체를 수정하려면 먼저 작업 브랜치로 이동하는 편이 안전하다.

```bash
cd sub1
git switch main
# 수정
git commit -am "change sub1"
git push
```

그다음 Superproject로 돌아와 **새 Submodule SHA를 기록**해야 한다.

```bash
cd ..
git add sub1
git commit -m "bump sub1"
```

전체 흐름은:

```text
Submodule 수정
   ↓
Submodule Commit + Push
   ↓
새 Commit SHA 생성
   ↓
Superproject의 gitlink 갱신
   ↓
Superproject Commit
```

이다.

마지막 상위 commit을 빼먹으면 다른 사용자는 여전히 이전 Submodule SHA를 받는다.

## 6. 원격 브랜치의 최신 Commit을 가져오려면

기본 `update`와 `--remote`는 목적이 다르다.

```text
git submodule update
→ Superproject에 기록된 SHA 재현

git submodule update --remote
→ 설정된 원격 브랜치의 최신 Commit 조회
```

추적 브랜치를 명시하려면:

```bash
git config -f .gitmodules submodule.sub1.branch main
git submodule update --remote
```

`--remote`로 새 commit을 가져온 뒤에도 그 버전을 프로젝트의 공식 상태로 만들려면 Superproject에서 gitlink 변경을 commit해야 한다.

## 7. 자주 쓰는 명령을 역할별로 보기

| 목적 | 명령 |
|---|---|
| 추가 | `git submodule add <repo> [path]` |
| 초기화 | `git submodule init` |
| 기록된 SHA 재현 | `git submodule update` |
| 처음부터 전체 준비 | `git submodule update --init --recursive` |
| Submodule 포함 clone | `git clone --recurse-submodules <repo>` |
| 원격 브랜치 기준 갱신 | `git submodule update --remote` |
| 상태 확인 | `git submodule status` |
| 모든 Submodule에서 실행 | `git submodule foreach <cmd>` |
| URL 설정 동기화 | `git submodule sync` |

명령을 외우기보다 **지금 원하는 것이 기록된 SHA 재현인지, 원격 최신 Commit 조회인지**를 먼저 구분하는 게 중요하다.

## 8. 제거

Submodule 제거는 working tree 디렉터리 하나만 지우는 작업이 아니다. Superproject 설정과 Git 내부 저장 영역도 함께 정리한다.

```bash
git submodule deinit -f sub1
git rm -f sub1
rm -rf .git/modules/sub1
git commit -m "remove sub1 submodule"
```

각 단계는 대략:

```text
deinit
→ 로컬 Submodule 등록 해제

git rm
→ gitlink와 .gitmodules 항목 제거

.git/modules/sub1 제거
→ 로컬 내부 저장 영역 정리
```

역할을 한다.

## 9. Submodule과 Subtree는 무엇이 다른가

둘 다 다른 저장소의 코드를 프로젝트와 함께 사용할 수 있지만 **소유 방식이 다르다.**

```text
Submodule
Superproject ──포인터──→ 외부 저장소 Commit

Subtree
외부 저장소 내용 ──병합/복사──→ Superproject History
```

- **Submodule** — 외부 저장소의 독립성을 유지하고 특정 버전을 명시적으로 가리키기 좋다. 대신 clone/update와 두 저장소 commit 흐름을 이해해야 한다.
- **Subtree** — 코드를 상위 저장소 내용으로 가져오기 때문에 일반 clone만으로 작업하기 쉽다. 대신 외부 저장소와의 동기화가 별도 merge/split 흐름이 된다.

따라서 단순히 "Submodule은 어렵고 Subtree는 쉽다"보다 **외부 저장소를 독립된 저장소로 계속 취급할 것인지, 현재 저장소의 코드 History 안으로 가져올 것인지**가 선택 기준이다.

## 정리

Submodule의 핵심 모델은 한 줄로 정리된다.

```text
Superproject
   ↓ gitlink
Submodule의 특정 Commit SHA
   ↓
외부 저장소
```

이 포인터 모델을 이해하면 `--init`, `update`, detached HEAD, 상위 저장소의 `git add sub1`이 모두 별개의 예외가 아니라 같은 구조에서 나온 동작으로 보인다.
