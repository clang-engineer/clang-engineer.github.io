# 에이전트와 MCP

이 문서는 Agent와 MCP를 별도의 신기한 AI 기술로 외우기보다, **기본 LLM에 실제 행동 능력을 어떻게 붙이는지**를 이해하는 데 목적이 있다.

## 1. Agent의 바닥에는 여전히 LLM이 있다

Codex나 Claude Code 같은 Coding Agent도 가장 밑바닥의 생성 원리는 일반 LLM과 같다.

```text
Context
→ Tokenization
→ Embedding
→ Transformer·Attention
→ 다음 Token 예측
→ Token 생성
```

차이는 LLM 바깥에 **Tool과 실행 Loop**가 붙는다는 것이다.

일반적인 LLM 호출은 다음처럼 끝날 수 있다.

```text
사용자 질문
→ LLM
→ 자연어 답변
```

Agent는 다음처럼 움직인다.

```text
사용자 목표
→ LLM이 다음 행동 판단
→ Tool 호출
→ Tool 실제 실행
→ 결과를 LLM에 전달
→ LLM이 다시 판단
→ 추가 Tool 호출 또는 종료
```

즉 Agent의 핵심은 **판단 → 행동 → 결과 관찰 → 재판단**의 반복이다.

---

## 2. Coding Agent 예제로 보면 쉽다

사용자가 다음과 같이 요청했다고 하자.

```text
"이 프로젝트 빌드 오류 찾아서 고쳐줘"
```

Agent는 개념적으로 다음과 같이 동작할 수 있다.

```text
LLM
"먼저 프로젝트 구조를 봐야겠다"
        ↓
파일 목록 조회 Tool
        ↓
결과를 LLM에 전달
        ↓
LLM
"로그를 확인해야겠다"
        ↓
Shell Tool
        ↓
빌드 로그 반환
        ↓
LLM
"이 파일을 수정해야겠다"
        ↓
Write Tool
        ↓
LLM
"테스트해보자"
        ↓
Test Tool
        ↓
실패 또는 성공
        ↓
LLM 재판단
```

여기서 중요한 것은 **LLM이 파일을 직접 읽거나 Shell 명령을 직접 실행하는 것이 아니라는 점**이다.

LLM은 어떤 Tool을 어떤 인자로 사용할지를 결정한다. 실제 행동은 Agent Runtime 또는 Harness가 수행한다.

---

## 3. LLM · Tool · Agent Runtime의 역할

### LLM

무엇을 할지 판단한다.

```text
"로그를 읽어야겠다"
"UserService의 참조를 찾아야겠다"
"테스트를 실행해야겠다"
```

### Tool

실제 능력을 제공한다.

- 파일 읽기
- 파일 쓰기
- Shell 실행
- Git 작업
- DB Query
- Web 검색
- 업무 API 호출

### Agent Runtime / Harness

LLM과 Tool 사이를 연결한다.

```text
LLM의 Tool Call
→ 실제 Tool 실행
→ 결과 수집
→ 다시 LLM Context에 넣음
→ 다음 LLM 호출
```

따라서 다음처럼 기억하면 쉽다.

> **LLM = 두뇌, Tool = 손발, Agent Runtime = 두뇌와 손발을 연결하고 반복을 관리하는 실행 구조**

---

## 4. Tool Calling도 결국 LLM의 출력이다

일반 대화에서는 LLM이 자연어 Token을 생성한다.

```text
"네, 원인은 ..."
```

Agent 환경에서는 모델이 Tool 호출을 나타내는 구조화된 출력을 만들 수 있다.

```text
read_file(path="src/UserService.java")
```

이것 역시 모델 입장에서는 출력 생성의 한 형태다. Runtime이 이 구조화된 출력을 해석해 실제 Tool을 실행한다.

---

## 5. Agent에서 Token은 언제 소비되는가

Tool이 하는 모든 일이 LLM Token을 소비하는 것은 아니다.

```text
파일 읽기 자체        → LLM Token 연산 아님
파일 쓰기 자체        → LLM Token 연산 아님
Shell 명령 실행 자체   → LLM Token 연산 아님
DB Query 실행 자체     → LLM Token 연산 아님
```

하지만 Tool 결과를 LLM에게 보여주는 순간 Context가 된다.

```text
LLM
→ "로그를 읽어"
→ Tool이 app.log 10,000줄 읽음
→ 파일 읽기 자체는 LLM Token 아님
→ 로그 내용을 LLM Context에 전달
→ 여기서 입력 Token 사용
→ LLM이 로그를 해석하며 추론
```

