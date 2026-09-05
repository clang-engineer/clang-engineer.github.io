---
title       : "Tableau Trusted Ticket — 임베딩 인증과 발급 실패 진단"
description : "Tableau Server 뷰를 외부 애플리케이션에 임베딩할 때 Trusted Ticket이 흐르는 구조와 신뢰 호스트 등록, curl 발급 확인, 실패 로그 진단 절차를 정리한다."
date        : 2025-01-01 00:00:00 +0900
updated     : 2026-09-05 22:05:00 +0900
categories  : [tableau, "인증·임베딩"]
tags        : [sso, iframe, embed, trusted-ticket, troubleshooting]
pin         : false
hidden      : false
---

외부 웹 애플리케이션에 Tableau Server 뷰를 임베딩할 때 사용자가 Tableau에 다시 로그인하지 않게 하려면 Trusted Ticket 방식을 사용할 수 있다.

핵심 흐름은 다음과 같다.

```text
사용자
  ↓
외부 애플리케이션
  ↓ 사용자 식별 정보로 Ticket 요청
Tableau Server /trusted
  ↓ 일회용 Ticket
외부 애플리케이션
  ↓ Ticket을 포함한 View 요청
Tableau View
```

따라서 문제가 생기면 iframe 자체보다 먼저 **Ticket 요청이 Tableau까지 정상적으로 도달하고 발급되는지**를 분리해서 확인한다.

## 1. 먼저 신뢰 관계를 확인한다

Tableau Server는 아무 서버가 사용자를 대신해 Ticket을 요청하도록 허용하지 않는다. Ticket을 요청하는 애플리케이션 서버가 Trusted Authentication의 신뢰 대상에 포함되어 있어야 한다.

Tableau Server 관리 화면 또는 TSM 설정에서 Trusted Authentication 구성을 확인하고, 실제 Ticket 요청을 보내는 서버의 주소가 허용되어 있는지 본다.

여기서 중요한 구분은 다음과 같다.

```text
브라우저 IP
≠ 반드시 Ticket 요청 서버 IP
```

Trusted Ticket을 서버 측에서 발급한다면 Tableau가 보는 요청 주체는 보통 애플리케이션 서버다. 어떤 컴포넌트가 실제 `/trusted` 요청을 보내는지 먼저 확인한다.

## 2. iframe보다 `/trusted` 발급부터 검증한다

전체 임베딩 흐름을 한 번에 디버깅하지 않는다. 먼저 `/trusted` 요청 하나만 떼어낸다.

```bash
curl -k -X POST \
  --data-urlencode "username=<tableau-user>" \
  --data-urlencode "client_ip=<client-ip>" \
  https://<tableau-server>/trusted
```

`/trusted`는 JSON API처럼 호출하는 것이 아니라 form-urlencoded 파라미터를 받는다.

```text
성공
→ Ticket 문자열 반환

실패
→ -1
```

Ticket 문자열이 정상적으로 나온다면:

```text
Trusted Authentication 설정
        ↓ 정상
Ticket 발급
        ↓ 정상
그 다음 View URL / iframe / 브라우저 문제 확인
```

반대로 여기서 `-1`이 나오면 iframe을 볼 단계가 아니다. Trusted Authentication 설정과 Tableau 로그부터 본다.

`client_ip`는 환경과 설정에 따라 필요한 경우에만 사용한다. 무조건 넣기보다 현재 Trusted Ticket 구성에서 client IP 검증을 사용하는지 확인한다.

## 3. 실패하면 Tableau 로그로 내려간다

Ticket 발급이 실패하면 먼저 관련 로그의 진단 수준을 높이고 실패 요청을 다시 재현한다.

```bash
tsm configuration set -k vizqlserver.trustedticket.log_level -v debug
tsm pending-changes apply
```

설정 변경의 실제 적용 방식은 사용 중인 Tableau Server 버전과 운영 정책에 맞춰 확인한다. 무조건 서버 전체를 재부팅하기보다 `tsm pending-changes apply` 결과와 필요한 서비스 재시작 여부를 먼저 확인하는 편이 안전하다.

대표적인 로그 위치는 설치 환경에 따라 다음 계열에서 찾는다.

```text
Windows
C:\ProgramData\Tableau\Tableau Server\data\tabsvc\logs\...

Linux
/var/opt/tableau/tableau_server/data/tabsvc/logs/...
```

정확한 로그 파일명과 경로는 Tableau Server 버전에 따라 달라질 수 있으므로 현재 설치본의 로그 디렉터리를 기준으로 찾는다.

진단 순서는 단순하다.

```text
1. /trusted 요청이 실제 Tableau에 도달하는가
2. 요청한 username이 Tableau에 존재하는가
3. 요청 서버가 Trusted Authentication 대상인가
4. client_ip 검증 조건이 있다면 값이 맞는가
5. Tableau 로그가 거부 이유를 무엇이라고 기록하는가
```

## 4. 전체 문제를 계층별로 분리한다

Trusted Ticket 임베딩 문제는 한 덩어리처럼 보이지만 실제로는 여러 단계다.

```text
[인증 설정]
Trusted host / user / site
        ↓
[Ticket 발급]
POST /trusted
        ↓
[View 접근]
Ticket을 사용한 Tableau URL
        ↓
[브라우저 임베딩]
iframe / cookie / browser policy
```

예를 들어 `/trusted`에서 이미 `-1`이 나온다면 브라우저 쿠키나 iframe 정책을 조사할 이유가 없다.

반대로 Ticket은 정상 발급되는데 임베딩만 실패한다면 인증 발급층은 통과한 것이므로 View URL, Site 지정, 브라우저 정책 등 다음 층으로 내려간다.

## 정리

Trusted Ticket 문제의 핵심은 **전체 iframe 화면을 보며 추측하지 않고 인증 흐름을 단계별로 끊어 검증하는 것**이다.

```text
Trusted 설정 확인
→ curl로 Ticket 발급 단독 검증
→ 실패하면 Tableau 로그
→ 성공하면 View 접근
→ 마지막에 iframe / 브라우저 확인
```

이 순서로 보면 `-1` 하나만 나오는 막막한 문제도 어느 층에서 실패했는지 빠르게 좁힐 수 있다.
