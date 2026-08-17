# Text2SQL과 스키마 링킹

이 문서는 Text2SQL을 단순히 `자연어 → SQL`로 외우기보다, **RAG와 무엇이 비슷하고 Schema Linking은 정확히 어떤 '작업'인지**를 이해하는 데 목적이 있다.

## 1. Text2SQL의 본질

Text2SQL은 사용자의 자연어 질문을 Database Query로 변환한다.

가장 단순한 구조는 다음과 같다.

```text
사용자 질문
+
DB Schema
        ↓
       LLM
        ↓
       SQL
```

예를 들어 Table이 5~10개뿐이라면 전체 Schema를 Context에 넣고 LLM에게 SQL을 만들라고 해도 충분히 동작할 수 있다.

즉 Text2SQL에 반드시 Vector DB, RAG, 별도 Schema Linking Model이 필요한 것은 아니다.

문제는 실제 기업 DB처럼 Schema가 커졌을 때다.

```text
Table 2,000개
Column 30,000개
업무용어 수천 개
복잡한 Join 관계
```

이 모든 정보를 매번 LLM Context에 넣으면 비용과 Noise가 커지고, LLM이 관련 없는 Table이나 Column을 선택할 가능성도 높아진다.

그래서 관련 정보를 먼저 좁히는 Retrieval이 필요해진다.

---

## 2. Text2SQL과 RAG가 비슷하게 느껴지는 이유

일반 문서 RAG는 다음처럼 동작한다.

```text
사용자 질문
→ 관련 문서 Retrieval
→ 질문 + 관련 문서
→ LLM
→ 자연어 답변
```

대규모 Text2SQL은 다음처럼 구성할 수 있다.

```text
사용자 질문
→ 관련 Schema·Metadata Retrieval
→ 질문 + 관련 Schema
→ LLM
→ SQL
```

즉 큰 구조는 매우 비슷하다.

차이는 **무엇을 검색하고 무엇을 생성하느냐**다.

| 구분 | 일반 RAG | Text2SQL + Retrieval |
|---|---|---|
| 검색 대상 | 문서 Chunk | Table·Column·업무용어·Code·Join·예제 SQL |
| LLM 입력 | 질문 + 관련 문서 | 질문 + 관련 Schema·Metadata |
| LLM 출력 | 자연어 답변 | SQL |
| 추가 검증 | 근거·출처 중심 | 문법·권한·비용·실행 안전성 |

---

## 3. Metadata를 왜 준비해야 하는가

실제 DB의 물리명만 보고 LLM이 업무 의미를 정확히 알기는 어렵다.

예를 들어 다음 Column만 있다고 하자.

```text
DIAG_CD
PT_NO
ADM_DT
```

사람도 설명이 없으면 정확한 의미를 알기 어렵다.

따라서 Text2SQL용 Metadata에는 다음 정보를 함께 관리하면 좋다.

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

이렇게 의미를 풍부하게 만들어 Embedding하면 `당뇨 환자` 같은 자연어 질문이 물리명 `DIAG_CD`와 연결될 가능성이 훨씬 높아진다.

---

## 4. Metadata Retrieval

사용자가 다음과 같이 질문했다고 하자.

```text
"2025년 당뇨 환자 수를 알려줘"
```

전체 Schema를 LLM에 넣는 대신 질문과 관련 있는 Schema 후보를 먼저 찾을 수 있다.

```text
질문
→ 검색용 Embedding
→ Vector Search / Keyword Search
→ 관련 Metadata 후보

DIAGNOSIS
- PATIENT_ID
- DIAG_CODE
- DIAG_DATE

PATIENT
- PATIENT_ID
...
```

이 단계는 일반 RAG의 Retrieval과 거의 같은 역할을 한다.

검색 대상은 단순 Table 설명만이 아닐 수 있다.

```text
Table 설명
Column 설명
업무 용어 사전
Code Dictionary
Join 관계
과거 질문 ↔ SQL 예제
SQL 작성 규칙
```

---

# Schema Linking

## 5. Schema Linking은 별도 Model 이름이 아니다

처음 들으면 `Schema Linking Model`이라는 특정 AI Model이 존재하는 것처럼 느껴질 수 있다.

