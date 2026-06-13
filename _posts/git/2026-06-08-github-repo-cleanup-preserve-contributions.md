---
title       : "GitHub repo 정리하면서 잔디 보존하기"
description : "여러 repo를 subtree로 흡수해 한 archive repo로 정리. 원본을 지워도 잔디는 그대로."
date        : 2026-06-08 12:00:00 +0900
updated     : 2026-06-08 12:00:00 +0900
categories  : [git, "GitHub·잔디"]
tags        : [github, contribution-graph, git-subtree, cleanup]
pin         : false
hidden      : false
---

오래된 repo를 지우면 해당 커밋의 잔디가 같이 사라진다. `git subtree`로 여러 repo의 히스토리를 한 archive repo로 흡수하면 잔디를 그대로 유지하면서 원본을 삭제할 수 있다.

## Delete / Archive / Private 비교

| | 잔디 유지 | 남에게 안 보임 | 본인에게도 안 보임 |
|---|---|---|---|
| Delete | ❌ | ✅ | ✅ |
| Archive | ✅ | ❌ (Archived 뱃지) | ❌ |
| Private | ✅ | ✅ | ❌ (필터 가능) |

세 조건을 모두 만족하는 단일 옵션은 없다.

## 잔디가 계산되는 조건

GitHub contribution graph는 다음 모두를 만족하는 커밋만 카운트:

- 커밋 author email이 GitHub 계정에 연결돼 있을 것
- repo의 **default branch** 위에 있을 것
- repo가 **fork가 아닐 것** (standalone)
- 그 repo가 현재 GitHub에 존재할 것

→ 원본 repo를 지워도 **같은 커밋이 다른 repo에 살아있으면** 잔디는 유지된다.

## subtree로 히스토리 통합

여러 repo를 한 archive repo의 폴더로 흡수. 커밋 SHA·author·date 모두 보존됨.

```sh
mkdir archive && cd archive
git init -b main
git commit --allow-empty -m "init"

git subtree add --prefix=kh-msa-book \
  https://github.com/<user>/kh-msa-book.git main
git subtree add --prefix=jh-gateway \
  https://github.com/<user>/jh-gateway.git main
# ... 반복

git remote add origin https://github.com/<user>/archive.git
git push -u origin main
```

이후 archive를 Private 전환하면 남에게도 안 보이고, 본인 repo 탭에선 `?type=public` 필터로 가릴 수 있다.

## 진행 순서 (안전한 검증)

1. archive repo 생성 + subtree 흡수 + push
2. **원본과 archive 둘 다 존재하는 상태**에서 GitHub 잔디 확인
3. 잔디 그대로면 원본 Delete
4. archive Private 전환

2번을 거치지 않고 바로 지우면 복구가 어렵다.

## 한계

- Issues, PRs, Releases, Stars는 이전되지 않고 사라짐
- 각 repo가 폴더 하나로 합쳐지므로 개별 repo URL은 잃음
- subtree merge 커밋이 하나 추가되지만 원본 커밋의 date는 그대로

## 참고

- 부계정으로 transfer 하는 우회는 소유권 이동 후 잔디 카운트가 끊겨 권장 안 함
- "Include private contributions on my profile" 설정을 켜면 private repo 커밋도 방문자에게 카운트 표시됨
