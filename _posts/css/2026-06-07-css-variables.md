---
title       : CSS Variables (Custom Properties) 사용법
description : "CSS Variables(Custom Properties)의 선언과 var() 사용법, 전역과 지역 스코프, 폴백 패턴, 구버전 브라우저 방어 코드, :root와 html 선택자의 우선순위 차이를 정리한다."
date        : 2026-06-07 12:00:00 +0900
categories  : [css]
tags        : []
pin         : false
hidden      : false
---

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

## CSS 변수 지원 안 되는 브라우저 방어 (IE 등)

같은 속성 두 번 — 구버전은 첫 줄, 신버전은 둘째 줄 적용:

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