하지만 Schema Linking은 기본적으로 **Text2SQL에서 해결해야 하는 Task의 이름**이다.

> **사용자 질문 속 자연어 개념을 실제 DB의 Table · Column · Value · 관계에 연결하는 작업**

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

이 매핑 결과를 만드는 행위 자체가 Schema Linking이다.

---

## 6. Schema Linking은 누가 수행하는가

방법은 하나로 정해져 있지 않다.

### 방법 1. 전체 Schema를 LLM에 주고 한 번에 처리

작은 DB라면 가장 단순하다.

```text
질문 + 전체 Schema
        ↓
       LLM
        ↓
관련 Table·Column 판단
+
SQL 생성
```

이 경우 별도의 `Schema Linking 단계`를 구현하지 않았지만 **LLM이 SQL을 만드는 과정에서 내부적으로 Schema Linking Task를 수행한 것**으로 볼 수 있다.

### 방법 2. Retrieval 후 LLM이 최종 Linking

대규모 DB에서는 먼저 후보를 좁힌다.

```text
질문
→ Schema Retrieval
→ 관련 Table·Column 후보
→ 질문 + 후보를 LLM에 전달
→ LLM이 최종 Mapping + SQL 생성
```

실무에서 단순하게 시작하기 좋은 구조다.

### 방법 3. Linking과 SQL 생성을 명시적으로 분리

```text
질문
→ Retrieval
→ LLM 또는 규칙으로 Schema Linking 결과 생성
→ 선택된 Schema
→ 다른 LLM Call에서 SQL 생성
```

복잡한 시스템에서는 중간 결과를 검증하거나 설명하기 위해 분리할 수 있다.

---

## 7. Embedding 단계에서 이미 Linking할 수 있지 않은가

여기서 중요한 의문이 나온다.

> Schema 설명에 `진단, 질환, 상병, 당뇨` 같은 의미를 충분히 넣어 Embedding하면 Retrieval 자체가 이미 Linking을 상당 부분 하는 것 아닌가?

맞다.

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

사용자 질문:

```text
"당뇨 환자"
        ↓
Query Embedding
        ↓
Vector Search
        ↓
DIAGNOSIS.DIAG_CODE가 상위 후보
```

이렇게 Retrieval 단계 자체가 자연어와 Schema의 의미적 연결을 상당 부분 수행한다.

다만 여기서 정확히 구분할 것이 있다.

> **사전에 '질문과 Schema를 Linking해 저장'하는 것은 아니다.**

사전에는 Schema의 의미를 잘 표현한 Vector를 저장한다. 실제 질문이 들어온 뒤 Query Vector와 비교하면서 관련 후보가 결정된다.

또 `DIAG_CODE`를 찾았다고 해서 모든 문제가 끝난 것은 아니다.

```text
"당뇨"
→ DIAG_CODE Column
→ 실제 값은 E10~E14인가?

"환자 수"
→ 어느 Table의 PATIENT_ID를 Count할 것인가?

여러 Table이 필요하면
→ 어떤 FK로 Join할 것인가?
```

질문 전체 문맥에 따른 최종 선택은 여전히 필요하다.

따라서 다음처럼 이해하면 가장 자연스럽다.

> **Retrieval은 Schema Linking 후보를 잘 찾아주는 과정이고, 최종적으로 질문에 사용할 Table·Column·Value·Join을 결정하는 문제 전체를 Schema Linking이라고 볼 수 있다.**

---

## 8. Value Linking도 중요하다

Schema Linking을 Column 선택으로만 생각하면 부족하다.

```text
"당뇨"
→ DIAGNOSIS.DIAG_CODE
```

여기까지 알아도 SQL 조건을 만들려면 실제 Code 값을 알아야 한다.

```text
"당뇨"
→ DIAG_CODE
→ E10, E11, E12, E13, E14
```

이런 자연어와 실제 DB 값의 연결을 Value Linking으로 구분해서 부르기도 한다.

사내 Text2SQL에서는 Code Dictionary와 업무 용어 사전이 중요한 이유다.

---

## 9. Join 관계도 Linking의 일부다

