---
title       : "Docker Desktop에서 OrbStack으로 옮긴 뒤 — 앱, CLI, context가 서로 다르게 남았다"
description : "macOS에서 컨테이너 런타임을 바꿀 때 Docker 앱, 명령 실행 파일, context, 데이터가 별개 상태인 이유와 잔여 상태를 구분한 경험을 정리한다."
date        : 2026-11-16 12:00:00 +0900
categories  : [macos, "시스템 운영"]
tags        : [docker, docker-desktop, orbstack, homebrew, migration, troubleshooting]
pin         : false
hidden      : false
---

macOS에서 Docker Desktop을 OrbStack으로 바꾼 뒤에도 `docker` 명령이 실행되고, 앱 목록에는 Docker 아이콘이 보이며, `docker context ls`에는 `desktop-linux`가 남아 있었다. 하나만 보고 “제거에 실패했다” 또는 “아직 Docker Desktop이 실행 중이다”라고 결론 내리면 문제를 잘못 고치기 쉽다.

2026년 9월에 겪은 이 정리는 **앱 번들·CLI 실행 파일·Docker context·컨테이너 데이터가 각각 별개 상태**임을 보여 준다. Docker CLI가 계속 실행되는 것은 OrbStack으로의 전환이 성공했을 때도 정상일 수 있다. Docker CLI는 API 클라이언트이고, 어떤 엔진을 향하는지는 context와 연결 설정에 달려 있다.

## 전환 전에 보존할 데이터를 먼저 확인한다

런타임을 교체하기 전에 기존 엔진의 컨테이너·이미지·볼륨을 어떻게 보존할지 정해야 한다. [Docker Desktop 공식 제거 안내](https://docs.docker.com/desktop/uninstall/)는 제거 시 로컬 컨테이너·이미지·볼륨 등의 데이터가 사라질 수 있다고 경고한다. [OrbStack의 이전 안내](https://docs.orbstack.dev/install)는 Docker Desktop의 데이터를 복사해 마이그레이션하는 기능을 제공하며, 설치 시 제안을 받거나 나중에 `orb docker migrate`를 사용할 수 있다고 설명한다. **필요한 데이터의 백업과 이전 결과 확인을 제거보다 앞세운다.** 단순히 context 이름이 남아 있는 것으로 데이터가 이전됐다고 판단하지 않는다.

## 네 층을 따로 보면 모순이 사라진다

| 확인할 것 | 무엇을 알려 주나 | 잘못된 추론 |
|---|---|---|
| `/Applications/Docker.app` | 앱 번들이 물리적으로 남았는가 | Dock 아이콘이 보인다고 실제 앱도 반드시 존재하는가 |
| `command -v docker`, `type -a docker` | 지금 실행할 CLI가 어느 파일인가 | CLI가 있으니 Docker Desktop 엔진이 동작하는가 |
| `docker context ls` | 등록된 엔진 연결 정보와 활성 context | `desktop-linux` 항목이 있으니 그 엔진이 현재 켜졌는가 |
| `docker info` | 선택한 엔진에 실제 연결 가능한가 | context 이름만 맞으면 서버도 정상인가 |

OrbStack은 자체 `docker`·`docker compose` CLI를 제공한다. [공식 설치 문서](https://docs.orbstack.dev/install#command-line-tools)에 따르면 다른 도구의 CLI가 이미 있으면 그대로 남겨 두기도 하고, 앱 시작 시 `/usr/local/bin` 링크와 `~/.orbstack/bin` 경로를 사용한다. 따라서 `/usr/local/bin/docker`를 발견해도 그 위치만으로 제공자를 판별할 수 없다. 링크의 최종 대상과 활성 context를 확인해야 한다. `DOCKER_HOST`처럼 context 선택을 덮는 환경 설정이 있는 경우도 구분한다.

```bash
command -v docker
ls -l "$(command -v docker)"
docker context ls
docker info
```

## 실제 정리에서 가장 먼저 확인한 것은 실행 주체였다

당시 Homebrew cask 제거 후 앱 아이콘과 오래된 context가 남았다. 하지만 그 둘은 다른 문제였다. 먼저 백업을 확인하고 Docker Desktop이 아직 설치돼 있다면 **앱이 제공하는 공식 Uninstall 절차**(`/Applications/Docker.app/Contents/MacOS/uninstall` 또는 GUI)를 따른다. 공식 문서는 그 뒤 앱 번들을 휴지통으로 옮기라고 안내한다. Dock을 다시 띄워 아이콘 캐시를 갱신하는 행위는 앱 제거 그 자체가 아니다.

다음은 OrbStack을 켠 뒤 활성 엔진을 확인한다. 두 엔진을 잠시 병행한다면 context를 전환할 수 있다.

```bash
docker context ls
docker context use orbstack
docker info
```

`desktop-linux`는 예전 Docker Desktop 연결 정의가 남은 것일 수 있다. 아직 롤백이나 데이터 이전을 위해 필요하다면 **지우지 않는다**. 전환을 확인하고 나서 필요 없는 연결만 제거한다. 이 순서가 중요한 이유는 오래된 context 삭제가 컨테이너 데이터를 이전해 주는 명령이 아니기 때문이다.

## 설치 기록만 남고 앱이 손상된 경우는 별도 장애다

당시에는 OrbStack cask 업그레이드/제거 과정에서 `orbctl`을 찾지 못하는 오류도 있었다. 이는 Docker context 문제와 무관한 **설치 기록과 실제 앱 파일의 불일치**였다. 이런 경우 앱 실행 가능 여부와 Homebrew 설치 기록을 먼저 비교하고, 필요하면 해당 cask만 대상으로 재설치를 검토한다. 당시 `brew uninstall --cask --force orbstack` 후 다시 설치해 복구했지만, 강제 제거가 모든 버전·환경에서 필요한 표준 마이그레이션 단계라는 뜻은 아니다. 데이터·설정 경로의 보존 여부를 확인하기 전에 무턱대고 강제 제거하지 않는다.

컨테이너가 `unhealthy`해졌다면 앱 잔재와 섞지 말고 **그 컨테이너의 최초 오류와 리소스·아키텍처 조건**을 별도로 조사한다. 특히 `docker compose down -v`는 볼륨을 지우므로 일반적인 마이그레이션 점검 명령으로 사용해서는 안 된다.

결론은 “Docker Desktop을 지운 뒤 `docker`도 없어야 한다”가 아니다. **어느 앱이 설치되어 있고, 어느 CLI가 실행되며, 지금 어느 엔진에 연결하고, 필요한 데이터가 어디에 있는가**를 각각 확인해야 한다. 이 경계를 분리하면 아이콘 캐시나 오래된 context를 실제 런타임 장애로 오해하지 않으면서 안전하게 이전할 수 있다.
