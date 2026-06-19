---
title       : "Spring Boot + Webpack SPA 프로젝트 설정 (Webpack + Gradle)"
description : "Spring Boot에서 Webpack으로 SPA 프론트엔드를 구성하고 Gradle 빌드에 통합하는 전체 가이드"
date        : 2025-02-12 11:00:00 +0900
updated     : 2026-06-19 09:00:00 +0900
categories  : [javascript, "Node·번들러"]
tags        : [spring-boot, webpack, react, spa, gradle]
pin         : false
hidden      : false
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

## Step 5. Gradle 빌드에 통합하기

여기까지 Webpack 빌드 설정이 완료되었습니다. 이제 Gradle을 통해 프론트엔드 빌드를 함께 수행하고, 빌드 결과물을 Spring Boot의 static 디렉토리로 포함시키도록 설정합니다.

### 1. Gradle에서 Node를 사용하기 위한 설정

`build.gradle` 파일의 `plugins` 섹션에 node plugin을 추가합니다. `settings.gradle`을 통해 plugin을 별도 설정하지 않고 `build.gradle`에 설정하는 방식으로 진행합니다.

```groovy
plugins {
    // ...
    id "com.github.node-gradle.node" version "3.4.0"
}
```

### 2. Gradle에서 npm을 사용하기 위한 설정

`build.gradle` 파일에 npm task를 추가합니다.

```groovy
task webapp(type: NpmTask) {  // npm task 선언
    inputs.property('appVersion', project.version) // 현재 프로젝트 버전을 입력값으로 설정해 task의 변경 여부를 체크하도록 설정
    inputs.files("package-lock.json").withPropertyName('package-lock').withPathSensitivity(PathSensitivity.RELATIVE)  // package-lock.json 파일을 입력값으로 설정하여 변경 여부를 체크하도록 설정
    inputs.files("build.gradle").withPropertyName('build.gradle').withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("src/main/webapp/").withPropertyName("webapp-source-dir").withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.files("tsconfig.json").withPropertyName("tsconfig").withPathSensitivity(PathSensitivity.RELATIVE)

    def webpackDevFiles = fileTree("webpack/")  
    // webpackDevFiles.exclude("webpack.prod.js")  // 운영 환경 설정을 별도로 관리하는 경우에는 해당 설정을 추가하여 webpack.prod.js 파일을 제외하도록 설정
    inputs.files(webpackDevFiles).withPropertyName("webpack-dir").withPathSensitivity(PathSensitivity.RELATIVE)  // webpack 설정 파일을 입력값으로 설정하여 변경 여부를 체크하도록 설정
    outputs.dir("build/resources/main/static/").withPropertyName("webapp-build-dir")  // webpack 빌드 결과물을 spring boot의 static 디렉토리로 복사하기 위한 설정

    dependsOn npmInstall // npm install task가 실행되기 전에 실행되도록 설정

    args = ["run", "webapp:build"]  // npm script 실행 명령어 설정
    environment = [APP_VERSION: project.version]  // 환경 변수 설정
}

processResources.dependsOn webapp  // processResources task가 실행되기 전에 webapp task를 실행하도록 설정
bootJar.dependsOn processResources  // bootJar task가 실행되기 전에 processResources task를 실행하도록 설정
```

#### 주요 설정 설명

- **inputs**: Task의 입력값을 정의하여 변경 여부를 추적합니다. 입력값이 변경되지 않으면 task를 재실행하지 않아 빌드 성능이 향상됩니다.
- **outputs**: Task의 출력값을 정의합니다.
- **dependsOn**: Task 간의 의존성을 설정합니다.
- **args**: npm 명령어 인자를 설정합니다.
- **environment**: 환경 변수를 설정하여 npm 스크립트에 전달할 수 있습니다.

> 위 task는 `webapp:build` npm script를 실행합니다. 운영 빌드용 webpack 설정(`webpack.prod.js`)과 함께 `package.json`에 해당 script를 추가해 두어야 합니다.

### 3. React Router 404 에러 방지를 위한 Forward 설정

Spring Boot에서 react-router-dom을 사용할 때 발생하는 404 에러 처리를 위한 설정을 추가합니다.

아래 컨트롤러는 프론트엔드 라우팅을 지원하기 위한 목적입니다. 백엔드에서 매핑되지 않은 모든 요청(웹소켓 제외)은 프론트엔드의 **단일 페이지 애플리케이션(SPA)**으로 포워딩됩니다.

```java
// ClientForwardController.java
@Controller
class ClientForwardController {
    @GetMapping(value = ["/{path:[^\\.]*}", "/{path:^(?!websocket).*}/**/{path:[^\\.]*}"])
    fun forward() = "forward:/"
}
```

#### PathPatternParser 이슈 해결

Spring Boot 2.6 이상에서는 `PathPatternParser`가 기본으로 사용되어 `/**/`와 정규식을 함께 사용하는 경우 오류가 발생합니다.

만약 위 오류가 있다면 `spring.mvc.pathmatch.matching-strategy=ant_path_matcher` 설정으로 해결하거나 패턴을 간소화해야 합니다.

```yml
# application.yml
spring:
  mvc:
    pathmatch:
      matching-strategy: ant_path_matcher  
```
