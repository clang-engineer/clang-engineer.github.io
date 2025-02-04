---
layout  : wiki
title   : Spring Boot 를 이용한 SPA 프로젝트에서 Webpack 설정하기
summary : 
date    : 2025-02-04 20:18:27 +0900
updated : 2025-02-04 20:18:34 +0900
tags    : 
toc     : true
public  : true
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}

# Spring Boot 를 이용한 SPA 프로젝트에서 Webpack 설정하기
- Spring Boot 를 이용하여 SPA(Single Page Application) 프로젝트를 개발할 때 Webpack 설정을 기록합니다.
- 프로젝트 생성 도구(ex> create-react-app, vue-cli, ...)를 사용하면 Webpack 설정을 자동으로 생성해주지만, 프로젝트 구조를 변경하기 어렵고, 커스터마이징이 어렵다는 단점이 있었습니다. (특히, Spring Boot와 연동하는 경우)
- jhipster가 생성해주는 spa 프로젝트 구조를 참고하여 Webpack 설정을 직접 구성하는 방법을 기록합니다.

---

# step1. spring boot 프로젝트에 webpack기본 설정 추가

## 프로젝트 구조
- 프로젝트 루트 디렉토리에 src/main/webapp 디렉토리를 생성합니다.
- src/main/webapp/app 디렉토리에 index.js 파일을 생성합니다.  >> 이 파일은 webpack 빌드시 시작점으로 사용합니다.
- src/main/webapp 디렉토리에 index.html 파일을 생성합니다.  >> 이 파일은 webpack의 HtmlWebpackPlugin 플러그인이 사용해서 js파일을 로딩할때 사용합니다.


## webpack 설정 파일 생성
- 프로젝트 루트 디렉토리에 webpack 디렉토리를 생성합니다.
- webpack 디렉토리에 webpack.dev.js 파일을 생성합니다.

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.js'),  // webpack 빌드 시작점
  mode: 'development',
  devServer: {
    port: 9000,
    open: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/main/webapp/index.html'), // HtmlWebpackPlugin 플러그인이 사용해서 js파일을 로딩할때 사용하는 html파일
      title: 'Webpack Dev Server Example',
    }),
  ],
};
```

## package.json 파일 생성
- 프로젝트 루트 디렉토리에 package.json 파일을 생성합니다.

```json
{
  "name": "webpack-spa",
  "description": "default webpack configuration for spa",
  "scripts": {
    "start": "npm run webapp:dev --",  // -- 는 뒤에 따로오는 옵션을 앞에 있는 명령어에 전달하기 위함
    "webapp:dev": "npm run webpack-dev-server -- --config webpack/webpack.dev.js",
    "webpack-dev-server": "webpack serve"
  },
  "devDependencies": {
    "webpack": "5.74.0",  // 실제 웹팩을 사용하기 위한 패키지
    "webpack-cli": "4.10.0",  // 웹팩을 커맨드라인에서 사용하기 위한 패키지
    "webpack-dev-server": "4.10.1",  // 웹팩 개발서버를 사용하기 위한 패키지 -> 웹팩의 빌드 결과물을 메모리에 올려서 사용할 수 있게 해줌
    "html-webpack-plugin": "5.5.0"  // html파일을 빌드 결과물에 포함시켜주는 플러그인 (사용자가 직접 html파일을 만들어서 빌드 결과물에 포함시키지 않아도 됨)
  },
  "engines": {
    "node": ">=16.17.0"
  },
  "cacheDirectories": [
    "node_modules"
  ]
}
```