---
title       : "React 렌더링 — State에서 DOM 반영까지"
description : "React가 상태 변화로부터 다음 UI를 계산하고, 이전 렌더 결과와 비교해 필요한 DOM 변경만 Commit하는 흐름을 Render·Reconciliation·Commit 중심으로 정리한다."
date        : 2026-09-13 16:00:00 +0900
updated     : 2026-09-13 16:00:00 +0900
categories  : [javascript, React]
tags        : [react, rendering, reconciliation, commit, virtual-dom, key]
pin         : false
hidden      : false
---

React 렌더링을 처음 배울 때 흔히 다음처럼 외우기 쉽다.

```text
State 변경
→ Virtual DOM 생성
→ 이전 Virtual DOM과 비교
→ 실제 DOM 갱신
```

틀린 방향은 아니지만, 이 설명만으로는 React가 실제로 무엇을 계산하고 언제 브라우저 DOM을 바꾸는지 흐려진다.

먼저 가장 중요한 흐름을 다음처럼 잡는 편이 낫다.

```text
State / Props 변경
        ↓
Render
        ↓
다음 UI 표현 계산
        ↓
이전 렌더 결과와 비교
(Reconciliation)
        ↓
Commit
        ↓
필요한 DOM 변경 적용
```

핵심은 다음 한 문장이다.

> **React는 화면을 직접 명령식으로 고치기보다, 현재 State가 만들고 싶은 UI를 다시 계산하고 실제 DOM에는 필요한 변경만 반영한다.**

## 1. React의 출발점 — UI를 직접 고치지 않는다

전통적인 명령형 DOM 코드는 상태 변화가 생길 때마다 실제 DOM을 직접 수정할 수 있다.

```text
버튼 비활성화
텍스트 교체
목록 항목 추가
클래스 변경
```

React에서는 보통 먼저 State를 바꾼다.

```text
State 변경
↓
컴포넌트 다시 Render
↓
현재 State에서 UI가 어떻게 보여야 하는지 계산
```

즉 관심사가 다음처럼 바뀐다.

```text
명령형
= DOM을 어떻게 고칠까?

React
= 현재 State라면 UI가 어떻게 보여야 할까?
```

이 관점은 `UI = f(State)`로 단순화할 수 있다.

## 2. Render — 실제 DOM을 바꾸는 단계가 아니다

React의 Render는 브라우저 화면을 즉시 고치는 작업과 구분해야 한다.

Render 단계에서는 컴포넌트를 호출하고, 현재 Props와 State를 기준으로 **다음 UI 표현을 계산**한다.

```text
State
  ↓
Component 실행
  ↓
JSX / React Element 결과
  ↓
다음 UI 구조 계산
```

따라서:

> **Render = 실제 DOM 변경**

으로 이해하면 안 된다.

Render는 **다음 UI가 어떻게 생겨야 하는지를 계산하는 단계**에 가깝다.

## 3. Reconciliation — 이전과 다음 UI를 비교한다

다음 UI 표현이 계산되면 React는 이전 렌더 결과와 비교해 무엇을 유지하고 무엇을 바꿔야 하는지 판단한다.

개념적으로 보면:

```text
이전 UI Tree
      ↕ 비교
다음 UI Tree
      ↓
유지 / 갱신 / 삽입 / 제거 판단
```

이 비교와 대응 관계를 잡는 과정이 보통 **Reconciliation**이라고 불린다.

중요한 것은 React가 항상 DOM 전체를 버리고 다시 만드는 것이 아니라는 점이다.

```text
전체 UI를 다시 계산할 수는 있음
        ↓
하지만 실제 DOM에는
필요한 변경만 반영
```

즉 **"다시 Render한다"와 "DOM 전체를 다시 만든다"는 같은 말이 아니다.**

## 4. Commit — 실제 DOM에 반영한다

React가 필요한 변경을 결정한 뒤 실제 DOM에 적용하는 단계가 Commit이다.

```text
Render
= 다음 UI 계산

Reconciliation
= 이전 결과와 비교해 변경점 결정

Commit
= 실제 DOM에 변경 적용
```

예를 들어 한 문장의 텍스트만 달라졌다면 전체 페이지를 새로 만드는 것이 아니라 필요한 DOM 변경만 적용할 수 있다.

그래서 전체 흐름은 다음처럼 기억하면 된다.

```text
State Update
    ↓
Render
    ↓
Next UI Tree
    ↓
Reconciliation
    ↓
Commit
    ↓
DOM
```

## 5. Virtual DOM은 목적이 아니라 표현 방식에 가깝다

React를 설명할 때 흔히 "Virtual DOM이 실제 DOM보다 빨라서 사용한다"라고 단순화하지만, 핵심을 놓치기 쉽다.

중요한 점은 React가 **현재 State에서 원하는 UI 구조를 메모리상의 표현으로 계산할 수 있다는 것**이다.

그 결과:

```text
현재 State
→ 원하는 UI 표현 계산
→ 이전 결과와 비교
→ 실제 DOM 변경 최소화
```

