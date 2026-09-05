---
title       : "셸 로드맵 — 첫 스크립트부터 환경 관리까지"
description : "첫 스크립트 실행 → Bash 문법 → CLI 인터페이스 → 환경 관리와 dotfiles → 세션·원격으로 이어지는 현재 셸 문서 지도를 정리한다. 삭제된 레거시 글을 제거하고 실제 남아 있는 문서만 연결한다."
date        : 2026-07-03 14:30:00 +0900
updated     : 2026-09-05 21:14:00 +0900
categories  : [shell, "개요·인덱스"]
tags        : [roadmap, shell, zsh, bash]
pin         : false
hidden      : false
---

이 로드맵은 셸을 **명령어 모음이 아니라 작업 환경과 자동화 도구를 잇는 층**으로 본다.

중심 줄기는 다음과 같다.

```text
명령을 파일로 실행
        ↓
Bash 문법 이해
        ↓
CLI 인터페이스 설계
        ↓
환경을 선언적으로 관리
        ↓
세션·원격 환경까지 확장
```

파이프·리다이렉션·글로빙·`grep`/`awk` 같은 인터랙티브 셸 기본기는 아직 별도 본문이 충분하지 않다. 없는 글을 억지로 로드맵에 끼워 넣지 않고 빈 영역으로 둔다.

## 1. 시작 — 첫 스크립트를 실행한다

| 글 | 핵심 |
|---|---|
| [첫 셸 스크립트 만들고 실행하기](/posts/shell/2026-07-04-first-shell-script/) | shebang, 실행 권한, `./`, PATH, CRLF 같은 첫 실행 단계의 함정 |

여기서 중요한 것은 문법보다 **실행 모델**이다.

```text
파일 생성
→ 어떤 인터프리터가 읽는가
→ 실행 권한이 있는가
→ 셸이 그 파일을 어디서 찾는가
```

이 바닥이 잡혀야 다음의 문법이 실제 스크립트로 이어진다.

## 2. 문법 — Bash 줄기를 잡는다

| 글 | 핵심 |
|---|---|
| [셸 스크립트 문법 종합 가이드](/posts/shell/2026-07-03-bash-syntax-guide/) | 변수·인용·파라미터 확장·조건·반복·함수·배열·확장 순서·`set -euo pipefail` |

문법을 외우는 게 목적이 아니라 다음 질문에 답할 수 있으면 된다.

```text
값은 언제 확장되는가
공백은 언제 인자를 쪼개는가
조건식은 어떤 셸 문법을 쓰는가
실패를 어디까지 전파할 것인가
```

> 📎 **치트시트** · [shell](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/shell.md) · [zsh](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/zsh.md)
{: .prompt-tip }

## 3. CLI로 만들기 — 남이 쓸 수 있는 인터페이스

| 글 | 핵심 |
|---|---|
| [CLI 인자 컨벤션 — positional과 --flag는 왜 섞어 쓰나](/posts/shell/2026-06-10-cli-positional-vs-flag/) | 위치 인자·옵션·환경변수의 역할을 나눠 CLI 인터페이스를 설계 |

스크립트가 일회성 명령 묶음을 넘어서면 입력 인터페이스가 필요하다.

```text
필수 대상
→ positional

선택 동작
→ --flag / --option

환경별 기본값
→ environment variable
```

이 단계부터 셸 스크립트는 개인 메모가 아니라 작은 도구가 된다.

## 4. 환경 — 디렉터리와 패키지를 선언적으로 관리한다

스크립팅과는 다른 축이지만 실제 셸 환경을 재현하려면 이 영역이 중요하다.

| 글 | 핵심 |
|---|---|
| [direnv 사용법 정리](/posts/shell/2026-02-21-direnv/) | 디렉터리별 환경변수를 `.envrc`로 자동 로드 |
| [dotfiles를 git 저장소 + 심볼릭 링크로 관리하기](/posts/shell/2026-07-03-dotfiles-symlink-management/) | 설정 파일을 한 저장소에서 관리하고 홈 디렉터리로 연결 |
| [Homebrew Brewfile로 패키지 선언적으로 관리하기](/posts/shell/2026-07-03-homebrew-brewfile-bundle/) | 패키지 목록을 코드처럼 선언하고 재설치·검증 |
| [chezmoi 사용 — source와 apply](/posts/shell/2026-07-08-chezmoi-usage-source-apply/) | dotfiles를 source state와 실제 홈 디렉터리로 분리해 관리 |
| [chezmoi 전환 시 함정](/posts/shell/2026-07-08-chezmoi-migration-pitfalls/) | 기존 심볼릭 링크 기반 dotfiles에서 chezmoi로 옮길 때 생기는 문제 |

이 흐름은 다음처럼 볼 수 있다.

```text
환경변수
→ direnv

설정 파일
→ dotfiles

패키지
→ Brewfile

머신별 렌더링·배포
→ chezmoi
```

단순 심볼릭 링크 방식과 chezmoi는 경쟁 관계라기보다 **복잡도 단계**가 다르다. 머신 분기가 거의 없으면 심볼릭 링크가 단순하고, 템플릿·머신별 차이가 커지면 chezmoi의 가치가 커진다.

## 5. 일상 탐색 속도

| 글 | 핵심 |
|---|---|
| [zoxide로 디렉토리 이동 빠르게](/posts/shell/2026-07-03-zoxide-directory-jump/) | 방문 기록의 frecency로 자주 가는 디렉터리 점프 |

`zoxide`는 셸 문법이 아니라 **반복 이동의 마찰을 줄이는 도구**다.

```text
정확한 경로를 안다
→ cd

자주 갔던 목적지를 대충 기억한다
→ zoxide

목록에서 fuzzy 선택이 필요하다
→ fzf 계열 도구
```

## 6. 프로세스와 세션 — 셸을 닫아도 작업을 남긴다

| 글 | 핵심 |
|---|---|
| [백그라운드 작업과 세션 지속](/posts/shell/2026-06-16-background-jobs-and-session/) | `&`, job control, `nohup`, 세션 종료와 프로세스 생존, tmux와의 경계 |

여기서는 명령 실행 자체보다 **프로세스가 어떤 세션에 묶여 있는가**가 핵심이다.

```text
현재 셸 안에서 잠깐 백그라운드
→ & / jobs / fg / bg

로그아웃 후에도 프로세스만 유지
→ nohup 등

작업 화면과 셸 상태까지 유지
→ tmux
```

터미널 세션 자체를 더 깊게 보려면 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)으로 이어진다.

## 아직 비어 있는 영역

현재 문서셋 기준으로 다음은 아직 전용 글이 부족하다.

- 파이프와 리다이렉션
- `grep`·`awk`·`cut`·`sort` 중심 텍스트 처리
- login / interactive shell 초기화 파일 전체 모델
- `set -x`, ShellCheck 중심 디버깅
- POSIX `sh`와 Bash/Zsh의 경계

예전의 짧은 메모를 억지로 남겨 이 빈칸을 채우지 않는다. 필요성이 생기면 새 글을 현재 원칙에 맞춰 작성한다.

## 어디서 시작할까

```text
셸 스크립트를 처음 만든다
→ 첫 셸 스크립트
→ Bash 문법 가이드
→ CLI 인자 설계

새 Mac에서 환경을 재현하고 싶다
→ dotfiles
→ Brewfile
→ 필요하면 chezmoi

명령을 오래 돌려야 한다
→ background jobs
→ tmux
```

이 로드맵은 **현재 실제로 남아 있는 문서만** 연결한다. 삭제된 단편 메모를 다시 링크해 지식 구조를 흐리지 않는다.
