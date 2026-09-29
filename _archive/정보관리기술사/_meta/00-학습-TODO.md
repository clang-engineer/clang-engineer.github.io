# 정보관리기술사 학습 TODO

이 문서는 세부학습 중 발견한 **학습 가치는 있지만 현재 주제의 핵심 흐름에서 벗어나는 가지 주제**를 한곳에서 관리한다.

각 항목에는 `무엇을 볼지`, `왜 나왔는지`, `어느 주제와 연결되는지`를 남긴다. 현재 주제를 이해하는 데 반드시 필요한 내용은 TODO로 미루지 않는다.

---

## 데이터베이스

- [ ] Conflict Serializability 판정
  - 무엇: Conflict의 순서를 이용해 Schedule이 어떤 Serial Schedule과 동등한지 판단하는 방법
  - 나온 이유: Transaction 동시성에서 Conflict와 Serializability의 관계를 학습하다 파생
  - 연결: Schedule / Serializability / 동시성 제어

- [ ] 2PL 변형
  - 무엇: Conservative / Strict / Rigorous 2PL
  - 나온 이유: 기본 2PL의 `Growing → Shrinking` 규칙을 학습하다 파생
  - 연결: Lock / Deadlock / Recoverability

- [ ] PostgreSQL MVCC와 VACUUM
  - 무엇: 오래된 Tuple Version이 남는 이유와 이를 정리하는 방식
  - 나온 이유: MVCC가 여러 Version을 유지한다는 점을 학습하다 파생
  - 연결: PostgreSQL / MVCC / Dead Tuple

- [ ] DBMS별 Isolation Level / MVCC 차이
  - 무엇: PostgreSQL, MySQL InnoDB, SQL Server에서 같은 Isolation Level 이름이 실제로 어떻게 동작하는지 비교
  - 나온 이유: Isolation Level은 보장 수준이고 Lock/MVCC는 구현 수단이라는 경계를 학습하다 파생
  - 연결: Isolation Level / Lock / MVCC