라는 구조를 만들 수 있다.

따라서 처음에는 Virtual DOM 자체의 성능 주장보다 다음 관계를 먼저 이해하는 편이 좋다.

> **React Element / Render Tree는 "현재 UI가 어떻게 보여야 하는가"를 표현하는 중간 모델이다.**

## 6. key — 비교할 때 identity를 알려준다

리스트를 다시 Render할 때 React는 이전 항목과 다음 항목이 같은 대상인지 판단해야 한다.

예를 들어:

```text
이전
A
B
C

다음
A
C
B
```

단순히 위치만 보면 B와 C가 모두 바뀐 것처럼 보일 수 있다.

`key`는 React가 각 항목의 **identity**를 판단하는 데 도움을 준다.

```jsx
items.map(item => (
  <Row key={item.id} item={item} />
))
```

개념적으로:

```text
key
= "이 노드는 이전 Render의 어느 노드와 같은 대상인가?"
```

를 판단하기 위한 단서다.

React는 같은 위치의 같은 컴포넌트를 이어서 유지하는 경향이 있고, `key`가 달라지면 다른 identity로 취급해 기존 상태를 버리고 새로 만들 수 있다.

그래서 `key`는 단순한 "리스트 경고 없애기용 속성"이 아니다.

## 7. State 보존도 Tree의 identity와 연결된다

React는 컴포넌트의 State를 JSX 태그 그 자체에 저장한다고 보기보다 **렌더 트리에서의 위치와 identity에 연결해 관리**한다.

```text
같은 위치 + 같은 identity
→ 기존 State 유지 가능

다른 타입 / 다른 key / 제거 후 재생성
→ 기존 State 폐기 가능
```

그래서 `key`를 바꾸면 컴포넌트를 의도적으로 새 인스턴스처럼 취급해 State를 초기화하는 패턴도 가능하다.

## 8. curses refresh와 비교하면 왜 비슷하게 느껴질까

터미널 TUI를 공부하다 보면 curses의 `refresh()`와 React의 Render/Commit 흐름이 꽤 비슷하게 느껴진다.

curses 계열을 단순화하면:

```text
애플리케이션이 원하는 화면 상태
        ↓
curses 내부 화면 모델
        ↓
현재 화면 모델과 비교
        ↓
refresh()
        ↓
필요한 터미널 제어만 출력
```

React는:

```text
State
  ↓
다음 UI 표현 계산
  ↓
이전 UI 결과와 비교
  ↓
Commit
  ↓
필요한 DOM 변경 적용
```

둘 다 다음 문제를 푼다.

> **"원하는 전체 상태"와 "현재 실제 상태"를 분리하고, 그 차이를 실제 출력에 반영한다.**

하지만 직접적인 계보로 보면 안 된다.

```text
curses
= 문자 셀 기반 터미널 화면
= 화면 상태 + refresh 중심

React
= Component / Element Tree 기반 웹 UI
= State / Component identity / Reconciliation / Commit 중심
```

React가 curses를 계승했다기보다, **UI 시스템에서 반복해서 등장하는 desired state → compare → minimal update 패턴이 서로 다른 환경에서 나타난 것**으로 보는 편이 정확하다.

## 9. C++ 관점으로 비유하면

정확히 같은 구조는 아니지만 감각적으로는 다음처럼 볼 수 있다.

```cpp
State state;
UiTree previous;

while (running) {
    Event event = next_event();

    state = update(state, event);

    UiTree next = render(state);

    Patch patch = diff(previous, next);
    commit_to_dom(patch);

    previous = std::move(next);
}
```

여기서 역할을 대응하면:

```text
state
= React State

render(state)
= Component Render

diff(previous, next)
= Reconciliation을 단순화한 비유

commit_to_dom()
= Commit
```

실제 React 내부 구현이 이 코드 그대로라는 뜻은 아니다. **전체 책임 분리를 이해하기 위한 모델**이다.

## 10. 처음에는 이것만 기억하면 된다

```text
1. State가 바뀐다.

2. React가 다음 UI를 Render한다.

3. 이전 렌더 결과와 다음 결과를 비교한다.

4. Commit 단계에서 실제 DOM에 필요한 변경만 적용한다.
```

그리고 반드시 구분한다.

```text
Render
≠ 실제 DOM 변경

Re-render
≠ DOM 전체 재생성

Virtual DOM
≠ 단순히 "DOM보다 빠른 복사본"

key
= 노드 / 컴포넌트 identity 판단에 중요한 정보
```

이 흐름을 잡고 나면 이후 `memo`, `useMemo`, `useCallback`, Concurrent Rendering 같은 주제도 "Render를 언제 다시 계산하고, 어떤 결과를 재사용할 것인가"라는 좌표 위에서 이해하기 쉬워진다.

## 참고

- React 공식 문서 — Render and Commit: https://react.dev/learn/render-and-commit
- React 공식 문서 — Preserving and Resetting State: https://react.dev/learn/preserving-and-resetting-state
- React 공식 문서 — Managing State: https://react.dev/learn/managing-state
