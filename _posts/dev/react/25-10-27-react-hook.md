---
title       : 🪝 React Hook 개념 정리
description : 
date        : 2025-10-27 09:57:38 +0900
updated     : 2025-10-27 09:58:38 +0900
categories  : [dev, react]
tags        : [react, hook, javascript]
pin         : false
hidden      : false
---

## 1. Hook이란?

**Hook(훅)**은 **React의 함수형 컴포넌트(function component)**에서  
기존 **클래스 컴포넌트에서만 가능했던 기능(상태 관리, 생명주기 관리 등)**을  
사용할 수 있도록 해주는 **특별한 함수**이다.

React 16.8 버전부터 도입되었으며,  
컴포넌트를 더 **간결하고 재사용 가능하게** 만들어 준다.

---

## 2. 왜 Hook이 생겼을까?

### 기존 문제점
- 클래스 컴포넌트는 문법이 복잡하고 `this` 바인딩이 필요했다.
- 여러 생명주기 메서드(`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`)에서  
  하나의 로직을 나눠 작성해야 해서 관리가 어려웠다.
- 상태 관련 로직을 여러 컴포넌트 간에 재사용하기 어려웠다.

### Hook의 등장으로 해결된 점
- 함수형 컴포넌트에서도 상태(state)와 생명주기 로직을 사용할 수 있다.
- **커스텀 훅(Custom Hook)**을 통해 로직을 재사용할 수 있다.
- 코드가 간결하고 테스트가 쉬워졌다.

---

## 3. 기본 규칙 (Rules of Hooks)

1. **반드시 함수 컴포넌트의 최상위에서만 호출해야 한다.**  
   → 반복문, 조건문, 중첩 함수 안에서는 사용 불가.

2. **React 함수(컴포넌트 or 커스텀 훅) 안에서만 호출해야 한다.**  
   → 일반 JavaScript 함수에서는 호출 불가.

---

## 4. 주요 내장 Hook

| Hook 이름 | 설명 |
|------------|------|
| `useState` | 컴포넌트 내 상태(state)를 선언하고 관리 |
| `useEffect` | 생명주기 관리 (렌더링 이후, 변경 감지, 정리 작업 등) |
| `useContext` | Context API를 사용하여 전역 데이터 접근 |
| `useRef` | DOM 접근 또는 렌더 사이에서 유지되는 값 관리 |
| `useMemo` | 연산 결과를 메모이제이션하여 성능 최적화 |
| `useCallback` | 함수를 메모이제이션하여 불필요한 재렌더링 방지 |
| `useReducer` | 복잡한 상태 로직을 리듀서 패턴으로 관리 |
| `useLayoutEffect` | DOM이 변경된 직후 동기적으로 실행 |
| `useImperativeHandle` | `ref`를 통해 부모가 접근할 수 있는 값 제어 |

---

## 5. 예시

### ✅ useState & useEffect 예제

```jsx
import React, { useState, useEffect } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(`현재 카운트: ${count}`);
  }, [count]); // count 값이 변경될 때만 실행됨

  return (
    <button onClick={() => setCount(count + 1)}>
      클릭 횟수: {count}
    </button>
  );
}

export default Counter;
````

---

## 6. 커스텀 훅 (Custom Hook)

Hook을 조합해서 새로운 훅을 만들 수 있다.
이로써 **상태 로직을 재사용 가능**하게 만든다.

### 예시: 윈도우 크기 감지 훅

```jsx
import { useState, useEffect } from "react";

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

export default useWindowSize;
```

---

## 7. Hook의 장점 요약

* ✅ 코드 간결성 — 클래스 문법보다 단순
* 🔁 로직 재사용 — 커스텀 훅으로 추상화 가능
* ⚡ 성능 최적화 — `useMemo`, `useCallback` 등으로 불필요한 연산 감소
* 🧩 컴포넌트 구조 단순화 — 기능 중심으로 분리 가능

---

## 8. 참고 자료

* [React 공식 문서 - Hooks 소개](https://react.dev/reference/react)
* [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
* [React Blog - Introducing Hooks](https://react.dev/blog/2018/10/23/react-hooks-intro)

```
