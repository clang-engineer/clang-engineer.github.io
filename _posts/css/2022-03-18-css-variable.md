---
title       : CSS 변수 사용하기
description :
date        : 2022-03-18 14:38:36 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, css]
tags        : [css, variable]
pin         : false
hidden      : false
---

# 소개
- CSS 변수를 사용하면 코드를 더 깔끔하게 작성할 수 있습니다.
- 변수를 사용하면 코드를 수정할 때 변수만 수정하면 되기 때문에 유지보수가 편리해집니다.
- 변수의 종류는 지역변수와 전역변수가 있습니다.

| - | 지역변수 | 전역변수 |
|:-------------------------------:|:--------:|
| 접근범위 | 자신의 부모 엘리먼트에 선언된 변수에만 접근할 수 있다. | 모든 엘리먼트에서 접근 가능하다. |
| 사용예시 | div { --color: red; } | :root { --color: blue; } |

# 변수 사용 방법
- 변수를 사용하려면 `--`로 시작하는 이름을 선언하고, `var()` 함수를 사용하여 값을 참조합니다.
- `var()` 함수는 두 개의 매개변수를 가질 수 있습니다.
- 변수값이 유효하지 않은 경우 기본값을 적용할 수 있습니다.
- 변수값이 유효하지 않은 경우 다른 변수를 적용할 수 있습니다.
- CSS 변수를 적용할 수 없을 때 방어코드를 작성할 수 있습니다.

| 방법 | 설명 |
|:----:|:----:|
| 단순 사용 | `var(--변수명)` |
| 변수값이 유효하지 않은 경우 기본값 적용 | `var(--변수명, 기본값)` |
| 변수값이 유효하지 않은 경우 다른 변수를 적용 | `var(--변수명, var(--변수명2, 기본값))` |
| CSS 변수를 적용할 수 없을 때 방어코드 | `background-color: #F00; background-color: var(--red, #F00);` |


0. 선언
```css
:root {
  --red : #DC3545;
  --blue: #007bff;
  --indigo: #6610f2;
  --purble: #6f42c1;
  ...
}
```

1. 단순 사용
```css
div {
  background-color: var(--red);
}
```

2. 변수값이 유효하지 않은 경우 기본값 적용
```css
div {
  background-color: var(--red, #F00);
}
```

3. 변수값이 유효하지 않은 경우 다른 변수를 적용
```css
div {
  background-color: var(--red, var(--blue, #F00));
}
```

4. CSS 변수를 적용할 수 없을 때 방어코드 (ex>익스플로러)
```css
div {
  background-color: #F00;
  background-color: var(--red, #F00);
}
```

# html 태그 선택자와 전역변수의 차이점
- :root는 최상위 엘리먼트인 html와 동일합니다. 다만, html태그 이름을 선택자로 쓰면 우선순위에서 1점 밖에 부여되지 않게 됩니다. (vs :root 가상 선택자는 class로 간주되어 10점이 부여됩니다.)
  때문에, css에서 변수를 선언할 때는 :root라는 가상선택자를 이용해 최상위 엘리먼트에 선언하여 모든 엘리먼트에서 변수를 사용할 수 있도록 하는 것이 보편적입니다. (ex> 부트스트랩)

```css
html {
  --main-color: red;
}

:root {
  --main-color: blue;
}

body {
  color: var(--main-color);
}
```
>👉 :root의 우선순위가 높기 때문에 --main-color 값은 blue가 됩니다.

