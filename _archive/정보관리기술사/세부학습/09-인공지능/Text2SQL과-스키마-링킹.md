# Text2SQL과 스키마 링킹

이 문서는 Text2SQL을 단순히 `자연어 → SQL`로 외우기보다, **Text2SQL이라는 문제 자체와 그 구현 방법을 구분하고, 그중 LLM 기반 접근에서 RAG와 Schema Linking이 어떤 역할을 하는지** 이해하는 데 목적이 있다.

## 1. 먼저 가장 중요한 구분: Text2SQL ≠ LLM

Text2SQL은 특정 AI Model의 이름이 아니다.

> **Text2SQL은 자연어 질문을 SQL로 변환하는 문제(Task)다.**

따라서 Text2SQL을 구현할 때 반드시 LLM을 사용할 필요는 없다.

```text
자연어 질문
"2025년 당뇨 환자 수"
        ↓
    어떤 구현 방식이든
        ↓
SQL
SELECT ...
```

구현 방법은 여러 가지가 가능하다.

### 1) Rule · Template 기반

업무 영역이 좁고 질문 Pattern이 제한적이라면 규칙과 SQL Template만으로도 만들 수 있다.

```text
"환자 수"
→ COUNT(DISTINCT patient_id)

"2025년"
→ date >= '2025-01-01'
  AND date < '2026-01-01'

"당뇨"
→ diagnosis_code IN (...)
```

이 방식은 범위가 제한되어 있으면 예측 가능하고 통제하기 쉽지만, 자연어 표현과 요구가 다양해질수록 규칙이 복잡해진다.

### 2) 전통적 NLP · 전용 ML Model 기반

LLM 이전에도 Text2SQL 연구는 존재했다.

```text
자연어
→ 형태·구문 분석
→ Intent / Entity 추출
→ Schema Mapping
→ SQL 구조 결정
→ SQL 생성
```

또는 자연어와 SQL 쌍을 학습한 Seq2Seq·Transformer 계열의 **Text2SQL 전용 Model**이 SQL을 직접 생성할 수도 있다.

```text
자연어 질문
→ Text2SQL 전용 Model
→ SQL
```

### 3) LLM 기반

최근에는 범용 LLM이 자연어 이해, Schema 해석, SQL 생성 능력을 이미 상당 부분 가지고 있기 때문에 다음처럼 구현하기 쉬워졌다.

```text
질문 + Schema + 업무정보
        ↓
       LLM
        ↓
       SQL
```

즉 **LLM은 Text2SQL이라는 문제를 푸는 현재의 강력한 구현 수단 중 하나이지, Text2SQL 자체가 LLM 기술인 것은 아니다.**

### 관계를 한 번에 보면

```text
                    Text2SQL
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
     Rule/Template   전용 ML     LLM 기반
                         Model        │
                                      ├─ RAG를 붙일 수 있음
                                      ├─ Few-shot 사용 가능
                                      └─ Agent Loop도 붙일 수 있음
```

이 구분을 먼저 잡으면 뒤에서 나오는 Schema Linking도 LLM 전용 개념이 아니라는 점이 자연스럽게 이해된다.

---

## 2. Text2SQL의 기본 문제

어떤 구현 방식을 쓰든 최종 목적은 동일하다.

```text
사용자 자연어 질문
        ↓
질문의 의미를 DB 구조와 연결
        ↓
실행 가능한 SQL 생성
```

예를 들어 질문이 다음과 같다고 하자.

```text
"2025년 당뇨 환자 수를 알려줘"
```

시스템은 최소한 다음을 알아야 한다.

```text
"당뇨"    → 어느 Column / 값인가?
"2025년"  → 어느 날짜 Column에 어떤 조건인가?
"환자 수" → 어떤 ID를 어떤 집계로 Count할 것인가?
```

따라서 Text2SQL에서 자연어와 DB 구조를 연결하는 문제는 LLM 사용 여부와 관계없이 존재한다.

---

## 3. 작은 DB에서는 복잡한 Retrieval이 없어도 된다

Table이 몇 개뿐이고 업무 범위가 좁으면 전체 Schema를 한 번에 처리할 수도 있다.

LLM 기반이라면:

```text
사용자 질문
+
전체 DB Schema
        ↓
       LLM
        ↓
       SQL
```

Rule 또는 전용 Model 기반이라면 해당 Schema 전체를 내부 Mapping 대상으로 사용할 수도 있다.

