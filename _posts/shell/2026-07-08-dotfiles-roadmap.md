---
title       : "dotfiles 로드맵 — 설정을 코드로 재현하는 순서"
description : "흩어진 설정을 git 한곳에 모으고(심링크), 설치까지 선언적으로(Brewfile) 만든 뒤, 머신마다 갈리는 값을 어떻게 처리하느냐(런타임 분기 vs chezmoi 렌더)에서 방식이 갈린다 — 이 블로그의 dotfiles 글을 그 순서로 큐레이션. init 파일 이해·direnv·SSH 분리·새 맥 셋업은 결이 다른 축이라 부록으로 분리."
date        : 2026-07-08 12:00:00 +0900
updated     : 2026-07-08 12:00:00 +0900
categories  : [shell, "개요·인덱스"]
tags        : [roadmap, dotfiles, chezmoi, symlink]
pin         : false
hidden      : false
---

새 기기를 받을 때마다 `~/.zshrc`·`~/.gitconfig`·`~/.config/nvim`을 처음부터 다시 만드는 건 낭비다. dotfiles 관리의 목표는 하나 — **설정을 코드로 두고, 어느 머신에서든 재현**하는 것이다. 이 로드맵은 그 목표를 향해 이 블로그의 dotfiles 글을 한 줄기로 묶었다. 설정을 한곳에 모으고(1단계), 설치까지 선언적으로 만든 뒤(2단계), 머신마다 갈리는 값을 어떻게 처리하느냐(3단계)에서 방식이 갈린다.

핵심 갈림길은 **3단계**다. 머신 차이를 셸이 *런타임에* 분기하게 둘 것인가(심링크 + `.secrets`), 아니면 *렌더 시점에* 확정할 것인가(chezmoi). 여기서 도구 선택이 갈리므로, 앞 단계를 지난 뒤 자기 상황에 맞는 갈래로 들어가면 된다.

설정 재현과 **결이 다른 축** — 초기화 파일이 언제 무엇을 읽는지(이해), 디렉토리별 환경변수, SSH 계정 분리, 새 맥 전체 셋업 — 은 아래 **부록**으로 분리했다. 단계가 아니라, 필요할 때 찾아 들어오는 다른 축이다.

## 한눈에 보기

1 → 2 → 3단계가 "설정을 코드로 재현"하는 척추다. 3단계에서 심링크 갈래와 chezmoi 갈래로 나뉜다.

| 구역 | 답하는 질문 | 성격 |
|---|---|---|
| 입문 | dotfiles를 왜·무엇으로 관리하나 | 학습 전제 |
| 1단계 — 한곳에 모으기 | 흩어진 설정을 git + 심링크로 | 척추 |
| 2단계 — 설치도 선언적으로 | 패키지까지 코드로 재현 (Brewfile) | 척추 |
| 3단계 — 머신 분기 | 런타임 분기(심링크) vs 렌더(chezmoi) | 척추 · **갈림길** |
| 부록 A | 초기화 파일 이해 · direnv | 다른 축 |
| 부록 B | SSH 계정 분리 · 새 맥 전체 셋업 | 필요할 때 |

## 입문 — dotfiles를 왜, 무엇으로

설정 파일을 홈에 그대로 두면 새 기기에서 처음부터 다시 만들어야 하고 "어제 뭘 바꿨더라"도 추적이 안 된다. 해법은 **원본을 git 저장소 한곳에 모으는 것**이다. 그 위에 "홈에 어떻게 되돌려 놓을 것인가"(심링크냐 렌더냐)가 얹힌다. 큰 그림 — 새 맥을 받아 시스템 설정부터 dotfiles까지 이어지는 day-1 흐름 — 은 [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/)의 런북이 잡아 준다. 이 로드맵은 그중 dotfiles 갈래를 깊게 판다.

## 1단계 — 설정을 한곳에 모으기 (심링크)

가장 기본이자 대부분의 상황에서 충분한 방식. 설정 원본을 git 저장소에 모으고, 홈에는 그 원본을 가리키는 **심볼릭 링크**만 둔다. 편집이 즉시 반영되고(같은 inode), 원본과 어긋날 일이 구조적으로 없다.

| 글 | 핵심 |
|---|---|
| [dotfiles를 git 저장소 + 심볼릭 링크로 관리하기](/posts/shell/2026-07-03-dotfiles-symlink-management/) | 설정을 git 한곳에 모으고 홈으로 심볼릭 링크. `ln -s` 재실행 문제를 없애는 멱등 링크 헬퍼, 도구별 `setup.sh`를 `bootstrap.sh`로 묶는 구조, GNU stow 대안, 시크릿 분리까지 |

> 이 단계의 멱등 링크 헬퍼·bootstrap은 [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/)에서 배운 스크립팅이 실제로 쓰이는 첫 실전이기도 하다. 스크립트를 갓 배웠다면 자기 환경을 재현하는 연습으로 삼기 좋다.
{: .prompt-tip }

## 2단계 — 설치도 선언적으로 (Brewfile)

설정 파일만 복원해선 반쪽이다 — 그 설정이 가리키는 **도구 자체**도 새 기기에 깔려 있어야 한다. Homebrew Brewfile로 "무엇을 설치할지"를 코드로 선언해 두면, dotfiles와 함께 설치 상태까지 재현된다.

