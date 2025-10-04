---
title       : LazyVim Keymaps 정리
description : LazyVim의 기본 키맵을 정리한 문서입니다.
date        : 2025-09-25 09:11:30 +0900
updated     : 2025-09-25 09:15:15 +0900
categories  : ["dev", "lazyvim"]
tags        : ["lazyvim", "neovim", "keymaps", "cheatsheet"]
pin         : false
hidden      : false
---


# LazyVim Keymaps 정리

## 이동 (Navigation)

| 키              | 모드   | 설명                                    |
| -------------- | ---- | ------------------------------------- |
| `j` / `<Down>` | n, x | Count 없으면 `gj`, 있으면 `j` (논리/물리 라인 이동) |
| `k` / `<Up>`   | n, x | Count 없으면 `gk`, 있으면 `k`               |
| `<C-h>`        | n    | 왼쪽 윈도우로 이동                            |
| `<C-j>`        | n    | 아래 윈도우로 이동                            |
| `<C-k>`        | n    | 위 윈도우로 이동                             |
| `<C-l>`        | n    | 오른쪽 윈도우로 이동                           |

## 윈도우 크기 조절

| 키           | 모드 | 설명      |
| ----------- | -- | ------- |
| `<C-Up>`    | n  | 창 높이 +2 |
| `<C-Down>`  | n  | 창 높이 -2 |
| `<C-Left>`  | n  | 창 너비 -2 |
| `<C-Right>` | n  | 창 너비 +2 |

## 줄 이동 (Move Lines)

| 키       | 모드      | 설명                 |
| ------- | ------- | ------------------ |
| `<A-j>` | n, i, v | 현재 줄/선택 영역을 아래로 이동 |
| `<A-k>` | n, i, v | 현재 줄/선택 영역을 위로 이동  |

## 버퍼 (Buffers)