Agent가 Token을 많이 사용하는 이유는 단순히 Tool이 많아서가 아니라 다음 Loop가 반복되기 때문이다.

```text
LLM
→ Tool
→ 결과
→ LLM
→ Tool
→ 결과
→ LLM
...
```

따라서 Coding Agent에서는 필요한 파일만 읽기, 긴 Tool 결과 요약, Context 관리가 중요하다.

---

## 6. Memory는 Model Weight가 아니다

Agent가 이전 작업의 정보를 기억해야 할 수 있다.

예:

```text
이 Project는 PostgreSQL 사용
Test 명령은 ./gradlew test
API Server Port는 8080
```

이 정보를 별도 저장소에 보관했다가 필요한 순간 다시 LLM Context에 넣을 수 있다.

```text
Memory
→ 필요한 정보 검색
→ LLM Context에 공급
```

따라서 Memory 역시 모델 Weight를 수정하는 개념이 아니다. 구현에 따라 RAG와 비슷한 Retrieval 구조를 사용할 수도 있다.

---

# MCP

## 7. MCP를 먼저 '지도'라고 생각하자

MCP(Model Context Protocol)는 AI Model도 아니고 Tool 자체도 아니다.

처음에는 다음 질문이 자연스럽다.

> Agent가 DB나 GitHub를 쓰면 그냥 API 호출하면 되지, 왜 MCP가 필요한가?

맞다. MCP가 없어도 된다.

MCP의 핵심은 **Agent에게 외부 Tool과 Data Source의 '지도와 사용법'을 공통 규격으로 제공하는 것**이다.

예를 들어 사내 시스템이 다음 기능을 제공한다고 하자.

```text
search_metadata(keyword)
get_schema(table_name)
execute_sql(sql)
```

Agent가 이 기능을 쓰려면 최소한 다음을 알아야 한다.

```text
Tool 이름은 무엇인가?
무슨 기능인가?
어떤 Parameter를 넣는가?
어떤 결과가 오는가?
어떻게 호출하는가?
```

MCP는 이런 Tool 발견과 호출 방법을 표준화한다.

---

## 8. MCP Server가 제공할 수 있는 것

MCP Server는 AI Client에게 다음과 같은 것을 노출할 수 있다.

- Tools: 실행 가능한 기능과 입력 Schema
- Resources: 읽을 수 있는 문서·Data·상태
- Prompts: 재사용 가능한 작업 지침

예를 들어 Tool 지도는 개념적으로 다음과 같다.

```text
Tool: search_metadata
설명: 업무 용어로 DB Metadata 검색
입력: keyword: string

Tool: get_schema
설명: Table의 Column과 관계 조회
입력: table_name: string

Tool: execute_sql
설명: SQL 실행
입력: sql: string
```

LLM은 이 정보를 보고 현재 문제에 어떤 Tool이 필요한지 판단할 수 있다.

---

## 9. MCP가 없으면 어떻게 했는가

MCP가 없다고 Agent가 외부 시스템을 사용할 수 없는 것은 아니다.

각 Agent에 직접 연결하면 된다.

```text
Codex ↔ 사내 API 전용 연동
Claude ↔ 사내 API 전용 연동
Agent A ↔ 사내 API 전용 연동
```

그리고 각 Agent에게 Tool 이름, Parameter, 결과 형식을 직접 알려주면 된다.

MCP를 사용하면 Tool 제공자가 공통 규격으로 기능을 노출하고 MCP를 지원하는 Client들이 같은 방식으로 사용할 수 있다.

```text
              사내 MCP Server
              /      |      \
          Agent A  Agent B  Agent C
```

즉 MCP는 **기존 API를 없애는 기술이 아니라 AI Agent용 Adapter·Protocol 계층**에 가깝다.

MCP Server 내부에서는 기존 REST API, DB, File System 등을 그대로 호출할 수 있다.

---

## 10. API · RAG · MCP를 구분하자

이 셋은 서로 다른 계층의 개념이다.

### API

일반 Program이 시스템의 Data와 기능을 호출하기 위한 Interface.

### RAG

질문과 관련 있는 외부 지식을 검색해서 LLM Context에 넣는 Architecture.

### MCP

AI Client가 외부 Tool과 Resource를 발견하고 호출하는 연결 Protocol.

따라서 경쟁 관계가 아니다.

예를 들어 다음 구조가 가능하다.

