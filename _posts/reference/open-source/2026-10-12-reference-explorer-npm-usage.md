---
title       : "npm 패키지를 블로그에서 쓰는 두 가지 방식 — install 번들링과 CDN 로딩"
description : "reference-explorer를 npm에 배포하며, 정적 블로그에서 npm 패키지를 빌드에 포함할지 CDN으로 직접 로드할지 비교한 기록."
date        : 2026-10-12 10:20:00 +0900
categories  : [reference, "open-source"]
tags        : [npm, package, cdn, jekyll, javascript, open-source, web-component]
pin         : false
hidden      : false
---

`@clang.engineer/reference-explorer`를 npm에 배포하면서 한 가지 구조 결정을 다시 보게 됐다. npm 패키지를 "쓴다"고 해도 실제 적용 방식은 하나가 아니다. 특히 Jekyll 같은 정적 블로그에서는 다음 두 방식이 갈린다.

```text
1. npm install 후 블로그 빌드에 포함한다.
2. npm CDN에서 브라우저가 직접 로드한다.
```

둘 다 npm 패키지를 사용하는 방식이지만, 의존성이 걸리는 시점과 운영 성격이 다르다.

## 배경: devkit 데이터와 explorer UI를 분리했다

Devkit에는 도구 관계와 치트시트 목록을 담은 공개 JSON이 있다.

```text
https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json
```

처음에는 블로그가 devkit 저장소의 explorer UI 코드를 빌드 시점에 복사해 `/command-map/` 페이지에서 사용했다. 하지만 이 구조는 경계가 애매했다.

```text
UI 코드
  devkit explorer
  ↓ blog build-time copy
  blog assets/devkit-runtime

데이터
  devkit reference/catalog.json
  ↓ browser runtime fetch
  command-map page
```

데이터는 런타임에 직접 읽는데, UI는 빌드 시점에 devkit 내부 구조를 알아야 했다. devkit은 reference data의 원본이고, 블로그는 host인데, viewer 코드가 devkit에 섞여 있으니 패키징 책임이 흐려졌다.

그래서 viewer를 npm 패키지로 분리했다.

```text
devkit
  = reference/catalog.json 원본

@clang.engineer/reference-explorer
  = catalog-like 데이터를 화면으로 보여주는 viewer

blog
  = viewer를 붙이고 catalog URL을 넘기는 host
```

## 방식 1: npm install 후 빌드에 포함

가장 일반적인 방식은 블로그 저장소에 패키지를 설치하고, 기존 JavaScript 빌드 파이프라인에 포함하는 것이다.

```bash
npm install @clang.engineer/reference-explorer
```

그 다음 블로그의 JavaScript entrypoint에서 import한다.

```js
import { mount } from '@clang.engineer/reference-explorer';
import '@clang.engineer/reference-explorer/style.css';

const root = document.querySelector('[data-reference-explorer]');

if (root) {
  mount(root, {
    catalogUrl: root.dataset.catalog,
    defaultView: root.dataset.defaultView,
  });
}
```

Jekyll include는 mount 지점과 데이터 위치만 제공한다.

```html
<section
  data-reference-explorer
  data-default-view="map"
  data-catalog="https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json"
  aria-label="Devkit 도구 탐색">
  <p>Devkit 데이터를 불러오는 중...</p>
</section>
```

이 방식에서는 패키지가 블로그의 빌드 결과물에 포함된다.

```text
blog source
  ↓ npm install
node_modules/@clang.engineer/reference-explorer
  ↓ Rollup / Vite / Webpack 등으로 bundle
blog assets/js/dist/...
  ↓ browser
```

장점은 재현성이다. `package.json`과 lockfile에 버전이 남고, 최종 사이트는 자기 asset만 제공한다. 외부 CDN이 페이지 로딩 경로에 끼지 않는다.

대신 블로그의 JavaScript 빌드 구성을 만져야 한다. CSS import를 번들러가 처리하는지, 별도 CSS로 복사해야 하는지, Jekyll asset 경로와 어떻게 맞출지도 확인해야 한다.

## 방식 2: npm CDN에서 직접 로드

다른 방식은 npm에 올라간 패키지를 CDN으로 직접 로드하는 것이다. 예를 들어 jsDelivr를 쓰면 HTML include만으로 붙일 수 있다.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@clang.engineer/reference-explorer@0.1.0/src/styles/explorer.css">

<reference-explorer
  src="https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json"
  default-view="map">
</reference-explorer>

<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@clang.engineer/reference-explorer@0.1.0/src/element.js">
</script>
```

이 방식에서는 브라우저가 패키지 파일을 런타임에 CDN에서 가져온다.

```text
browser
  ↓
npm CDN에서 reference-explorer JS/CSS 로드
  ↓
devkit raw catalog fetch
  ↓
