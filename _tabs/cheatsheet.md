---
layout: page
icon: fas fa-book-open
order: 4
title: 치트시트
---

자주 쓰지만 매번 검색하게 되는 명령어·문법 모음. 본문은 [toolbox 레포](https://github.com/clang-engineer/toolbox/tree/main/cheatsheets)에서 관리됩니다.

## 자주 쓰는 것

### 에디터 & TUI

| 파일 | 설명 |
|------|------|
| [vim.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/vim.md) | Vim 모드별 명령어 |
| [lazyvim.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/lazyvim.md) | LazyVim 키맵 |
| [lazygit.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/lazygit.md) | LazyGit TUI 단축키 |
| [tmux.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/tmux.md) | Tmux 세션/윈도우/패널 |

### 모던 CLI 도구 (grep/find/cat/ls 대체)

| 파일 | 설명 |
|------|------|
| [rg.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/rg.md) | ripgrep — 텍스트 검색 (`grep` 대체) |
| [fzf.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/fzf.md) | fzf — 퍼지 파인더 (Ctrl+R/T, 파이프 조합) |
| [jq.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/jq.md) | jq — JSON 파이프라인 가공 |
| [modern-cli.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/modern-cli.md) | bat / eza / fd / tree / zoxide / delta / tldr 통합 |

### 텍스트 처리

| 파일 | 설명 |
|------|------|
| [sed-awk.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/sed-awk.md) | sed (치환·삽입·삭제) + awk (필드·집계·보고서) |
| [compression.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/compression.md) | tar / gzip / zip / xz / bzip2 / 7z |

### 데이터

| 파일 | 설명 |
|------|------|
| [sql-snippets.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/sql-snippets.md) | PostgreSQL 운영 패턴 (`information_schema` ALTER 자동 생성 등) |

### 인프라 / 빌드

| 파일 | 설명 |
|------|------|
| [kubectl.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/kubectl.md) | Kubernetes CLI — get/logs/exec/port-forward/apply/rollout |
| [make.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/make.md) | Makefile — 자동변수, 패턴 룰, .PHONY, 함수 |

### 셸 & 시스템

| 파일 | 설명 |
|------|------|
| [shell.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/shell.md) | Bash `set` 옵션, `&`/`&&`/`;`/`\|\|`, job 관리 |
| [linux-process.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/linux-process.md) | 프로세스 찾기·종료 (`pgrep`/`pkill`/`lsof`/`kill` 시그널) |
| [ssh.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/ssh.md) | ssh-agent/ssh-add, ~/.ssh/config, scp/rsync |

### Git & 버전 관리

| 파일 | 설명 |
|------|------|
| [git.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/git.md) | Git 명령어 (브랜치, stash, rebase, tag 등) |
| [gh.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/gh.md) | GitHub CLI — PR/이슈/Actions/API |
| [code-review-glossary.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/code-review-glossary.md) | 리뷰 약어/용어 (LGTM, PTAL, nit:, Draft PR 등) |

> `delta`(git diff 페이저)는 [modern-cli.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/modern-cli.md)에 통합.

### 개발 도구

| 파일 | 설명 |
|------|------|
| [docker.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/docker.md) | Docker / Compose 명령어 + 오프라인 바이너리 설치 |
| [curl.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/curl.md) | curl HTTP 요청 |
| [claude-code.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/claude-code.md) | Claude Code CLI |

> 언어 문법을 처음부터 익히는 자료는 치트시트가 아니라 [`../guides/`](https://github.com/clang-engineer/toolbox/tree/main/guides/)에 정리되어 있다 (Lua, Vimscript 등).

---

## 저빈도 — [`_archive/`](https://github.com/clang-engineer/toolbox/tree/main/cheatsheets/_archive/)

`rg`/`grep`의 평소 검색(`cheatsheets/*.md`)에서 제외되도록 서브폴더로 분리.

### 셸 / 패턴

| 파일 | 설명 |
|------|------|
| [_archive/zsh.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/zsh.md) | Zsh 단축키, glob, alias |
| [_archive/regex.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/regex.md) | 정규표현식 문법 |
| [_archive/powershell.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/powershell.md) | PowerShell — Bash와 다른 점 위주 (PS 5.1 vs 7 포함) |

### 서버 관리

| 파일 | 설명 |
|------|------|
| [_archive/nginx.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/nginx.md) | Nginx 설정/명령어 |
| [_archive/systemd.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/systemd.md) | systemd 서비스 관리 + journalctl 로그 |
| [_archive/linux.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/linux.md) | Linux 디렉터리 구조 + 자원 모니터링 + 네트워크 |
| [_archive/rocky-linux.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/rocky-linux.md) | Rocky Linux (firewalld, SELinux, certbot) |

### macOS

| 파일 | 설명 |
|------|------|
| [_archive/aerospace.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/aerospace.md) | macOS 타일링 WM |
| [_archive/macos-admin.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/macos-admin.md) | macOS troubleshoot (LaunchDaemons, Secure Input 등) |

### 데이터 / 검색

| 파일 | 설명 |
|------|------|
| [_archive/elasticsearch.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/elasticsearch.md) | Elasticsearch 쿼리/관리 |
| [_archive/kibana.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/kibana.md) | KQL, Dev Tools, Discover, 운영 진단 |

### 디버깅 & 보안

| 파일 | 설명 |
|------|------|
| [_archive/gdb.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/gdb.md) | C/C++ 디버깅 |
| [_archive/openssl.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/openssl.md) | 인증서/암호화 |

### 언어

| 파일 | 설명 |
|------|------|
| [_archive/cpp.md](https://github.com/clang-engineer/toolbox/blob/main/cheatsheets/_archive/cpp.md) | C++ 문자열 분리/타입 변환 스니펫, Google C++ Style |
