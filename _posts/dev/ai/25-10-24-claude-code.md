---
title       : Claude Code 정리
description : 
date        : 2025-10-24 09:47:55 +0900
updated     : 2025-11-06 08:12:27 +0900
categories  : [dev, ai]
tags        : [ai, claude, anthrophic, claude-code]
pin         : false
hidden      : false
---

## 📌 Claude Code란?

Claude Code는 터미널에서 직접 실행되는 AI 코딩 도구로, 자연어 명령을 통해 코드 작성, 디버깅, Git 워크플로우 관리 등을 수행할 수 있습니다. 별도의 IDE나 채팅 창 없이 현재 작업 환경에서 바로 사용할 수 있습니다.

### 주요 특징

- **터미널 통합**: 익숙한 개발 환경에서 바로 작업
- **실행 가능**: 파일 편집, 명령 실행, 커밋 생성 등 직접 액션 수행
- **프로젝트 인식**: 전체 코드베이스 구조 파악
- **웹 검색 지원**: 최신 정보 검색 가능
- **MCP 통합**: Google Drive, Slack, Figma 등 외부 데이터소스 연동
- **Unix 철학**: 조합 가능하고 스크립트화 가능

---

## 🚀 설치 방법

### 필수 요구사항

- Node.js 18 이상
- Claude.ai 계정 또는 Claude Console 계정

### 설치 단계

```bash
# 1. Claude Code 글로벌 설치
npm install -g @anthropic-ai/claude-code

# 2. 프로젝트 디렉토리로 이동
cd your-project-directory

# 3. Claude Code 실행
claude

# 처음 실행 시 로그인 프롬프트가 표시됩니다
```

---

## 💡 주요 기능

### 1. 기능 구축
평범한 한국어/영어로 원하는 기능을 설명하면 Claude가 계획을 세우고 코드를 작성합니다.

```bash
claude
> "사용자 로그인 기능을 추가해줘. JWT 토큰 방식으로 구현하고 싶어"
```

### 2. 디버깅 및 버그 수정
버그를 설명하거나 에러 메시지를 붙여넣으면 코드베이스를 분석하고 수정합니다.

```bash
> "로그인할 때 500 에러가 발생해. 에러 로그: [에러 내용]"
```

### 3. 코드베이스 탐색
프로젝트 구조나 특정 코드에 대한 질문에 답변합니다.

```bash
> "인증 로직이 어디에 구현되어 있어?"
> "이 함수가 어떻게 동작하는지 설명해줘"
```

### 4. 지루한 작업 자동화
- Lint 문제 수정
- Merge conflict 해결
- Release notes 작성
- 문서화 업데이트

---

## 🎮 작동 모드

Claude Code는 3가지 모드로 작동합니다:

### 1. Normal 모드 (기본)
- 각 작업마다 승인 요청
- 파일 변경, 명령 실행 전 확인
- 안전하고 제어된 작업 진행

### 2. Auto 모드
- 자동으로 작업 수행
- 승인 없이 파일 편집
- 특정 bash 명령(패키지 설치 등)은 여전히 승인 필요
- 커피 한 잔 하러 가는 동안 작업 완료 가능

```bash
# Auto 모드 활성화
> /auto

# 특정 명령 권한 추가
> /permissions

# 모든 권한 승인 (주의!)
claude --dangerously-skip-permissions
```

### 3. Plan 모드
- 코드 작성 전 확장된 사고 능력 활용
- 포괄적인 전략 수립
- 복잡한 아키텍처 결정에 유용

---

## 🛠️ 주요 명령어

### 기본 명령어

```bash
# Claude Code 실행
claude

# 특정 프롬프트와 함께 실행
claude -p "버그를 찾아서 수정해줘"

# 대화 기록 확인
/history

# 권한 설정
/permissions

# 버그 리포트
/bug

# 모드 전환
/auto        # Auto 모드
/normal      # Normal 모드로 복귀

# 되돌리기 (v2.0.0+)
/rewind      # 이전 상태로 롤백
ESC ESC      # 더블 ESC로도 되돌리기 가능

/clear       # 대화 기록 초기화 => 주기적으로 해주는 것이 좋음
/usage       # token 사용량 확인
```

