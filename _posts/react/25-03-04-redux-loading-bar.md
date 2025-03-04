---
title       : Redux Loading Bar 사용법
description : >-
    Redux Loading Bar 라이브러리를 사용하여 Redux 액션의 로딩 상태를 표시하는 방법에 대해 기록합니다.
date        : 2025-03-04 00:00:00 +0900
updated     : 2025-03-04 18:09:37 +0900
categories  : [dev, react]
tags        : [redux, react, loading-bar]
pin         : false
hidden      : false
---

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
```plaintext
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