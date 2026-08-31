---
layout: page
icon: fas fa-book-open
order: 2
title: 치트시트
---

자주 쓰지만 매번 검색하게 되는 명령어·문법 모음. 본문은 [devkit 레포](https://github.com/clang-engineer/devkit/tree/main/cheatsheets)에서 관리됩니다.

## 에디터 & TUI

| 파일 | 설명 |
|------|------|
| [vim.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/vim.md) | Vim 모드별 명령어 |
| [lazyvim.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/lazyvim.md) | LazyVim 키맵 |
| [lazygit.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/lazygit.md) | LazyGit TUI 단축키 |
| [tmux.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/tmux.md) | Tmux 세션/윈도우/패널 |
| [smug.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/smug.md) | smug — 선언형 YAML로 tmux 세션 부팅 |
| [ghostty.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/ghostty.md) | Ghostty 터미널 탭/분할/키맵 |

## 모던 CLI 도구 (grep/find/cat/ls 대체)

| 파일 | 설명 |
|------|------|
| [rg.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/rg.md) | ripgrep — 텍스트 검색 (`grep` 대체) |
| [fzf.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/fzf.md) | fzf — 퍼지 파인더 (Ctrl+R/T, 파이프 조합) |
| [jq.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/jq.md) | jq — JSON 파이프라인 가공 |
| [modern-cli.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/modern-cli.md) | bat / eza / fd / tree / zoxide / delta / tldr 통합 |

## 텍스트 처리

| 파일 | 설명 |
|------|------|
| [sed-awk.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/sed-awk.md) | sed (치환·삽입·삭제) + awk (필드·집계·보고서) |
| [regex.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/regex.md) | 정규표현식 문법 + 도구별 플레이버(BRE/ERE/PCRE) 차이 |
| [compression.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/compression.md) | tar / gzip / zip / xz / bzip2 / 7z |

## 셸

| 파일 | 설명 |
|------|------|
| [shell.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/shell.md) | Bash `set` 옵션, `&`/`&&`/`;`/`\|\|`, job 관리 |
| [zsh.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/zsh.md) | Zsh 단축키, glob, alias |
| [powershell.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/powershell.md) | PowerShell — Bash와 다른 점 위주 (PS 5.1 vs 7, 서비스 관리 sc/nssm 포함) |

## 시스템 & 서버

| 파일 | 설명 |
|------|------|
| [linux-process.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/linux-process.md) | 프로세스 찾기·종료 (`pgrep`/`pkill`/`lsof`/`kill` 시그널) |
| [linux.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/linux.md) | Linux 디렉터리 구조 + 자원 모니터링 + 네트워크 |
| [ssh.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/ssh.md) | ssh-agent/ssh-add, ~/.ssh/config, scp/rsync |
| [systemd.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/systemd.md) | systemd 서비스 관리 + journalctl 로그 |
| [nginx.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/nginx.md) | Nginx 설정/명령어 |
| [openssl.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/openssl.md) | 인증서/암호화 |
| [rocky-linux.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/rocky-linux.md) | Rocky Linux / RHEL 계열 (dnf, firewalld, SELinux) |

## macOS

| 파일 | 설명 |
|------|------|
| [macos-admin.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/macos-admin.md) | macOS troubleshoot (LaunchDaemons, Secure Input 등) |
| [aerospace.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/aerospace.md) | macOS 타일링 WM |
| [hammerspoon.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/hammerspoon.md) | macOS 자동화/윈도우 관리 (Lua) |

## 데이터

| 파일 | 설명 |
|------|------|
| [harlequin.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/harlequin.md) | Harlequin 기본 사용법 (`--config-path`, `--profile`) |
| [sql-snippets.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/sql-snippets.md) | PostgreSQL 운영 패턴 (`information_schema` ALTER 자동 생성 등) |
| [vertica.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/vertica.md) | Vertica — 계정 만료 해제(chage) + v_catalog/v_monitor 용량·이력 조회 |
| [elasticsearch.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/elasticsearch.md) | Elasticsearch 쿼리/관리 |
| [kibana.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/kibana.md) | KQL, Dev Tools, Discover, 운영 진단 |

## 컨테이너 & 빌드

| 파일 | 설명 |
|------|------|
| [kubectl.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/kubectl.md) | Kubernetes CLI — get/logs/exec/port-forward/apply/rollout |
| [docker.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/docker.md) | Docker / Compose 명령어 + 오프라인 바이너리 설치 |
| [make.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/make.md) | Makefile — 자동변수, 패턴 룰, .PHONY, 함수 |

## Git & 버전 관리

| 파일 | 설명 |
|------|------|
| [git.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/git.md) | Git 명령어 (브랜치, stash, rebase, tag 등) |
| [gh.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/gh.md) | GitHub CLI — PR/이슈/Actions/API |
| [code-review-glossary.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/code-review-glossary.md) | 리뷰 약어/용어 (LGTM, PTAL, nit:, Draft PR 등) |
| [chezmoi.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/chezmoi.md) | chezmoi — dotfiles 관리 (source/target 모델, 네이밍 규칙, 템플릿) |

> `delta`(git diff 페이저)는 [modern-cli.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/modern-cli.md)에 통합.

## 설정 파일 형식

| 파일 | 설명 |
|------|------|
| [toml.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/toml.md) | TOML 문법 — 값, 배열, 테이블 `[ ]`, 테이블 배열 `[[ ]]` |

## 개발 도구

| 파일 | 설명 |
|------|------|
| [terminal-tooling.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/terminal-tooling.md) | 터미널 도구 역할 분담과 선택 가이드 |
| [mise.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/mise.md) | mise — 다언어 런타임 버전 관리 (rbenv/jenv/pyenv/nvm 통합, config+activate) |
| [curl.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/curl.md) | curl HTTP 요청 |
| [taskwarrior.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/taskwarrior.md) | Taskwarrior 3.5 — 태스크 관리, 필터, 날짜, JSON export, TaskChampion 동기화 |
| [claude-code.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/claude-code.md) | Claude Code CLI |
| [ccusage.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/ccusage.md) | ccusage 사용량 집계와 임계치 경보 |
| [opencode.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/opencode.md) | opencode — provider-agnostic 터미널 AI 코딩 에이전트 (인증·모델 선택) |
| [gdb.md](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/gdb.md) | GDB — GNU 디버거 (중단점·스택·변수·메모리 조사) |
