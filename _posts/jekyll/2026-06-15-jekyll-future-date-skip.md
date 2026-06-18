---
title       : "Jekyll은 글 작성 시각이 현재보다 미래면 빌드에서 제외 — Skipping: has a future date"
description : "front matter date가 현재 시각보다 미래면 Jekyll이 빌드에서 글을 제외한다 — 시각까지 비교"
date        : 2026-06-15 12:00:00 +0900
updated     : 2026-06-15 12:00:00 +0900
categories  : [jekyll]
tags        : [jekyll, blog, troubleshooting]
pin         : false
hidden      : false
---

dev server를 띄워도 글이 안 보여서 한참 헤맸는데, 빌드 로그에 `Skipping: _posts/.../foo.md has a future date`가 찍혀 있었다. 글 front matter의 `date`가 **현재 시각보다 미래**면 Jekyll 기본 정책상 빌드에서 제외된다 (예: 오전 10시인데 글 시각이 `16:00`).

## 해결책 (셋 중 하나)

### 1. CLI 옵션 `--future` (로컬 빠른 확인용)

```sh
bundle exec jekyll s -l --future
```

단점: GitHub Pages 배포에는 적용 안 됨. CLI 옵션은 로컬만.

### 2. `_config.yml`에 `future: true` (로컬·배포 둘 다)

```yaml
future: true
```

GitHub Pages도 이 설정을 본다. 미래 발행 예약 기능을 안 쓸 거면 안전.

### 3. 글 시각을 현재 이전으로 수정 (표준)

```yaml
date: 2026-06-15 09:00:00 +0900
```

Jekyll 표준 워크플로. 설정 손 안 댐.

## 함정

- 같은 날(`YYYY-MM-DD`)이라도 **시각까지 비교**한다. 오늘 10시에 `today 16:00`로 박으면 미래.
- 시리즈 정렬 위해 14:00/15:00/17:00 같은 시각을 임의로 박으면 이 함정에 빠진다.
- 살아남은 이전 글도 안 보이는 게 아니라 **새로 추가한 미래 시각 글들만** 안 보임 — "왜 일부만 안 보이지?"로 보임.

## 참고

- [Jekyll docs — Future-dated posts](https://jekyllrb.com/docs/configuration/options/) (`future` 옵션)