### 프로젝트 커맨드

`.claude/commands/` 폴더에 커스텀 명령어를 마크다운 파일로 저장할 수 있습니다.

예시: `.claude/commands/fix-github-issue.md`

```markdown
GitHub 이슈를 분석하고 수정해주세요: $ARGUMENTS

단계:
1. `gh issue view`로 이슈 세부사항 확인
2. 이슈에 설명된 문제 이해
3. 코드베이스에서 관련 파일 검색
4. 수정 사항 구현
5. 테스트 작성 및 실행
6. 린트 및 타입 체킹 통과 확인
7. 설명이 포함된 커밋 메시지 작성
8. 푸시 및 PR 생성
```

사용:
```bash
> /project:fix-github-issue 1234
```

개인 명령어는 `~/.claude/commands/`에 저장하면 모든 프로젝트에서 사용 가능합니다.

---

## 🔌 MCP (Model Context Protocol) 통합

MCP를 통해 Claude Code를 외부 데이터소스와 연결할 수 있습니다.

### MCP 서버 추가

```bash
# MCP 서버 추가
claude mcp add server-name --scope local -- [command]

# 예시: Google Drive 연동
claude mcp add google-drive --scope local

# MCP 서버 목록 확인
claude mcp list

# MCP 서버 설정 확인
claude mcp get server-name

# MCP 디버그 모드로 실행
claude --mcp-debug
```

### 설정 파일

프로젝트에 `.mcp.json` 파일을 만들어 팀 전체가 사용할 수 있도록 공유:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-puppeteer"]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"]
    }
  }
}
```

---

## 📋 베스트 프랙티스

### 1. 단계별 접근법 (복잡한 작업)

복잡한 문제는 4단계로 나누어 진행:

```
1단계: 문제 연구
> "이 버그의 원인을 찾아줘. 코드베이스를 분석하고 가능한 원인들을 나열해줘"

2단계: 해결책 계획
> "각 원인에 대한 해결책을 제안하고 장단점을 비교해줘"

3단계: 구현
> "가장 좋은 방법으로 구현해줘"

4단계: 문서화
> "이 변경사항을 README에 추가하고 커밋 후 PR을 생성해줘"
```

### 2. CLAUDE.md 파일 활용

프로젝트 루트에 `CLAUDE.md` 파일을 만들어 프로젝트 컨텍스트 제공:

```markdown
# 프로젝트 개요
이 프로젝트는 Next.js 기반의 전자상거래 플랫폼입니다.

## 기술 스택
- Next.js 14
- TypeScript
- Tailwind CSS
- PostgreSQL

## 코딩 규칙
- 함수형 컴포넌트 사용
- TypeScript strict 모드
- 테스트 커버리지 80% 이상 유지

## 프로젝트 구조
- `/app` - Next.js 앱 라우터
- `/components` - 재사용 가능한 컴포넌트
- `/lib` - 유틸리티 함수
```

### 3. Sub-Agents 활용

전문화된 서브 에이전트를 만들어 작업 분담:

```bash
# 서브 에이전트 생성
> /agents

# 예시: 코드 리뷰어, 테스터, 문서 작성자 등
```

각 서브 에이전트는 자체 지침과 권한을 가집니다.

### 4. Git 워크플로우 자동화

```bash
> "새로운 기능을 feature 브랜치에 구현하고, 테스트 작성, 커밋, PR 생성까지 해줘"
```

---

## 🎯 실전 예제

### 예제 1: 버그 수정

```bash
claude
> "로그인 버튼을 클릭하면 콘솔에 'undefined is not a function' 에러가 발생해. 
   수정해줘"

# Claude가 자동으로:
# 1. 에러 원인 분석
# 2. 관련 파일 찾기
# 3. 코드 수정
# 4. 변경사항 커밋
```

### 예제 2: 새 기능 추가

```bash
> "상품 필터링 기능을 추가하고 싶어. 
   가격 범위와 카테고리로 필터링할 수 있어야 해"

