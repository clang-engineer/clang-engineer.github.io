---
title       : "React Hooks — Render 흐름에서 State·Ref·Effect를 이해하기"
description : "React Hooks를 API 목록이 아니라 Render 관점에서 정리한다. useState, useReducer, useRef, useMemo, useCallback, useEffect가 무엇을 기억하고 무엇이 다시 렌더링을 일으키며 Commit 이후 무엇을 동기화하는지 연결한다."
date        : 2026-09-13 16:30:00 +0900
updated     : 2026-09-13 16:30:00 +0900
categories  : [javascript, React]
tags        : [react, hooks, useState, useReducer, useRef, useEffect, useMemo, useCallback, rendering]
pin         : false
hidden      : false
---

앞 글에서는 React의 화면 갱신을 다음 흐름으로 봤다.

```text
State / Props 변경
        ↓
Render
        ↓
다음 UI 표현 계산
        ↓
Reconciliation
        ↓
Commit
        ↓
DOM 반영
```

글: [React 렌더링 — State에서 DOM 반영까지](./2026-09-13-react-render-reconciliation-commit.md)

Hooks도 이 흐름 위에 놓으면 훨씬 덜 헷갈린다.

Hooks를 처음 배우면 다음처럼 함수 이름을 따로 외우기 쉽다.

```text
useState
useEffect
useRef
useMemo
useCallback
...
```

하지만 중요한 질문은 함수 이름이 아니다.

```text
1. 이 값은 Render 사이에서 기억되어야 하는가?
2. 값이 바뀌면 다시 Render해야 하는가?
3. Render 중 계산한 결과를 재사용하고 싶은가?
4. DOM·네트워크·타이머 같은 외부 시스템과 언제 동기화할 것인가?
```

이 질문으로 보면 각 Hook의 위치가 잡힌다.

## 전체 좌표

```text
                    React가 기억해야 하는 값
                           │
              ┌────────────┴────────────┐
              │                         │
      UI 결과에 영향을 줌        UI 결과와 직접 무관
              │                         │
        useState / useReducer            useRef
              │                         │
      변경 → 새 Render 요청       변경 → Render 요청 안 함

Render 중 계산 비용 줄이기
→ useMemo / useCallback

Commit 이후 외부 시스템과 동기화
→ useEffect
```

즉 Hooks는 모두 같은 종류의 기능이 아니다.

## 1. useState — React가 기억하고, 변경되면 다시 Render한다

`useState`의 핵심은 단순히 "변수를 저장한다"가 아니다.

일반 지역 변수는 컴포넌트 함수가 다시 실행되면 다시 만들어진다.

```jsx
function Counter() {
  let count = 0;
  ...
}
```

반면 State는 React가 컴포넌트 Render 바깥에서 보존한다.

```text
React가 보존하는 State
        ↓
Component Render
        ↓
이번 Render에서 사용할 State snapshot
```

`setState()`를 호출하면 현재 함수 안의 변수를 즉시 바꾸는 것보다:

> **다음 Render를 요청하고, 그 Render에서 새로운 State snapshot을 받는다.**

라고 이해하는 편이 정확하다.

```text
Event
  ↓
setState(...)
  ↓
새 Render 예약
  ↓
Component 다시 실행
  ↓
새 State snapshot으로 UI 계산
```

React 공식 문서도 State를 **각 Render 시점의 snapshot**으로 설명한다.

### 왜 setState 직후 값이 그대로 보일까

```jsx
console.log(count); // 0
setCount(1);
console.log(count); // 여전히 0
```

현재 실행 중인 함수는 이미 `count = 0`인 Render의 snapshot 안에 있기 때문이다.

```text
Render A
count = 0
  ↓
setCount(1)
  ↓
Render B를 요청

하지만 현재 실행 중인 Render A의 count는 여전히 0
```

이 관점을 잡으면 stale closure 문제도 이해하기 쉬워진다.

## 2. useReducer — State 변경 규칙을 한곳에 모은다

`useReducer`도 본질적으로 State다.

차이는 State 변경 로직을:

```text
여러 이벤트 핸들러에 흩어두기
```

보다:

```text
Event / Action
    ↓
Reducer
    ↓
Next State
```

형태로 모으는 데 있다.

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

개념적으로는:

```text
useState
= 다음 값을 직접 요청하는 쪽에 가까움

useReducer
= Action을 보내고 State Transition 규칙을 reducer에 모음
```

둘 다 State가 바뀌면 새로운 Render를 일으킬 수 있다는 점은 같다.

TUI에서 봤던:

```text
Event
→ State Update
→ Render
```

구조와도 잘 대응된다.