화면 렌더링
```

장점은 블로그 빌드 파이프라인을 거의 건드리지 않는다는 점이다. Jekyll include에 Web Component tag와 script만 두면 된다. 블로그 안에 별도 JavaScript 관리층을 늘리고 싶지 않을 때 특히 단순하다.

단점은 외부 CDN 의존성이다. CDN 장애, 캐시 정책, 보안 정책, CSP(Content Security Policy)를 고려해야 한다. 버전을 고정하지 않고 `latest`를 쓰면 예기치 않은 변경이 바로 반영될 수 있으므로, 정적 블로그에서는 `@0.1.0`처럼 버전을 명시하는 편이 안전하다.

## 두 방식의 차이

| 기준 | npm install 후 번들링 | CDN 직접 로딩 |
|---|---|---|
| 의존 시점 | 빌드 시점 | 런타임 |
| 블로그 코드 변경 | JS entrypoint와 빌드 설정 필요 | HTML include 중심 |
| 외부 CDN 의존 | 없음 | 있음 |
| 버전 고정 | `package.json` / lockfile | URL의 버전 문자열 |
| 최종 asset | 블로그가 직접 제공 | CDN에서 제공 |
| 적합한 경우 | 재현성과 자체 호스팅 우선 | 블로그 관리층 최소화 우선 |

둘 중 하나가 항상 정답은 아니다. 이미 Vite나 Rollup으로 애플리케이션 JavaScript를 관리하는 프로젝트라면 install 후 번들링이 자연스럽다. 반대로 Jekyll 문서 사이트에서 특정 페이지 하나에만 붙는 widget이라면 CDN 방식이 더 단순할 수 있다.

## explorer는 catalog 위치가 아니라 입력 모델에 의존해야 한다

패키지로 분리하면서 중요한 기준은 `reference-explorer`가 devkit 저장소 URL에 직접 묶이지 않게 하는 것이었다.

나쁜 방향은 viewer 내부에 특정 URL을 고정하는 것이다.

```js
fetch('https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json');
```

이렇게 하면 패키지가 devkit 전용 구현이 된다. 대신 host가 데이터를 어디서 가져올지 정하고, viewer는 입력만 받는 구조가 낫다.

```js
mount(root, {
  catalogUrl: 'https://raw.githubusercontent.com/clang-engineer/devkit/main/reference/catalog.json',
});
```

또는 데이터를 직접 주입할 수 있다.

```js
mount(root, {
  catalog,
});
```

더 분리하면 devkit catalog를 viewer 내부 모델로 바꾸는 adapter를 따로 둔다.

```js
import { mount } from '@clang.engineer/reference-explorer';
import { fromDevkitCatalog } from '@clang.engineer/reference-explorer/adapters/devkit';

const catalog = await fetch(url).then((response) => response.json());

mount(root, {
  model: fromDevkitCatalog(catalog),
});
```

이렇게 하면 core viewer는 "devkit의 파일 경로"가 아니라 "탐색 가능한 model"에 의존한다. devkit은 그 model을 만들 수 있는 데이터 원본 중 하나가 된다.

## npm 배포에서 확인한 점

패키지는 npm에 다음 이름으로 배포했다.

```text
@clang.engineer/reference-explorer
```

처음에는 GitHub 계정명에 맞춰 `@clang-engineer/reference-explorer`를 생각했지만, npm scope는 npm 사용자나 organization 기준이다. 현재 npm 사용자명은 `clang.engineer`였기 때문에 실제 scope는 `@clang.engineer`가 맞았다.

배포 명령은 다음과 같다.

```bash
npm publish --access public
```

공개 scoped package는 `--access public`을 명시해야 한다. 2FA가 켜져 있으면 publish 과정에서 브라우저 인증이나 OTP 입력이 필요하다.

배포 확인은 `npm view`로 한다.

```bash
npm view @clang.engineer/reference-explorer version
```

출력이 다음처럼 나오면 registry에 반영된 것이다.

```text
0.1.0
```

이미 배포된 version은 다시 publish할 수 없다.

```text
You cannot publish over the previously published versions: 0.1.0.
```

수정이 필요하면 `package.json`의 version을 올리고 다시 publish한다.

## 이번 경우의 판단

`reference-explorer`는 블로그에 붙는 작은 viewer지만, 블로그 안에 계속 JS 관리층을 늘리고 싶지는 않았다. 그렇다고 devkit 저장소에 UI 패키징까지 계속 남기면 devkit이 data source와 viewer를 동시에 소유하게 된다.

그래서 경계를 이렇게 잡았다.

```text
devkit
  reference/catalog.json 관리

@clang.engineer/reference-explorer
  catalog/model을 화면으로 표현

blog
  CDN으로 viewer를 로드하고 catalog URL만 제공
```

장기적으로 애플리케이션 JavaScript 안에서 깊게 통합한다면 install 후 번들링이 더 재현 가능하다. 하지만 이번처럼 특정 Jekyll page에 widget처럼 붙이는 단계에서는 CDN Web Component 방식이 더 단순했다. 블로그에는 include만 남고, devkit에는 데이터 원본만 남는다.

중요한 것은 어느 방식을 택하든 viewer가 데이터 원본 저장소의 내부 경로에 직접 묶이지 않고, host가 데이터 위치를 결정하도록 두는 것이다.
