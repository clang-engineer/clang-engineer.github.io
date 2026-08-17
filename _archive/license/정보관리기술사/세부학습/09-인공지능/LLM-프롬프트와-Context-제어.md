# LLM 프롬프트와 Context 제어

이 문서는 LLM을 다시 학습시키지 않고 **현재 요청의 Context를 어떻게 구성해 원하는 행동을 유도하는지**를 정리한다.

핵심 구분은 다음과 같다.

```text
System Prompt / Few-shot / RAG
→ Context를 바꿈
→ Model Weight는 바뀌지 않음

Fine-tuning
→ Training을 수행
→ Model Parameter를 바꿈
```

---

## 1. Prompt Engineering

Prompt Engineering은 LLM에게 어떤 정보와 지시를 어떤 구조로 제공할지 설계하는 활동이다.

단순히 질문을 예쁘게 쓰는 기법만을 뜻하지 않는다. 실제 LLM Application에서는 다음 전체를 설계하는 문제에 가깝다.

```text
System Prompt
+ User Prompt
+ Few-shot 예제
+ RAG 검색 결과
+ Tool 설명과 Schema
+ 이전 대화나 Memory
→ 하나의 Context
→ LLM Inference
```

즉 Prompt Engineering은 **LLM의 Weight를 바꾸는 대신 현재 추론에 들어갈 Context를 설계하는 일**이라고 이해하면 된다.

---

## 2. System Prompt

System Prompt는 모델의 역할, 행동 규칙, 제약조건 등을 상위 지침으로 제공한다.

예를 들어 Text2SQL 시스템이라면 다음처럼 구성할 수 있다.

```text
너는 PostgreSQL SQL 생성 도우미다.
제공된 Schema만 사용한다.
존재하지 않는 Table과 Column을 만들지 않는다.
SELECT 문만 생성한다.
```

System Prompt의 목적은 주로 다음과 같다.

- 역할 지정
- 허용·금지 행동 정의
- 출력 원칙 정의
- 업무 규칙 전달
- 안전 제약 설정

하지만 System Prompt를 넣는다고 Model Weight가 바뀌는 것은 아니다. 해당 요청의 Context에서 지침을 참고하는 것이다.

---

## 3. Few-shot

Few-shot은 입력과 원하는 출력 예제를 몇 개 Context에 넣어 모델에게 해결 패턴을 보여주는 방식이다.

```text
질문: 남성 환자 수
SQL: SELECT COUNT(DISTINCT patient_id) ...

질문: 2025년 방문 환자 수
SQL: SELECT COUNT(DISTINCT patient_id) ...

실제 질문: 2025년 당뇨 환자 수
SQL: ?
```

모델은 앞의 예제를 참고해 실제 질문도 유사한 스타일로 처리할 수 있다.

### Few-shot과 Fine-tuning의 차이

```text
Few-shot
→ 예제를 Prompt에 넣음
→ Context에만 존재
→ Weight 변경 없음

Fine-tuning
→ 예제를 학습 Data로 사용
→ Training 수행
→ Parameter 변경
```

Few-shot은 학습처럼 보이지만 **Inference 시점에 예제를 보여주는 것**이지 Model 자체를 다시 학습하는 것은 아니다.

---

## 4. Few-shot과 RAG가 비슷하게 느껴지는 이유

둘 다 필요한 정보를 Context에 공급한다는 공통점이 있다.

```text
Few-shot
→ 예제를 Context에 넣음

RAG
→ 외부 지식을 검색해서 Context에 넣음
```

차이는 무엇을 어떻게 가져오느냐에 있다.

| 방식 | 주로 넣는 것 | 목적 |
|---|---|---|
| System Prompt | 규칙·역할 | 어떻게 행동할지 |
| Few-shot | 입력-출력 예제 | 어떻게 풀지 보여주기 |
| RAG | 검색된 지식 | 무엇을 참고할지 |

세 방식 모두 **Weight를 변경하지 않고 Context를 구성한다**.

---

## 5. Dynamic Few-shot

Few-shot 예제를 개발자가 항상 고정해서 넣을 필요는 없다.

Text2SQL 예를 보자.

현재 질문:

```text
"2025년 당뇨 환자 수"
```

과거 질문-SQL 예제들을 Vector DB에 저장해 두었다가 비슷한 예제를 검색할 수 있다.

```text
현재 질문
→ Embedding
→ 유사 질문 검색
→ "2024년 고혈압 환자 수" + 정답 SQL 발견
→ 해당 예제를 Few-shot으로 Context에 추가
→ LLM SQL 생성
```

이 경우 **RAG 방식으로 Few-shot 예제를 동적으로 선택**한 것이다.