## 3. useRef — 기억하지만 Render를 일으키지 않는다

`useRef`도 Render 사이에서 값을 보존한다.

하지만 State와 결정적인 차이가 있다.

```text
useState
값 변경
→ React가 알아야 함
→ 다시 Render

useRef
ref.current 변경
→ React에게 Render 요청하지 않음
```

그래서 Ref는 **화면을 결정하지 않는 값**을 저장할 때 적합하다.

예:

```text
DOM 노드 참조
Timer ID
이전 값 기록
외부 객체 참조
렌더링과 무관한 mutable 값
```

React 공식 문서도 Ref 변경은 re-render를 발생시키지 않는다고 설명한다.

C++ 느낌으로 아주 거칠게 비유하면:

```text
State
≈ UI 계산에 참여하고 변경 통지가 필요한 보존 상태

Ref
≈ 객체 수명 동안 유지되는 mutable field지만
  UI invalidation은 발생시키지 않는 값
```

정확히 같은 실행 모델은 아니지만 책임 차이를 보는 데는 유용하다.

### State와 Ref를 나누는 질문

```text
이 값이 바뀌면 화면도 다시 계산해야 하나?

YES → State 후보
NO  → Ref 후보
```

물론 모든 값을 무조건 둘 중 하나에 넣어야 한다는 뜻은 아니다. Render 중 계산 가능한 값은 그냥 지역 변수로 두는 편이 낫다.

## 4. useMemo — Render 중 계산 결과를 재사용한다

`useMemo`는 State를 저장하기 위한 Hook이 아니다.

```text
State / Props
   ↓
Render
   ↓
비싼 계산
   ↓
계산 결과
```

이 계산을 매 Render마다 다시 할 필요가 없을 때 이전 결과를 재사용할 수 있다.

```jsx
const filtered = useMemo(
  () => expensiveFilter(items, query),
  [items, query]
);
```

개념적으로:

```text
dependencies 동일
→ 이전 계산 결과 재사용 가능

dependencies 변경
→ 다시 계산
```

핵심은:

> **useMemo는 Render를 막는 기능이라기보다 Render 중 특정 계산 결과를 재사용하는 최적화 도구다.**

React 코드의 의미를 성립시키기 위해 `useMemo`가 반드시 필요하도록 설계하면 오히려 구조가 불안정해질 수 있다.

## 5. useCallback — 함수 identity를 재사용한다

컴포넌트 함수가 다시 실행되면 그 안에서 만든 함수도 새 함수 객체가 될 수 있다.

```jsx
function Parent() {
  const handleClick = () => {...};
  ...
}
```

다시 Render하면 개념적으로:

```text
Render A → handleClick A
Render B → handleClick B
```

가 될 수 있다.

`useCallback`은 dependency가 바뀌지 않았다면 함수 identity를 재사용하는 데 쓰인다.

```jsx
const handleClick = useCallback(() => {
  ...
}, [dependency]);
```

따라서 `useCallback`은:

```text
함수를 실행 결과로 memoize
```

한다기보다:

```text
함수 객체 identity를 안정적으로 재사용
```

하는 쪽에 가깝다.

주로 `memo`된 자식에게 callback을 넘기거나 dependency identity가 중요한 경우에 의미가 생긴다.

## 6. useEffect — Render 로직이 아니라 외부 시스템 동기화다

`useEffect`는 가장 많이 오해되는 Hook 중 하나다.

흔한 설명:

```text
컴포넌트가 Render되면 뭔가 실행하고 싶을 때 사용
```

이렇게만 외우면 Effect 안에 온갖 계산 로직을 넣기 쉽다.

React 공식 문서는 Effect를 **컴포넌트를 외부 시스템과 동기화하는 수단**으로 설명한다.

예:

```text
네트워크 연결
DOM API
Timer
브라우저 Event Listener
외부 라이브러리
구독(Subscription)
```

전체 흐름에서 위치를 보면:

```text
State / Props 변경
      ↓
Render
      ↓
Reconciliation
      ↓
Commit
      ↓
DOM 반영
      ↓
Effect로 외부 시스템 동기화
```

즉 Effect는 **다음 UI를 계산하는 Render 단계 자체가 아니다.**

### Effect가 필요 없는 경우

현재 Props나 State만으로 계산 가능한 값이라면:

```jsx
const fullName = firstName + ' ' + lastName;
```

처럼 Render 중 계산하면 된다.

굳이:

```text
State A 변경
→ Render
→ Effect
→ State B 갱신
→ 다시 Render
```

같은 우회 구조를 만들 필요가 없다.

## 7. dependency array는 "언제 실행할까"만의 문제가 아니다