| 키                            | 모드 | 설명            |
| ---------------------------- | -- | ------------- |
| `<S-h>`, `[b`                | n  | 이전 버퍼         |
| `<S-l>`, `]b`                | n  | 다음 버퍼         |
| `<leader>bb`, \`<leader>\`\` | n  | 이전 버퍼로 전환     |
| `<leader>bd`                 | n  | 현재 버퍼 닫기      |
| `<leader>bo`                 | n  | 다른 버퍼 모두 닫기   |
| `<leader>bD`                 | n  | 버퍼와 윈도우 함께 닫기 |

## 검색 & 탐색

| 키            | 모드      | 설명                       |
| ------------ | ------- | ------------------------ |
| `<esc>`      | i, n, s | 검색 하이라이트 제거 & snippet 중단 |
| `<leader>ur` | n       | 검색/디프 업데이트/리드로우          |
| `n`          | n, x, o | 다음 검색 결과 (zv 포함)         |
| `N`          | n, x, o | 이전 검색 결과 (zv 포함)         |

## Undo & 저장

| 키       | 모드         | 설명               |
| ------- | ---------- | ---------------- |
| `, . ;` | i          | 입력 중 undo 포인트 추가 |
| `<C-s>` | i, x, n, s | 파일 저장            |

## 인덴트

| 키        | 모드 | 설명                   |
| -------- | -- | -------------------- |
| `<`, `>` | v  | 시각적 모드에서 인덴트 후 선택 유지 |

## 주석

| 키     | 모드 | 설명             |
| ----- | -- | -------------- |
| `gco` | n  | 현재 줄 아래에 주석 추가 |
| `gcO` | n  | 현재 줄 위에 주석 추가  |

## Lazy / 파일 / 창

| 키                          | 모드 | 설명         |             |
| -------------------------- | -- | ---------- | ----------- |
| `<leader>l`                | n  | Lazy UI 열기 |             |
| `<leader>fn`               | n  | 새 파일 열기    |             |
| `<leader>qq`               | n  | 모든 창 종료    |             |
| `<leader>-`                | n  | 아래로 split  |             |
| \`<leader>                 | \` | n          | 오른쪽으로 split |
| `<leader>wd`               | n  | 창 닫기       |             |
| `<leader>wm`, `<leader>uZ` | n  | 창 줌 토글     |             |
| `<leader>uz`               | n  | Zen 모드 토글  |             |

## Quickfix / Location List

| 키            | 모드 | 설명                  |
| ------------ | -- | ------------------- |
| `<leader>xl` | n  | Location List 열기/닫기 |
| `<leader>xq` | n  | Quickfix List 열기/닫기 |
| `[q`         | n  | 이전 Quickfix         |
| `]q`         | n  | 다음 Quickfix         |

## 포맷팅 & 진단

| 키            | 모드   | 설명            |
| ------------ | ---- | ------------- |
| `<leader>cf` | n, v | 강제 포맷         |
| `<leader>cd` | n    | 현재 줄 진단 float |
| `[d` / `]d`  | n    | 이전/다음 진단      |
| `[e` / `]e`  | n    | 이전/다음 에러      |
| `[w` / `]w`  | n    | 이전/다음 워닝      |

## 옵션 토글 (Snacks)

| 키             | 모드 | 설명                        |
| ------------- | -- | ------------------------- |
| `<leader>uf`  | n  | 포맷 토글                     |
| `<leader>uF`  | n  | 포맷 강제 토글                  |
| `<leader>us`  | n  | 스펠링 토글                    |
| `<leader>uw`  | n  | 줄 바꿈(wrap) 토글             |
| `<leader>uL`  | n  | 상대 번호 토글                  |
| `<leader>ud`  | n  | 진단 표시 토글                  |
| `<leader>ul`  | n  | 라인 번호 토글                  |
| `<leader>uc`  | n  | conceallevel 토글           |
| `<leader>uA`  | n  | 탭라인 토글                    |
| `<leader>uT`  | n  | Treesitter 토글             |
| `<leader>ub`  | n  | 배경 light/dark 토글          |
| `<leader>uD`  | n  | Dim 토글                    |
| `<leader>ua`  | n  | 애니메이션 토글                  |
| `<leader>ug`  | n  | Indent guide 토글           |
| `<leader>uS`  | n  | 스크롤 애니메이션 토글              |
| `<leader>dpp` | n  | 프로파일러 토글                  |
| `<leader>dph` | n  | 프로파일러 하이라이트 토글            |
| `<leader>uh`  | n  | LSP Inlay Hints 토글 (지원 시) |

## Git (Snacks)

| 키            | 모드   | 설명                   |
| ------------ | ---- | -------------------- |
| `<leader>gg` | n    | Lazygit (Root Dir)   |
| `<leader>gG` | n    | Lazygit (cwd)        |
| `<leader>gL` | n    | Git Log (cwd)        |
| `<leader>gb` | n    | 현재 줄 Git blame       |
| `<leader>gf` | n    | 현재 파일 Git history    |
| `<leader>gl` | n    | Git Log (Root Dir)   |
| `<leader>gB` | n, x | Git 브라우저 열기          |
| `<leader>gY` | n, x | Git 브라우저 URL 클립보드 복사 |

## Terminal

| 키                | 모드 | 설명                |
| ---------------- | -- | ----------------- |
| `<leader>fT`     | n  | 터미널 열기 (cwd)      |
| `<leader>ft`     | n  | 터미널 열기 (Root Dir) |
| `<C-/>`, `<C-_>` | n  | 터미널 열기 (Root Dir) |
| `<C-/>`, `<C-_>` | t  | 터미널 닫기            |

## Tabs

| 키                    | 모드 | 설명         |
| -------------------- | -- | ---------- |
| `<leader><tab>l`     | n  | 마지막 탭      |
| `<leader><tab>o`     | n  | 다른 탭 모두 닫기 |
| `<leader><tab>f`     | n  | 첫 번째 탭     |
| `<leader><tab><tab>` | n  | 새 탭        |
| `<leader><tab>]`     | n  | 다음 탭       |
| `<leader><tab>d`     | n  | 탭 닫기       |
| `<leader><tab>[`     | n  | 이전 탭       |

## 기타

| 키            | 모드 | 설명                      |
| ------------ | -- | ----------------------- |
| `<leader>K`  | n  | Keywordprg 실행           |
| `<leader>ui` | n  | 커서 아래 하이라이트 확인          |
| `<leader>uI` | n  | Treesitter Inspect Tree |
| `<leader>L`  | n  | LazyVim Changelog       |


