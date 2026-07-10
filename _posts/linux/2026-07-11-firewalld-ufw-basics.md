---
title       : "리눅스 방화벽 기초: firewalld와 ufw, 그리고 그 아래의 nftables"
description : "firewalld(RHEL/Rocky)와 ufw(Debian/Ubuntu)는 프론트엔드일 뿐이고, 실제 패킷을 거르는 건 커널의 netfilter → nftables/iptables입니다. zone·--permanent 함정·rich rule·SSH 락아웃 경고까지 실무 흐름으로 정리."
date        : 2026-07-11 14:00:00 +0900
updated     : 2026-07-11 14:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [firewall, firewalld, ufw, nftables, iptables, security]
pin         : false
hidden      : false
---

서버에 포트를 열었는데 밖에서 접속이 안 되거나, 반대로 열려 있으면 안 될 포트가 열려 있거나 — 방화벽에서 매번 막힙니다. 그런데 명령이 `firewall-cmd`인지 `ufw`인지, `iptables`는 또 왜 나오는지, `--permanent`를 붙였는데 왜 지금 안 먹히는지에서 헷갈리기 시작합니다.

이 글은 리눅스 방화벽의 **큰 그림**(누가 프론트엔드고 누가 실제 엔진인지)부터 잡고, RHEL/Rocky의 기본인 **firewalld**를 주력으로, Debian/Ubuntu의 **ufw**를 대안으로, 그 아래 **nftables/iptables**까지 한 번에 정리합니다.

---

## 큰 그림: 프론트엔드와 엔진은 다르다

방화벽을 다룰 때 가장 먼저 잡아야 할 건 **명령어 도구와 실제 필터링 엔진이 다른 계층**이라는 사실입니다. 이걸 모르면 "firewalld로 열었는데 iptables에도 뭐가 보인다" 같은 상황에서 혼란스러워집니다.

| 계층 | 무엇 | 예시 |
|---|---|---|
| 관리 도구(프론트엔드) | 사람이 쉽게 규칙을 넣는 관리 계층 | `firewalld` · `ufw` |
| 룰 엔진 | 프론트엔드가 실제로 규칙을 쓰는 곳 | `nftables`(요즘) · `iptables`(구형) |
| 커널 서브시스템 | 진짜로 패킷을 거르는 곳 | 커널의 **netfilter** |

핵심은 이겁니다: **firewalld와 ufw는 스스로 패킷을 거르지 않습니다.** 이들은 사용자가 넣은 규칙을 그 아래 nftables(또는 iptables) 언어로 번역해서 커널 netfilter에 심어줄 뿐입니다. 그래서 firewalld로 포트를 열면 `nft list ruleset`에 그 결과가 그대로 보입니다 — 별개의 시스템이 아니라 같은 엔진의 서로 다른 조작 창구입니다.

직접 `nft`/`iptables`를 만지는 대신 firewalld·ufw를 쓰는 이유는, 이 프론트엔드들이 **zone·서비스 이름·영속 저장·재부팅 복원** 같은 운영에 필요한 것들을 얹어주기 때문입니다.

---

## 배포판 기본값

어떤 프론트엔드가 깔려 있는지는 배포판 계열을 따라갑니다. ([apt/dnf, 계열별 기본값 차이는 여기](/posts/linux/2024-03-23-debian-redhat/) 정리)

| 배포판 | 기본 프론트엔드 | 비고 |
|---|---|---|
| RHEL · Rocky · Fedora · AlmaLinux | **firewalld** | 기본 설치·활성 |
| Ubuntu · Debian | **ufw** | 설치는 되어 있으나 **기본 비활성**인 경우가 많음 |
| 최소 설치(minimal) | 없을 수 있음 | 필요 시 직접 설치 |

Ubuntu에서 "방화벽이 없다"고 느끼는 건 대개 ufw가 설치돼 있지만 `disabled` 상태이기 때문입니다. 컨테이너 이미지나 최소 설치본에는 아예 프론트엔드가 없고 nftables만 있는 경우도 흔합니다.

