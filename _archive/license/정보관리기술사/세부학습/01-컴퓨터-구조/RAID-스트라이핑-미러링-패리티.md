# RAID - Striping, Mirroring, Parity

RAID를 숫자별 특징으로 외우기 전에 **데이터를 여러 Disk에 어떻게 배치하는가**를 이해한다.

핵심은 세 가지다.

```text
Striping  : 데이터를 나눠 여러 Disk에 저장 → 성능
Mirroring : 같은 데이터를 여러 Disk에 복제 → 가용성
Parity    : 복구용 계산 정보를 저장 → 용량 효율 + 장애 복구
```

RAID 0/1/10은 특히 `Striping`과 `Mirroring` 두 개만 이해하면 자연스럽게 연결된다.

---

## 1. RAID가 왜 필요한가

Disk 하나만 사용하면 구조는 단순하지만 두 가지 문제가 있다.

```text
하나의 Disk가 모든 I/O 처리
        ↓
성능 한계

Disk 하나에 모든 데이터 존재
        ↓
Disk 장애 시 데이터 접근 불가
```

여러 Disk를 함께 사용하면 이를 서로 다른 방향으로 해결할 수 있다.

```text
여러 Disk에 일을 나눔
        ↓
병렬 I/O
        ↓
성능 향상

같은 데이터를 다른 Disk에도 보관
        ↓
한 Disk 장애
        ↓
다른 Disk로 계속 서비스
```

RAID(Redundant Array of Independent Disks)는 여러 물리 Disk를 묶어 하나의 논리 Storage처럼 사용하면서 **성능, 가용성, 용량 효율 사이의 Trade-off를 선택하는 방식**이다.

---

# 2. 가장 먼저 이해할 것 - Striping

Striping은 데이터를 여러 Disk에 **나눠서 저장하는 것**이다.

예를 들어 데이터가 다음과 같다고 하자.

```text
A B C D E F
```

Disk 하나라면 한 Disk가 모두 처리한다.

```text
Disk 1 : A B C D E F
```

두 Disk에 Striping하면 다음처럼 나눌 수 있다.

```text
Disk 1 : A   C   E
Disk 2 :   B   D   F
```

핵심은 단순히 저장 위치가 나뉜다는 것이 아니다.

```text
A → Disk 1이 처리
B → Disk 2가 처리

두 Disk가 동시에 일할 수 있음
        ↓
병렬 Read / Write
        ↓
성능 향상
```

`stripe`는 줄무늬라는 뜻이다. 데이터를 Disk마다 번갈아 줄무늬처럼 배치한다고 생각하면 기억하기 쉽다.

---

# 3. RAID 0 - Striping만 사용

RAID 0은 Striping만 사용한다.

```text
원본 데이터 : A B C D E F

          RAID 0
        Striping

Disk 1 : A   C   E
Disk 2 :   B   D   F
```

두 Disk가 서로 다른 데이터를 동시에 처리할 수 있으므로 성능이 좋아진다.

또한 1TB Disk 두 개를 사용하면 약 2TB 전체를 데이터 저장에 사용할 수 있다.

```text
1TB + 1TB
    ↓
사용 가능 약 2TB
```

즉 용량 효율도 100%에 가깝다.

하지만 문제가 있다.

```text
Disk 1 : A C E   ← 장애
Disk 2 : B D F
```

Disk 2가 정상이어도 A, C, E가 사라졌다. 데이터 전체를 복원할 수 없다.

따라서 RAID 0의 성격은 명확하다.

```text
Striping
   ↓
성능 ↑
용량 효율 ↑
장애 대응 X
```

> RAID 0 = 모든 Disk를 성능에 사용하는 구조

RAID라는 이름에 Redundant가 들어가지만 RAID 0 자체에는 실제 중복성이 없다.

---

# 4. RAID 1 - Mirroring

RAID 1은 데이터를 나누는 대신 **같은 데이터를 복제**한다.

```text
          RAID 1
         Mirroring

Disk 1 : A B C D
Disk 2 : A B C D
```

Disk 1이 장애가 나도 Disk 2에 동일한 데이터가 있다.

```text
Disk 1 : X X X X  ← 장애
Disk 2 : A B C D

        ↓
서비스 지속 가능
```

대신 저장 공간 절반을 복제에 사용한다.

```text
1TB + 1TB
    ↓
실제 데이터 저장 가능 약 1TB
```

따라서 RAID 1의 핵심은 성능보다 **가용성**이다.

```text
Mirroring
   ↓
동일 데이터 복제
   ↓
Disk 장애 대응
   ↓
가용성 ↑

대신
용량 효율 ↓
```

> RAID 1 = Disk를 복제에 사용하는 구조

읽기는 Controller 구현에 따라 두 Disk에서 분산하여 처리할 수 있어 성능 향상을 얻을 수도 있다. 반면 일반적인 쓰기는 동일 데이터를 양쪽에 모두 기록해야 한다.

---

# 5. RAID 10 - RAID 1의 안정성 + RAID 0의 병렬성

RAID 10은 여러 RAID 1 Mirror Group을 만들고 그 위에 Striping을 적용한다고 이해하면 쉽다.

