# VLAN·서브넷·브로드캐스트 도메인

이 문서는 VLAN, Subnet, Broadcast Domain이 모두 `망을 나누는 것`처럼 보여 헷갈리는 지점을 풀기 위한 문서다. 핵심은 **무엇을 기준으로 나누는지와 어느 Layer의 경계인지**를 구분하는 것이다.

## 이 문서에서 되짚을 질문

- VLAN과 Subnet은 둘 다 망을 나누는데 왜 서로 다른 개념인가?
- Switch를 사용하면 Broadcast Domain도 자동으로 나뉘는가?
- 서로 다른 VLAN의 단말은 왜 Router나 L3 Switch를 거쳐야 하는가?
- 다른 Subnet의 목적지에 보낼 때 단말은 왜 목적지 MAC이 아니라 Gateway MAC을 찾는가?

---

# 1. 가장 먼저 잡을 세 개념

```text
브로드캐스트 도메인
= Layer 2 Broadcast Frame이 퍼질 수 있는 범위

VLAN
= 하나의 물리 Switch 환경을 여러 논리적 Layer 2 망으로 분리

Subnet
= IP Prefix를 기준으로 나눈 Layer 3 주소 범위
```

셋은 실제 설계에서 서로 밀접하게 맞물리지만 정의상 같은 개념은 아니다.

---

# 2. Switch가 있다고 Broadcast Domain이 자동으로 나뉘는 것은 아니다

일반적인 Layer 2 Switch는 목적지 MAC을 보고 Unicast Frame을 필요한 Port로 전달하지만, Broadcast Frame은 같은 VLAN의 여러 Port로 Flooding한다.

```text
Host A
  ↓ Broadcast
Switch
  ├→ Host B
  ├→ Host C
  └→ Host D
```

VLAN이 하나뿐이라면 Switch Port가 많아도 같은 VLAN에 속한 Port들은 하나의 Broadcast Domain에 포함된다.

따라서:

```text
Switch를 사용했다
≠
Broadcast Domain이 자동으로 여러 개가 됐다
```

Broadcast Domain을 논리적으로 나누는 대표적인 방법이 VLAN이다.

---

# 3. VLAN은 Layer 2 경계를 만든다

예를 들어 하나의 물리 Switch에 인사팀과 개발팀 PC가 모두 연결되어 있다고 하자.

```text
물리 Switch 1대
├─ Port 1,2,3 : 인사팀
└─ Port 4,5,6 : 개발팀
```

그냥 연결하면 하나의 Layer 2 Broadcast 범위로 동작할 수 있다.

여기에 VLAN을 적용하면:

```text
물리 Switch 1대
├─ VLAN 10 : 인사팀
└─ VLAN 20 : 개발팀
```

논리적으로 서로 다른 Layer 2 망처럼 분리된다.

```text
VLAN 10 Broadcast
→ VLAN 10 내부에만 전달

VLAN 20 Broadcast
→ VLAN 20 내부에만 전달
```

따라서 일반적으로 **VLAN 하나가 하나의 Broadcast Domain을 만든다.**

중요한 점은 물리 장비 수와 논리 망 수가 같지 않다는 것이다.

```text
Switch 1대에 VLAN 여러 개 가능
여러 Switch에 같은 VLAN을 확장하는 것도 가능
```

---

# 4. Access Port와 Trunk Port

## Access Port

보통 하나의 VLAN에 속한 단말을 연결한다.

```text
PC
 ↓
Access Port
 ↓
VLAN 10
```

단말은 일반적으로 자신이 VLAN Tag를 직접 처리하지 않아도 된다.

## Trunk Port

여러 VLAN의 Frame을 하나의 물리 Link로 전달해야 할 때 사용한다.

예:

```text
Switch A
   │
   │ Trunk
   │ VLAN 10 / VLAN 20 / VLAN 30
   │
Switch B
```

여러 VLAN의 Frame을 구분하기 위해 VLAN Tag를 사용한다.

즉:

```text
Access
= 보통 하나의 VLAN을 단말에 제공

Trunk
= 여러 VLAN Traffic을 한 Link에서 전달
```

---

# 5. Subnet은 Layer 3 주소 경계다

Subnet은 IP 주소와 Prefix를 기준으로 같은 Network인지 판단하는 Layer 3 개념이다.

예:

```text
192.168.10.0/24
192.168.20.0/24
```

두 주소 범위는 서로 다른 Subnet이다.

단말은 목적지 IP가 자신의 Prefix 범위 안에 있는지 확인한다.

```text
목적지 IP가 같은 Subnet
→ 직접 전달 시도

목적지 IP가 다른 Subnet
→ Default Gateway로 전달
```

따라서 VLAN과 Subnet의 핵심 차이는 다음이다.

```text
VLAN
= Frame이 퍼지는 Layer 2 범위를 나눔

Subnet
= IP 주소상 같은 Network인지 판단하는 Layer 3 범위를 나눔
```

---

# 6. 왜 실무에서는 VLAN 하나에 Subnet 하나를 자주 대응시키는가

정의상 VLAN과 Subnet은 별개지만 실제 Network 설계에서는 보통 경계를 맞춘다.

예:

```text
VLAN 10
↔ 192.168.10.0/24

VLAN 20
↔ 192.168.20.0/24
```

이렇게 하면 Layer 2와 Layer 3 경계가 같은 위치에 놓인다.

```text
인사팀
VLAN 10
192.168.10.0/24

개발팀
VLAN 20
192.168.20.0/24
```

