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
    output: {
    path: path.resolve(__dirname, '../build/resources/main/static/'),  // webpack 빌드 결과물이 저장될 디렉토리를 지정
  },
  mode: 'development',  // 개발모드로 설정 (production, development, none) 중 선택
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
    "webapp:dev": "npm run webpack-dev-server -- --config webpack/webpack.dev.js",  // --config 옵션을 사용해서 webpack 설정파일을 전달
    "webpack-dev-server": "webpack serve"
  },
  "devDependencies": {
    "webpack": "5.74.0",  // 실제 웹팩을 사용하기 위한 패키지
    "webpack-cli": "4.10.0",  // 웹팩을 커맨드라인에서 사용하기 위한 패키지
    "webpack-dev-server": "4.10.1",  // 웹팩 개발서버를 사용하기 위한 패키지 -> 웹팩의 빌드 결과물을 메모리에 올려서 사용할 수 있게 해줌
    "html-webpack-plugin": "5.5.0",  // html파일을 빌드 결과물에 포함시켜주는 플러그인 (사용자가 직접 html파일을 만들어서 빌드 결과물에 포함시키지 않아도 됨)
    "webapp:build:dev": "webpack --config webpack/webpack.dev.js"  // webpack을 사용해서 빌드하는 명령어
  },
  "engines": {
    "node": ">=16.17.0"
  },
  "cacheDirectories": [
    "node_modules"
  ]
}
```

---

# step2. javascript대신 typescript 사용하기
- typescript를 사용하면 코드의 가독성을 높일 수 있고, 타입스크립트의 장점을 활용할 수 있습니다.
- ts-loader를 사용하여 typescript를 웹팩에서 사용할 수 있습니다.
- ts-loader는 tsconfig.json 파일을 참조하여 빌드를 수행하기 때문에 tsconfig.json 파일을 반드시 생성해야 합니다.

1. tsloader, typescript 의존성 추가
```bash
npm install --save-dev typescript ts-loader
```


2. webpack 설정파일 수정
```javascript
// webpack/webpack.dev.js
module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.ts'),  // js 대신 ts 파일을 사용
  // ...
  resolve: {
    extensions: ['.js', '.ts'], // .ts 파일을 읽을 수 있도록 설정
  },
  // ts-loader 설정
  module: {
    rules: [
      {
        test: /\.ts$/, // TypeScript 파일을 처리
        use: 'ts-loader', // ts-loader 사용
        exclude: /node_modules/, // node_modules는 제외
      },
    ],
  },
  // ...
};
```

3. tsconfig.json 파일 생성
- ts-loader가 작동하기 위해서 tsconfig.json파일이 반드시 필요하므로 우선적으로 빈 tsconfig.json 파일을 생성합니다.

---

# step3. react 사용하기
- webpack + typescript 설정에 react관련 설정을 추가합니다.

1. react, react-dom 의존성 추가
- react를 사용하기 위해서는 react, react-dom 패키지를 설치해야 합니다.
```bash
npm install --save react react-dom @types/react @types/react-dom
```

2. webpack 설정파일 수정
```javascript
// webpack/webpack.dev.js
module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.tsx'),  // ts 대신 tsx 파일을 사용
  // ...
  resolve: {
    extensions: ['.js', '.ts', '.tsx'], // .tsx 파일을 읽을 수 있도록 설정
  },
  // ts-loader 설정
  module: {
    rules: [
      {
        test: /\.tsx?$/, // .tsx 파일을 읽을 때 ts-loader를 사용하도록 설정
        use: 'ts-loader', 
        exclude: /node_modules/, // node_modules는 제외
      },
    ],
  },
  // ...
};
```

3. index.tsx 파일 생성
- src/main/webapp/app 디렉토리에 index.tsx 파일을 생성합니다.
```tsx
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => <h1>Hello, React Without Babel!</h1>;

ReactDOM.render(<App />, document.getElementById('root'));
```

4. index.html 파일 수정
- src/main/webapp/index.html 파일을 수정합니다.
```html
<!-- src/main/webapp/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Webpack Dev Server Example</title>
</head>
<body>
<div id="root"></div>
</body>
</html>
```


5. tsconfig.json 파일 수정
- tsconfig.json 파일을 수정하여 jsx를 사용할 수 있도록 설정합니다.
```json
{
  "compilerOptions": {
    "jsx": "react",   // jsx를 사용할 수 있도록 설정, 17버전부터는 "react-jsx"로 변경됨
    "esModuleInterop": true  // import React from 'react'; 를 사용할 수 있도록 설정
  },
  "include": [
    "src/main/webapp/app"   // typescript 파일이 위치한 디렉토리를 지정
  ]
}
```

---

# 최종 설정

## package.json
```json
{
  "name": "webpack-spa",
  "version": "0.0.1-SNAPSHOT",
  "private": true,
  "description": "Description for webpack-spa",
  "license": "UNLICENSED",
  "scripts": {
    "start": "npm run webapp:dev --",
    "webapp:dev": "npm run webpack-dev-server -- --config webpack/webpack.dev.js",
    "webpack-dev-server": "webpack serve",
    "webapp:build:dev": "webpack --config webpack/webpack.dev.js"
  },
  "config": {
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-router-dom": "6.3.0"
  },
  "devDependencies": {
    "webpack": "5.74.0",
    "webpack-cli": "4.10.0",
    "webpack-dev-server": "4.10.1",
    "html-webpack-plugin": "5.5.0",
    "typescript": "4.8.2",
    "ts-loader": "9.3.1",
    "@types/react": "^18.0.26",
    "@types/react-dom": "18.0.6",
    "sass": "1.54.8",
    "sass-loader": "13.0.2",
    "style-loader": "3.3.1",
    "css-loader": "6.7.1"
  },
  "engines": {
    "node": ">=16.17.0"
  },
  "cacheDirectories": [
    "node_modules"
  ]
}

```

## webpack/webpack.dev.js
```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.tsx'),
  output: {
    path: path.resolve(__dirname, '../build/resources/main/static/'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  mode: 'development',
  devServer: {
    port: 9000,
    open: true,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/main/webapp/index.html'),
      title: 'Webpack Dev Server Example',
    }),
  ],
};

```

## tsconfig.json
```json
{
  "compilerOptions": {
    "jsx": "react",
    "esModuleInterop": true
  },
  "include": [
    "src/main/webapp/app"
  ]
}
```

## src/main/webapp/app/index.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => <h1>Hello, React Without Babel!</h1>;

ReactDOM.render(<App />, document.getElementById('root'));
```

## src/main/webapp/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Webpack Dev Server Example</title>
</head>
<body>
<div id="root"></div>
</body>
</html>
```

## src/main/webapp/app/index.scss
```scss
body {
  background-color: #f0f0f0;
}
```
---