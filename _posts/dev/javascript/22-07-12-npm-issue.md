---
title       : npm 관련 에러
description : >-
date        : 2022-07-12 09:00:45 +0900
updated     : 2022-07-14 09:01:11 +0900
categories  : [dev, javascript]
tags        : [npm]
pin         : false
hidden      : false
---

## unable to resolve dependency tree
- npm install 에러 발생시 --force 또는 --legacy 옵션을 사용

```
npm install --force
npm install --legacy-peer-deps
```
 
### --legacy vs --force
--force를 하면 package-lock.json에 몇가지의 다른 의존 버전들을 추가한다.
--legacy를 하면 peerDependency가 맞지 않아도 일단 설치한다.

> You have the option to retry with --force to bypass the conflict or --legacy-peer-deps command to ignore peer dependencies entirely (this behavior is similar to versions 4-6). - in npm github blog


### 아래와 같이 실행 스크립트에 기본옵션으로 추가도 가능
```sh
"legacy-peer-deps=true" >> .npmrc
```

---

## npm install 설치시 npm ERR! code ERESOLVE 에러가 발생한다면
npm install 뒤에 '--save --legacy-peer-deps' 를 추가해주면 된다.
```sh
$ npm install --save --legacy-peer-deps
```


---

## Can not find module npm-cli

### 환경변수 추가

환경변수의 제일 앞에 nodejs경로를 재설정 해준다

```cmd
SET PATH=C:\Program Files\Nodejs;%PATH%
```

