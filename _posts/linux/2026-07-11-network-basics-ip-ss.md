---
title       : "리눅스 네트워크 기초: ip, ss로 갈아타기 + DNS 진단"
description : "ifconfig·netstat·route는 이제 레거시입니다. iproute2(ip·ss)로 인터페이스·라우팅·소켓을 진단하고, /etc/hosts·resolv.conf와 dig·getent로 DNS를 파고드는 표준 흐름."
date        : 2026-07-11 22:00:00 +0900
updated     : 2026-07-11 22:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [network, ip, ss, dns, dig]
pin         : false
hidden      : false
---

서버가 갑자기 통신이 안 됩니다. 핑이 안 나가는 건지, 이름이 안 풀리는 건지, 서비스가 안 뜬 건지, 방화벽이 막은 건지 — 증상은 다 "안 돼요"로 똑같이 보이지만 원인은 계층이 다릅니다. 그런데 대부분의 한국어 자료가 아직도 `ifconfig`·`netstat`로 시작하는데, 최신 배포판 상당수엔 이 명령들이 **기본으로 깔려 있지도 않습니다.**

이 글은 레거시 도구(`net-tools`)에서 현대 표준(`iproute2`의 `ip`·`ss`)으로 갈아타면서, 서버 네트워크를 **아래에서 위로**(인터페이스 → 라우팅 → 소켓 → 이름 해석 → 도달성) 진단하는 흐름을 정리합니다.

---

## 옛 도구 → 새 도구 대응표

먼저 지도부터 잡습니다. `net-tools`(ifconfig·netstat·route·arp)는 오랫동안 표준이었지만 개발이 사실상 멈췄고, 지금은 **`iproute2`가 커널 네트워킹의 정식 인터페이스**입니다. RHEL 8/9·Rocky·최신 Ubuntu 서버 등에는 `net-tools`가 기본 미설치라, 옛 명령을 치면 `command not found`부터 만납니다.

| 하는 일 | 옛 (net-tools) | 새 (iproute2) |
|---|---|---|
| IP·인터페이스 확인 | `ifconfig` | `ip addr` |
| 라우팅 테이블 | `route -n` | `ip route` |
| 소켓·포트 | `netstat -tlnp` | `ss -tlnp` |
| ARP 이웃 | `arp -n` | `ip neigh` |
| 인터페이스 up/down | `ifconfig eth0 up` | `ip link set eth0 up` |

> **`ifconfig`가 없다고 당황하지 마세요.** 그건 시스템이 고장 난 게 아니라 정상입니다. `sudo dnf install net-tools`로 옛 도구를 억지로 되살리기보다, 애초에 어디에나 있는 `ip`·`ss`에 손을 들이는 편이 이식성이 좋습니다.
{: .prompt-tip }

---

## `ip` — 인터페이스·주소·라우팅

`ip`는 하위 객체(`addr`·`route`·`link`·`neigh`)를 골라 쓰는 구조입니다. 축약도 되지만(`ip a`, `ip r`) 글에선 명확하게 풀어 씁니다.

```bash
ip addr                 # 모든 인터페이스와 붙은 IP (ifconfig 대체)
ip -br addr             # brief — 한 줄 요약, 상태 확인용으로 가장 자주 씀
ip route                # 라우팅 테이블 + 기본 게이트웨이 (route 대체)
ip link                 # 인터페이스 목록·MTU·MAC (IP 없이 링크 계층만)
ip neigh                # ARP 이웃 테이블 (arp 대체)
```

`ip -br addr`의 출력이 실전에서 제일 유용합니다 — 인터페이스가 `UP`인지, IP가 붙었는지 한눈에 들어옵니다.

```bash
ip -br addr
# lo      UNKNOWN  127.0.0.1/8 ::1/128
# eth0    UP       192.168.1.20/24 fe80::.../64
# docker0 DOWN     172.17.0.1/16
#  │       │        └ 붙은 IP
#  │       └ 링크 상태 (UP / DOWN)
#  └ 인터페이스 이름
```

기본 게이트웨이가 없거나 엉뚱하면 외부로 나가는 통신이 통째로 안 됩니다. `ip route`의 `default` 줄이 첫 확인 대상입니다.

```bash
ip route
# default via 192.168.1.1 dev eth0    ← 이 줄이 없으면 외부 통신 불가
# 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.20
```

인터페이스를 껐다 켜거나 임시 IP를 붙일 수도 있습니다.

```bash
sudo ip link set eth0 down          # 인터페이스 내리기
sudo ip link set eth0 up            # 올리기
sudo ip addr add 192.168.1.50/24 dev eth0   # IP 임시 추가
```

> **`ip addr add`로 붙인 IP는 재부팅하면 사라집니다.** `ip`는 커널의 현재 상태를 바꿀 뿐, 설정 파일에 쓰지 않습니다. 영구 설정은 배포판마다 다르며(아래 경고 참조), 이 글은 **진단**에 집중합니다.
{: .prompt-warning }

---

## `ss` — 소켓·포트 현황