이 구조가 직관적인 이유는:

- Broadcast 범위와 IP 주소 범위가 일치
- Routing 경계가 명확
- 장애 분석이 쉬움
- ACL·정책 적용이 단순

하기 때문이다.

같은 VLAN에 서로 다른 Subnet을 둘 수 있거나, 일반적이지 않은 설계를 만들 수도 있지만 운영과 통신 이해가 복잡해지므로 보통은 1 VLAN : 1 Subnet 형태가 자연스럽다.

---

# 7. 서로 다른 VLAN은 왜 직접 통신하지 못하는가

VLAN 10과 VLAN 20은 Layer 2에서 서로 다른 Network다.

```text
VLAN 10
Host A
192.168.10.10

VLAN 20
Host B
192.168.20.20
```

Host A가 Host B에 보내려면 Layer 3 Routing이 필요하다.

```text
Host A
  ↓
VLAN 10
  ↓
Router / L3 Switch
  ↓
VLAN 20
  ↓
Host B
```

이를 Inter-VLAN Routing이라고 한다.

Router 또는 L3 Switch가 각 VLAN 사이의 Layer 3 경계 역할을 한다.

---

# 8. 다른 Subnet으로 보낼 때 왜 Gateway MAC을 찾는가

이 부분을 이해하면 Layer 2와 Layer 3 관계가 명확해진다.

Host A:

```text
IP      : 192.168.10.10/24
Gateway : 192.168.10.1
```

목적지:

```text
192.168.20.20
```

Host A는 Prefix를 비교한다.

```text
내 Network      = 192.168.10.0/24
목적지 Network  = 192.168.20.0/24

서로 다름
```

따라서 Host A는 목적지 Host B의 MAC을 직접 찾으려 하지 않는다.

```text
IP Packet의 목적지 IP
= 192.168.20.20

현재 Link의 Frame 목적지 MAC
= Default Gateway의 MAC
```

즉:

```text
Host A
→ "이 목적지는 내 Layer 2 망 밖이다"
→ Gateway에게 전달
```

한다.

---

# 9. Router를 지나면 MAC은 바뀌고 IP 목적지는 유지된다

Host A에서 Gateway로 보낼 때:

```text
IP
Src: 192.168.10.10
Dst: 192.168.20.20

Ethernet Frame
Src MAC: Host A
Dst MAC: Gateway(VLAN 10 쪽)
```

Router가 Packet을 받아 VLAN 20으로 전달할 때는 새로운 Link의 Frame을 만든다.

```text
IP
Src: 192.168.10.10
Dst: 192.168.20.20

새 Ethernet Frame
Src MAC: Router(VLAN 20 쪽)
Dst MAC: Host B
```

즉 핵심은:

```text
IP Packet
= Network 사이를 이동하는 Layer 3 정보

Frame의 MAC 주소
= 현재 Link에서 다음 장치까지 전달하기 위한 Layer 2 정보
```

이다.

그래서 Router를 지날 때 Frame은 Link마다 새로 만들어지고 MAC 주소는 바뀐다.

---

# 10. VLAN은 보안 장치 자체가 아니다

VLAN으로 Layer 2 Network를 분리하면 Traffic 범위와 Broadcast Domain은 나눌 수 있다.

하지만 이것만으로 완전한 보안 정책이 되는 것은 아니다.

서로 다른 VLAN 사이에서 Router/L3 Switch가 Routing을 허용하면 통신할 수 있다.

따라서 실제 접근 통제에는:

```text
VLAN 분리
+
Routing 정책
+
ACL / Firewall
+
인증·접근제어
```

등이 필요할 수 있다.

VLAN은 **논리적 Network 분리의 기반**이지 Firewall 자체는 아니다.

---

# 11. 처음 헷갈리기 쉬운 부분

```text
Switch = Broadcast Domain 분리?
→ X
같은 VLAN이면 Broadcast는 Switch 전체에 퍼질 수 있다.

VLAN = Subnet?
→ X
VLAN은 L2, Subnet은 L3 개념이다.

서로 다른 VLAN인데 IP가 같은 Subnet이면 되는가?
→ 일반적인 설계가 아니며 운영이 복잡해진다.

다른 Subnet으로 보낼 때 목적지 Host의 MAC을 찾는가?
→ X
현재 Link에서는 Gateway MAC을 목적지로 사용한다.

VLAN = 보안?
→ X
분리 기반은 제공하지만 실제 접근통제 정책은 별도다.
```

---

# 12. 기억 흐름

```text
하나의 물리 Switch에 여러 조직·망이 섞임
        ↓
Layer 2 Traffic을 논리적으로 분리하고 싶음
        ↓
VLAN
        ↓
VLAN별 Broadcast Domain 분리
        ↓
각 VLAN에 Layer 3 주소 범위 필요
        ↓
Subnet 설계
        ↓
실무에서는 보통 VLAN 1개 ↔ Subnet 1개
        ↓
다른 VLAN / Subnet으로 가야 함
        ↓
Default Gateway
        ↓
Router / L3 Switch가 Inter-VLAN Routing
        ↓
Link가 바뀔 때 Frame과 MAC 주소도 새로 구성
```

가장 중요한 한 문장:

> **VLAN은 Layer 2의 논리적 분리, Subnet은 Layer 3의 주소 분리이며, 실제 Network에서는 두 경계를 맞추고 Router/L3 Switch가 그 사이를 연결한다.**