즉 Text2SQL에 반드시 Vector DB, RAG, 별도의 Schema Retrieval Pipeline이 필요한 것은 아니다.

문제는 실제 기업 DB처럼 Schema가 커질 때다.

```text
Table 2,000개
Column 30,000개
업무용어 수천 개
복잡한 Join 관계
```

전체 Schema를 매번 다루면 검색 범위와 Noise가 커진다. 이때 관련 Schema를 먼저 좁히는 Retrieval이 유용해진다.

---

## 4. Text2SQL과 RAG가 비슷하게 느껴지는 이유

이 부분은 특히 **LLM 기반 Text2SQL**에서 잘 보인다.

일반 문서 RAG:

```text
사용자 질문
→ 관련 문서 Retrieval
→ 질문 + 관련 문서
→ LLM
→ 자연어 답변
```

대규모 LLM 기반 Text2SQL:

```text
사용자 질문
→ 관련 Schema·Metadata Retrieval
→ 질문 + 관련 Schema
→ LLM
→ SQL
```

큰 구조가 매우 비슷하다.

차이는 **무엇을 검색하고 무엇을 생성하느냐**다.

| 구분 | 일반 RAG | LLM 기반 Text2SQL + Retrieval |
|---|---|---|
| 검색 대상 | 문서 Chunk | Table·Column·업무용어·Code·Join·예제 SQL |
| LLM 입력 | 질문 + 관련 문서 | 질문 + 관련 Schema·Metadata |
| LLM 출력 | 자연어 답변 | SQL |
| 추가 검증 | 근거·출처 중심 | 문법·권한·비용·실행 안전성 |

따라서 RAG는 Text2SQL의 필수 구성요소가 아니라 **대규모 Schema를 다룰 때 관련 Context를 찾기 위한 한 가지 좋은 방법**이다.

---

## 5. Metadata를 왜 준비해야 하는가

실제 DB의 물리명만 보고 사람이든 Model이든 업무 의미를 정확히 알기는 어렵다.

예를 들어 다음 Column만 있다고 하자.

```text
DIAG_CD
PT_NO
ADM_DT
```

설명이 없다면 어떤 값인지 명확하지 않다.

따라서 Text2SQL용 Metadata에는 다음 정보를 관리할 수 있다.

- Table·Column 물리명
- 논리명과 설명
- PK·FK·Join 관계
- Data Type과 허용값
- Code 값과 업무 용어
- 동의어와 약어
- 대표 Query
- 개인정보·민감도
- 조회 권한
- Data 갱신 주기와 품질

예:

```text
DIAGNOSIS.DIAG_CD
논리명: 진단코드
설명: 환자의 진단 질환 코드
동의어: 진단, 상병, 질환, 질병
Code 체계: ICD
예시: 당뇨병, 고혈압, 심근경색
```

이 Metadata는 Rule 기반 Mapping에도 쓸 수 있고, 검색 Index에도 쓸 수 있고, LLM Context에도 넣을 수 있다.

즉 Metadata 자체는 LLM 전용 자산이 아니다.

---

## 6. Metadata Retrieval

Schema가 커졌다면 질문과 관련 있는 후보만 먼저 찾을 수 있다.

```text
질문
→ Keyword / 규칙 / Embedding / 검색 Engine
→ 관련 Metadata 후보
```

LLM 기반 구조라면 다음처럼 이어진다.

```text
질문
→ 검색용 Embedding
→ Vector Search / Keyword Search
→ 관련 Metadata 후보
→ 질문 + 후보를 LLM에 전달
```

검색 대상은 다양할 수 있다.

```text
Table 설명
Column 설명
업무 용어 사전
Code Dictionary
Join 관계
과거 질문 ↔ SQL 예제
SQL 작성 규칙
```

중요한 점은 **Embedding Retrieval도 여러 구현 방법 중 하나**라는 것이다. 정확한 물리명이나 업무 Code를 찾는 데는 Keyword Search나 Dictionary Lookup이 더 적합할 수도 있다.

---

# Schema Linking

## 7. Schema Linking은 LLM 전용 개념이 아니다

Schema Linking은 특정 Model 이름이 아니다.

> **사용자 질문의 자연어 개념을 실제 DB의 Table · Column · Value · 관계에 연결하는 Task**다.

