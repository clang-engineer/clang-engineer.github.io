---
title       : "Claude Code 슬래시 명령어 사전"
description : "Claude Code(CLI)에서 사용 가능한 슬래시 명령어를 기본/설정/프로젝트/Git/계정/통합 카테고리로 분류해 한눈에 보기."
date        : 2025-10-24 11:30:00 +0900
updated     : 2026-06-17 10:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, slash-commands, cli]
pin         : false
hidden      : false
---

Claude Code(CLI)의 슬래시 명령어 전체 사전. 영역별로 묶어 정리. 전체 개요·설치·MCP는 [Claude Code 개요](/posts/ai/2025-10-24-claude-code/) 참고.

## 자주 쓰는 것

| 명령어 | 설명 |
| --- | --- |
| `/help` | 도움말 및 사용 가능한 명령어 표시 |
| `/clear` | 대화 기록 초기화 (주기적으로 권장) |
| `/compact [instructions]` | 대화 기록을 요약해 컨텍스트 유지 |
| `/usage` | 토큰 사용량 확인 |
| `/cost` | 현재 세션의 총 비용 및 소요 시간 |
| `/context` | 현재 컨텍스트 사용량을 컬러 그리드로 시각화 |
| `/rewind` | 코드 및/또는 대화를 이전 시점으로 복원 |
| `/resume` | 이전 대화 재개 |
| `/export` | 현재 대화를 파일 또는 클립보드로 내보내기 |

## 설정·관리

| 명령어 | 설명 |
| --- | --- |
| `/permissions` | 도구 권한 규칙 관리 (허용/거부) |
| `/config` | 설정 패널 열기 |
| `/model` | Claude Code의 AI 모델 설정 |
| `/privacy-settings` | 개인정보 설정 보기/업데이트 |
| `/output-style` | 출력 스타일 설정 |
| `/statusline` | Claude Code의 상태 표시줄 UI 설정 |
| `/vim` | Vim과 일반 편집 모드 간 전환 |

## 프로젝트·개발

| 명령어 | 설명 |
| --- | --- |
| `/init` | 새로운 `CLAUDE.md` 파일 초기화(코드베이스 문서화) |
| `/add-dir` | 새 작업 디렉토리 추가 |
| `/memory` | Claude 메모리 파일 편집 |
| `/todos` | 현재 todo 항목 목록 표시 |
| `/bashes` | 백그라운드 작업 목록 및 관리 |
| `/agents` | 에이전트 구성 관리 |
| `/hooks` | 도구 이벤트에 대한 훅 구성 관리 |

## Git·PR

| 명령어 | 설명 |
| --- | --- |
| `/review` | Pull Request 리뷰 |
| `/pr-comments` | GitHub Pull Request의 댓글 가져오기 |
| `/security-review` | 현재 브랜치의 보류 중인 변경사항 보안 리뷰 |
| `/install-github-app` | 저장소에 Claude GitHub Actions 설정 |

## 계정·시스템

| 명령어 | 설명 |
| --- | --- |
| `/login` | Anthropic 계정으로 로그인 |
| `/logout` | Anthropic 계정에서 로그아웃 |
| `/status` | Claude Code 상태 표시(버전, 모델, 계정, API 연결 등) |
| `/doctor` | Claude Code 설치/설정 진단 |
| `/upgrade` | Max 플랜으로 업그레이드(더 높은 속도 제한) |
| `/release-notes` | 릴리스 노트 보기 |
| `/feedback` | Claude Code에 대한 피드백 제출 |

## 통합

| 명령어 | 설명 |
| --- | --- |
| `/mcp` | MCP 서버 관리 |
| `/plugin` | Claude Code 플러그인 관리 |
| `/ide` | IDE 통합 관리 및 상태 표시 |
| `/terminal-setup` | 새 줄을 위한 Shift+Enter 키 바인딩 설치 |

## 프로젝트 커스텀 명령어

`.claude/commands/` 폴더에 마크다운 파일로 저장하면 슬래시 명령으로 호출할 수 있다.

예: `.claude/commands/fix-github-issue.md`

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

호출:

```bash
> /project:fix-github-issue 1234
```

개인 명령어는 `~/.claude/commands/`에 두면 모든 프로젝트에서 사용 가능.

## 참고

- 전체 개요·설치·작동 모드: [Claude Code 개요](/posts/ai/2025-10-24-claude-code/)
- 메모리 시스템: [Claude Code 메모리 시스템](/posts/ai/2026-03-12-claude-code-memory/)
- MCP 프로토콜: [Model Context Protocol(MCP) 개념 정리](/posts/ai/2025-10-23-mcp/)