---

## firewalld — zone부터 이해하기

firewalld의 핵심 개념은 **zone**입니다. iptables가 규칙을 한 줄씩 나열하는 방식이라면, firewalld는 "신뢰 수준별 규칙 묶음"인 zone을 만들어 두고 **네트워크 인터페이스를 zone에 배정**합니다. 같은 규칙이라도 어느 zone에 있느냐로 적용 대상이 갈립니다.

| zone | 성격 |
|---|---|
| `public` | 기본값. 신뢰 안 하는 공개망 (들어오는 연결 대부분 차단) |
| `home` / `work` | 어느 정도 신뢰하는 내부망 |
| `trusted` | 모든 연결 허용 (내부 전용 인터페이스에만) |
| `drop` | 들어오는 건 다 버리고 응답도 안 함 |
| `block` | 거부하되 거부 응답은 보냄 |

현재 상태부터 확인합니다.

```bash
sudo firewall-cmd --state              # running / not running
sudo firewall-cmd --get-active-zones   # 어떤 zone에 어떤 인터페이스가 붙어 있나
sudo firewall-cmd --get-default-zone   # 기본 zone (보통 public)
sudo firewall-cmd --list-all           # 현재 활성 zone의 규칙 전체
```

`--list-all`이 실무에서 가장 자주 보는 명령입니다 — 열린 서비스(`services:`)·포트(`ports:`)·rich rule이 한눈에 나옵니다.

---

## firewalld — 서비스와 포트로 열기

firewalld는 잘 알려진 포트를 **서비스 이름**으로 다룰 수 있습니다. `http`는 80, `https`는 443, `ssh`는 22 식으로 미리 정의돼 있어서 포트 번호를 외울 필요가 없습니다.

```bash
# 서비스 이름으로 열기 (포트 번호를 몰라도 됨)
sudo firewall-cmd --add-service=http
sudo firewall-cmd --add-service=https

# 포트로 직접 열기 (정의된 서비스가 없을 때)
sudo firewall-cmd --add-port=8080/tcp

# 현재 열린 것 확인
sudo firewall-cmd --list-services      # http https ssh ...
sudo firewall-cmd --list-ports         # 8080/tcp ...

# 닫기
sudo firewall-cmd --remove-service=http
sudo firewall-cmd --remove-port=8080/tcp

# 정의된 서비스 목록 보기
sudo firewall-cmd --get-services
```

그런데 위 명령을 그대로 쓰면 **재부팅이나 reload 후에 다 사라집니다.** 여기서 대부분이 걸립니다.

---

## `--permanent`의 함정

firewalld는 규칙을 **런타임(runtime)** 과 **영구(permanent)** 두 곳에 따로 둡니다. 이 분리를 모르면 반드시 한 번은 당합니다.

| 명령 | 지금 즉시 적용? | 재부팅 후에도 유지? |
|---|---|---|
| `--add-service=http` (그냥) | O | **X** (런타임에만) |
| `--permanent --add-service=http` | **X** (즉시 반영 안 됨) | O (설정에 저장) |
| 위 + `--reload` | O | O |

즉:

- **`--permanent` 없이** 추가하면 런타임에만 들어가서, `--reload`나 재부팅 시 **날아갑니다.**
- **`--permanent`를 붙이면** 설정 파일엔 저장되지만 **런타임에는 즉시 반영되지 않습니다** — `--reload`를 해야 실제로 열립니다.

그래서 관례는 둘 중 하나입니다.

```bash
# 방법 1 — permanent로 저장한 뒤 reload로 런타임에 반영 (가장 흔함)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# 방법 2 — 런타임과 permanent 양쪽에 동시에 넣기 (reload 불필요)
sudo firewall-cmd --add-service=http           # 지금 즉시
sudo firewall-cmd --permanent --add-service=http  # 재부팅 후에도
```