따라서 Rule 기반 Text2SQL, 전용 ML Model, LLM 기반 Text2SQL 모두 이 문제를 어떤 형태로든 해결해야 한다.

예를 들어:

```text
사용자 질문
"2025년 당뇨 환자 수"

"당뇨"
→ DIAGNOSIS.DIAG_CODE
→ 실제 Code E10~E14

"2025년"
→ DIAGNOSIS.DIAG_DATE

"환자 수"
→ PATIENT_ID
→ COUNT(DISTINCT PATIENT_ID)
```

이 매핑 결과를 만드는 작업 전체를 Schema Linking으로 볼 수 있다.

### 구현 방식별 예

Rule 기반:

```text
사전: "당뇨" → DIAG_CODE / E10~E14
```

전용 ML Model 기반:

```text
질문 Token ↔ Schema Element의 관계를 Model이 예측
```

LLM 기반:

```text
질문 + Schema Context
→ LLM이 관련 Table·Column·Value 판단
→ SQL 생성
```

즉 **Schema Linking이라는 문제는 같고 누가 어떻게 해결하느냐가 다른 것**이다.

---

## 8. LLM 기반에서는 Schema Linking을 어디서 수행하는가

방법은 하나로 정해져 있지 않다.

### 방법 1. 전체 Schema와 함께 한 번에 처리

```text
질문 + 전체 Schema
        ↓
       LLM
        ↓
Schema Linking + SQL 생성
```

별도 Linking API를 만들지 않아도 LLM이 SQL을 생성하는 과정에서 자연스럽게 Linking을 수행한다.

### 방법 2. Retrieval 후 LLM이 최종 Linking

```text
질문
→ Schema Retrieval
→ 관련 후보
→ 질문 + 후보를 LLM에 전달
→ 최종 Mapping + SQL 생성
```

대규모 DB에서 단순하게 시작하기 좋은 구조다.

### 방법 3. Linking과 SQL 생성을 명시적으로 분리

```text
질문
→ Retrieval
→ Schema Linking 결과 생성
→ Linking 검증
→ SQL Generation
```

정확도와 설명 가능성을 높이거나 중간 결과를 검증해야 할 때 사용할 수 있다.

---

## 9. Embedding Retrieval이 이미 Linking의 상당 부분을 하는 것 아닌가

맞다.

Schema 설명에 의미 정보를 충분히 넣어 Embedding해 두면 자연어 질문과 관련 Schema가 가까워질 수 있다.

```text
DIAGNOSIS.DIAG_CODE
설명: 환자의 진단 질환 코드
업무용어: 진단, 질환, 상병
예시: 당뇨, 고혈압, 심근경색
        ↓
Embedding
        ↓
Schema Vector 저장
```

질문:

```text
"당뇨 환자"
        ↓
Query Embedding
        ↓
Vector Search
        ↓
DIAGNOSIS.DIAG_CODE가 상위 후보
```

이렇게 Retrieval 자체가 자연어와 Schema를 의미적으로 연결하는 역할을 한다.

다만 사전에 `당뇨 질문 → 이 Column`이라는 모든 질문별 Linking 결과를 저장하는 것은 아니다. Schema의 의미를 표현한 Vector를 저장해 두고 실제 질문이 들어온 뒤 후보를 찾는다.

또 Column 후보를 찾았다고 최종 SQL의 모든 판단이 끝나는 것은 아니다.

```text
"당뇨" → DIAG_CODE는 찾음
하지만 실제 조건 값은?
→ E10~E14?

"환자 수"
→ 어느 Table의 PATIENT_ID?

여러 Table이 필요함
→ 어느 Join Path?
```

그래서 Retrieval은 **Schema Linking 후보 생성**에 매우 유용하고, 질문 전체를 고려한 최종 Mapping 문제가 남을 수 있다.

---

## 10. Value Linking과 Join Linking

Schema Linking을 Column 이름 선택으로만 생각하면 부족하다.

### Value Linking

```text
"당뇨"
→ DIAG_CODE
→ E10, E11, E12, E13, E14
```

자연어와 실제 DB 값 또는 Code를 연결해야 SQL 조건을 만들 수 있다.

### Join Linking

```text
PATIENT.PATIENT_ID
        ↕
DIAGNOSIS.PATIENT_ID
        ↕
ADMISSION.PATIENT_ID
```

