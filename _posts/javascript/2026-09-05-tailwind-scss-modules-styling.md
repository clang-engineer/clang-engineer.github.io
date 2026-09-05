---
title       : Tailwind CSS + SCSS Modules 스타일링 기준
description : Tailwind CSS를 기본 스타일링 수단으로 사용하고, 복잡한 CSS는 SCSS Modules로 보완하는 실무 기준
 date        : 2026-09-05 21:34:00 +0900
updated     : 2026-09-05 21:34:00 +0900
categories  : [javascript, "UI·스타일링"]
tags        : [tailwindcss, scss, css-modules, styling]
pin         : false
hidden      : false
---

프론트엔드 스타일링에서는 Tailwind CSS를 기본으로 사용하고, Tailwind만으로 표현하기 복잡하거나 가독성이 떨어지는 경우 SCSS Modules를 보조 수단으로 사용한다.

핵심 원칙은 다음과 같다.

> **Tailwind = 기본, SCSS Modules = escape hatch**

## 역할 구분

### Tailwind CSS

일반적인 UI 스타일은 Tailwind로 처리한다.

- layout: `flex`, `grid`, 정렬
- spacing: `margin`, `padding`, `gap`
- typography
- color
- border, radius, shadow
- responsive style
- 단순한 hover/focus 상태

예를 들어 다음 정도의 스타일은 별도 SCSS를 만들지 않는다.

```tsx
<div className="flex items-center gap-4 rounded-lg p-4">
  ...
</div>
```

### SCSS Modules

다음과 같이 Tailwind로 작성했을 때 표현이 복잡해지거나 의도가 불분명해지는 경우 SCSS Module로 분리한다.

- 복잡한 selector
- `::before`, `::after` 같은 pseudo element
- 복잡한 hover/child 관계
- animation / keyframes
- third-party library style override
- 컴포넌트 내부의 복잡한 상태 기반 스타일
- Tailwind class가 지나치게 길어져 가독성이 떨어지는 경우

```tsx
import styles from './Card.module.scss';

export function Card() {
  return (
    <div className={`flex items-center gap-4 p-4 ${styles.card}`}>
      ...
    </div>
  );
}
```

```scss
.card {
  position: relative;

  &:hover {
    .icon {
      transform: rotate(10deg);
    }
  }

  &::before {
    content: '';
    position: absolute;
  }
}
```

## CSS Modules와 SCSS의 관계

CSS Modules와 SCSS는 서로 대체 관계가 아니다.

- **CSS Modules**: 클래스 이름의 scope를 컴포넌트 단위로 제한하는 방식
- **SCSS**: nesting, mixin 등의 문법을 제공하는 CSS 전처리기

따라서 보조 스타일이 필요하다면 일반적인 `*.module.css`보다 `*.module.scss` 형태로 사용하는 것을 기본으로 한다.

```text
Component.tsx
Component.module.scss
```

## 디자인 토큰 관리

SCSS의 변수와 mixin을 별도의 디자인 시스템처럼 확장하지 않는다.

Tailwind와 SCSS 양쪽에서 색상, spacing, breakpoint 등의 디자인 토큰을 각각 관리하면 동일한 개념의 관리 지점이 두 군데가 된다.

따라서 공통 디자인 토큰은 가능하면 Tailwind의 theme/config 또는 CSS custom properties를 중심으로 관리하고, SCSS는 복잡한 CSS 표현을 위한 도구로 제한한다.

## 판단 기준

```text
일반적인 UI 스타일인가?
        │
        ├─ Yes → Tailwind
        │
        └─ No
             │
             ├─ selector / animation / pseudo element 등이 복잡한가?
             │      └─ Yes → SCSS Module
             │
             └─ Tailwind class가 과도하게 복잡한가?
                    └─ Yes → SCSS Module 검토
```

Tailwind를 쓰면서 모든 스타일을 utility class로 강제할 필요는 없다. 반대로 단순한 spacing이나 layout까지 SCSS Module로 옮기면 Tailwind를 사용하는 장점이 줄어든다.

결론적으로 **Tailwind를 기본 경로로 두고 SCSS Modules를 예외 처리 수단으로 사용한다.**