```text
Agent
→ MCP
→ search_metadata Tool
→ Tool 내부에서 Embedding
→ Vector DB 검색
→ 관련 Metadata 반환
→ Agent
```

겉에서 보면 MCP Tool이고, 내부 구현은 RAG다.

> **RAG = 어떻게 관련 정보를 찾을 것인가**
>
> **MCP = 그 기능을 Agent에게 어떤 표준 방식으로 제공할 것인가**

---

## 11. Context7과 Serena를 MCP 관점에서 보기

### Context7

Library나 Framework의 문서·예제를 Agent가 검색할 수 있게 제공한다.

```text
LLM
→ "Spring Security 최신 문서가 필요하다"
→ Context7 Tool
→ 관련 문서 반환
→ LLM Context
→ 문서를 참고해 Code 작성
```

핵심은 외부 문서 Retrieval이다.

### Serena

처음에는 다음 의문이 생긴다.

> Coding Agent가 grep하고 파일을 읽으면 되는데 왜 Serena 같은 중간 Tool이 필요한가?

필수는 아니다. Agent 자체의 파일 탐색으로 충분할 수 있다.

Serena 같은 Code Intelligence Tool의 가치는 **문자열이 아니라 Code의 구조와 Symbol 관계를 중심으로 탐색**할 수 있다는 데 있다.

```text
grep 방식
"UserService라는 문자열이 어디 있지?"

Symbol 기반 탐색
"UserService Class 정의는 어디지?"
"이 Symbol의 Reference는 어디지?"
"어떤 Method가 있지?"
```

큰 Code Base에서 파일 전체를 무작정 LLM Context에 넣는 대신 필요한 Symbol과 위치를 먼저 좁힐 수 있어 Context와 Token을 절약할 수 있다.

Serena와 LSP도 같은 계층은 아니다. LSP는 IDE 등에 Code Intelligence를 제공하기 위한 Protocol이고, Serena는 Code 분석·Symbol 탐색 기능을 Agent가 사용할 수 있도록 제공하는 Tool 계층으로 이해하는 것이 편하다.

---

## 12. MCP Tool을 많이 붙이면 항상 좋은가

아니다.

Tool이 많아지면 LLM이 참고해야 하는 Tool 설명과 Schema도 늘어난다. Tool 결과가 길면 Context도 커진다.

```text
Tool 목록·Schema
+ Tool 호출 인자
+ Tool 결과
+ 반복 LLM 판단
= Context와 Token 비용 증가
```

따라서 필요한 Tool만 노출하고 결과를 적절히 Filter·요약하는 것이 중요하다.

---

## 13. Agentic RAG

일반 RAG는 보통 정해진 Pipeline을 따른다.

```text
질문
→ 검색 1회
→ 관련 Chunk
→ LLM
→ 답변
```

Agentic RAG는 검색 과정에도 Agent의 판단이 들어간다.

```text
질문
→ LLM: 무엇을 검색해야 하지?
→ 검색 Tool
→ 결과
→ LLM: 정보가 부족한데?
→ 다른 Query로 추가 검색
→ 결과
→ LLM: 이제 충분하다
→ 최종 답변
```

즉 정해진 검색 1회가 아니라 Agent가 상황에 따라 검색 전략과 추가 Tool 사용을 동적으로 결정한다.

---

## 14. 안전과 운영

Agent는 실제 행동을 수행할 수 있으므로 일반 Chat보다 운영 통제가 더 중요하다.

- 최소권한과 사용자별 권한 전달
- 쓰기·삭제·외부 전송 전 승인
- Tool 입력 검증
- 실행 결과와 감사 Log
- Prompt Injection 격리
- 반복 횟수·시간·비용 제한
- 실패 시 중단·복구
- Tool 결과의 신뢰 수준 관리

---

## 15. 기억 흐름

```text
사용자 목표
→ LLM이 다음 행동 판단
→ Agent Runtime이 Tool Call 처리
→ MCP가 외부 Tool·Resource의 지도와 호출 규격 제공 가능
→ Tool이 실제 외부 작업 수행
→ Tool 결과가 LLM Context로 들어감
→ LLM이 다시 판단
→ 목표 완료까지 반복
```

한 문장으로 정리하면 다음과 같다.

> **Agent는 LLM의 판단을 Tool을 통한 실제 행동으로 연결하는 반복 실행 구조이고, MCP는 Agent가 외부 Tool과 Resource를 공통된 방식으로 발견하고 호출할 수 있게 하는 연결 규격이다.**
