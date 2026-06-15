---
title       : "Chirpy 테마의 포스트 조회수 위젯은 GoatCounter만 공식 지원"
description : "analytics와 pageviews는 다른 설정. 사이드바 숫자 위젯은 GoatCounter만 가능."
date        : 2026-06-12 10:00:00 +0900
updated     : 2026-06-12 10:00:00 +0900
categories  : [opensource, "Jekyll"]
tags        : [chirpy, jekyll, analytics, goatcounter]
pin         : false
hidden      : false
---

Jekyll Chirpy 테마에서 포스트 페이지 사이드바에 조회수 숫자를 띄우는 위젯(`#pageviews`)은 **GoatCounter만 공식 지원**한다. `_config.yml`의 `pageviews.provider:` 주석에 "now only supports 'goatcounter'" 라고 박혀있고, 실제로 `_includes/pageviews/` 폴더에는 `goatcounter.html` 하나뿐이다.

## 분석 도구 ≠ 조회수 위젯

- `analytics.*` (GA, Umami, Matomo, Cloudflare, Fathom 등 다 지원) → **수집 + 외부 대시보드**
- `pageviews.provider` (GoatCounter only) → **포스트 페이지 안에 숫자 표시**

GA만 깔려있으면 대시보드에서 보긴 하지만 포스트 사이드바 숫자는 안 뜬다. 둘은 별개 설정이다.

## 설정 (가입 후)

```yaml
# _config.yml
analytics:
  goatcounter:
    id: clang-engineer  # goatcounter.com 가입 시 정한 Code (서브도메인)

pageviews:
  provider: goatcounter
```

## 인기 순위 (현실)

조회수 위젯 때문에 어쩔 수 없이 쓰지만, GoatCounter 자체는 비주류다:

1. Google Analytics — 압도적 1위
2. Plausible (22k★) / Umami (27k★) — 프라이버시 친화 인기
3. Matomo — 엔터프라이즈 셀프호스팅
4. GoatCounter — 1인 운영, niche, but Chirpy 호환 유일

다른 도구로 위젯을 만들고 싶으면 `_includes/pageviews/` 에 직접 템플릿 추가 + 유지보수 부담을 안아야 한다.

## 참고

- GoatCounter: <https://www.goatcounter.com>
- Chirpy `_includes/pageviews/goatcounter.html` — `/counter/{path}.json` 엔드포인트를 fetch해서 `#pageviews` 엘리먼트에 숫자 주입