> **`--reload`는 런타임 규칙을 permanent 기준으로 통째로 다시 씁니다.** 그래서 `--permanent` 없이 넣어둔 런타임 임시 규칙이 있으면 `--reload` 순간 모두 사라집니다. "잘 되던 규칙이 reload 후 없어졌다"면 십중팔구 permanent에 저장을 안 한 것입니다. 무엇이 permanent에 있는지는 `--permanent --list-all`로 따로 확인하세요.
{: .prompt-warning }

> 📎 **치트시트** · [rocky-linux](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/rocky-linux.md) — firewalld·SELinux·nginx 리버스 프록시 서버 구축 빠른 참조 (GitHub)
{: .prompt-tip }

---

## firewalld — rich rule로 세밀하게

서비스·포트 여닫기만으로 부족할 때, 예를 들어 **특정 IP에만** 포트를 열고 싶을 때 rich rule을 씁니다.

```bash
# 1.2.3.4 에서 오는 22/tcp(SSH)만 허용
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="1.2.3.4" port port="22" protocol="tcp" accept'
sudo firewall-cmd --reload

# 확인 / 제거
sudo firewall-cmd --list-rich-rules
sudo firewall-cmd --permanent --remove-rich-rule='rule family="ipv4" source address="1.2.3.4" port port="22" protocol="tcp" accept'
```

rich rule은 출발지 주소·포트·프로토콜·동작(`accept`/`reject`/`drop`)·로깅·rate limit까지 한 줄에 표현합니다. "누구나 이 포트"가 아니라 "이 IP만 이 포트"처럼 조건이 붙으면 서비스/포트 명령으로는 안 되고 rich rule로 갑니다.

---

## ufw — Debian/Ubuntu의 간단한 대안

ufw(Uncomplicated Firewall)는 이름처럼 firewalld보다 단순합니다. zone 개념 없이 규칙을 위에서 아래로 나열하는 방식이고, 명령이 직관적입니다.

```bash
sudo ufw status verbose      # 상태·기본 정책·규칙 전체
sudo ufw enable              # 방화벽 켜기 (SSH부터 열고!)
sudo ufw disable             # 끄기

# 포트/서비스 열기
sudo ufw allow 22/tcp
sudo ufw allow OpenSSH        # 앱 프로파일(이름)로 열기 — /etc/ufw/applications.d
sudo ufw allow 80

# 출발지 제한 (firewalld rich rule에 해당)
sudo ufw allow from 1.2.3.4 to any port 22

# 기본 정책 — 들어오는 건 다 막고 필요한 것만 열기
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 규칙 삭제
sudo ufw delete allow 80
```

`ufw allow OpenSSH` 처럼 **앱 프로파일**로 열 수 있는 게 특징입니다 — `sudo ufw app list`로 설치된 프로파일을 볼 수 있고, 패키지가 자기 프로파일을 등록해 둡니다. firewalld의 서비스 이름과 비슷한 발상입니다.

ufw도 내부적으로는 nftables/iptables 규칙을 생성할 뿐이라, 큰 그림은 firewalld와 동일합니다.

---

## 위험: 원격에서 자기 자신을 잠그지 않기

> **SSH로 원격 접속 중에 방화벽을 켜거나 `default deny`를 걸면, SSH(22)를 먼저 허용하지 않는 한 그 순간 자기 접속이 끊기고 다시 들어올 수 없습니다.** 콘솔 접근이 없는 클라우드 서버라면 복구가 매우 곤란합니다. 순서는 **항상 SSH 규칙 먼저, 그다음 enable/deny** 입니다.
{: .prompt-warning }

안전한 순서는 이렇습니다.

