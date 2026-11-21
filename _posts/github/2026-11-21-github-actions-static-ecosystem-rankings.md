---
title       : "GitHub Actions와 Web Component로 서버 없는 랭킹 시스템 만들기"
description : "공통 Collector와 Viewer를 분리하고 각 사용자 저장소에 YAML 설정, GitHub Actions, JSON 스냅샷을 두는 정적 랭킹 시스템의 구조를 기록한다."
date        : 2026-11-21 15:10:00 +0900
categories  : [github, actions]
tags        : [github-actions, web-component, jekyll, json, yaml, architecture]
pin         : false
hidden      : false
---

분야별 오픈소스 프로젝트 랭킹을 블로그에 표시하려면 외부 API에서 데이터를 수집하고, 기간별 변화량을 계산하고, 브라우저에서 보여줘야 한다. 이를 위해 별도 서버나 데이터베이스를 운영할 필요가 있을까?

[Ecosystem](/ecosystem/)은 **GitHub Actions + JSON + Web Component**를 조합하는 방식을 선택했다.

## 공통 코드는 한 곳에, 설정과 데이터는 사용자 저장소에

처음에는 수집기 프로젝트 저장소에서 랭킹을 생성하도록 구성했다. 하지만 그렇게 하면 패키지를 설치한 다른 사용자의 설정과 데이터까지 공통 저장소에 모으는 형태가 된다.

원하는 것은 서비스형 랭킹 사이트가 아니라 **기존 블로그에 설치하는 재사용 가능한 도구**였다. 그래서 책임을 나눴다.

```text
ecosystem-rankings (공통 패키지)
├─ Collector ─── GitHub API 수집 및 집계
├─ Action ────── Collector 실행 인터페이스
└─ Viewer ────── JSON을 표시하는 Web Component
                         │
                         ▼
각 사용자 저장소
├─ ecosystems.yml                  무엇을 수집할지
├─ .github/workflows/              언제 실행할지
│  └─ ecosystem-rankings.yml
└─ data/
   ├─ rankings.json                화면용 결과
   └─ history.json                 기간 계산용 이력
```

GitHub Actions는 실행 시점을 담당하고 Collector는 설정 파일을 읽어 데이터를 만든다. Viewer는 YAML을 직접 해석하지 않고 **Collector가 생성한 JSON**만 읽는다.

## 설정 파일 하나로 수집과 표시를 연결한다

`ecosystems.yml`은 수집 분야와 기본 표시 기간을 정의한다.

```yaml
viewer:
  default_period: 7

periods: [7, 30, 0]

ecosystems:
  - id: tmux-plugins
    name: Tmux Plugins
    source: github
    discovery: topic
    topic: tmux-plugin
    searches:
      - "tmux plugin in:name,description"
    limit: 100
```

`7`과 `30`은 일 단위 기간, `0`은 전체 누적 Stars를 뜻한다. 기본 표시 기간은 7일이지만 기록이 충분하지 않으면 Viewer가 전체 누적 순위를 **임시 결과임을 알리며** 보여준다.

수집기는 `periods`와 `defaultPeriod`도 결과 JSON에 포함한다. 덕분에 블로그의 HTML 속성을 수정하지 않고 YAML 설정만으로 초기 표시 기간을 바꿀 수 있다.

## 스냅샷으로 기간별 변화량 계산하기

누적 Stars만 저장하면 현재 순위는 만들 수 있지만 주간·월간 증가량은 계산할 수 없다.

```text
날짜          Stars
11월 21일     1,200
11월 28일     1,235
               └── 7일 증가량: +35
```

Collector는 날짜별 `id`, `date`, `stars`를 `history.json`에 기록한다. 기간별 수치는 현재 값에서 해당 기간 이전의 이용 가능한 스냅샷 값을 빼서 계산한다.

처음 실행한 날에는 7일 전 데이터가 없다. 이때 `0`으로 기록하면 **증가량이 0인 것과 아직 측정할 수 없는 것**을 구별할 수 없다. 따라서 기간별 값은 `null`로 남긴다.

수집이 매일 정확히 같은 시각에 실행된다는 보장도 없다. 날짜별 스냅샷의 비교는 설정한 기간의 근사치이며, 수집 간격과 누락된 실행에 따라 실제 기간과 차이가 날 수 있다.

## 왜 Jekyll의 `_data/`가 아니라 `data/`인가

Jekyll의 `_data/`는 템플릿이 빌드 중 읽는 내부 데이터 폴더다. 반면 Viewer는 브라우저에서 JSON을 요청한다.

```text
_data/  → Jekyll 빌드 중 site.data로 사용
data/   → 빌드 결과에서 정적 파일로 공개
```

따라서 랭킹 JSON은 `data/rankings.json`에 두고 Web Component에서 직접 읽는다.

```html
<ecosystem-rankings src="/data/rankings.json"></ecosystem-rankings>
```

이렇게 하면 Jekyll 전용 템플릿을 만들지 않아도 되고 다른 정적 사이트에도 같은 Viewer를 붙일 수 있다.

## GitHub Actions는 실행기이지 수집기가 아니다

워크플로는 일정을 지정하고 공통 Action을 호출한다.

```yaml
name: Update Ecosystem Rankings
on:
  workflow_dispatch:
  schedule:
    - cron: '17 1 * * *'

permissions:
  contents: write

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: clang-engineer/ecosystem-rankings@main
        with:
          token: ${{ github.token }}
```

위 예시는 **수집 호출 부분만** 보여준다. 실제 사용자 워크플로에는 변경된 JSON을 `git add`, `commit`, `push`하는 단계도 필요하다. 또한 운영 환경에서는 `@main`보다 검증된 릴리스 또는 커밋 SHA 고정이 안전하다.

별도 서버 없이 자동 수집할 수 있다는 장점이 있지만, JSON 변경 커밋이 블로그 배포까지 트리거할 수 있다는 운영상의 고려도 남는다.

## 정리

이 구조의 핵심은 파일의 역할을 구분하는 데 있다.

- YAML: 무엇을 수집하고 어떤 기간을 기본으로 보여줄지
- GitHub Actions: 언제 수집할지
- Collector: 어떻게 수집·계산할지
- JSON: 결과와 과거 기록을 어디에 저장할지
- Viewer: 데이터를 어떻게 보여줄지

공통 코드는 [ecosystem-rankings](https://github.com/clang-engineer/ecosystem-rankings)에 두고, 각 사이트는 설정과 수집 결과를 소유한다. 설치 안내와 최신 옵션은 프로젝트 README를 기준으로 관리한다.

검색 결과의 정확도 문제는 별도 글인 [GitHub 검색으로 오픈소스 생태계를 탐색할 때 생기는 문제]({{ '/posts/github/2026-11-21-github-open-source-ecosystem-search/' | relative_url }})에서 다룬다.
