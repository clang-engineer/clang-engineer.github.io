---
title       : "GitHub Actions 예약 실행과 블로그 재배포를 분리한 기록"
description : "schedule과 cron으로 정기 작업을 실행하는 방법, 그리고 devkit 데이터를 직접 조회하도록 바꾸며 불필요한 블로그 재배포를 제거한 기록."
date        : 2026-10-04 21:00:00 +0900
categories  : [github, actions]
tags        : [github-actions, cron, jekyll, chirpy, deployment]
pin         : false
hidden      : false
---

GitHub Actions는 코드를 push할 때뿐 아니라 정해진 시간에도 workflow를 실행할 수 있다. 별도 서버의 cron을 운영하지 않아도 정기적인 링크 검사나 외부 데이터 확인을 수행할 수 있다.

블로그에서 이 기능을 데이터 동기화에 사용하려 했지만, 데이터 확인과 사이트 배포를 같은 주기로 묶을 필요는 없었다. 이 글은 예약 실행 방법과 그 구성을 제거한 이유를 기록한다.

## 예약 실행은 workflow의 트리거다

`.github/workflows/` 아래 workflow의 `on`에 `schedule`을 선언한다. 아래는 예약 실행과 수동 실행을 확인하는 예시다. 현재 블로그 배포 설정에 추가하는 코드는 아니다.

```yaml
name: Scheduled check

on:
  schedule:
    - cron: "17 */6 * * *"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Confirm trigger
        run: echo "Triggered by ${{ github.event_name }}"
```

`schedule`은 예약 시각에 workflow를 시작하고, `workflow_dispatch`는 Actions 화면에서 수동으로 시작할 수 있게 한다. 실제로 무엇을 검사하거나 배포할지는 `jobs`와 `steps`에 정의한다. 예약 실행 자체가 자동 배포를 뜻하지는 않는다.

기본 브랜치에 파일을 반영한 뒤 Actions에서 workflow를 선택해 수동 실행을 확인할 수 있다. 예약 실행 기록은 실행 상세의 이벤트가 `schedule`인지 확인한다. 수동 실행 성공은 작업의 동작을 확인하는 것이며, 예약 시각의 실행을 보장하는 것은 아니다.

## cron 표현식과 시간대

cron은 분·시·일·월·요일의 다섯 필드로 구성된다.

| 필드 | 예시 값 | 의미 |
|---|---|---|
| 분 | `17` | 매 실행 시각의 17분 |
| 시 | `*/6` | 0·6·12·18시 |
| 일 | `*` | 매일 |
| 월 | `*` | 매월 |
| 요일 | `*` | 모든 요일 |

시간대를 지정하지 않은 예시는 UTC 기준이다. 한국 시간으로는 다음과 같다.

| UTC 예정 시각 | 한국 예정 시각 |
|---|---|
| 00:17 | 09:17 |
| 06:17 | 15:17 |
| 12:17 | 21:17 |
| 18:17 | 다음 날 03:17 |

`*/6`은 마지막 실행이 끝난 뒤 6시간을 기다리는 간격이 아니라, 시 필드에서 지정된 시각을 선택하는 표현이다.

현재 공식 문서는 `timezone`에 IANA 시간대 이름을 지정하는 방식도 지원한다. 한국 시간으로 매일 오전 9시 17분에 실행하려면 다음처럼 쓸 수 있다.

```yaml
on:
  schedule:
    - cron: "17 9 * * *"
      timezone: "Asia/Seoul"
```

## 정확한 시각을 보장하는 스케줄러는 아니다

예약 workflow는 기본 브랜치의 최신 커밋에서 실행하며, workflow 파일도 기본 브랜치에 있어야 한다. 실행 간격은 최소 5분이다.

GitHub Actions의 부하에 따라 실행이 지연될 수 있고, 부하가 심하면 대기 중인 작업이 누락될 수도 있다. 매시 정각은 혼잡한 시각으로 안내되므로 분을 분산하는 것이 도움이 되지만, 17분을 선택했다고 정시 실행이 보장되지는 않는다. 공개 저장소는 60일 동안 활동이 없으면 예약 workflow가 자동으로 비활성화될 수 있다.

따라서 링크 검사·주기적 데이터 확인처럼 실행 지연을 허용하는 작업에 적합하다. 정확한 시각이나 실행 누락 없는 처리가 필수라면 그 요구를 보장하는 스케줄러와 재처리 방식을 별도로 선택한다.

## 블로그에서는 왜 예약 배포를 제거했나

처음에는 devkit의 치트시트·CLI 카탈로그를 블로그 빌드 때 가져오도록 구성했다. devkit만 수정해도 블로그에 반영되게 하려고 기존 배포 workflow에 `17 */6 * * *`을 추가했다.

그 구성은 원본에 변경이 없어도 데이터를 가져온 뒤 블로그 전체를 다시 빌드·배포했다. 실제 데이터 변경과 배포 필요 여부를 구분하지 못했다.

Chirpy의 기존 PWA 캐시 설정은 빌드 시각을 이름에 포함한다.

```liquid
{% raw %}cacheName: 'chirpy-{{ "now" | date: "%s" }}'{% endraw %}
```

콘텐츠가 같아도 재빌드하면 캐시 버전이 달라질 수 있으므로, 불필요한 배포는 업데이트 알림이 자주 나타날 조건을 만들 수 있다. 다만 실제 반복 알림이 예약 실행 때문인지, 연속된 push 배포 때문인지, 대기 중인 서비스 워커의 적용 문제인지는 별도로 확인해야 한다. 이 기록은 반복 알림의 원인을 확정한 장애 분석은 아니다.

최종적으로 치트시트와 CLI 지도 모두 브라우저가 devkit의 공개 JSON을 직접 읽도록 바꿨다.

| 책임 | 담당 |
|---|---|
| 치트시트 메타·CLI 관계 데이터 원본 | devkit |
| 목록·탭·검색·상세 화면 | 블로그 JavaScript |
| 일반 글과 페이지 틀의 HTML 생성 | Jekyll |

블로그의 데이터 복사본, 가져오기 스크립트, 6시간 예약 배포를 제거했다. 원본 변경은 GitHub raw 캐시가 갱신된 뒤 다음 페이지 로드에 반영되며, 데이터 변경만으로 블로그를 재배포하지 않는다. 외부 요청 실패 시 목록을 표시할 수 없으므로 재시도 처리는 화면에 남겼다.

예약 작업이 필요한 경우에도 **주기적으로 확인하는 일과 변경이 있을 때 반영하는 일**을 구분해야 한다. 이번 경우에는 직접 조회로 요구를 충족할 수 있어 예약 작업 자체가 필요하지 않았다.

## 참고

- [GitHub Actions — schedule 이벤트](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [블로그 배포 workflow](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/.github/workflows/pages-deploy.yml)
- [devkit CLI 데이터 원본](https://github.com/clang-engineer/devkit/blob/main/reference/cli/catalog.json)
- [devkit 치트시트 카탈로그](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/catalog.json)

예약 실행의 제약과 시간대 지원은 2026-10-04 공식 문서 기준이다.