4개의 Disk가 있다고 하자.

```text
D1 ↔ D2       D3 ↔ D4
  Mirror        Mirror
     \           /
      \         /
       Striping
```

조금 더 구체적으로 데이터를 A, B라고 하면 다음과 같다.

```text
          Striping
       ┌─────┴─────┐
       ↓           ↓
       A           B

     Mirror      Mirror
     ┌──┴──┐      ┌──┴──┐
     D1   D2      D3   D4
      A    A       B    B
```

즉 두 가지 동작을 동시에 한다.

```text
A와 B를 서로 다른 Mirror Group으로 나눔
                ↓
             Striping
                ↓
             성능 향상

각 Group 안에서는 같은 데이터를 두 번 저장
                ↓
             Mirroring
                ↓
             장애 대응
```

그래서 RAID 10은 다음 한 문장으로 기억할 수 있다.

> RAID 10 = 나눠서 저장하면서 각각 복제한다.

---

# 6. RAID 0과 RAID 10의 쓰기 성능 차이

여기서 처음 헷갈리기 쉬운 부분이 있다.

> "RAID 10도 Striping을 하는데 RAID 0과 쓰기 속도가 같은 것 아닌가?"

같은 Disk 개수라면 그렇지 않다.

4개의 Disk를 비교해보자.

## RAID 0

```text
데이터 : A B C D

D1     D2     D3     D4
 A      B      C      D
 ↓      ↓      ↓      ↓
     동시에 Write
```

4개의 Disk가 모두 서로 다른 데이터를 기록하는 데 사용된다.

이론적인 관점에서 쓰기 병렬성을 모두 성능에 사용할 수 있다.

```text
4 Disk
   ↓
4개 모두 데이터 Write에 사용
```

## RAID 10

같은 4개의 Disk라도 RAID 10은 다르다.

```text
D1 ↔ D2       D3 ↔ D4
 A    A        B    B

Mirror        Mirror
```

논리적으로 서로 다른 데이터는 A와 B 두 개이고, 나머지 Write는 복제다.

```text
4 Disk
   ↓
A를 쓰는 Mirror Group
B를 쓰는 Mirror Group
   ↓
서로 다른 데이터의 병렬 Write는 2 Group
```

따라서 같은 Disk 4개를 기준으로 보면 감각적으로 다음과 같다.

```text
RAID 0
→ 모든 Disk를 성능에 사용

RAID 10
→ 일부 I/O 능력을 Mirroring에 사용
→ 성능 + 안정성을 함께 확보
```

실제 성능이 항상 정확히 절반이라는 뜻은 아니다. Controller, Cache, Disk 종류, I/O Pattern, Queue Depth 등에 따라 달라진다. 다만 **쓰기 병렬성의 구조를 이해하기 위한 모델**로는 유용하다.

---

# 7. RAID 1과 RAID 10은 왜 속도가 같지 않은가

RAID 10의 각 Mirror Group 하나만 떼어 보면 RAID 1과 같다.

```text
RAID 10

[ RAID 1 ]    [ RAID 1 ]
 D1 ↔ D2       D3 ↔ D4
      \         /
       \       /
        RAID 0
       Striping
```

따라서 차이는 **Mirror Group이 여러 개 있고 그 사이에 Striping이 존재한다는 것**이다.

```text
RAID 1
동일 데이터 복제
        ↓
주목적: 안정성

RAID 10
여러 RAID 1 Group
        +
Group 사이 Striping
        ↓
안정성 + 병렬 I/O
```

그래서 같은 조건이라면 RAID 10은 RAID 1보다 높은 I/O 병렬성을 확보할 수 있다.

---

# 8. RAID 10의 장애 허용을 숫자로 외우면 안 되는 이유

RAID 10을 단순히 "Disk 2개 장애까지 허용"이라고 외우면 틀릴 수 있다.

```text
Mirror Group 1     Mirror Group 2
D1 ↔ D2             D3 ↔ D4
```

D1과 D3가 동시에 장애라면:

```text
X  ↔ D2             X  ↔ D4

각 Mirror Group에 정상 Disk가 하나씩 남아 있음
                  ↓
              동작 가능
```

반면 D1과 D2가 동시에 장애라면:

```text
X  ↔ X              D3 ↔ D4
↑
Mirror Group 하나 전체 소실
        ↓
RAID 전체 데이터 유지 불가
```

따라서 정확한 이해는 다음과 같다.

> RAID 10은 각 Mirror Group에 최소 하나의 정상 Disk가 남아 있는 동안 데이터를 유지할 수 있다.

---

# 9. Parity - RAID 5/6으로 넘어가기 위한 개념

RAID 1/10은 원본 데이터를 그대로 복제하기 때문에 이해하기 쉽지만 용량 효율이 떨어진다.

```text
A를 보호하려면

Disk 1 : A
Disk 2 : A

→ 동일 데이터를 한 번 더 저장
```

Parity 방식은 원본 전체를 복제하지 않고 **데이터로부터 계산한 복구 정보**를 추가로 저장한다.

개념적으로 다음처럼 생각할 수 있다.