```bash
# ufw — 반드시 SSH를 먼저 허용한 뒤에 enable
sudo ufw allow OpenSSH
sudo ufw enable

# firewalld — default deny 성격의 zone으로 바꾸기 전에 ssh부터
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

firewalld는 기본 `public` zone이 `ssh`를 열어둔 경우가 많지만, zone을 바꾸거나 규칙을 갈아엎을 때는 **SSH가 열려 있는지 확인하고 손대는 습관**이 안전합니다. 클라우드라면 방화벽 규칙을 바꾸기 전에 **별도 SSH 세션을 하나 더 열어두면**, 새 규칙이 잘못돼도 기존 세션으로 되돌릴 수 있습니다.

---

## 한 단계 아래: nftables / iptables

프론트엔드가 만들어 낸 실제 규칙을 보고 싶거나, firewalld/ufw가 없는 환경(최소 설치·컨테이너)이라면 엔진을 직접 봅니다.

```bash
sudo nft list ruleset        # nftables — 현재 커널에 올라간 규칙 전체
sudo iptables -L -n -v       # iptables(레거시) — 규칙 나열
sudo iptables-save           # iptables 규칙을 텍스트로 덤프
```

- **nftables**가 요즘 표준 엔진입니다. iptables·ip6tables·arptables·ebtables를 하나로 통합했고, RHEL 8+·최신 Debian/Ubuntu는 firewalld/ufw가 뒤에서 nftables를 씁니다.
- **iptables**는 레거시지만 여전히 아주 흔합니다. 다만 요즘 배포판의 `iptables` 명령은 실제로 nftables 위에서 도는 호환 계층(`iptables-nft`)인 경우가 많습니다.
- **직접 만지는 건** firewalld/ufw가 없거나, 프론트엔드가 표현 못 하는 세밀한 제어(복잡한 NAT·마킹 등)가 필요할 때입니다. 일반적인 포트 여닫기라면 프론트엔드로 하는 게 재부팅 복원·가독성 면에서 낫습니다.

---

## 방화벽으로 열었는데 안 될 때 (SELinux)

firewalld로 8080을 열었는데도 서비스가 그 포트를 못 쓰는 경우가 있습니다. Rocky/RHEL이라면 **SELinux가 방화벽과 별개로** 포트 사용을 막고 있을 수 있습니다. 방화벽은 "패킷이 들어오게" 할 뿐이고, 데몬이 비표준 포트에 바인딩하려면 SELinux 정책이 그 포트를 허용해야 합니다.

```bash
getenforce                                        # Enforcing 이면 SELinux 활성
sudo semanage port -a -t http_port_t -p tcp 8080  # 8080을 http 포트로 SELinux에 등록
```

자세한 건 범위 밖이라 짧게만 짚습니다 — [rocky-linux 치트시트](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/rocky-linux.md)의 SELinux 절에 nginx 리버스 프록시에서 502가 나던 실제 사례가 있습니다. "방화벽은 열었는데 안 된다"면 SELinux를 의심하세요.

---

## 대중성·대안

- **firewalld** — RHEL/Rocky/Fedora 계열의 사실상 표준. zone·서비스·rich rule로 서버 운영에 필요한 걸 잘 갖췄고, 뒤로 nftables를 씁니다. RHEL 환경이면 이걸 벗어날 이유가 거의 없습니다.
- **ufw** — Debian/Ubuntu의 표준. 단순하고 배우기 쉬워 단일 서버·개인 환경에 좋습니다. zone 같은 개념은 없어서 복잡한 다중 인터페이스 정책에는 firewalld가 더 맞습니다.
- **nftables 직접** — 프론트엔드 없이 규칙을 직접 관리. 컨테이너·최소 설치·세밀 제어용이지만, 재부팅 복원·가독성을 스스로 챙겨야 해서 손이 많이 갑니다. iptables는 레거시(신규 채택 비권장)지만 현장엔 여전히 많습니다.

결론: **배포판 기본 프론트엔드를 그대로 쓰는 게 정답**입니다 — Rocky/RHEL이면 firewalld, Ubuntu/Debian이면 ufw. `--permanent` + `--reload`(firewalld), `default deny` 전에 SSH 먼저(공통) 두 가지만 몸에 익히면 실무의 대부분이 해결됩니다.
