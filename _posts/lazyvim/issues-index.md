---
title       : LazyVim 이슈 인덱스
description : LazyVim 사용 중 발생한 이슈 및 해결방법 모음
date        : 2025-12-17 16:37:51 +0900
updated     : 2026-05-08 12:00:00 +0900
categories  : [lazyvim]
tags        : [lazyvim, neovim, troubleshooting]
pin         : false
hidden      : false
---

## LazyVim 이슈 목록

이 페이지는 LazyVim 사용 중 발생한 이슈들과 해결방법을 정리한 인덱스입니다.

---

### LSP / Diagnostics

| 날짜 | 제목 | 요약 |
|------|------|------|
| 2025-12-17 | [Java LSP (jdtls) 작동 안함]({% post_url 2025-12-17-java-lsp-jdtls %}) | Java 21 + jenv export 플러그인 설정 필요 |
| 2026-02-04 | [Diagnostics 로그/메시지 확인법]({% post_url 2026-02-04-lazyvim-diagnostics %}) | Diagnostics 팝업, Trouble 리스트, LSP 로그, `:messages` 정리 |

---

### 플러그인 / Extra

| 날짜 | 제목 | 요약 |
|------|------|------|
| 2026-05-06 | [vim-dadbod-ui dbout 결과창 레이아웃]({% post_url 2026-05-06-vim-dadbod-dbout-layout %}) | FileType autocmd + `wincmd L` 트릭과 fold 비활성화 |
| 2026-05-07 | [LazyVim extra의 플러그인 spec에 의존성만 보강]({% post_url 2026-05-07-lazyvim-extra-override-merge-deps %}) | 같은 이름의 spec을 다시 작성해 `dependencies` 배열만 머지 |

---

### Treesitter

| 날짜 | 제목 | 요약 |
|------|------|------|
| 2026-05-08 | [kotlin 쿼리 `..<` 노드 에러는 파서 버전 불일치]({% post_url 2026-05-08-nvim-treesitter-kotlin-rangeuntil-query-error %}) | rangeUntil(`..<`)을 모르는 옛 파서 + 새 highlights 쿼리 충돌 |
| 2026-05-08 | [nvim-treesitter main 브랜치는 0.12+ 전용]({% post_url 2026-05-08-nvim-treesitter-main-branch-needs-0.12 %}) | nvim 0.11에서 lockfile 갱신으로 박제되는 함정 |

---

## 이슈 추가 가이드

새로운 이슈 파일을 추가할 때:

1. 파일명: `YYYY-MM-DD-간단한-설명.md` 형식
2. 구조:
   - 이슈 (증상)
   - 원인 분석
   - 해결 방법
   - 확인 방법
3. 이 인덱스에 링크 추가 (`{% post_url 2026-MM-DD-slug %}` 형식, date prefix 포함)
