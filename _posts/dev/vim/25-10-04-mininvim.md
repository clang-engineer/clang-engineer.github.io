---
title       : mini.nvim 관련 정리
description : 
date        : 2025-10-04 14:18:02 +0900
updated     : 2025-10-04 14:25:57 +0900
categories  : [dev, vim]
tags        : [vim, neovim, mini, memo]
pin         : false
hidden      : false
---

# mini.nvim 모듈 정리

`mini.nvim`은 Neovim용 **경량 Lua 플러그인 모음**으로, 여러 작은 기능 모듈로 구성되어 있습니다.  
각 모듈은 독립적으로 사용할 수 있으며, 필요한 기능만 선택해 설치할 수 있습니다.
(ex> LazyVim에서는 주요 모듈을 미리 설정해 사용합니다.)

> [github url](https://github.com/nvim-mini/mini.nvim)

---

## 1. Editing / Text Manipulation

| 모듈 | 기능 | 설명 |
|------|------|------|
| `mini.comment` | 주석 관리 | 커서 위치나 선택 영역의 주석을 토글, 언어별 주석 스타일 자동 처리 |
| `mini.surround` | 감싸기/제거 | 문자, 괄호, 따옴표 등으로 텍스트 감싸기, 교체, 제거 |
| `mini.pairs` | 자동 괄호 | `()`, `{}`, `""` 등 자동 닫기, 입력 시 자동 완성 |
| `mini.ai` | 텍스트 객체 | `a`/`i` 명령어로 단어, 문장, 블록 등 다양한 텍스트 객체 선택 가능 |

---

## 2. UI / 편의성

| 모듈 | 기능 | 설명 |
|------|------|------|
| `mini.icons` | 아이콘 | UI 요소, 버퍼라인, 상태바 등에서 사용 가능한 작은 아이콘 제공 |
| `mini.indentscope` | 들여쓰기 시각화 | 블록 구조를 시각적으로 표시 (VSCode indent guide 비슷) |
| `mini.animate` | 애니메이션 | 스크롤, 커서 이동, 창 전환 시 부드러운 애니메이션 제공 |

---

## 3. Navigation / 검색

| 모듈 | 기능 | 설명 |
|------|------|------|
| `mini.bracketed` | 이동 단축키 | 괄호, 함수, git hunk 등 “구간 단위 이동” 기능 제공 |
| `mini.jump` | 빠른 이동 | 특정 단어나 문자로 빠르게 점프 |
| `mini.map` | 키맵 관리 | Lua 기반 키맵 등록과 관리 간소화 |

---

## 4. 편집 보조 / 자동화

| 모듈 | 기능 | 설명 |
|------|------|------|
| `mini.trailspace` | 불필요 공백 제거 | 파일 저장 시 trailing space 자동 제거 |
| `mini.starter` | 스타트 화면 | Neovim 시작 화면 커스터마이징 |
| `mini.files` | 파일 탐색 | 간단한 파일 탐색기 제공 |

---

## 5. 기타

| 모듈 | 기능 | 설명 |
|------|------|------|
| `mini.sessions` | 세션 관리 | 작업 세션 저장/복원 |
| `mini.splitjoin` | 코드 포맷팅 | 한 줄 ↔ 여러 줄 변환 (JS, Lua 등) |
| `mini.ai` + `mini.surround` | 결합 사용 가능 | 텍스트 객체 선택 후 감싸기/변경 가능 |

---

## 핵심 포인트

- 각 모듈은 **독립적**이라 필요 없는 기능은 설치 안 해도 됨  
- **Lua 기반**으로 빠르고 가벼움  
- LazyVim에서는 주로 `mini.comment`, `mini.surround`, `mini.ai` 등 자주 쓰이는 모듈을 기본 설정  