따라서 Few-shot과 RAG는 서로 완전히 분리된 기술이라기보다 함께 조합할 수 있다.

---

## 6. Structured Output

LLM은 기본적으로 Text를 생성한다. 사람이 읽기에는 자연스럽지만 Application이 후속 처리하기에는 자유로운 자연어가 불편할 수 있다.

예를 들어 다음 결과보다:

```text
사용자는 2025년 당뇨 환자 수를 조회하고 싶어 합니다.
```

다음처럼 구조화된 결과가 프로그램 처리에는 편하다.

```json
{
  "year": 2025,
  "disease": "diabetes"
}
```

Structured Output은 **LLM의 출력을 프로그램이 안정적으로 읽을 수 있는 Schema에 맞추는 방식**이다.

---

## 7. Function Calling / Tool Calling

Structured Output을 실제 외부 기능 호출과 연결하면 Tool Calling으로 이어진다.

예를 들어 Application에 다음 Tool이 있다고 하자.

```text
get_patient_count(year, disease)
```

사용자가 다음과 같이 물어본다.

```text
"2025년 당뇨 환자 몇 명이야?"
```

LLM은 개념적으로 다음과 같은 호출 의도를 만들 수 있다.

```json
{
  "tool": "get_patient_count",
  "arguments": {
    "year": 2025,
    "disease": "diabetes"
  }
}
```

중요한 것은 **LLM이 함수를 실제 실행하는 것이 아니라는 점**이다.

```text
사용자
→ LLM이 Tool과 인자 결정
→ Agent Runtime / Application
→ 실제 Tool 실행
→ 결과 반환
→ 결과를 다시 LLM Context에 전달
→ LLM이 최종 답변 생성
```

즉 Tool Calling은 LLM의 판단을 실제 Program 동작으로 연결하는 Interface다.

---

## 8. Structured Output과 Tool Calling의 관계

둘 다 자유로운 자연어 대신 구조화된 출력을 사용한다는 점은 비슷하다.

### Structured Output

```text
"결과를 이 구조로 반환해"
```

### Tool Calling

```text
"사용할 Tool과 Parameter를 이 구조로 표현해"
```

Tool Calling에서는 구조화된 결과가 실제 Tool 실행으로 이어진다는 점이 다르다.

---

## 9. Context Window 관점에서 모두 하나로 보기

LLM 입장에서 System Prompt, Few-shot, RAG 결과, Tool 결과는 결국 모두 **현재 Context에 들어온 Token**이다.

```text
System Prompt ──────┐
Few-shot ───────────┤
RAG 결과 ───────────┤
Tool 결과 ──────────┼→ Context Window → LLM
User Prompt ────────┘
```

차이는 그 정보를 누가 어떤 방식으로 준비했는가에 있다.

- System Prompt: 개발자가 주로 고정적으로 준비
- Few-shot: 예제 제공
- RAG: 질문에 따라 외부에서 동적으로 검색
- Tool 결과: 외부 시스템을 실제 호출한 결과

---

## 10. Context 방식의 장점과 한계

### 장점

- Model 재학습이 필요 없음
- 적용과 변경이 빠름
- 최신 정보나 사용자별 정보를 동적으로 넣을 수 있음
- RAG·Tool과 쉽게 결합 가능

### 한계

- Context Window를 사용함
- 긴 Context는 Token 비용과 Latency를 증가시킴
- Prompt만으로 Model의 모든 행동을 안정적으로 바꾸기는 어려움
- 반복적으로 동일한 Task 행동을 강제해야 하는 경우 Fine-tuning이 더 적합할 수도 있음

---

## 11. 무엇을 언제 선택할까

```text
모델에게 규칙을 알려주고 싶다
→ System Prompt

답변 패턴 예제를 보여주고 싶다
→ Few-shot

외부의 최신·사내 지식을 참고시키고 싶다
→ RAG

Program이 읽을 구조로 답을 받고 싶다
→ Structured Output

외부 기능을 실제 호출시키고 싶다
→ Tool Calling

모델 자체의 반복적인 행동 특성을 바꾸고 싶다
→ Fine-tuning 검토
```

---

## 12. 기억 흐름

```text
Prompt Engineering
= Context 설계 전체

System Prompt
= 규칙과 역할

Few-shot
= 예제

RAG
= 동적으로 검색한 지식

Structured Output
= 프로그램이 읽기 좋은 출력 구조

Tool Calling
= 어떤 외부 기능을 어떤 인자로 쓸지 구조화
```

가장 중요한 한 문장:

> **System Prompt, Few-shot, RAG는 서로 목적은 다르지만 모두 Model Weight를 건드리지 않고 추론 시점의 Context를 바꾸어 LLM 행동을 유도하는 방법이다.**
