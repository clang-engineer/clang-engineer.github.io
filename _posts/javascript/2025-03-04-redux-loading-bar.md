---
title       : Redux Loading Bar 사용법
description : "react-redux-loading-bar는 액션 타입 시작·종료를 미들웨어가 감지해 자동으로 로딩 바를 표시한다. Provider 하위 컴포넌트, 리듀서, 미들웨어 연결 예시."
date        : 2025-03-04 00:00:00 +0900
updated     : 2026-06-19 18:09:37 +0900
categories  : [javascript, "React·UI"]
tags        : [react]
pin         : false
hidden      : false
---

비동기 요청마다 로딩 상태를 직접 `useState`로 켜고 끄다 보면, 화면 곳곳에 로딩 플래그가 흩어진다. `react-redux-loading-bar`는 이 일을 미들웨어에 맡긴다. 액션 타입의 접미사(`_REQUEST` 시작 / `_SUCCESS`·`_FAILURE` 종료) 패턴을 미들웨어가 감지해, 페이지 상단 진행 바를 **자동으로** 표시했다 지운다. 컴포넌트에서 로딩 상태를 일일이 관리하지 않아도 된다.

## Redux Loading Bar
- Redux 액션의 로딩 상태를 표시하는 라이브러리. (액션의 시작과 종료 시점에 액션 타입을 기반으로 로딩 상태를 표시)
- Redux 스토어에 연결하여 사용할 수 있으며, 자동으로 로딩 상태를 관리함. (미들웨어로 사용)

## 저장소
- [react-redux-loading-bar](https://github.com/mironov/react-redux-loading-bar)

## 사용법
### 설치
```bash
npm install react-redux-loading-bar
```

### 로더 컴포넌트 추가
```jsx
import { Provider } from 'react-redux';
import { LoadingBar } from 'react-redux-loading-bar';
import store from './store';

const App = () => (
  <Provider store={store}>
    <LoadingBar />
    <YourComponent />
  </Provider>
);
```

### 리듀서 설정
```javascript
import { loadingBarReducer } from 'react-redux-loading-bar';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  loadingBar: loadingBarReducer,
  // other reducers
});
```

### middleware 설정
```javascript
import { createStore, applyMiddleware } from 'redux';
import { loadingBarMiddleware } from 'react-redux-loading-bar';
import rootReducer from './reducers';

const store = createStore(
  rootReducer,
  applyMiddleware(loadingBarMiddleware())
);
```

> `createStore`는 현재 deprecated다. Redux Toolkit을 쓴다면 `configureStore`의 `middleware` 옵션으로 같은 미들웨어를 연결한다.
>
> ```javascript
> import { configureStore } from '@reduxjs/toolkit';
> import { loadingBarMiddleware } from 'react-redux-loading-bar';
>
> const store = configureStore({
>   reducer: rootReducer,
>   middleware: (getDefaultMiddleware) =>
>     getDefaultMiddleware().concat(loadingBarMiddleware()),
> });
> ```