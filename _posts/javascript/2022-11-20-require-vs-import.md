---
title       : Require vs Import
description : "CommonJS의 require는 런타임에 동기적으로, ES6의 import는 파싱 시점에 정적으로 해석된다. 해석 시점·호이스팅·트리 쉐이킹으로 갈리는 두 모듈 시스템의 차이."
date        : 2022-11-20 09:00:45 +0900
updated     : 2026-07-03
categories  : [javascript, "언어·패키지"]
tags        : [commonjs, esm, nodejs, tree-shaking]
pin         : false
hidden      : false
---

JavaScript로 모듈을 나눠 쓰다 보면 언젠가 `require`와 `import`를 섞어 쓰다 에러를 만난다. `require`는 CommonJS의 모듈 시스템에서 쓰는 함수이고 `import`는 ES6(ESM)의 모듈 시스템에서 쓰는 키워드다. 둘은 단순히 문법만 다른 게 아니라 **모듈을 언제, 어떻게 해석하느냐**가 근본적으로 다르다. 이 차이가 트리 쉐이킹 가능 여부와 동적 로딩 방식까지 갈라놓는다.

## Require (CommonJS)
- 주로 Node.js 환경에서 사용된다.
- **동기적**으로, 코드가 실행되는 시점(런타임)에 모듈을 불러온다. `require` 호출을 만나면 그 자리에서 해당 모듈을 읽고 평가한 뒤 결과를 반환한다.
- `module.exports`로 내보내고 다른 파일에서 `require`로 가져온다.

```javascript
// module.js
module.exports = {
  name: 'module'
};

// index.js
const module = require('./module');
console.log(module.name); // module
```

## Import (ESM)
- ES6(ECMAScript 2015) 표준에 도입된 모듈 시스템. 현재는 대부분의 최신 브라우저와 Node.js에서 지원된다.
- `import`/`export` 선언은 **런타임이 아니라 파싱·링크 시점에 정적으로 해석**된다. 모듈 본문이 실행되기 전에 의존 관계가 먼저 확정되고 호이스팅되므로, `import`는 항상 파일 최상단(모듈 최상위 스코프)에 와야 한다.
- 이렇게 구조가 정적으로 고정되기 때문에 컴파일러가 "무엇을 실제로 쓰는지"를 미리 알 수 있고, 트리 쉐이킹(tree shaking) 같은 최적화가 가능하다.

```javascript
// module.js
export const name = 'module';

// index.js
import { name } from './module';
console.log(name); // module
```

정적 `import` 선언과 달리, **함수 형태의 동적 `import()`** 는 런타임에 조건부로 모듈을 불러올 때 쓰며 `Promise`를 반환한다. 여기서 "비동기"가 등장한다.

```javascript
// 필요할 때 런타임에 불러오는 동적 import — Promise를 반환한다
const { name } = await import('./module');
console.log(name); // module
```

## 주요 차이점
- 환경: `require`는 Node.js의 CommonJS 모듈 시스템으로 서버 측 개발에서 주로 쓰이고, `import`는 표준 ECMAScript 모듈 시스템(ESM)으로 브라우저와 Node.js(최신 버전) 모두에서 쓸 수 있다.
- 해석 시점: `require`는 런타임에 동기적으로 모듈을 로드한다. 반면 정적 `import` 선언은 파싱·링크 단계에서 정적으로 해석되어 본문 실행 전에 평가가 끝난다. "비동기"는 정적 `import`가 아니라 `Promise`를 반환하는 동적 `import()`의 특성이다.
- 호이스팅(hoisting): `import` 문은 모듈 최상위에 위치해야 하며 호이스팅된다. `require`는 코드 어디에서든(함수 안, 조건문 안 등) 호출될 수 있다.

## 트리 쉐이킹(tree shaking)
- 불필요한 코드를 제거하는 최적화 기법.
- import를 통해 사용하지 않는 모듈은 번들링 시 제거됨.
- 번들 크기를 줄이고 성능을 향상시킴.

```javascript
// 아래 코드에서 age는 사용되지 않으므로 번들링 시 제거됨.
// module.js
export const name = 'module';
export const age = 20;

// index.js
import { name } from './module';
console.log(name); // module
```