`ss`(socket statistics)는 `netstat`의 후계자입니다. `/proc`를 긁는 `netstat`보다 커널에서 직접 읽어 훨씬 빠르고, 옵션 문법은 거의 그대로라 손이 금방 익습니다.

```bash
ss -tlnp        # TCP LISTEN 포트 + 프로세스 (netstat -tlnp 대체, 가장 많이 씀)
ss -tunap       # TCP·UDP 전부 + 프로세스 (a=all, u=UDP 포함)
ss -tn          # 활성 TCP 연결 (ESTABLISHED 등)
ss -s           # 소켓 요약 통계 (전체 개수 한눈에)
```

플래그 의미를 한 번 정리하면 조합이 편해집니다.

| 플래그 | 의미 |
|---|---|
| `-t` | TCP |
| `-u` | UDP |
| `-l` | LISTEN 중인 소켓만 |
| `-n` | 포트를 이름 대신 **숫자**로 (DNS 조회 안 해서 빠름) |
| `-p` | 소켓을 연 **프로세스**(PID·이름) 표시 — 보통 `sudo` 필요 |
| `-a` | LISTEN + 연결까지 전부 |

"이 서버가 어떤 포트를 열고 있나"는 거의 항상 `ss -tlnp` 하나로 끝납니다.

```bash
sudo ss -tlnp
# State   Local Address:Port   Process
# LISTEN  0.0.0.0:22           users:(("sshd",pid=812,fd=3))
# LISTEN  127.0.0.1:5432       users:(("postgres",pid=1103,fd=5))
#          │       │            └ 어떤 프로세스가 잡았는지
#          │       └ 포트
#          └ 바인드 주소 (0.0.0.0=모든 IP, 127.0.0.1=로컬 전용)
```

바인드 주소도 놓치기 쉬운 함정입니다. `127.0.0.1:5432`처럼 로컬에만 바인드된 서비스는 **외부에서 접속이 안 되는 게 정상**입니다 — 방화벽 문제로 오인하기 쉽습니다.

> **"포트 누가 잡았나"는 [프로세스 글](/posts/linux/2026-06-16-process-find-and-kill/)의 `lsof -iTCP:PORT`와 겹칩니다.** 둘은 관점이 다릅니다 — `ss`는 **네트워크 스택 전반**(모든 소켓·상태·통계)을, `lsof`는 **파일/프로세스 관점**(이 프로세스가 연 것 전부)을 봅니다. 포트 하나만 콕 집을 땐 `lsof -iTCP:4000`이, 전체 소켓 현황이 필요하면 `ss -tlnp`가 낫습니다.
{: .prompt-tip }

---

## DNS 진단 — 이름이 안 풀릴 때

핑은 IP로는 나가는데 도메인으로는 안 나간다면 이름 해석(name resolution) 문제입니다. 리눅스가 이름을 푸는 경로부터 잡아야 합니다.

| 파일 | 역할 |
|---|---|
| `/etc/hosts` | 로컬 정적 매핑. **DNS보다 먼저** 참조됨 |
| `/etc/resolv.conf` | 질의할 네임서버(`nameserver ...`) 목록 |
| `/etc/nsswitch.conf` | `hosts:` 줄이 **조회 순서**(files → dns 등)를 결정 |

`/etc/hosts`에 잘못된 줄이 있으면 DNS가 멀쩡해도 엉뚱한 IP로 갑니다. 조회 순서상 여기가 이기기 때문입니다.

**조회 도구**는 목적이 조금씩 다릅니다.

```bash
dig example.com                 # 권장 — 상세·정확, 어떤 네임서버가 뭘 답했는지
dig +short example.com          # IP만 간결하게
host example.com                # 가벼운 요약
nslookup example.com            # 대화형에 익숙하면 (레거시 취급)
getent hosts example.com        # OS resolver 경로로 조회 (hosts + DNS 통합)
```

> **`dig`와 `getent`의 차이를 아는 게 DNS 디버깅의 핵심입니다.** `dig`는 DNS 서버에 **직접** 물어봅니다 — `/etc/hosts`나 `nsswitch.conf` 순서를 무시합니다. 반면 `getent hosts`는 **실제 앱이 이름을 푸는 경로 그대로**(hosts → DNS)를 밟습니다. `dig`는 되는데 접속이 안 되면, `getent hosts`로 다시 확인해 보세요 — `/etc/hosts`의 오염이나 `nsswitch.conf` 순서 문제가 드러납니다.
{: .prompt-tip }

`systemd-resolved`를 쓰는 시스템(최신 Ubuntu 등)에서는 `/etc/resolv.conf`가 스텁(`127.0.0.53`)을 가리켜서 실제 네임서버가 안 보입니다. 이땐 전용 명령을 씁니다.

```bash
resolvectl status               # 인터페이스별 실제 DNS 서버·도메인
resolvectl query example.com    # resolved를 통한 조회
```

---

## 연결 진단 흐름 — 아래에서 위로

증상이 "안 돼요"일 때, 계층을 낮은 쪽부터 하나씩 올라가며 좁힙니다.

