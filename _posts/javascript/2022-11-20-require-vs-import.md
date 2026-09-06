---
title       : "CommonJS require vs ESM import — 문법보다 모듈 모델이 다르다"
description : "require와 import를 함수/키워드 차이가 아니라 CommonJS와 ESM의 로딩 시점, 정적 분석 가능성, export binding, 동적 로딩 방식이라는 공통 비교축으로 정리한다."
date        : 2022-11-20 09:00:45 +0900
updated     : 2026-09-06 10:02:00 +0900
categories  : [javascript, "언어·패키지"]
tags        : [commonjs, esm, nodejs, tree-shaking]
pin         : false
hidden      : false
---

`require()`와 `import`는 같은 일을 하는 두 문법처럼 보이지만 실제로는 **CommonJS와 ECMAScript Modules(ESM)라는 서로 다른 모듈 시스템의 진입점**이다.

먼저 비교축을 잡으면 차이가 단순해진다.

```text
모듈 의존 관계를 언제 알 수 있나?
→ 실행 중 / 실행 전

무엇을 export하고 import하나?
→ 객체 값 / live binding

조건에 따라 동적으로 불러올 수 있나?
→ require() / import()

정적 분석과 bundling에 얼마나 유리한가?
→ CommonJS보다 ESM이 구조적으로 유리
```

## 1. CommonJS — 실행 중 require()로 모듈을 가져온다

CommonJS는 Node.js 생태계에서 오래 사용된 모듈 시스템이다.

```javascript
// module.js
module.exports = {
  name: 'module'
};

// index.js
const mod = require('./module');
console.log(mod.name);
```

`require()`는 일반 함수 호출처럼 실행 흐름 안에 위치할 수 있다.

```javascript
if (featureEnabled) {
  const feature = require('./feature');
  feature.run();
}
```

따라서 의존 관계가 **실제 실행 경로에 따라 결정될 수 있다.** Node.js의 CommonJS loader는 `require()` 시 모듈을 로드·평가하고 그 결과를 반환하며, 이후 같은 모듈은 cache에서 재사용될 수 있다.

```text
실행 흐름
  ↓
require('./module')
  ↓
Resolve
  ↓
Load / Evaluate
  ↓
module.exports 반환
```

## 2. ESM — 정적 import로 모듈 그래프를 먼저 구성한다

ESM은 ECMAScript 표준 모듈 시스템이다.

```javascript
// module.js
export const name = 'module';

// index.js
import { name } from './module.js';
console.log(name);
```

정적 `import` / `export` 선언은 모듈의 최상위에 위치하며, JavaScript engine은 모듈 본문을 평가하기 전에 **의존 관계를 해석하고 모듈 그래프를 연결(link)**할 수 있다.

```text
Module A
 ├─ import B
 └─ import C
        ↓
의존 관계 Resolve / Link
        ↓
Module Evaluation
```

이 정적 구조 때문에 tooling이 어떤 module/export가 연결되는지 사전에 분석하기 쉬워지고, bundler가 tree shaking 같은 최적화를 수행할 기반이 생긴다.

> ESM을 단순히 "비동기 import"라고 설명하면 안 된다. 정적 `import` 선언과 런타임 `import()`는 다른 형태다.

## 3. 동적 로딩 — require()와 import()

ESM에서도 실행 중 조건에 따라 모듈을 로드해야 할 수 있다. 이때 함수 형태의 `import()`를 사용한다.

```javascript
if (featureEnabled) {
  const feature = await import('./feature.js');
  feature.run();
}
```

`import()`는 `Promise`를 반환한다.

```text
정적 import
→ 모듈 그래프의 선언적 dependency

동적 import()
→ 실행 중 필요한 module을 비동기로 요청
```

CommonJS의 `require()` 역시 실행 중 호출할 수 있지만 동기적 API라는 점에서 동적 `import()`와 실행 모델이 다르다.

## 4. Export의 의미도 다르다

CommonJS에서는 `module.exports` 객체를 통해 값을 노출한다.

```javascript
module.exports = { count: 1 };
```

ESM의 named import는 단순한 객체 destructuring 복사와 같지 않고 **exported binding에 연결되는 live binding**이다.

```javascript
// counter.js
export let count = 0;
export function inc() {
  count++;
}
```

```javascript
import { count, inc } from './counter.js';

inc();
console.log(count); // 갱신된 binding을 관찰
```

이 차이는 circular dependency나 module initialization을 이해할 때 특히 중요하다.

## 5. Tree shaking은 ESM 문법만 쓴다고 자동 보장되지 않는다

ESM은 정적 dependency/export 구조를 가지므로 bundler의 tree shaking에 유리하다.

```javascript
// math.js
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;

// app.js
import { add } from './math.js';
```

Bundler는 사용되지 않는 export를 제거할 가능성이 있다.

하지만 실제 제거 여부는 다음에도 영향을 받는다.

```text
Module Side Effect
Bundler 설정
Package의 sideEffects metadata
동적 접근 방식
Build Mode
```

따라서:

```text
ESM = 사용하지 않은 코드는 무조건 삭제
```

가 아니라:

```text
ESM의 정적 구조
→ Tree Shaking을 가능하게 하는 중요한 조건
```

으로 이해하는 편이 정확하다.

## 6. Node.js에서는 어떤 모듈 시스템인지 먼저 결정해야 한다

Node.js에서는 파일 확장자와 `package.json`의 `type` 등에 따라 CommonJS/ESM 해석 방식이 달라질 수 있다.

대표적으로:

```json
{
  "type": "module"
}
```

을 사용하면 해당 package scope의 `.js`를 ESM으로 해석하는 구성이 가능하다. `.mjs`와 `.cjs`를 사용해 의도를 명시할 수도 있다.

문제가 생겼을 때는 `require`와 `import` 문법만 바꾸기 전에 **현재 파일이 어느 module system으로 해석되고 있는지**를 먼저 확인한다.

```text
package.json type
파일 확장자
실행 환경(Node / Browser / Bundler)
        ↓
현재 Module System 결정
        ↓
require / import 사용 방식 결정
```

## 비교 정리

| 비교축 | CommonJS | ESM |
|---|---|---|
| 대표 문법 | `require`, `module.exports` | `import`, `export` |
| 의존 관계 | 실행 중 동적으로 결정 가능 | 정적 import는 실행 전 분석 가능 |
| 정적 import 위치 | 해당 없음 | 모듈 최상위 |
| 동적 로딩 | `require()` | `import()` Promise |
| Export 모델 | `module.exports` 객체 | Export binding |
| 정적 분석 | 상대적으로 어려움 | 구조적으로 유리 |
| Tree Shaking | Tooling이 분석하기 까다로울 수 있음 | 정적 구조 때문에 유리 |

## 정리

`require`와 `import`를 비교할 때 가장 중요한 질문은 "어느 문법이 최신인가"가 아니다.

```text
CommonJS
→ 실행 흐름 중심 Module Loading

ESM
→ 선언적 Module Graph 중심
```

이 차이에서 조건부 로딩, static analysis, tree shaking, circular dependency의 동작 차이가 이어진다. **문법보다 먼저 현재 코드가 어떤 모듈 모델 위에서 동작하는지 확인하는 것**이 핵심이다.
