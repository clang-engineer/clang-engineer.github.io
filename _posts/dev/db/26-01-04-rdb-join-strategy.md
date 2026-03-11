---
title       : RDB에서 조인(Join) 방식 총정리
description : 
date        : 2026-01-04 19:42:22 +0900
updated     : 2026-01-04 19:53:00 +0900
categories  : [dev, db]
tags        : [rdb, join, 조인, hash-join, nested-loop-join, sort-merge-join, broadcast-join, semi-join]
pin         : false
hidden      : false
---

# **대규모 데이터 조인 방식 정리**

## **1. Nested Loop Join (중첩 반복 조인)**

### **원리**

* 테이블 A의 각 행(row)을 순회하면서, 테이블 B의 모든 행과 비교
* 조건이 만족되면 결과에 추가
* **인덱스를 활용하면 속도 향상** → Index Nested Loop Join

**예제**

```sql
SELECT *
FROM A
JOIN B ON A.id = B.a_id;
```

* 작은 테이블 A를 외부 루프로, 큰 테이블 B를 내부 루프로 순회
* 인덱스가 있으면 내부 루프 검색 비용이 감소

### **시간 복잡도**

* 일반 Nested Loop: O(N × M)
  (N = 외부 테이블 행 수, M = 내부 테이블 행 수)
* 인덱스 사용 시: O(N × log(M))

### **메모리**

* 작은 테이블은 메모리에 올려두고, 큰 테이블은 순차적으로 읽기
* 따라서 메모리 부담은 작은 테이블 크기에 비례

### **장단점**

| 장점         | 단점              |
| ---------- | --------------- |
| 구현이 간단     | 큰 테이블 조인 시 비효율적 |
| 인덱스 있으면 빠름 | 메모리 없으면 느림      |

---

## **2. Hash Join**

### **원리**

* 작은 테이블을 메모리에 해시 테이블(Hash Table)로 생성
* 큰 테이블을 순회하며 해시 테이블에서 키를 매칭

**예제**

```sql
-- 의사 코드
hash_table = {key: row for row in small_table}
for row in large_table:
    if row.key in hash_table:
        output(row, hash_table[row.key])
```

### **시간 복잡도**

* 작은 테이블 해시 생성: O(N)
* 큰 테이블 순회: O(M)
* 총: O(N + M) (Nested Loop에 비해 훨씬 빠름)

### **메모리**

* 작은 테이블 전체를 메모리에 올려야 함
* 메모리 부족 시 → **Partitioned/Grace Hash Join**: 데이터를 파티션으로 나누어 디스크 활용

### **장단점**

| 장점            | 단점                  |
| ------------- | ------------------- |
| 큰 테이블 조인 가능   | 작은 테이블이 메모리에 있어야 함  |
| 시간 복잡도 O(N+M) | 메모리 부족 시 디스크 I/O 발생 |

---

## **3. Sort-Merge Join (정렬-병합 조인)**

### **원리**

* 두 테이블을 조인 키 기준으로 정렬
* 정렬된 상태에서 순차적으로 병합(Merge)
* 이미 정렬된 테이블이면 빠름

**예제**

```sql
-- 테이블 A, B를 key 기준 정렬
SELECT *
FROM A JOIN B
ON A.key = B.key
ORDER BY A.key, B.key;
```

### **시간 복잡도**

* 정렬: O(N log N + M log M)
* 병합: O(N + M)
* 총: O(N log N + M log M)

### **메모리**

* 버퍼 단위 처리 가능
* 메모리 부족 시 → 외부 정렬(External Sort) 후 디스크 사용

### **장단점**

| 장점                 | 단점                |
| ------------------ | ----------------- |
| 대용량 테이블 효율적        | 정렬 비용 발생          |
| 병합 과정은 순차 I/O로 안정적 | 작은 테이블만 빠르게 처리 불가 |

---

## **4. 분산/분할 조인 (Broadcast / Semi-Join / Bloom Filter)**

### **Broadcast Join**

* 작은 테이블을 모든 노드에 복제
* 각 노드에서 로컬 큰 테이블과 조인

### **Semi-Join / Bloom Filter Join**

* 큰 테이블에서 불필요한 데이터 미리 제거
* 네트워크 전송량 최소화

**메모리**

* 각 노드마다 작은 테이블은 메모리에
* 필터링으로 큰 테이블 처리량 감소

**장점**

* 분산 환경에서 네트워크 부하 감소
* 대규모 데이터 처리 최적화

---

## **5. DB 엔진별 조인 전략 특징**

| DB         | 주요 조인 전략                      | 특화 기능                                           |
| ---------- | ----------------------------- | ----------------------------------------------- |
| Oracle     | Nested Loop, Hash, Sort-Merge | Bitmap Join Index, Star Join, Bloom Filter Join |
| PostgreSQL | Nested Loop, Hash, Merge Join | Hash Aggregation + Join                         |
| SQL Server | Nested Loop, Hash, Merge Join | Adaptive Join (실행 중 최적화)                        |

> 현대 DB는 테이블 크기, 인덱스, 조건에 따라 **조인 방식 자동 선택**

---

## **6. 메모리 최적화 원리**

