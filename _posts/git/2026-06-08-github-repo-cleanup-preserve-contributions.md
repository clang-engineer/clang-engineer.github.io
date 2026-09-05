---
title       : "GitHub 저장소 정리와 Contribution 보존 — 삭제 전에 검증해야 할 것"
description : "오래된 저장소를 정리할 때 Contribution Graph 조건을 먼저 확인하고, 필요하면 history를 archive repository에 보존한 뒤 실제 Graph 반영을 검증하고 원본 삭제 여부를 결정하는 절차를 정리한다."
date        : 2026-06-08 12:00:00 +0900
updated     : 2026-09-05 19:45:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, contribution-graph, repository, record, decision]
pin         : false
hidden      : false
---

오래된 GitHub repository를 정리하고 싶지만 과거 Contribution Graph까지 사라지는 것은 피하고 싶을 수 있다.

이 문제는 단순히 "원본 repository를 지우기 전에 commit을 다른 곳에 복사하면 된다"로 끝나지 않는다. GitHub Contribution은 **commit이 존재한다는 사실만이 아니라 email, branch, repository 유형 등 여러 조건**으로 계산된다.

따라서 가장 안전한 원칙은 다음이다.

```text
정리 대상 Repository 확인
   ↓
Contribution 조건 확인
   ↓
필요하면 History 보존
   ↓
GitHub에 Push
   ↓
Contribution Graph 실제 확인
   ↓
원본 삭제 여부 결정
```

즉 **삭제 전에 실제 결과를 검증한다.**

## 1. 먼저 무엇을 보존하려는지 구분한다

Repository를 없앨 때 잃는 것은 commit만이 아니다.

```text
Git History
Issues
Pull Requests
Releases
Stars / Fork 관계
Repository URL
설정과 Actions 기록
```

History를 다른 repository로 옮겨도 Issues, PR, Releases 같은 GitHub 플랫폼 데이터까지 자동으로 따라가는 것은 아니다.

따라서 목표가 단순히 "과거 코드를 한곳에 보관"인지, "GitHub 프로젝트 자체를 보존"인지 먼저 구분한다.

## 2. Contribution Graph의 기본 조건

GitHub의 현재 기준에서 commit Contribution은 대표적으로 다음 조건의 영향을 받는다.

```text
Author Email이 GitHub 계정과 연결
        +
Standalone Repository
        +
Default Branch 또는 대상 gh-pages Branch
        +
계정과 Repository 사이의 필요한 관계
```

즉 archive repository를 만든다고 자동으로 모든 과거 commit이 Contribution으로 인정되는 것은 아니다.

특히 다음을 확인해야 한다.

```text
원본 Commit의 Author Email이 그대로 유지되는가?
Archive의 Default Branch에서 해당 Commit이 reachable한가?
Archive가 Fork가 아닌 standalone Repository인가?
GitHub가 해당 Commit을 내 계정의 Contribution으로 다시 인식하는가?
```

마지막 항목은 실제 Profile에서 확인하는 것이 가장 확실하다.

## 3. Archive Repository에 History를 보존하는 방법

여러 repository history를 하나의 archive repository에 합치고 싶다면 `git subtree` 같은 방법을 사용할 수 있다.

```bash
mkdir archive
cd archive
git init -b main
git commit --allow-empty -m "init archive"
```

Repository를 하나씩 추가한다.

```bash
git subtree add \
  --prefix=project-a \
  https://github.com/<user>/project-a.git \
  main

git subtree add \
  --prefix=project-b \
  https://github.com/<user>/project-b.git \
  main
```

`--squash`를 사용하지 않으면 원본 branch history를 merge하는 방식으로 가져올 수 있다.

구조는 대략:

```text
Archive main
├─ archive 자체 Commit
├─ project-a History
└─ project-b History
```

이다.

## 4. "Commit SHA가 유지된다"와 "Contribution이 유지된다"는 다른 문제다

History 통합에서 원본 commit object를 그대로 reachable하게 만들 수 있더라도 GitHub Contribution Graph는 별도 규칙으로 계산된다.