| 글 | 핵심 |
|---|---|
| [Homebrew Brewfile로 패키지 선언적으로 관리하기](/posts/shell/2026-07-03-homebrew-brewfile-bundle/) | `dump`로 현재 설치를 덤프 → `bundle`로 재설치 → `cleanup`으로 정리 → `check`로 검증. Brewfile 문법과 dotfiles 버전관리에 얹는 법 |

## 3단계 — 머신 분기: 런타임이냐 렌더냐

여기가 갈림길이다. 여러 머신을 쓰면 값이 갈린다 — 이메일, 툴셋, 호스트별 경로. 이 차이를 **언제 확정하느냐**로 두 방식이 나뉜다.

- **런타임 분기 (심링크 + `.secrets`)** — 홈의 링크는 원본 그대로 두고, 머신별 값은 `~/.secrets` 같은 파일에 두어 셸이 실행 시점에 `source`로 분기한다. 1단계 심링크 방식의 자연스러운 연장이다. 시크릿을 저장소에서 빼는 방법이 여기 포함된다 ([1단계 글](/posts/shell/2026-07-03-dotfiles-symlink-management/)의 시크릿 분리 절).
- **렌더 (chezmoi)** — 템플릿을 `apply` 시점에 그 머신용 실파일로 렌더해 분기를 미리 확정한다. `.gitconfig`·JSON처럼 런타임 `source`가 안 되는 파일, 또는 남이 클론해 바로 돌리게 하고 싶을 때 값을 한다.

| 글 | 핵심 |
|---|---|
| [chezmoi vs 심링크 dotfiles — 근본 차이와 언제 무엇을 쓸까](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/) | 머신 분기를 런타임에서 apply타임으로 옮기는 게 핵심. 차이를 표로 정리하고 chezmoi가 실제 이득인 세 경우와 심링크가 더 나은 경우를 가른다. stow와의 위치까지 |
| [chezmoi 사용법 — 소스 표현과 apply 흐름](/posts/shell/2026-07-08-chezmoi-usage-source-apply/) | 소스 디렉토리(git repo), 파일명 메타 인코딩(`dot_`·`private_`·`.tmpl`), 템플릿 데이터, `init`→`add`→`chattr`→`diff`→`apply` 명령 흐름. 공유의 핵심 `init --apply` |

> **대부분은 심링크로 충분하다.** 개인 1머신이거나 머신 차이가 경로 수준(환경변수로 처리 가능)에 그친다면, chezmoi는 일상 편집에 `apply` 한 단계를 얹어 무겁게만 만든다. chezmoi가 값을 하는 건 (1) 남이 클론해 바로 돌리게, (2) config *내용*이 머신마다 갈릴 때, (3) 비셸 config에 머신별 값이 필요할 때 — 이 세 경우다.
{: .prompt-info }

---

## 부록 A — 초기화 파일 이해 · direnv (다른 축)

dotfiles를 "코드로 관리"하기 전에 잡아 두면 좋은 이해, 그리고 저장소 밖에서 환경을 다루는 축.

| 글 | 핵심 |
|---|---|
| [/etc/profile, /etc/bashrc, ~/.bash_profile, ~/.bashrc](/posts/shell/2022-07-19-bashrc-profile/) | login/non-login × interactive/non-interactive 두 축으로 본 초기화 파일 로딩 순서. zsh 매핑까지. "왜 내 `.zshrc`가 안 먹히지"의 답 — 어느 파일을 dotfiles로 관리할지 정하기 전 전제 |
| [direnv 사용법 정리](/posts/shell/2026-02-21-direnv/) | 디렉토리 진입 시 `.envrc`로 환경변수 자동 로드. 저장소별로 갈리는 값을 dotfiles 밖에서 다루는 축. 셸 레벨 direnv vs 앱 레벨 dotenv의 역할 분담 |

## 부록 B — SSH 계정 분리 · 새 맥 전체 셋업 (필요할 때)

특정 상황에서 찾아 들어오는 글들.

| 글 | 핵심 |
|---|---|
| [GitHub 다중 계정 관리 (SSH config)](/posts/git/2025-10-03-git-multiple-config/) | 회사·개인 계정을 `~/.ssh/config`의 Host 별칭으로 분리. dotfiles의 시크릿 분리(개인키는 저장소에서 제외)와 이어지는 지점 |
| [새 맥 초기 설정 — 셋업 순서](/posts/macos/2022-02-05-new-mac-initial-setup/) | 시스템 설정 → Homebrew → dotfiles → Git 계정으로 이어지는 day-1 런북. dotfiles가 전체 셋업의 어디에 놓이는지 |

---

본인 위치에 따라:

- **dotfiles를 처음 관리한다면** 1단계 심링크로 설정을 한곳에 모으는 것부터. 대부분 여기 + 시크릿 분리(3단계 런타임 갈래)면 충분하다.
- **새 기기 재현을 완성하고 싶다면** 2단계 Brewfile로 설치까지 코드로.
- **여러 머신에서 config 내용이 갈린다면** 3단계에서 chezmoi 갈래를 검토. 그렇지 않으면 심링크 + `.secrets`로 남는다.

그다음은 상황껏 — 초기화 파일 로딩이 헷갈리면 부록 A, SSH 계정을 나누거나 새 맥을 처음부터 세우면 부록 B로. 이 로드맵은 [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/)의 *환경을 코드로 관리* 갈래를 dotfiles 축으로 확장한 것이고, 데스크톱 환경 전반은 [macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/)과 함께 보면 된다.