1. **작은 테이블은 메모리에, 큰 테이블은 순차 스캔**
2. **파티셔닝**: 조인 키 기준으로 데이터를 나눠 메모리 부담 최소화
3. **스트리밍 처리**: 결과를 버퍼 단위로 순차 반환
4. **임시 디스크 활용**: 메모리 초과 시 디스크 파티션 사용

> 요약: “한 번에 모든 데이터를 올리지 않고, 필요한 부분만 메모리에 올리고, 나머지는 디스크/스트리밍 처리”

---

## **7. 시간/공간 복잡도 요약**

| 조인 방식                  | 시간 복잡도               | 메모리 사용      | 특징                      |
| ---------------------- | -------------------- | ----------- | ----------------------- |
| Nested Loop            | O(N×M)               | 작은 테이블      | 인덱스 있으면 개선              |
| Hash Join              | O(N+M)               | 작은 테이블      | 큰 테이블 효율적, 메모리 초과 시 파티션 |
| Sort-Merge Join        | O(N log N + M log M) | 버퍼 단위       | 이미 정렬된 경우 강력            |
| Broadcast Join         | O(N + M/P)           | 작은 테이블      | 분산 환경 최적화               |
| Semi/Bloom Filter Join | O(N + M)             | 작은 테이블 + 필터 | 네트워크 최적화                |

---

## **8. 실무 팁**

* **필터링 + 필요한 컬럼만 조회**: 불필요한 데이터 로딩 방지
* **작은 테이블 우선 메모리 적재**: 메모리 효율 극대화
* **분산 환경**: Bloom Filter / Partitioned Join 활용
* **ETL/앱 레벨 조인**: 데이터 서버가 분리되어 있는 경우 현실적

---

## **9. RDBMS의 조인 전략 결정 기준**

RDBMS는 쿼리 실행 전에 **조인 전략을 자동으로 선택**합니다.
대부분 현대 DB는 **Cost-Based Optimizer(CBO)**를 사용하며, 예상 비용을 계산해 가장 효율적인 전략을 선택합니다.

### **1) 조인 전략 후보**

* Nested Loop Join
* Hash Join
* Sort-Merge Join (Merge Join)
* 일부 DB: Broadcast / Semi-Join (분산 환경)

---

### **2) 판단 기준**

| 기준              | 설명                                                         |
| --------------- | ---------------------------------------------------------- |
| **테이블 크기**      | 작은 테이블 → Nested Loop 유리, 큰 테이블 → Hash Join / Merge Join 선호 |
| **인덱스 존재 여부**   | 조인 키에 인덱스가 있으면 Nested Loop + Index Nested Loop 가능          |
| **통계 정보**       | 테이블 행 수, 컬럼 분포, null 비율 등 → 예상 결과 행 수 계산에 활용               |
| **메모리 용량**      | Hash Join은 작은 테이블 전체를 메모리에 올려야 하므로 메모리 크기 고려               |
| **정렬 여부**       | 이미 정렬된 테이블이면 Merge Join 비용 절감                              |
| **필터 조건**       | WHERE, JOIN 조건에 따라 Scan 범위가 줄면 Nested Loop 선호 가능           |
| **네트워크/디스크 비용** | 분산 환경에서는 Bloom Filter, Partitioned Join 등으로 I/O 최소화        |

---

### **3) 의사 결정 흐름**

```
1. 후보 조인 방식 생성
   - Nested Loop / Hash Join / Merge Join

2. 각 후보의 예상 비용 계산
   - 비용 = CPU + I/O + 메모리 + 네트워크

3. 최소 비용 조인 선택
   - 예: 작은 테이블 + 인덱스 → Nested Loop
   - 예: 큰 테이블, 작은 테이블 메모리 적재 가능 → Hash Join
   - 예: 이미 정렬됨 → Merge Join

4. 필요 시 실행 중 조정 (Adaptive Join)
   - SQL Server, Oracle 등 일부 DB는 실행 중 통계 확인 후 전략 변경
```

---

### **4) DB별 조인 전략 결정 특징**

| DB         | 결정 방식 / 특화 기능                                        |
| ---------- | ---------------------------------------------------- |
| Oracle     | Cost-Based Optimizer, Adaptive Join 지원               |
| PostgreSQL | Cost-Based, Nested Loop / Hash / Merge Join 자동 선택    |
| SQL Server | Adaptive Join, 병렬 처리와 연계, Hash / Merge / Nested Loop |

> 핵심: **DB는 테이블 크기, 인덱스, 통계, 메모리 상태 등을 종합해 비용 최소 전략 선택**

---

### **5) 실무 팁**

* `EXPLAIN` 또는 `EXPLAIN ANALYZE`로 **실제 선택된 조인 전략 확인**
* 필요 시 **힌트** 사용 → 예: `/*+ USE_HASH */` (Oracle), `OPTION (HASH JOIN)` (SQL Server)
* 조인 전략을 이해하면 **쿼리 성능 문제**를 분석하고 최적화할 때 큰 도움이 됨

---

💡 **정리**

* RDBMS는 **자동 최적화**를 통해 Nested Loop, Hash Join, Merge Join 중 선택
* 선택 기준: **테이블 크기, 인덱스, 통계, 메모리, 정렬, 필터 조건, 분산 환경 고려**
* 실무에서는 **EXPLAIN + 필터링 + 필요한 컬럼만 조회**가 성능 향상 핵심