```bash
# 1) 링크·IP·게이트웨이가 정상인가
ip -br addr
ip route

# 2) 도달성 — IP까지 패킷이 가는가
ping -c 3 8.8.8.8          # 외부 IP로 (DNS 배제)
ping -c 3 example.com      # 도메인으로 (DNS까지 포함)

# 3) 이름 해석 — 위 둘의 결과가 갈리면 DNS 문제
getent hosts example.com

# 4) 경로 추적 — 어디서 막히는가
traceroute example.com     # 홉별 지연
mtr example.com            # traceroute + ping 실시간 (더 유용)

# 5) HTTP 계층 — 서비스가 실제로 응답하는가
curl -I https://example.com     # 헤더만 (상태 코드 확인)
curl -v https://example.com     # 핸드셰이크·리다이렉트까지 상세

# 6) 내 호스트명 확인
hostname                   # 짧은 호스트명
hostnamectl                # 호스트명·OS·커널 종합
```

`ping 8.8.8.8`은 되는데 `ping example.com`이 안 되면 3단계(DNS)가 범인입니다. 둘 다 안 되면 1~2단계(링크·라우팅·게이트웨이)를 봅니다. `curl`까지 왔다면 이미 네트워크는 통한 것이고, 문제는 애플리케이션 계층입니다.

---

## 서비스가 안 뜬 건가, 방화벽이 막은 건가

접속이 안 될 때 가장 헷갈리는 두 원인 — **서비스가 애초에 안 떴다** vs **떴는데 방화벽이 막았다** — 는 순서를 정해 구분합니다.

```bash
# 1) 먼저 LISTEN 여부 확인
sudo ss -tlnp | grep :443
```

- **아무것도 안 나온다** → 서비스가 뜨지 않았거나 다른 포트/주소에 바인드됨. 방화벽 문제가 아닙니다. 서비스부터 띄웁니다.
- **`127.0.0.1:443`으로만 LISTEN** → 로컬 전용 바인드. 외부 접속 불가가 정상. 앱 설정에서 `0.0.0.0`으로 바꿔야 합니다.
- **`0.0.0.0:443`으로 LISTEN 중인데도 외부에서 안 됨** → 이제야 방화벽을 의심할 차례입니다.

즉 **`ss`로 LISTEN을 먼저 확인 → 그 다음 방화벽**이 순서입니다. 방화벽 쪽 확인·개방은 [방화벽 글](/posts/linux/2026-07-11-firewalld-ufw-basics/)에서 `firewalld`·`ufw`로 따로 정리했습니다.

---

## 영구 설정은 배포판마다 다르다

> **IP·DNS를 재부팅 후에도 유지하는 방법은 배포판·환경마다 완전히 다릅니다.** `ip addr add`는 임시일 뿐이니, 영구 설정은 각 도구로 넘어가세요.
>
> - **RHEL/Rocky·Ubuntu 데스크톱**: NetworkManager — `nmcli con mod ...`
> - **Ubuntu 서버**: netplan — `/etc/netplan/*.yaml` 편집 후 `netplan apply`
> - **구형 Debian**: `/etc/network/interfaces` 직접 편집
>
> 이 글은 **진단**에 집중합니다. 어느 시스템이든 `ip`·`ss`로 현재 상태를 읽는 법은 동일하고, 그걸 파일에 굳히는 방법만 위처럼 갈립니다.
{: .prompt-warning }

---

> 📎 **치트시트** · [linux](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/linux.md) — ip·ss·dig 네트워크 진단 빠른 참조 (GitHub)
{: .prompt-tip }

---

## 대중성·대안

- `ip`/`ss` (**iproute2**) — **현재 표준**. 모든 최신 리눅스 배포판 기본 포함. 커널 네트워킹의 정식 인터페이스이고, `net-tools`는 사실상 유지보수 종료된 레거시입니다. 갈아탈지 말지의 문제가 아니라 이미 갈아타 있어야 하는 쪽.
- `ifconfig`/`netstat`/`route` (**net-tools**) — 손에 익어 여전히 쓰이지만 **기본 미설치 배포판이 많아** 이식성이 떨어집니다. 새로 배운다면 `ip`·`ss`로.
- `dig` (**bind-utils/dnsutils**) — DNS 조회의 사실상 표준. `nslookup`은 레거시 취급, `host`는 가벼운 대안.
- `mtr` — `traceroute` + `ping`을 합친 실시간 경로 진단. 경로 문제엔 `traceroute`보다 정보량이 많아 선호됩니다(별도 설치 필요할 수 있음).
- `getent hosts` — 조회 도구가 아니라 **OS resolver 경로 검증기**. `dig`와 역할이 겹치지 않고 보완합니다.

결론: 서버 네트워크 진단은 `ip -br addr` / `ip route`로 링크·라우팅을 잡고 → `ss -tlnp`로 소켓을 확인하고 → 이름이 안 풀리면 `getent hosts`·`dig`로 DNS를 파는 흐름이면 사실상 끝납니다. `ifconfig`·`netstat`는 이제 놓아주세요.
