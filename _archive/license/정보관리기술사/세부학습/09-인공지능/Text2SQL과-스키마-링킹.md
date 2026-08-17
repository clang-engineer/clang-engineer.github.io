# Text2SQL과 스키마 링킹

## Text2SQL의 목적

Text2SQL은 사용자의 자연어 질문을 Database Query로 변환한다.

질문 이해
→ 관련 Schema·Metadata 검색
→ Schema Linking
→ SQL 생성
→ 문법·권한·비용 검증
→ 제한된 환경에서 실행
→ 결과 확인·설명

단순히 모든 Table 정의와 질문을 LLM에 넣어도 작은 DB에서는 동작할 수 있다. Schema가 크고 이름이 모호해지면 관련 Table·Column을 찾지 못하거나 존재하지 않는 항목을 만들어낼 가능성이 커진다.

## Metadata 준비

LLM이 Column 이름만 보고 업무 의미를 모두 알 수는 없다. 다음 정보를 함께 관리하면 품질이 좋아진다.

- Table·Column 이름과 설명
- PK·FK·Join 관계
- Data Type과 허용값
- Code 값과 업무 용어
- 대표 Query
- 개인정보·민감도
- 조회 권한
- Data 갱신 주기와 품질
- 동의어와 약어

Schema와 Metadata를 Table·도메인·업무 영역 단위로 Embedding해 검색할 수 있다.

## Schema Retrieval

사용자 질문을 Embedding하고 관련 Table·Column·업무 용어를 검색한다. 전체 Schema를 Prompt에 넣는 대신 관련 후보만 가져오면 Context 사용량과 혼동을 줄일 수 있다.

Retrieval 결과는 확정 답이 아니라 Schema Linking의 후보 집합이다.

## Schema Linking

Schema Linking은 질문 속 업무 개념을 실제 Schema 요소에 연결하는 과정이다.

예:
- “환자” → patient_master Table
- “진단일” → diagnosis_date Column
- “당뇨” → diagnosis_code와 Code Dictionary
- “최근 1년” → 날짜 조건
- “병원별” → hospital_id Grouping과 기관 Table Join

별도 Machine Learning Model 하나를 반드시 사용하는 것은 아니다. 규칙·사전·Embedding 검색·LLM 추론을 조합해 수행할 수 있다.

Embedding 단계에서 Schema 정보를 미리 Vector화할 수는 있지만, 실제 질문이 들어온 뒤 어떤 Table과 Join을 사용할지는 Query 문맥에 따라 결정해야 한다. 따라서 사전 Indexing과 질의 시 Linking은 서로 다른 단계다.

## SQL 생성

선택한 Schema와 제약을 LLM에 제공하고 SQL을 생성한다. Prompt에는 사용 가능한 Table·Column, Dialect, Join 규칙, 금지 연산, Row 제한 등을 명확히 둔다.

Few-shot으로 자연어 질문과 올바른 SQL 예시를 제공하면 조직의 Query Pattern과 명명법을 학습 Context로 줄 수 있다. 이는 RAG와 비슷하게 Context를 제공하지만 목적은 지식 검색보다 출력 형식과 해결 예시를 보여주는 데 있다.

## 검증

생성된 SQL을 바로 운영 DB에서 실행하면 위험하다.

- Parser로 문법 확인
- 허용된 SELECT인지 확인
- Table·Column 존재 확인
- 사용자 권한과 Row·Column 보안 적용
- Cartesian Join과 전체 Scan 위험 확인
- 실행계획·예상 비용 확인
- Timeout·Row Limit
- 읽기 전용 계정과 Replica 사용
- 민감정보 Masking
- 결과가 질문 의도와 맞는지 확인

필요하면 생성 → 검증 오류 → 수정의 반복을 제한된 횟수 안에서 수행한다.

## Text2SQL과 RAG의 관계

공통점:
- 질문을 이해한다.
- 관련 Context를 검색한다.
- LLM에 필요한 정보만 제공한다.
- 생성 결과를 검증한다.

차이:
- 일반 RAG는 관련 문서 Text를 근거로 답변한다.
- Text2SQL은 Schema·Metadata를 근거로 실행 가능한 SQL을 만든다.
- Text2SQL은 문법·권한·비용·실행 결과 검증이 특히 중요하다.

## 기억 흐름

질문
→ Metadata Retrieval
→ Schema Linking
→ SQL 생성
→ 안전성·비용 검증
→ 실행
→ 결과 검증과 설명