질문에 여러 업무 영역이 포함되면 여러 Table을 연결해야 한다.

```text
PATIENT.PATIENT_ID
        ↕
DIAGNOSIS.PATIENT_ID
        ↕
ADMISSION.PATIENT_ID
```

어떤 Table을 사용할지뿐 아니라 **어떤 관계로 Join할지**를 결정해야 정확한 SQL이 만들어진다.

따라서 Text2SQL용 Metadata에는 PK/FK, Join 관계, 업무적으로 허용되는 Join Path를 관리하는 것이 유용하다.

---

## 10. Few-shot과 RAG를 Text2SQL에서 같이 쓰기

Text2SQL에서는 관련 Schema뿐 아니라 과거의 비슷한 SQL 예제도 검색할 수 있다.

현재 질문:

```text
"2025년 당뇨 환자 수"
```

Vector Search로 다음 예제를 찾았다고 하자.

```text
질문: "2024년 고혈압 환자 수"
SQL: SELECT COUNT(DISTINCT ...) ...
```

이 예제를 Prompt에 넣으면 **RAG로 Few-shot 예제를 동적으로 선택한 것**이 된다.

따라서 System Prompt, Few-shot, RAG는 모두 Weight를 바꾸지 않고 Context를 구성한다는 공통점이 있다.

- System Prompt: 어떻게 행동할지 규칙 제공
- Few-shot: 어떻게 풀지 예제 제공
- RAG: 무엇을 참고할지 동적으로 검색

---

## 11. SQL Generation

최종적으로 필요한 Schema와 업무 정보를 LLM에 제공하고 SQL을 생성한다.

Prompt에는 다음을 명확히 둘 수 있다.

- 사용 가능한 Table·Column
- SQL Dialect
- Join 규칙
- 날짜 처리 규칙
- 금지 연산
- Row Limit
- 조직 고유의 Query Pattern

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

---

## 12. Validation: Text2SQL은 생성 후가 특히 중요하다

LLM이 만든 SQL을 바로 운영 DB에서 실행하면 위험하다.

검증 예:

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

필요하면 다음 Loop를 제한적으로 수행할 수 있다.

```text
SQL 생성
→ Validation
→ 오류
→ 오류 내용을 LLM에 전달
→ SQL 수정
→ 재검증
```

이 구조는 Agent Loop와도 연결된다.

---

## 13. Text2SQL 전체 흐름

작은 DB:

```text
질문
+
전체 Schema
→ LLM
→ SQL
```

대규모 실무형 구조:

```text
사용자 질문
→ Metadata / Schema Retrieval
→ 관련 Table·Column·업무용어·Code 후보
→ Schema Linking
   ├─ Table
   ├─ Column
   ├─ Value
   └─ Join 관계
→ 질문 + 관련 Context
→ LLM SQL Generation
→ 문법·권한·비용 Validation
→ 제한된 환경에서 실행
→ 결과 검증·설명
```

여기서 Schema Linking을 반드시 독립 Model이나 별도 Pipeline으로 구현해야 하는 것은 아니다. DB 규모와 정확도 요구에 따라 Retrieval과 SQL Generation 사이에서 LLM이 자연스럽게 수행하도록 둘 수도 있다.

---

## 14. 기억 흐름

```text
Text2SQL의 본질
= 자연어 질문 + DB 의미 → SQL

DB가 작으면
= 전체 Schema를 LLM에 넣어도 됨

DB가 커지면
= RAG처럼 관련 Metadata를 먼저 Retrieval

Schema Linking
= 질문의 개념을 Table·Column·Value·Join에 연결하는 Task
= 특정 Model 이름이 아님

최종
질문
→ Metadata Retrieval
→ Schema Linking
→ SQL Generation
→ Validation
→ Execution
→ 결과 확인
```

한 문장으로 정리하면 다음과 같다.

> **대규모 Text2SQL은 RAG와 유사하게 관련 Schema와 Metadata를 먼저 찾아 Context를 줄이고, LLM이 그 정보를 바탕으로 Schema Linking과 SQL 생성을 수행하도록 만드는 구조로 이해할 수 있다.**