여러 Table이 필요한 질문에서는 어떤 관계와 Join Path를 사용할지도 결정해야 한다.

그래서 Code Dictionary, PK/FK, 업무적으로 허용되는 Join Path 같은 Metadata가 중요하다.

---

## 11. Few-shot과 RAG를 LLM 기반 Text2SQL에서 같이 쓰기

LLM 기반 Text2SQL에서는 관련 Schema뿐 아니라 과거의 비슷한 질문-SQL 예제도 검색할 수 있다.

현재 질문:

```text
"2025년 당뇨 환자 수"
```

검색된 예제:

```text
질문: "2024년 고혈압 환자 수"
SQL: SELECT COUNT(DISTINCT ...) ...
```

이 예제를 Prompt에 넣으면 **RAG로 Few-shot 예제를 동적으로 선택**한 구조다.

- System Prompt: 어떻게 행동할지 규칙 제공
- Few-shot: 어떻게 풀지 예제 제공
- RAG: 무엇을 참고할지 동적으로 검색

세 가지 모두 Weight를 바꾸지 않고 LLM Context를 구성한다.

---

## 12. SQL Generation

이 단계 역시 구현 방식에 따라 다르다.

Rule/Template 기반:

```text
추출한 Intent·조건
→ 정해진 SQL Template 조립
```

전용 ML Model 기반:

```text
자연어 + Schema 표현
→ Model
→ SQL Token Sequence
```

LLM 기반:

```text
질문
+
관련 Schema
+
Code Dictionary
+
Join 관계
+
필요 시 유사 SQL 예제
        ↓
       LLM
        ↓
       SQL
```

LLM Prompt에는 SQL Dialect, 사용 가능한 Table·Column, Join 규칙, 날짜 처리 규칙, 금지 연산, Row Limit 등을 명확히 둘 수 있다.

---

## 13. Validation: 생성 방식과 관계없이 중요하다

Text2SQL의 출력은 실제 DB에 실행될 수 있으므로 생성 방법이 무엇이든 검증이 중요하다.

- Parser로 문법 확인
- 허용된 SELECT인지 확인
- 존재하는 Table·Column인지 확인
- 사용자 권한 확인
- Row·Column Security 적용
- Cartesian Join 여부
- Full Scan 위험
- 실행계획·예상 비용
- Timeout
- Row Limit
- 읽기 전용 계정·Replica 사용
- 민감정보 Masking

LLM 기반에서는 필요하면 다음 Agent Loop를 제한적으로 수행할 수도 있다.

```text
SQL 생성
→ Validation
→ 오류
→ 오류 내용을 LLM에 전달
→ SQL 수정
→ 재검증
```

하지만 이 역시 Text2SQL의 필수 본질이라기보다 LLM 기반 구현에서 사용할 수 있는 한 가지 패턴이다.

---

## 14. Text2SQL 전체 그림

```text
                    Text2SQL Task
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    Rule/Template     전용 ML        LLM 기반
          │              │              │
          └──────┬───────┴──────┬───────┘
                 │              │
            Schema Linking / Value Linking
                 │
             SQL Generation
                 │
              Validation
                 │
              Execution
```

대규모 LLM 기반 시스템이라면 다음처럼 확장될 수 있다.

```text
사용자 질문
→ Metadata / Schema Retrieval
→ 관련 Table·Column·업무용어·Code 후보
→ Schema Linking
→ LLM SQL Generation
→ Validation
→ Execution
→ 결과 검증·설명
```

---

## 15. 기억 흐름

```text
Text2SQL
= 자연어를 SQL로 바꾸는 Task
= LLM 그 자체가 아님

구현 방법
= Rule / 전용 ML Model / LLM 등 다양

Schema Linking
= 자연어 개념을 Table·Column·Value·Join과 연결하는 Task
= LLM 전용 개념이 아님

RAG
= 대규모 Schema에서 관련 Metadata를 찾기 위한 선택적 Retrieval 방법

LLM
= Text2SQL을 구현하는 강력한 방법 중 하나
```

한 문장으로 정리하면 다음과 같다.

> **Text2SQL은 자연어를 SQL로 변환하는 문제 영역이고, LLM은 이를 해결하는 여러 구현 방법 중 하나다. Schema Linking 역시 LLM 전용 기술이 아니라 자연어와 DB 구조를 연결하기 위해 Text2SQL 전반에서 필요한 핵심 Task다.**
