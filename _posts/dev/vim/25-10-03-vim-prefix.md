---
title       : Vim Prefix Keys 정리
description : >-
date        : 2025-10-03 11:36:45 +0900
updated     : 2025-11-03 09:42:16 +0900
categories  : [dev, vim]
tags        : [vim, neovim, prefix, 접두사, mapping]
pin         : false
hidden      : false
---

# Vim Prefix Keys 정리

Vim에서 자주 쓰이는 **prefix 키**들을 분류하고 예시를 정리한 자료입니다.

---

## 1. Vim 예약 확장 Prefix

- zm, zr: fold 관련 (m: more, r: reduce)

| Prefix | 설명 | 주요 예시 |
|--------|------|-----------|
| `g`    | 일반 명령 확장 | `gg` → 파일 맨 위<br>`gd` → local 정의로 이동<br>`gx` → URL 열기<br>`gu` / `gU` → 소문자/대문자 변환 |
| `z`    | 화면 / fold 관련 | `zz` → 커서 줄 화면 중앙<br>`zo` / `zc` → fold 열기/닫기<br>`zR` / `zM` → 전체 fold 풀기/닫기 |
| `[`    | “이전” 관련 이동 | `[d` → 이전 진단<br>`[m` → 이전 함수 시작<br>`[p` → 붙여넣기 인덴트 조정 |
| `]`    | “다음” 관련 이동 | `]d` → 다음 진단<br>`]m` → 다음 함수 시작<br>`]p` → 붙여넣기 인덴트 조정 |

---

## 2. Operator Prefix (동작 + motion)

| Operator | 설명 | 예시 |
|----------|------|-----|
| `d`      | 삭제 (delete) | `dw` → 단어 삭제<br>`d$` → 줄 끝까지 삭제 |
| `y`      | 복사 (yank) | `yw` → 단어 복사<br>`y$` → 줄 끝까지 복사 |
| `c`      | 변경 (change) | `cw` → 단어 바꾸기<br>`c$` → 줄 끝까지 바꾸기 |

---

## 3. 사용자 전용 Prefix

| Prefix | 설명 | 예시 |
|--------|------|-----|
| `<leader>` | 사용자/플러그인 단축키 | `<leader>w` → 저장<br>`<leader>q` → 종료<br>`<leader>f` → 파일 관련 |
| `<localleader>` | 파일타입 전용 단축키 | `<localleader>r` → LaTeX 컴파일<br>`<localleader>t` → 테스트 실행 |

---

## 4. 기타 Prefix

| Prefix | 설명 |
|--------|-----|
| `m`    | 마크 (위치 저장, 북마크) |
| `"`    | 레지스터 선택 (복사/붙여넣기 대상) |

---

### 요약
- **`g`, `z`, `[`, `]`** → Vim 예약 확장 prefix  
- **`d`, `y`, `c`** → operator prefix (motion과 결합)  
- **`<leader>`, `<localleader>`** → 사용자 전용 prefix  
- **`m`, `"`** → 특수 prefix (mark, register)