# Claude가 자동으로:
# 1. 계획 수립
# 2. 필요한 컴포넌트 생성
# 3. API 연동
# 4. 테스트 작성
# 5. 문서화
```

### 예제 3: 코드 리팩토링

```bash
> "UserProfile 컴포넌트가 너무 복잡해. 
   더 작은 컴포넌트들로 나누고 타입 안정성을 개선해줘"
```

### 예제 4: 파이프라인 활용

```bash
# 로그 모니터링
tail -f app.log | claude -p "에러나 이상 징후가 보이면 Slack에 알려줘"

# CI/CD 자동화
claude -p "새로운 텍스트 문자열이 있으면 프랑스어로 번역하고 PR을 생성해줘"
```

---

## 🔧 고급 설정

### 환경 변수 설정

```bash
# API 키 설정 (Claude Console 사용 시)
export ANTHROPIC_API_KEY="your-api-key"

# AWS Bedrock 사용
export AWS_REGION="us-east-1"

# Google Vertex AI 사용
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

### 설정 파일 위치

- 전역 설정: `~/.claude/settings.json`
- 프로젝트 설정: `.claude/settings.local.json`

---

## 🎨 IDE 통합

### VS Code Extension

1. VS Code 마켓플레이스에서 "Claude Code" 검색
2. 설치 후 사이드바에서 바로 사용
3. 터미널 없이 그래픽 인터페이스로 작업

### JetBrains IDEs

IntelliJ, PyCharm 등에서도 Claude Code 플러그인 지원

---

## 📊 컨텍스트 윈도우 관리

Claude Sonnet 4.5는 1백만 토큰 컨텍스트 윈도우를 지원합니다. 하지만 효율적인 작업을 위해:

### 팁:
1. **필요한 파일만 포함**: 불필요한 파일은 `.claudeignore`에 추가
2. **모듈화된 문서**: 큰 `CLAUDE.md` 대신 여러 개의 작은 문서로 분리
3. **서브 에이전트 활용**: 특정 작업에 특화된 에이전트 사용

---

## 🔒 보안 및 프라이버시

### 데이터 처리
- 코드는 암호화되어 전송
- Claude API 또는 AWS Bedrock/GCP Vertex AI 호스팅 가능
- 엔터프라이즈급 보안 및 컴플라이언스 내장

### 권한 관리
- 민감한 명령은 항상 승인 요청
- `.claudeignore`로 특정 파일/폴더 제외
- 프로젝트별 권한 설정 가능

---

## 🆘 문제 해결

### 일반적인 문제

**Claude가 응답하지 않을 때:**
```bash
# 네트워크 연결 확인
curl https://api.anthropic.com

# Claude 재시작
# Ctrl+C로 종료 후 재실행
```

**파일이 무시될 때:**
```bash
# .claudeignore 파일 확인
cat .claudeignore

# 특정 파일 명시적으로 포함
> "src/components/Header.tsx 파일을 확인해줘"
```

**MCP 서버가 작동하지 않을 때:**
```bash
# MCP 서버 목록 확인
claude mcp list

# MCP 설정 확인
claude mcp get server-name

# 디버그 모드로 실행
claude --mcp-debug
```

---

## 📚 추가 리소스

### 공식 문서
- [Claude Code 공식 문서](https://docs.claude.com/en/docs/claude-code)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [MCP 문서](https://docs.claude.com/en/docs/claude-code/mcp)

### 커뮤니티
- [Claude Developers Discord](https://discord.gg/claude-developers)
- [Reddit r/ClaudeAI](https://reddit.com/r/ClaudeAI)

### 학습 자료
- [Anthropic Academy](https://www.anthropic.com/academy)
- [Claude Code 베스트 프랙티스](https://www.anthropic.com/engineering/claude-code-best-practices)

---

## 💰 비용

Claude Code는 Claude API 토큰을 표준 API 가격으로 사용합니다.

- Claude.ai 계정으로 사용 가능
- API 토큰 기반 과금
- 프로젝트별 사용량 추적 가능

---

## 🚀 시작하기

```bash
# 1. 설치
npm install -g @anthropic-ai/claude-code

# 2. 프로젝트로 이동
cd your-project

# 3. Claude 시작!
claude

# 4. 첫 명령어 입력
> "안녕! 이 프로젝트의 구조를 설명해줘"
```
