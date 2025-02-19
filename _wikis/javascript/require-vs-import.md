---
layout  : wiki
title   : Require vs Import
summary : 
date    : 2024-11-20 09:01:06 +0900
updated : 2024-11-20 09:01:06 +0900
tags    : 
toc     : true
public  : true
parent  : [[javascript/index]]
latex   : false
---
* TOC
{:toc}

# Require vs Import
- 'require'는 CommonJS의 모듈 시스템에서 사용되는 키워드이고 'import'는 ES6의 모듈 시스템에서 사용되는 키워드이다.

## Require
- 주로 Node.js 환경에서 사용된다.
- 동기적으로 모듈을 로드하며, 실행 시점에서 모듈을 불러오는 방식.
- module.exports와 함께 사용되며, JavaScript 파일을 module.exports로 내보내고 다른 파일에서 require를 통해 가져옴.

```javascript
// module.js
module.exports = {
  name: 'module'
};

// index.js
const module = require('./module');
console.log(module.name); // module
```

## Import
- ES6(ECMAScript 2015) 표준에 도입된 모듈 시스템. 현재는 대부분의 최신 브라우저와 Node.js에서 지원됨.
- 비동기적으로 모듈을 로드하며, 선언적 방식으로 작성됩니다. 주로 export와 함께 사용됩니다.
- 정적 구조로 모듈을 분석하기 때문에 트리 쉐이킹(tree shaking) 같은 최적화가 가능합니다.

```javascript
// module.js
export const name = 'module';

// index.js
import { name } from './module';
console.log(name); // module
```

# 주요 차이점
- 환경: require는 Node.js의 CommonJS 모듈 시스템으로, 서버 측 개발에서 주로 사용. 반면, import는 표준 ECMAScript 모듈 시스템(ESM)으로 브라우저와 Node.js(최신 버전) 모두에서 사용 가능.
- 동기/비동기 로딩: require는 동기적으로 모듈을 로드하는 반면, import는 비동기적이고 모듈을 정적으로 분석함.
- 호이스팅(hoisting): import 문은 파일 최상단에 위치해야 하며, require는 코드 어디에서든 호출될 수 있음.

# 참고
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
