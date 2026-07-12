---
title       : "macOS Wi-Fi 전환 시 라우트 드리프트 (멀티홈 함정)"
description : "랜선+Wi-Fi를 동시에 쓸 때 route add가 엉뚱한 인터페이스로 묶이는 원인과, 실제 도달로 검증하는 해결 패턴."
date        : 2026-07-03 21:00:00 +0900
updated     : 2026-07-03 21:00:00 +0900
categories  : [network]
tags        : [macos, networksetup, route, multihoming, wifi]
pin         : false
hidden      : false
---

랜선(인터넷) + Wi-Fi(내부망)를 동시에 쓸 때, **Wi-Fi 전환 직후 추가한 라우트가 몇 초 뒤 주 인터페이스(랜선)로 몰래 되돌아가** 내부망이 안 되는 함정.

> 아래 IP는 전부 문서용 예시 대역([RFC 5737](https://datatracker.ietf.org/doc/html/rfc5737) `192.0.2.0/24`·`198.51.100.0/24`)으로 치환했다. 관계(내부망 / 게이트웨이 / 실호스트)만 보면 된다.
{: .prompt-info }

## 증상

- `route add -net 198.51.100.0/24 <gw>` 직후엔 라우트가 Wi-Fi(en1)에 제대로 붙음
- **몇 초 뒤** macOS가 같은 라우트를 주 서비스(Ethernet en0)로 재바인딩 → 게이트웨이 도달 불가 → 내부망 죽음
- 화면상 전환/설정은 "완료"인데 실제 접속만 안 됨

## 원인

`networksetup -setairportnetwork`(Wi-Fi 전환)가 네트워크 재평가를 유발하고, 그 과정에서 추가된 라우트를 **네트워크 서비스 순서상 primary(보통 Ethernet)** 로 재귀속시킨다. 전환이 없으면(`--keep-wifi`) 드리프트도 없다.

## 진단 명령 (읽기 전용)

```bash
# 실제로 어느 인터페이스로 나가는지 (진실)
route get 198.51.100.22 | grep -E 'gateway|interface'

# 라우트 테이블에서 인터페이스 컬럼 확인
netstat -rn -f inet | grep -E '198.51.100|^default'

# 서비스 우선순위 (primary가 라우트를 훔쳐감)
networksetup -listnetworkserviceorder
```

## 함정 3가지

1. **드리프트 전 찰나 검증** — `route add` 직후 확인하면 en1이라 "정상"으로 오판. **몇 초 대기 후** 확인해야 진실.
2. **`networksetup -getairportnetwork`이 거짓말** — Wi-Fi 붙어있어도 `not associated`로 나올 수 있음. 접속 판정에 쓰지 말 것. ARP(`arp -n <gw>`)나 `route get`으로 확인.
3. **네트워크 주소 vs 실호스트** — `route get 198.51.100.0`(네트워크 주소)와 `route get 198.51.100.22`(실호스트)가 다른 인터페이스를 반환할 수 있음. **반드시 실호스트로** 확인.

## 해결 패턴

- 가장 안정적: **전환을 안 하고 적용** (`--keep-wifi`). 이미 원하는 SSID에 붙여둔 뒤 IP/라우트만 적용.
- 전환이 불가피하면: **전환 → 드리프트 날 시간 대기 → 실호스트로 검증 → 샜으면 재적용**을 붙을 때까지 반복.

```bash
# setmanual(게이트웨이)을 먼저 잡아야 뒤이은 route add가 그 인터페이스로 묶인다.
# 순서 바꾸면 라우트가 인터넷 쪽으로 샌다.
sudo networksetup -setmanual "Wi-Fi" 192.0.2.50 255.255.255.0 192.0.2.1
sudo route -n add -net 198.51.100.0/24 192.0.2.1
sleep 3
route get 198.51.100.22 | awk '/interface/{print $2}'   # 기대 인터페이스인지 확인
```

## 최종 원인 정정

위의 "드리프트"는 **증상이었고, 진짜 원인은 "CLI 전환 연결이 느려서 완성 전에 적용한 것"** 이었다.

**핵심: `route add`는 Wi-Fi 연결 상태에 종속된다.**
라우트가 게이트웨이(`192.0.2.1`)를 통하므로, **그 게이트웨이가 Wi-Fi 인터페이스(en1)에서 실제로 잡힐 때** = Wi-Fi가 그 망에 완전히 올라온 뒤에야 라우트가 en1에 제대로 묶인다. 연결 전에 `route add`하면 게이트웨이를 못 찾아 엉뚱한 인터페이스(en0)로 붙거나 죽은 라우트가 된다.

**왜 "두 번 실행해야" 됐나** — `networksetup -setairportnetwork`(CLI 전환)는 association+인증에 수 초가 걸린다(GUI보다 느림·가변적). 스크립트가 전환 직후 곧바로 적용 → 연결 전이라 실패. 두 번째 실행 땐 그새 연결 완성 → 성공. GUI 전환이 잘 됐던 건 이미 붙은 뒤 적용해서.

**"연결 완성"의 유일한 정직한 신호 = 실제 도달** (`nc -z <내부서버> 443`). `-getairportnetwork`(거짓말)도, `route get`(연결 전에도 en1처럼 보이는 찰나 있음)도 못 믿는다.

**해결(정정)**: `sleep N` 같은 고정 대기는 연결 시간이 가변적이라 못 맞춘다. **내부 서버에 실제로 닿을 때까지 적용을 반복**해야 한 번에 된다.

```bash
# 전환 후: 도달될 때까지 적용 반복 (고정 대기 X)
for i in $(seq 1 10); do
  sudo networksetup -setmanual "Wi-Fi" 192.0.2.50 255.255.255.0 192.0.2.1
  sudo route -n add -net 198.51.100.0/24 192.0.2.1 >/dev/null 2>&1
  nc -z -G2 -w2 198.51.100.22 443 && break   # 실제 도달 = 연결 완성
  sleep 3
done
```

**`route add`의 동작 = 검사 없는 스냅샷 바인딩.** `route add`는 접속 여부를 확인하지 않는다. **추가하는 그 순간** 게이트웨이 경로를 소유한 인터페이스로 무조건 묶을 뿐이다. 그래서 연결 전에 추가하면 잘못된 인터페이스로 박힌다. 따라서 검증은 **추가 "전" 사전확인이 아니라, 추가 "후" 실제 도달로 확인하고 안 되면 재시도**하는 구조가 된다. (사전확인하려면 `arp -n <gw>`로 게이트웨이가 인터페이스에 잡혔는지 폴링하는 방법도 있음)