```text
Data A + Data B
       ↓
Parity P 계산

A    B    P
```

하나가 사라졌을 때 나머지 값과 Parity를 이용해 잃어버린 데이터를 재구성한다.

이 방식이 RAID 5/6의 핵심이다.

```text
RAID 5 → Single Parity → Disk 1개 장애 대응
RAID 6 → Dual Parity   → Disk 2개 장애 대응
```

다만 Parity 계산과 갱신이 필요하기 때문에 RAID 0/1/10과 다른 Write 특성이 생긴다.

---

# 10. RAID 5/6과 RAID 10이 갈리는 지점

RAID 5/6과 RAID 10의 중요한 Trade-off는 다음과 같다.

```text
RAID 5/6
원본 전체 복제 X
Parity 이용
    ↓
용량 효율 좋음
    ↓
대신 Parity 계산·갱신 필요

RAID 10
원본을 Mirror에 그대로 복제
    ↓
용량 효율 50%
    ↓
Parity 계산 없음
    ↓
쓰기 구조와 Rebuild가 상대적으로 단순
```

그래서 Write가 많고 I/O 성능과 복구 시간이 중요한 DB 등에서는 RAID 10이 자주 선호된다. 반대로 용량 효율이 중요하면 RAID 5/6 계열을 고려할 수 있다.

단, 실제 선택은 HDD/SSD, Controller, Workload, 데이터 크기, 장애 정책 등에 따라 달라진다.

---

# 11. 주요 RAID 비교

| RAID | 핵심 방식 | 최소 Disk | 장애 허용 | 용량 효율 | 핵심 성격 |
|---|---|---:|---|---|---|
| RAID 0 | Striping | 2 | 없음 | 100% | 성능 중심 |
| RAID 1 | Mirroring | 2 | Mirror 내 1개 | 약 50% | 가용성 중심 |
| RAID 5 | Striping + Single Parity | 3 | 1개 | `(N-1)/N` | 용량 효율 + 보호 |
| RAID 6 | Striping + Dual Parity | 4 | 2개 | `(N-2)/N` | RAID 5보다 높은 보호 |
| RAID 10 | Mirroring + Striping | 4 | Mirror 배치에 따라 다름 | 약 50% | 성능 + 가용성 |

RAID 10의 장애 허용은 단순히 "몇 개"라고만 외우기보다 **동일 Mirror Group의 Disk가 모두 사라지면 실패한다**고 이해한다.

---

# 12. 처음 헷갈리기 쉬운 부분

## 12.1 Striping은 단순 분할이 아니라 병렬 처리다

```text
데이터를 나눈다
    ↓
여러 Disk가 서로 다른 Block을 담당
    ↓
동시에 I/O 가능
    ↓
성능 향상
```

## 12.2 RAID 0과 RAID 10은 둘 다 Striping하지만 같지 않다

```text
RAID 0
Striping만 수행
→ 모든 Disk 자원을 성능에 사용

RAID 10
Striping + Mirroring
→ 일부 Disk I/O가 복제에도 사용
```

## 12.3 RAID 1과 RAID 10도 같지 않다

```text
RAID 1
하나의 Mirror Set

RAID 10
여러 Mirror Set
    ↓
Set 사이에 Striping
```

## 12.4 RAID는 Backup이 아니다

RAID는 Disk 장애에 대한 가용성을 높이지만 다음 문제를 해결하지 못한다.

```text
사용자가 파일 삭제
악성코드가 데이터 암호화
Application이 잘못된 데이터를 저장
RAID Controller 전체 장애
재해로 장비 전체 손실
```

잘못된 데이터도 RAID Mirror에는 그대로 복제된다.

따라서:

```text
RAID = Disk 장애 대응 / 가용성
Backup = 과거 데이터 복구
```

서로 목적이 다르다.

---

# 13. 기억 흐름

숫자를 먼저 외우지 말고 다음 순서로 복원한다.

```text
Disk 하나
  ↓
성능과 장애 문제가 있음
  ↓
여러 Disk를 어떻게 쓸 것인가?
  ↓
┌─────────────────────────────┐
│                             │
↓                             ↓
데이터를 나눠 저장         같은 데이터를 복제
Striping                    Mirroring
↓                             ↓
RAID 0                       RAID 1
빠름                          안전함
│                             │
└──────────┬──────────────────┘
           ↓
        RAID 10
 "나눠 저장하면서 각각 복제"
           ↓
       빠르고 안전
       용량 효율 50%

원본 전체 복제가 아깝다
           ↓
복구 정보만 저장할 수 없을까?
           ↓
         Parity
           ↓
      RAID 5 / RAID 6
```

가장 짧게 기억하면 다음과 같다.

```text
RAID 0  = 빠르기만 함
RAID 1  = 안전하기만 함
RAID 10 = 빠르면서 안전함
RAID 5/6 = Parity로 용량 효율과 장애 복구를 절충
```

단, 이는 개념을 떠올리기 위한 압축 표현이다. 실제 설계에서는 Workload, Disk 종류, Controller, 장애 허용 범위, Rebuild 시간 등을 함께 판단한다.
