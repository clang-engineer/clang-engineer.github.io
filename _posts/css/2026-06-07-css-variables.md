---
title       : CSS Variables (Custom Properties) 사용법
description : "CSS Variables(Custom Properties)의 선언과 var() 사용법, 전역과 지역 스코프, 폴백 패턴, 구버전 브라우저 방어 코드, :root와 html 선택자의 우선순위 차이를 정리한다."
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-19 12:00:00 +0900
categories  : [css]
tags        : [custom-properties, variables, selector, specificity]
pin         : false
hidden      : false
---

CSS Variables(공식 명칭 Custom Properties)는 `--이름` 형태로 값을 한 번 선언해두고 `var(--이름)`으로 재사용하는 기능이다. Sass 변수와 달리 빌드 타임이 아니라 **런타임에 살아 있어서**, 미디어 쿼리나 JavaScript로 값을 바꾸면 그 자리에서 다시 계산된다. 선언 위치에 따라 스코프가 갈리고 `:root`/`html` 선택자의 우선순위 차이가 있어, 이 글에서 그 규칙들을 정리한다.

## 선언 / 사용

```css
:root {
  --red: #DC3545;
  --blue: #007bff;
}

div {
  background-color: var(--red);
}
```

## 변수 선언 위치 — 지역 vs 전역

| 종류 | 접근 범위 | 예시 |
|---|---|---|
| **전역** | 모든 엘리먼트에서 사용 | `:root { --color: blue; }` |
| **지역** | 선언된 엘리먼트의 자식만 사용 | `div { --color: red; }` |

## `var()` 폴백 패턴

| 패턴 | 의미 |
|---|---|
| `var(--name)` | 단순 사용 |
| `var(--name, #f00)` | 변수 없으면 `#f00` |
| `var(--name, var(--other, #f00))` | 변수 → 다른 변수 → 기본값 |

## CSS 변수 지원 안 되는 브라우저 방어 (레거시)

IE는 2022년 6월 지원 종료됐고 현행 브라우저는 모두 Custom Properties를 지원하므로, 이 폴백이 필요한 경우는 거의 없다. 다만 같은 속성을 두 번 선언하는 패턴은 알아둘 만하다 — 변수를 못 읽는 브라우저는 첫 줄을, 읽는 브라우저는 둘째 줄을 적용한다.

```css
div {
  background-color: #F00;          /* fallback */
  background-color: var(--red);    /* 변수 지원 시 */
}
```

## `:root` vs `html` 선택자

둘 다 같은 엘리먼트를 가리키지만 **우선순위(specificity)가 다르다**.

| 선택자 | 우선순위 점수 |
|---|---|
| `html` (태그 선택자) | 1 |
| `:root` (가상 선택자) | 10 |

```css
html  { --main-color: red; }
:root { --main-color: blue; }

body { color: var(--main-color); }
/* → blue (:root 가 우선) */
```

CSS 변수 선언은 관례상 `:root` 사용.

## 참고

- [MDN — CSS custom properties](https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties)
