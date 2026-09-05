---
title       : "GitHub Actions Secrets vs Variables — 민감도와 적용 범위를 분리해서 설계하기"
description : "GitHub Actions 설정 값을 Secrets와 Variables 중 어디에 둘지 먼저 민감도로 구분하고 Repository·Environment·Organization 적용 범위를 별도 축으로 정리한다."
date        : 2025-10-22 12:54:06 +0900
updated     : 2026-09-05 19:30:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, actions, secrets, variables, comparison]
pin         : false
hidden      : false
---

GitHub Actions의 설정 값을 관리할 때는 두 질문을 분리해야 한다.

```text
이 값은 민감한가?
→ Secrets vs Variables

이 값은 어디까지 공유해야 하나?
→ Repository vs Environment vs Organization
```

`Secrets/Variables`와 `Repository/Environment/Organization`은 같은 분류축이 아니다. **첫 번째는 값의 성격, 두 번째는 적용 범위**를 결정한다.

이 두 축을 먼저 나누면 CI/CD 설정을 훨씬 일관되게 설계할 수 있다.

## 1. Secrets와 Variables — 값의 민감도로 구분한다

| 비교축 | Secrets | Variables |
|---|---|---|
| 목적 | 민감 정보 저장 | 일반 설정 값 저장 |
| 대표 값 | Token, Password, Private Key | 환경명, 경로, 일반 옵션 |
| Workflow 접근 | `${{ secrets.NAME }}` | `${{ vars.NAME }}` |
| UI에서 저장 값 재확인 | 제한됨 | 확인·수정 가능 |
| 로그 취급 | 알려진 Secret 값의 마스킹 기능 제공 | 일반 값이므로 그대로 노출될 수 있음 |

핵심 기준은 단순하다.

```text
노출되면 Credential·보안 문제가 생기는가?
├─ Yes → Secret
└─ No  → Variable 후보
```

다만 Secret masking을 **민감 값을 마음대로 로그에 출력해도 되는 보안 경계**로 생각하면 안 된다. 로그에는 Secret을 직접 출력하지 않는 것이 기본이다.

## 2. 적용 범위 — Repository, Environment, Organization

값의 민감도를 정했다면 그다음 어디에서 사용할지 결정한다.

```text
Organization
  └─ 여러 Repository에서 공유

Repository
  └─ 한 Repository 전체

Environment
  └─ 한 Repository 안의 특정 배포 환경
```

### Repository 수준

한 저장소의 여러 workflow에서 공통으로 사용할 값에 적합하다.

예:

```text
Repository 전용 API Credential
공통 Build 설정
저장소 단위 배포 값
```

### Environment 수준

`development`, `staging`, `production`처럼 같은 저장소 안에서도 **배포 대상에 따라 값과 보호 정책을 분리**할 때 적합하다.

```text
Repository
├─ development Environment
│    └─ 개발 서버용 값
└─ production Environment
     └─ 운영 서버용 값
```

Environment는 값 저장 위치뿐 아니라 deployment protection rule과 함께 사용할 수 있다는 점이 중요하다.

### Organization 수준

여러 repository가 공통으로 사용하는 값에 적합하다. 조직 정책에 따라 어떤 repository가 해당 Secret/Variable을 사용할 수 있는지도 함께 관리한다.

## 3. 두 축을 조합한다

예를 들어 서버 배포 값을 분류해보자.

| 값 | 민감도 | 범위 예시 | 선택 |
|---|---|---|---|
| SSH Private Key | 민감 | production | Environment Secret |
| API Token | 민감 | repository 전체 | Repository Secret |
| 배포 Environment 이름 | 일반 | environment | Environment Variable |
| 애플리케이션 경로 | 일반 | environment | Environment Variable |
| 여러 저장소 공통 Credential | 민감 | organization | Organization Secret |

중요한 것은 이름에 `DEV_`, `PROD_`를 붙이는 것보다 **Environment 자체로 경계를 표현할 수 있는지 먼저 보는 것**이다.

## 4. Development / Production 분리 예

GitHub Repository의 `Settings → Environments`에서:

```text
development
production
```

Environment를 만든다고 하자.

각 Environment에 같은 논리 이름을 두되 값만 다르게 관리할 수 있다.

```text
development
├─ Secret: SSH_PRIVATE_KEY
├─ Variable: SERVER_HOST
└─ Variable: SERVER_PATH

production
├─ Secret: SSH_PRIVATE_KEY
├─ Variable: SERVER_HOST
└─ Variable: SERVER_PATH
```

이렇게 하면 workflow에서 환경별 접두사인 `DEV_`, `PROD_`를 계속 분기하기보다 **선택된 Environment의 동일한 설정 이름**을 사용할 수 있다.

## 5. Workflow에서 Environment를 선택한다

예를 들어 production 배포 job이라면:

{% raw %}
```yaml
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: |
          ssh \
            "${{ vars.SERVER_USER }}@${{ vars.SERVER_HOST }}" \
            -p "${{ vars.SERVER_PORT }}"
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
```
{% endraw %}

여기서:

```text
environment: production
        ↓
production Environment의
Secrets / Variables 사용
```

이라는 관계가 만들어진다.

Private Key를 실제 `ssh` 명령에 사용하려면 임시 파일이나 `ssh-agent` 등 적절한 key 전달 단계가 별도로 필요하다. 위 예시는 **값을 어떤 계층에서 선택하는지**에 초점을 둔 최소 구조다.

## 6. 선택 순서

값 하나를 추가할 때 다음 순서로 판단하면 된다.

```text
1. 민감한가?
   ├─ Yes → Secret
   └─ No  → Variable

2. 어디까지 공유하는가?
   ├─ 특정 Environment → Environment
   ├─ Repository 전체  → Repository
   └─ 여러 Repository   → Organization
```

즉 `Environment Secret`은 Secret의 다른 종류라기보다 **민감한 값을 Environment 범위에 둔 조합**으로 이해하면 쉽다.

## 7. 보안에서 별도로 생각할 것

Secrets를 사용한다고 배포 보안이 자동으로 해결되는 것은 아니다.

별도로 고려할 수 있는 항목은:

```text
Environment 승인 규칙
최소 권한 Token
OIDC 기반 단기 Credential
Self-hosted Runner 보안
SSH 접근 경로
Cloud Firewall / Security Group
```

특히 GitHub-hosted runner의 네트워크 출발점을 단순한 고정 IP 하나로 가정해 방화벽 규칙을 설계하면 운영이 어려울 수 있다. 네트워크 허용 정책은 사용하는 runner와 인프라 구조에 맞춰 별도로 설계한다.

## 정리

GitHub Actions 설정 관리는 한 표에서 전부 결정하는 문제가 아니다.

```text
값의 성격
├─ Secret
└─ Variable

적용 범위
├─ Repository
├─ Environment
└─ Organization
```

먼저 **민감도**, 그다음 **범위**라는 서로 다른 두 축으로 판단하면 환경별 CI/CD 설정이 훨씬 명확해진다.
