---
title       : JS 공용 패키지 관리 (npm workspaces + GitHub Packages)
description : 모노레포로 JS/TS 패키지를 관리하고 GitHub Packages에 수동 배포하는 방법
date        : 2026-02-21 10:00:00 +0900
updated     : 2026-02-21 10:00:00 +0900
categories  : [dev, javascript]
tags        : [shared-package, npm, github-packages, workspaces, publishing]
pin         : false
hidden      : false
---

팀에서 공용으로 쓰는 JS/TS 라이브러리를 여러 모듈로 나눠 관리하고, GitHub Packages에 수동으로 배포하는 방식을 정리한다. 모노레포 + npm workspaces 구조를 기본으로 한다.

## 목적과 대상

- 여러 프로젝트에서 재사용하는 유틸/검증/컴포넌트 패키지를 한 저장소에서 관리하고 싶을 때
- npm 레지스트리를 GitHub Packages로 운영하고 싶을 때
- CI 자동화 전에 수동 배포 루틴을 먼저 정리하고 싶을 때

## 저장소 구조

모노레포 구조를 사용한다. 각 패키지는 `packages/*` 아래에 위치한다.

```
repo-root/
├─ package.json
└─ packages/
   ├─ utils/
   ├─ validation/
   └─ components/
```

루트 `package.json`에서 workspaces를 선언해 공통 작업을 한 번에 수행한다.

```json
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "clean": "npm run clean --workspaces"
  }
}
```

## 패키지 기본 설정

각 패키지 `package.json`에 빌드 결과와 레지스트리 정보를 지정한다.

```json
{
  "name": "@your-scope/utils",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "rm -rf dist"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

## GitHub Packages 설정

레지스트리와 토큰은 `.npmrc`로 분리해 관리한다. 토큰은 환경 변수로 주입한다.

```ini
@your-scope:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

배포용 토큰을 저장소에 남기지 않으려면 로컬 전용 `~/.npmrc`를 사용한다.

권장 토큰 권한:
- 읽기: `read:packages`
- 배포: `write:packages`
- 필요 시 `repo`

## 수동 빌드/배포 흐름

모든 패키지를 한 번에 빌드/배포한다.

```bash
export GITHUB_TOKEN=your-github-token
npm run build
npm publish --workspaces --access restricted
```

여러 패키지를 함께 배포하므로 버전 정책은 명확히 정해 두는 것이 좋다.

## 버전 전략(수동)

- 기본은 semver 기준으로 `version`을 수동 갱신
- 변경 내용을 짧게라도 기록(CHANGELOG 또는 릴리스 노트)
- 배포 전 `npm run build`로 산출물 확인

## 사용 예시

```bash
npm install @your-scope/utils
```

```ts
import { formatDate } from "@your-scope/utils";
```

## 운영 팁

- 토큰은 저장소에 커밋하지 않고 환경 변수로만 관리
- `files`에 `dist`만 포함해 불필요한 파일 배포 방지
- `--access restricted`로 접근 범위 명확히 설정
- 배포 전후에 `npm view @your-scope/utils`로 메타데이터 확인
