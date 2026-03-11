---
layout: post
title: "Spring Boot + Webpack SPA 프로젝트 설정"
date: 2025-02-12 11:00:00 +0900
categories: [dev, java]
tags: [spring-boot, webpack, react, typescript, spa]
summary: "Spring Boot에서 Webpack을 사용한 SPA 프로젝트 구성 가이드"
---

Spring Boot를 이용하여 SPA(Single Page Application) 프로젝트를 개발할 때 Webpack 설정을 단계별로 정리합니다.

프로젝트 생성 도구(create-react-app, vue-cli 등)를 사용하면 Webpack 설정을 자동으로 생성해주지만, 프로젝트 구조를 변경하기 어렵고 커스터마이징이 제한적입니다. 특히 Spring Boot와 연동하는 경우 더욱 그렇습니다.

JHipster가 생성해주는 SPA 프로젝트 구조를 참고하여 Webpack 설정을 직접 구성하는 방법을 기록합니다.

## Step 1. Spring Boot 프로젝트에 Webpack 기본 설정 추가

### 프로젝트 구조

```
project-root/
├── src/main/webapp/
│   ├── app/
│   │   └── index.js          # webpack 빌드 시작점
│   └── index.html             # HtmlWebpackPlugin이 사용할 템플릿
├── webpack/
│   └── webpack.dev.js         # webpack 설정 파일
└── package.json
```

### Webpack 설정 파일 생성

`webpack/webpack.dev.js`:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.js'),
  output: {
    path: path.resolve(__dirname, '../build/resources/main/static/'),
  },
  mode: 'development',
  devServer: {
    port: 9000,
    open: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/main/webapp/index.html'),
      title: 'Webpack Dev Server Example',
    }),
  ],
};
```

### package.json 파일 생성

```json
{
  "name": "webpack-spa",
  "description": "default webpack configuration for spa",
  "scripts": {
    "start": "npm run webapp:dev --",
    "webapp:dev": "npm run webpack-dev-server -- --config webpack/webpack.dev.js",
    "webpack-dev-server": "webpack serve",
    "webapp:build:dev": "webpack --config webpack/webpack.dev.js"
  },
  "devDependencies": {
    "webpack": "5.74.0",
    "webpack-cli": "4.10.0",
    "webpack-dev-server": "4.10.1",
    "html-webpack-plugin": "5.5.0"
  },
  "engines": {
    "node": ">=16.17.0"
  }
}
```

## Step 2. JavaScript 대신 TypeScript 사용하기

TypeScript를 사용하면 코드의 가독성을 높이고 타입 안정성을 확보할 수 있습니다.

### 1. ts-loader, typescript 의존성 추가

```bash
npm install --save-dev typescript ts-loader
```

### 2. Webpack 설정 파일 수정

```javascript
module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.ts'),
  resolve: {
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
```

### 3. tsconfig.json 파일 생성

ts-loader가 작동하기 위해 tsconfig.json 파일이 필요합니다.

```json
{
  "compilerOptions": {
    "esModuleInterop": true
  },
  "include": [
    "src/main/webapp/app"
  ]
}
```

## Step 3. React 사용하기

### 1. React 의존성 추가

```bash
npm install --save react react-dom @types/react @types/react-dom
```

### 2. Webpack 설정 파일 수정

```javascript
module.exports = {
  entry: path.resolve(__dirname, '../src/main/webapp/app/index.tsx'),
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
```

### 3. index.tsx 파일 생성

`src/main/webapp/app/index.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => <h1>Hello, React Without Babel!</h1>;

ReactDOM.render(<App />, document.getElementById('root'));
```

### 4. index.html 파일 수정

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

### 5. tsconfig.json 파일 수정

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

> React 17 이상에서는 `"jsx": "react-jsx"`를 사용합니다.

## Step 4. SCSS 사용하기

SCSS를 사용하면 CSS를 더 쉽게 작성할 수 있습니다.

### 1. sass, sass-loader, style-loader, css-loader 의존성 추가

```bash
npm install --save-dev sass sass-loader style-loader css-loader
```

### 2. Webpack 설정 파일 수정

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
};
```

**Loader 순서가 중요합니다:**
1. `sass-loader` → SCSS를 CSS로 변환
2. `css-loader` → CSS를 JavaScript로 변환
3. `style-loader` → JavaScript로 변환된 CSS를 `<style>` 태그로 삽입

## 최종 설정 파일

### package.json

```json
{
  "name": "webpack-spa",
  "version": "0.0.1-SNAPSHOT",
  "scripts": {
    "start": "npm run webapp:dev --",
    "webapp:dev": "npm run webpack-dev-server -- --config webpack/webpack.dev.js",
    "webpack-dev-server": "webpack serve",
    "webapp:build:dev": "webpack --config webpack/webpack.dev.js"
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
  }
}
```

### webpack/webpack.dev.js

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

### tsconfig.json

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

## 실행하기

```bash
# 개발 서버 시작
npm start

# 빌드
npm run webapp:build:dev
```

## 관련 문서

Gradle과 통합하는 방법은 [Spring Boot + Gradle 설정 가이드](/posts/spa-gradle/)를 참고하세요.