`useEffect`, `useMemo`, `useCallback`의 dependency array를 단순히 실행 횟수 조절 문법으로 보면 헷갈린다.

더 중요한 의미는:

> **이 계산/Effect가 어떤 Render 값에 의존하는가?**

다.

```text
현재 Render가 참조한 값
        ↓
Dependency
        ↓
값이 바뀌면 이전 결과를 그대로 쓸 수 있는가?
```

예를 들어 Effect가 `roomId`를 사용한다면:

```jsx
useEffect(() => {
  connect(roomId);
  return () => disconnect(roomId);
}, [roomId]);
```

`roomId`가 바뀌었을 때 이전 외부 연결을 그대로 유지하면 안 되므로 dependency에 들어간다.

즉 dependency는 **Render snapshot과 Hook이 잡고 있는 값의 관계**다.

## 8. Hook 호출 순서가 왜 중요한가

Hooks는 컴포넌트 Render 때 반복해서 호출된다.

```jsx
function Component() {
  const [a, setA] = useState(0); // Hook 1
  const ref = useRef(null);      // Hook 2
  const [b, setB] = useState(0); // Hook 3
}
```

다음 Render에서도 React는 이 Hook 호출들을 같은 컴포넌트의 기존 Hook 상태와 대응시켜야 한다.

그래서 조건문 안에서 Hook을 호출하면:

```text
Render A
Hook 1
Hook 2
Hook 3

Render B
Hook 1
Hook 3
```

처럼 대응 관계가 깨질 수 있다.

따라서 Hooks는 컴포넌트 최상위에서 일관된 순서로 호출해야 한다.

C++ 식으로 아주 거칠게 비유하면:

```text
컴포넌트마다 React가 관리하는 Hook slot 배열이 있고
호출 순서로 slot을 다시 찾는다고 생각하는 모델
```

정도로 보면 이해하기 쉽다.

실제 React 내부 구현을 그대로 묘사한 코드는 아니지만, Rules of Hooks가 왜 필요한지 이해하는 데 유용한 멘탈 모델이다.

## 9. Render 관점에서 Hook을 다시 분류하면

```text
useState / useReducer
= React가 보존하는 UI State
= 변경되면 다음 Render 요청

useRef
= Render 사이에서 보존되는 mutable 값
= 변경해도 Render 요청 안 함

useMemo
= Render 중 계산 결과 재사용

useCallback
= Render 사이에서 함수 identity 재사용

useEffect
= Commit 이후 외부 시스템과 동기화
```

이렇게 보면 Hooks가 한꺼번에 외울 API 목록이 아니라 **React Render 파이프라인의 서로 다른 위치에서 쓰이는 도구**라는 게 보인다.

## 10. 전체 흐름에 꽂아보기

```text
Event
  ↓
State 변경
(useState / useReducer)
  ↓
Render 요청
  ↓
Component 실행
  ├─ State snapshot 읽기
  ├─ Ref 읽기
  ├─ useMemo 계산 재사용 여부 판단
  └─ useCallback 함수 identity 재사용 여부 판단
  ↓
다음 UI 표현
  ↓
Reconciliation
  ↓
Commit
  ↓
DOM 변경
  ↓
Effect
외부 시스템 동기화
```

이 그림이 Hooks를 이해하는 핵심 좌표다.

## 11. 처음에는 이것만 기억하면 된다

```text
State
= 화면을 바꿔야 하는 기억

Ref
= 화면은 안 바꿔도 되는 기억

Memo / Callback
= Render 중 다시 만들 필요가 없는 결과나 identity를 재사용하는 최적화

Effect
= Render 결과를 외부 세계와 동기화
```

그리고 가장 중요한 경계는 다음이다.

```text
Hook
≠ 모두 State

Effect
≠ 일반적인 후처리 함수

Ref 변경
≠ Re-render

setState
≠ 현재 Render의 변수 즉시 변경

useMemo / useCallback
≠ 코드의 의미를 성립시키기 위한 필수 저장소
```

Hooks를 이 관점으로 이해하면 이후 stale closure, dependency array, `React.memo`, custom Hook, concurrent rendering 같은 주제도 같은 좌표 위에서 이어서 볼 수 있다.

## 참고

- React 공식 문서 — State as a Snapshot: https://react.dev/learn/state-as-a-snapshot
- React 공식 문서 — Referencing Values with Refs: https://react.dev/learn/referencing-values-with-refs
- React 공식 문서 — useEffect: https://react.dev/reference/react/useEffect
- React 공식 문서 — Rules of Hooks: https://react.dev/reference/rules/rules-of-hooks
