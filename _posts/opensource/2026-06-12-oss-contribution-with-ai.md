---
title       : "OSS 기여에 AI 활용 — 대필이 아니라 페어 시니어로"
description : "AI에게 패치를 짜달라고 하면 컨트리뷰터가 아니라 AI의 전달자가 된다. 사고는 본인이."
date        : 2026-06-12 12:00:00 +0900
updated     : 2026-06-12 12:00:00 +0900
categories  : [opensource, "기여 방법"]
tags        : [oss, claude-code]
pin         : false
hidden      : false
---

AI에게 패치까지 짜달라고 하면 PR은 빨리 나오지만 본인은 코드베이스도 패턴도 모름. 다음 이슈에서 똑같이 막힘. 컨트리뷰터가 되는 게 아니라 AI의 전달자가 되는 것.

## 빠진 함정

OSS 기여하려고 이슈 찾기 → AI에 코드 분석 시킴 → AI가 패치 스케치 → 복붙 → PR 흐름은:

- 본인이 디버깅 사고를 안 함 (AI가 함)
- 코드 패턴이 본인 머리에 안 남음
- 메인테이너 리뷰가 디테일 물고 들어오면 방어 불가
- 다음 PR도 똑같이 AI 없이 못 함

## 역할 바꾸기 — 대필 vs 교사

| 대필 (지양) | 교사 (지향) |
|---|---|
| "패치 짜줘" | "이 파일 구조 설명해줘" |
| "diff 보여줘" | "내 가설이 맞는지 봐줘" |
| "PR 본문 써줘" | "내 패치 리뷰해줘" |

시간은 3~4배 들지만, 다음 PR을 혼자 할 수 있게 됨.

## AI 슬롭 PR 컨텍스트

요즘 OSS 메인테이너들이 AI 슬롭 PR에 피로감 큼. PR이 너무 매끄러운데 후속 질문에 본인이 못 답하면 머지 거절될 수 있음. 이 경우 PR 본문에 "AI assist 받았다"를 솔직히 적는 게 신뢰 얻는 편.

## 좋은 기여 후보 찾는 기준

본인 환경에서 재현 가능 + 본인이 평소 쓰는 도구 = 디버깅 사고가 본인 자산이 됨.

```sh
# fork repo에서 upstream에 기여 가능한 변경 추적
git log upstream/master..HEAD --name-only -- <theme files...>

# starter / help wanted 이슈 검색
gh issue list --repo <owner>/<name> --state open --label "good first issue"
gh issue list --repo <owner>/<name> --state open --label "help wanted"

# 활발한 레포는 위 라벨이 비어있는 경우 많음 → 최근 bug 라벨 중 코멘트 적은 것 노리기
gh issue list --repo <owner>/<name> --state open --label bug --limit 25 \
  --json number,title,createdAt,comments
```

## 결론

AI를 코드 짜주는 도구가 아니라, 옆에서 페어 프로그래밍 해주는 시니어로 쓸 것. "이 코드 어떻게 동작해?", "내 가설 검증해줘", "내 패치 리뷰해줘" — 사고는 본인이 한다.
