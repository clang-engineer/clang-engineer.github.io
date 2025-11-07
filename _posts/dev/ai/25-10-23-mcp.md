---
title       : 🧩 Model Context Protocol (MCP) & Serena MCP 정리
description : 
date        : 2025-10-23 13:43:00 +0900
updated     : 2025-10-23 13:44:45 +0900
categories  : [dev, ai]
tags        : [ai, mcp, serena, claude, anthrophic, model-context-protocol]
pin         : false
hidden      : false
---

## 1. MCP란?
**MCP (Model Context Protocol)** 은 Anthropic(Claude 개발사)이 제안한  
AI 모델과 외부 리소스(파일, DB, API 등)가 **표준화된 방식으로 상호작용**하도록 하는 오픈 프로토콜이다.

### 💡 핵심 목적
- AI 모델이 **외부 시스템의 데이터를 안전하고 일관된 방식으로 접근**할 수 있게 함  
- 기존의 “커스텀 플러그인/툴 연결 문제(N×M)”를 **하나의 통합 인터페이스로 단순화**

### 🧠 주요 특징
| 항목 | 설명 |
|------|------|
| 통신 방식 | JSON-RPC 2.0 기반 양방향 통신 |
| 구조 | 클라이언트(모델) ↔ MCP 서버(리소스 제공자) |
| 보안 | 명시적 권한 요청 / 승인 기반 접근 |
| 활용 범위 | 파일 읽기, API 호출, 데이터 조회, 코드베이스 분석 등 |

---

## 2. MCP의 기본 구조

```

+----------------+
| Claude / LLM   |  ← 클라이언트
+--------+-------+
|
|  JSON-RPC 요청 (MCP 프로토콜)
↓
+--------+-------+
| MCP Server     |  ← 외부 리소스 접근 서버
| (예: Serena)   |
+--------+-------+
|
↓
+----------------+
| Files / DB / APIs |
+----------------+

```

---

## 3. Serena MCP란?

**Serena MCP**는 MCP 표준을 구현한 **코드베이스 분석용 서버**이다.  
Claude Code 또는 Claude Desktop 등과 연동되어,  
AI가 프로젝트의 전체 코드를 구조적으로 이해할 수 있게 돕는다.

### 🧰 Serena MCP의 역할
| 기능 | 설명 |
|------|------|
| 코드 인덱싱 | 프로젝트 전체 파일을 스캔하고, 함수/클래스 관계를 데이터베이스화 |
| 참조 추적 | 함수 호출 관계, 클래스 상속, 변수 참조 등을 추적 |
| 빠른 검색 | Claude의 요청에 맞춰 관련 코드나 파일을 즉시 반환 |
| 문맥 관리 | 대규모 코드에서 모델이 처리 가능한 범위를 관리 |
| MCP 통신 | Claude와 JSON-RPC로 명령/응답 처리 |

---

## 4. Claude Code + Serena MCP 연결 흐름

```

사용자 요청
↓
Claude Code (클라이언트)
↓
[MCP 요청]
↓
Serena MCP (서버)
↓
코드베이스 / 파일 시스템

````

예를 들어 사용자가 다음과 같이 묻는다면:

> “`UserService` 클래스가 어디서 사용되나요?”

1. Claude Code가 MCP 요청을 보냄  
2. Serena MCP가 코드베이스를 탐색  
3. 호출 위치를 찾아 JSON 응답  
4. Claude Code가 자연어로 결과를 요약하여 사용자에게 보여줌

---

## 5. Serena MCP 설치 요약 (예시)

```bash
# 1️⃣ 저장소 클론
git clone https://github.com/oraios/serena
cd serena

# 2️⃣ 의존성 설치 (uv 사용)
uv sync

# 3️⃣ MCP 서버 실행
uv run --directory /path/to/serena serena-mcp-server --context ide-assistant

# 4️⃣ Claude Code에 서버 등록
claude mcp add serena -- \
  uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant
````

⚙️ 설정 파일: `~/.serena/serena_config.yml`

```yaml
web_dashboard: false
read_only: true
```

---

## 6. 장점 및 주의사항

### ✅ 장점

* 코드 이해력 향상 (함수 관계, 호출 추적 등)
* 대규모 프로젝트 탐색 속도 개선
* Claude Code의 맥락 품질 향상

### ⚠️ 주의사항

* 프로젝트에 접근 권한이 있는 경우에만 실행
* 실행 시 “read_only” 옵션 권장
* MCP 서버 실행 중 Claude Code가 서버를 자동 인식해야 함

---

## 7. 요약

| 구분          | 설명                                |
| ----------- | --------------------------------- |
| MCP         | 모델이 외부 리소스와 통신하기 위한 오픈 프로토콜       |
| Serena MCP  | 코드베이스 구조를 Claude에 제공하는 MCP 서버     |
| Claude Code | 사용자 명령을 이해하고 Serena MCP로부터 데이터 요청 |
| 핵심 장점       | 코드 탐색·리팩토링·맥락 이해 향상               |
| 필수 조건       | Python + uv 환경, 로컬 서버 실행 권한       |

---

> ✨ **한마디로:**
> MCP는 “AI 모델을 외부 리소스와 연결하는 표준 인터페이스”이고,
> Serena MCP는 그 표준을 활용해 Claude가 “코드베이스를 이해하도록 돕는 도우미 서버”이다.

```