```text
Git Object 보존
≠
Profile Contribution 보장
```

이 경계를 명확히 해야 한다.

따라서 archive에 commit이 보인다는 이유만으로 원본을 바로 삭제하지 않는다.

## 5. 삭제 전에 반드시 검증한다

안전한 순서는 다음과 같다.

### 1) Archive Repository 생성

History를 합치고 GitHub에 push한다.

```bash
git remote add origin https://github.com/<user>/archive.git
git push -u origin main
```

### 2) 원본 Repository는 그대로 둔다

이 시점에는 원본과 archive가 모두 존재하게 한다.

### 3) Archive에서 과거 Commit을 확인한다

```text
Archive → Commits
```

에서 author, date, history가 의도대로 유지되는지 본다.

### 4) Contribution Graph를 확인한다

GitHub profile에서 과거 contribution이 기대한 형태로 유지되는지 확인한다.

GitHub의 contribution 재집계는 즉시 끝나지 않을 수 있으므로 충분히 반영된 뒤 판단한다.

### 5) 그다음 원본 삭제 여부를 결정한다

이 검증이 끝난 뒤에만 삭제를 고려한다.

## 6. Delete / Archive / Private는 목적이 다르다

| 선택 | Repository 유지 | 공개 노출 | GitHub 기능 보존 |
|---|---|---|---|
| Delete | X | X | 대부분 제거 |
| Archive | O | 기존 공개 상태 유지 | 읽기 전용으로 보존 |
| Private | O | 권한 있는 사용자만 | Repository 자체 유지 |

따라서 단순히 목록을 깔끔하게 만들고 싶은 목적이라면 **삭제가 유일한 선택은 아니다.**

History와 GitHub metadata를 모두 보존하고 싶다면 Archive나 Private 전환이 더 단순하고 안전할 수 있다.

## 7. Private Contribution은 표시 방식이 다르다

Private repository의 contribution을 profile에 표시하도록 설정할 수 있지만, 다른 사용자에게는 repository 상세가 아니라 익명화된 contribution count 형태로 보일 수 있다.

따라서:

```text
Repository를 남에게 숨기고 싶다
        +
과거 Activity 수는 Profile에 남기고 싶다
```

라면 삭제보다 Private 전환이 더 직접적인 방법일 수 있다.

## 8. Subtree 통합이 적합한 경우

History 통합은 다음 목적에 더 잘 맞는다.

```text
오래된 작은 Repository가 너무 많다
        ↓
Git History 자체는 한곳에 보존하고 싶다
        ↓
각 Repository의 GitHub Issues/PR/URL은 포기 가능하다
```

반대로 GitHub 프로젝트 metadata도 가치가 있다면 archive repository 하나로 흡수하는 것보다 원본을 Archive 상태로 남기는 편이 낫다.

## 9. 삭제 전에 체크

```text
[ ] 원본 Repository의 Issues / PR / Releases가 필요한가?
[ ] Author Email이 GitHub 계정과 정상 연결되는가?
[ ] Archive Default Branch에서 과거 Commit이 reachable한가?
[ ] Archive가 standalone Repository인가?
[ ] GitHub Contribution Graph를 실제로 확인했는가?
[ ] 재집계가 끝날 시간을 충분히 두었는가?
[ ] 삭제 대신 Archive / Private가 더 적합하지 않은가?
```

## 정리

Repository 정리에서 중요한 것은 "잔디를 보존하는 명령" 하나가 아니다.

```text
보존할 대상 결정
   ↓
Git History 통합 여부 결정
   ↓
GitHub Contribution 조건 확인
   ↓
Archive Push
   ↓
실제 Profile 검증
   ↓
삭제 / Archive / Private 선택
```

**History가 다른 repository에 존재한다는 사실과 Contribution Graph가 유지된다는 사실을 동일시하지 않고, 삭제 전에 실제 GitHub 결과를 검증하는 것**이 가장 안전하다.

## 참고

- [GitHub Docs — Profile contributions reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [GitHub Docs — Troubleshooting missing contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions)
