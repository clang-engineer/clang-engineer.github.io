---
title       : "tmux 플러그인, 무엇을 더하고 무엇을 빼나"
description : "TPM 기본 구성부터 출력 추출·세션 탐색까지 tmux 플러그인의 채택 이유를 비교하고, sesh·tmuxinator와의 역할 경계를 정리한다."
date        : 2026-07-11 16:00:00 +0900
updated     : 2026-11-18 16:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [plugin, catppuccin, extrakto]
pin         : false
hidden      : false
redirect_from:
  - /posts/tmux/2025-11-17-tmux-tpm/
  - /posts/tmux/2026-02-21-tmux-tips/
---

tmux 플러그인은 많이 설치하는 것보다 **반복해서 불편한 일을 하나씩 줄이는 것**이 중요하다. 기본 설정을 묶어 받고 싶은지, 재시작 뒤 작업 배치를 복원하고 싶은지, 화면의 경로를 집어내고 싶은지부터 나눈다. 같은 `fzf`를 쓰더라도 출력 문자열을 고르는 도구와 세션을 관리하는 도구는 해결하는 문제가 다르다.

> 이 글은 [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)의 플러그인 선택 구간이다. TPM과 기본 플러그인의 역할부터 대안·중복까지 여기서 함께 다룬다. 설치·옵션·재사용할 `.tmux.conf` 예시의 정본은 [devkit tmux 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md), 직접 만드는 방법은 [tmux 플러그인은 어떻게 만드나](./2026-07-09-tmux-plugin-authoring.md)에 둔다.
{: .prompt-tip }

**설치한 뒤에는 작업에서 출발한다.** 출력의 해시를 명령에 넣거나, 서버가 실행 중인 Pane을 찾거나, 선택한 경로를 열고 실패한 출력을 저장하는 순서는 [devkit의 플러그인 사용 흐름](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md#plugin-usage)에 모았다. extrakto·tmux-fzf·tmux-vim-copy·tmux-open·tmux-logging의 진입 키와 팝업·Copy Mode 안의 조작을 구분하며, 이 글은 어떤 도구를 남길지에 집중한다.

## 한눈에 — 어떤 불편을 줄이나

| 목적 | 후보 | 먼저 확인할 중복 |
|---|---|---|
| 기본 설정 정리 | sensible | 직접 적은 옵션·설정 배포판 |
| 떠 있던 작업 배치 저장·복원 | resurrect + 필요하면 continuum | 선언형 세션 생성과는 다른 목적 |
| Vim 창과 tmux pane 사이 이동 | vim-tmux-navigator | 에디터 쪽 연동·기존 이동 키 |
| 상태바 스타일·정보 표시 | catppuccin 등 테마 하나 | 기존 테마·OMT 상태바 |
| 선택 영역을 OS 클립보드로 | tmux-yank | OSC52·기존 클립보드 연동 |
| 출력된 경로·URL·해시 선택 | extrakto 또는 힌트 계열 하나 | Copy Mode로 충분한지 |
| tmux 객체 검색·조작 | tmux-fzf | 기존 객체 선택 UI |
| 프로젝트 세션 생성·접속 | sessionx 또는 sesh | 서로 겹치는 세션 선택기 |

## TPM과 기본 구성 — 모두에게 필수인 묶음은 아니다

[TPM(Tmux Plugin Manager)](https://github.com/tmux-plugins/tpm)은 플러그인을 설치·갱신·삭제하고 로드하는 관리자다. 플러그인을 수동으로 로드할 수도 있으므로 tmux 자체의 필수 구성요소는 아니다. 여러 저장소의 설치와 갱신을 한곳에서 관리하려고 채택한다.

직접 구성하는 환경에서는 TPM을 한 번 설치한다.

```sh
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

아래는 **기본 후보의 선언 방식**을 보여주는 최소 예다. 네 플러그인을 무조건 함께 설치하라는 뜻은 아니다. 필요한 선언만 남기고, 플러그인 옵션은 초기화 줄보다 앞에 둔다.

```tmux
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'christoomey/vim-tmux-navigator'
set -g @plugin 'tmux-plugins/tmux-continuum'

# 다른 설정과 플러그인 선언 뒤, 설정 파일 맨 마지막
run '~/.tmux/plugins/tpm/tpm'
```

기존 서버에는 `tmux source-file ~/.tmux.conf`로 TPM을 로드한 뒤 `prefix + I`(대문자 `I`)로 선언한 플러그인을 설치한다. 기본 prefix는 `Ctrl+b`다. 업데이트·삭제와 전체 구성 예시는 치트시트에서 이어간다. **Oh My Tmux! 사용자는 이 설치·초기화를 중복 추가하지 않고 배포판의 TPM 연동을 사용한다.**

### sensible — 자주 쓰는 기본값을 묶어 받기

[tmux-sensible](https://github.com/tmux-plugins/tmux-sensible)은 ESC 지연·Scrollback 크기·메시지 표시 시간·이동 키처럼 널리 쓰이는 설정을 묶는다. 사용자 정의 설정을 존중하면서 `.tmux.conf`의 반복을 줄이려는 것이 채택 이유다. 이미 필요한 옵션을 직접 관리하거나 OMT 같은 설정 배포판을 쓴다면 추가 이점이 작을 수 있다. “기본값 묶음”은 편의 기능이지 내 터미널의 색·입력 문제를 자동으로 모두 해결한다는 뜻은 아니다.

### resurrect와 continuum — 저장·복원에 자동화를 더하기

[tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect)는 **저장한 시점의 세션·윈도우·pane 배치와 작업 경로, 지원하는 실행 명령**을 복원한다. 기본 키는 `prefix + Ctrl+s`로 저장, `prefix + Ctrl+r`로 복원이다. pane에 보이던 내용까지 남기려면 다음 옵션을 선택한다.

```tmux
set -g @resurrect-capture-pane-contents 'on'
```

다만 **실행 중인 프로세스의 메모리·네트워크 연결을 그대로 보존하는 체크포인트는 아니다.** 프로그램 복원에는 지원 범위가 있으며, Vim/Neovim의 편집 상태 복원도 별도 연동을 확인해야 한다. “개발 환경 그대로 복구”보다는 작업 배치를 다시 잡는 수고를 줄이는 도구로 이해한다.

[tmux-continuum](https://github.com/tmux-plugins/tmux-continuum)은 resurrect에 의존해 기본 15분 간격의 자동 저장과 서버 시작 시 자동 복원을 더한다. 저장을 자주 잊는다면 추가할 이유가 있다.

```tmux
set -g @continuum-restore 'on'
```

이 옵션의 자동 복원은 **tmux 서버가 시작할 때만** 동작하며, 설정 리로드만으로 복원되지는 않는다. 컴퓨터 부팅 때 tmux 자체를 시작하는 기능도 별도로 활성화해야 한다. 자동 저장은 상태바 갱신에 의존하므로, 테마가 `status-right`를 덮어쓴다면 continuum을 플러그인 목록 마지막에 두는 등 [공식 문서의 조건](https://github.com/tmux-plugins/tmux-continuum#known-issues)을 확인한다.

**저장·복원과 선언형 생성은 다른 축이다.** resurrect·continuum은 *떠 있던* 작업을 저장해 되살리고, tmuxinator·smug·tmuxp는 *원하는* 경로·레이아웃·실행 명령을 선언해 새 환경을 만든다. 후자가 필요하면 [세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)을 본다. 둘을 같은 “세션 매니저”로 묶어 대체재라고 판단하지 않는다.

### vim-tmux-navigator — 에디터 창과 pane의 이동 키 통일

[vim-tmux-navigator](https://github.com/christoomey/vim-tmux-navigator)는 Vim/Neovim의 split과 tmux pane 사이를 **prefix 없이 `Ctrl+h/j/k/l`**로 이동하게 한다. 에디터 내부와 바깥에서 이동 키를 바꾸지 않아도 되는 것이 장점이다. **tmux 쪽 선언만으로 완성되지 않으며 Vim/Neovim 쪽 플러그인도 설치해야 한다.** 에디터를 쓰지 않거나 기존 키와 충돌한다면 기본 구성이라는 이유만으로 넣을 필요는 없다.

---

## 상태바 — themepack에서 catppuccin으로

기존 구성의 `jimeh/tmux-themepack`은 Powerline 스타일과 색상 프리셋을 골라 적용하는 간단한 테마였다. **2026-07에 비교했을 때** themepack은 1.8k⭐에 2019년 이후 활동이 뜸한 후보로 기록했고, catppuccin/tmux는 3.1k⭐의 활발한 대안으로 보았다. Neovim·bat·lazygit 등과 같은 팔레트를 쓰고 싶어 catppuccin을 교체 후보로 삼았다. 이 수치와 활동 평가는 당시 관찰이지 현재 상태를 새로 판정한 결과가 아니다.

```tmux
set -g @plugin 'catppuccin/tmux#v2.1.3'   # 태그 고정 권장 (v2는 config API가 바뀜)
set -g @catppuccin_flavor 'mocha'         # latte / frappe / macchiato / mocha
```

> **catppuccin v2는 상태바를 직접 조립하는 구조다.** v1과 달리 세그먼트를 `status-right`에 명시적으로 꽂아야 한다. 플러그인 로드 뒤 `set -g status-right "#{E:@catppuccin_status_application}#{E:@catppuccin_status_session}"` 식으로 원하는 모듈만 붙인다. 세부 모듈은 저장소 README 참고. 그래서 themepack보다 손이 더 가지만, 그만큼 세밀하게 고를 수 있다.
{: .prompt-info }

### 당시 함께 비교한 테마

아래 별 개수와 활동 메모 역시 **2026-07 비교 기록**이다. 순위는 설치 의무나 현재 생태계의 합의가 아니라 당시 검토 순서를 뜻한다.

| 순서 | 플러그인 | 별 | 선택할 이유·당시 메모 |
|---|---|---|---|
| 1 | [catppuccin/tmux](https://github.com/catppuccin/tmux) | 3.1k | 앱 전반의 팔레트 통일. 낮은 대비와 유행은 취향 문제 |
| 2 | [dracula/tmux](https://github.com/dracula/tmux) | 847 | 배터리·CPU 세그먼트를 함께 구성하려는 경우 |
| 3 | [tokyo-night-tmux](https://github.com/janoamaral/tokyo-night-tmux) | 566 | Tokyo Night 팔레트 선호, 당시 활동 확인 |
| 4 | [egel/tmux-gruvbox](https://github.com/egel/tmux-gruvbox) | 695 | gruvbox 팔레트 선호 |
| - | [erikw/tmux-powerline](https://github.com/erikw/tmux-powerline) | 3.8k | 세그먼트 조립의 자유와 폰트·정렬 관리 비용을 함께 고려 |
| - | [jimeh/tmux-themepack](https://github.com/jimeh/tmux-themepack) | 1.8k | 기존 구성. 당시 2019년 이후 활동이 뜸한 것으로 기록 |

powerline은 당시 별이 가장 많았지만, 폰트 글리프와 세그먼트 정렬을 손보는 비용까지 없어지는 것은 아니다. **별 개수보다 필요한 상태바와 관리 비용을 먼저 본다.** 반대로 커밋이 뜸하다는 이유만으로 성숙한 도구와 유지보수가 멈춘 도구를 구분할 수도 없다. README·호환성 이슈·실제 동작을 함께 확인해야 한다.

> **상태바 정보도 중복을 확인한다.** 2026-07에 함께 살핀 tmux-battery(569⭐)·tmux-cpu(533⭐)·prefix-highlight(669⭐)는 배터리·CPU·prefix 표시용이다. 테마가 제공하는 모듈이나 OMT 상태바로 같은 정보가 충족된다면 따로 설치할 이유가 줄어든다. 테마 모듈이 해당 정보를 직접 계산하는지 별도 플러그인에 의존하는지는 각 README에서 확인한다.
{: .prompt-tip }

---

## 복사 — 선택한 텍스트를 클립보드로

tmux에서 **선택한 텍스트를 시스템 클립보드로 보내는** 마찰을 줄이는 층이다. 기존 [클립보드 트러블슈팅 글](../terminal/2026-06-10-terminal-clipboard.md)이 "왜 안 붙나"를 다뤘다면, 여기는 "더 편하게"다. 화면에서 복사할 대상을 찾는 추출 도구는 다음 절에서 구분한다.

### tmux-yank — 클립보드 브리지의 표준

```tmux
set -g @plugin 'tmux-plugins/tmux-yank'
```

복사 모드에서 선택한 텍스트를 **시스템 클립보드**로 바로 보낸다(`y`). macOS `pbcopy`, Linux `xclip`/`xsel`/`wl-copy` 같은 도구를 감지해 사용한다. 2026-07 비교에서는 3.1k⭐, 최근 커밋은 2023년으로 기록했다. 목적이 명확한 도구라 후보로 남겼지만, 활동 날짜만으로 기능 완결이나 환경별 호환성을 보장할 수는 없다.

> **OSC52를 쓴다면 tmux-yank는 대체로 불필요하다.** 둘은 "선택 → 시스템 클립보드"라는 **같은 목적을 다른 수단**으로 푼다 — tmux-yank는 `pbcopy`/`xclip`를 부르고, OSC52는 터미널 이스케이프 시퀀스로 넘긴다. [클립보드 트러블슈팅 글](../terminal/2026-06-10-terminal-clipboard.md)의 결론대로 `set -g set-clipboard on` 한 줄이면 플러그인 없이 해결되므로, **OSC52가 되는(대부분의 모던) 터미널이면 yank는 안 넣어도 된다.** 반대로 OSC52를 지원하지 않는 터미널·환경에선 yank의 `pbcopy`/`xclip` 경로가 폴백이 된다. 뒤의 **extrakto**는 목적이 달라(화면 텍스트 추출) 이 중복과 무관하다.
{: .prompt-tip }

---

## 출력 탐색 — 정규식·힌트·퍼지 선택 비교

tmux의 Copy Mode는 출력 이력을 탐색하고 복사하는 기본 기능을 제공한다. 아래 플러그인들은 **화면에 이미 출력된 경로·URL·해시를 어떻게 찾아 선택할 것인가**라는 문제를 서로 다른 방식으로 해결한다.

```text
tmux 화면 / Scrollback
          │
          ├─ 정규식 매칭 후 순회 ── tmux-copycat
          ├─ 글자 힌트로 즉시 선택 ─ tmux-fingers / tmux-thumbs
          ├─ 후보를 퍼지 목록으로 ── extrakto
          ├─ 파일 경로 특화 ─────── tmux-fpp
          └─ URL 특화 ───────────── tmux-fzf-url / tmux-urlview
```

### 출력 탐색 플러그인 비교

| 플러그인 | Stars | 마지막 Push | 선택 방식·특징 |
|---|---:|---|---|
| [tmux-fingers](https://github.com/Morantron/tmux-fingers) | 1,488 | 2026-06 | 화면의 문자열에 키 힌트를 표시해 직접 선택 |
| [tmux-copycat](https://github.com/tmux-plugins/tmux-copycat) | 1,207 | 2023-05 | 정규식으로 경로·URL 등을 검색하고 매칭 결과 순회 |
| [extrakto](https://github.com/laktak/extrakto) | 1,158 | 2026-03 | 화면·Scrollback의 텍스트를 fzf 기반 목록으로 추출 |
| [tmux-thumbs](https://github.com/fcsonline/tmux-thumbs) | 1,104 | 2024-04 | Rust 기반의 키 힌트 선택 방식 |
| [tmux-fzf-url](https://github.com/wfxr/tmux-fzf-url) | 741 | 2026-08 | URL 후보를 fzf로 선택 |
| [tmux-fpp](https://github.com/tmux-plugins/tmux-fpp) | 322 | 2024-01 | Facebook PathPicker를 이용한 파일 경로 선택 |
| [tmux-urlview](https://github.com/tmux-plugins/tmux-urlview) | 291 | 2021-05 | URL 추출·선택에 특화 |

> Stars와 마지막 Push는 **2026-11-15 GitHub 저장소 조회 기준**이다. Push 시점은 코드 변경·유지보수 품질과 동일하지 않으며, 별 개수도 실제 사용량을 보장하지 않는다.
{: .prompt-info }

### extrakto — 화면 텍스트를 후보 목록으로

```tmux
set -g @plugin 'laktak/extrakto'
# 기본 바인딩: prefix + tab
```

`prefix + tab`을 누르면 **현재 화면과 Scrollback의 단어·경로·URL·git 해시**를 fzf 목록으로 띄우고, 고른 항목을 커서에 삽입하거나 클립보드로 복사한다. 방금 로그에 뜬 경로나 해시를 다시 타이핑하는 일이 잦다면 체감이 크다. 2026-07 비교에서는 1.1k⭐와 “killer plugin”이라는 호평을 도입 단서로 삼았지만, 추천의 핵심은 인기보다 **내 출력에서 문자열을 자주 꺼내는가**다.

### 무엇을 선택할까?

- **extrakto**: 로그·빌드 출력의 경로, URL, 해시를 **목록에서 검색하고 선택**하고 싶을 때. 이 글의 기본 추천은 유지한다.
- **tmux-fingers / tmux-thumbs**: 화면에 보이는 문자열을 **힌트 키로 바로 지정**하고 싶을 때. 목록을 훑는 방식과 사용감이 다르다.
- **tmux-copycat**: **정규식으로 찾은 항목을 순회**하는 흐름을 선호할 때. 기본 Copy Mode 검색과의 중복을 따져본다.
- **tmux-fpp / tmux-fzf-url / tmux-urlview**: 파일 경로 또는 URL만 특별히 다루고 싶을 때. 범용 추출 플러그인으로 충분한지 먼저 확인한다.

**예를 들어** `rg -n 'TODO'`나 빌드 명령이 `src/main.rs:42`를 출력했다면, extrakto는 후보 목록에서 해당 경로를 고르게 하고 fingers는 화면의 해당 문자열에 붙은 힌트 키를 입력하게 한다. copycat은 정규식에 매칭된 항목 사이를 이동한다. 이들은 **출력된 텍스트를 선택하는 도구**이며, 선택 결과를 기존 Neovim pane에서 열기까지 자동화하는 것은 별도의 연동 문제다.

**채택 기준:** 이미 Copy Mode와 OSC52를 활용한다면 무작정 설치할 필요는 없다. 실제로 화면의 경로를 다시 타이핑하거나 복사하는 일이 잦을 때 extrakto 또는 fingers 계열 하나부터 시험하는 편이 간결하다.

## 출력 추출 밖의 후보 — 관리·기록·메뉴

extrakto를 계속 쓴다면 다음 후보도 텍스트 추출 도구일 필요는 없다. **tmux 자체를 관리하거나, 작업 출력을 보관하거나, 명령을 메뉴로 고르는 기능**은 다른 빈틈을 채운다. 힌트 선택 방식이 맞지 않는다면 fingers 대신 thumbs를 넣기보다, 추출은 extrakto에 맡기고 다른 축을 살펴보는 편이 낫다.

아래는 **2026-11-17 GitHub API 조회 기준**이다. 전체 생태계 순위가 아니라 앞서 다룬 도구와 추가 후보를 함께 비교한 목록이며, Stars 순으로 정렬했다. 별 개수는 설치 수·활발함·유지보수 품질을 뜻하지 않는다.

| 플러그인 | Stars | 용도 | 도입 판단 |
|---|---:|---|---|
| [tmux-powerline](https://github.com/erikw/tmux-powerline) | 3,844 | Git·시스템 정보 등을 세그먼트로 구성하는 상태바 | 상태바를 교체하려는 경우. 기존 테마·OMT 상태바와 역할 중복 |
| [catppuccin/tmux](https://github.com/catppuccin/tmux) | 3,221 | 테마·상태바 스타일링 | 디자인 변경용. 기존 테마와 설정 우선순위 정리 필요 |
| [tmux-yank](https://github.com/tmux-plugins/tmux-yank) | 3,124 | 선택 영역·명령줄·현재 경로를 OS 클립보드로 복사 | Copy Mode를 자주 쓸 때. OSC52·기존 클립보드 연동과 중복 확인 |
| [tmux-sensible](https://github.com/tmux-plugins/tmux-sensible) | 2,238 | 널리 쓰이는 기본 설정·키 바인딩 묶음 | 직접 구성할 때의 기반. OMT 같은 설정 배포판 위에서는 우선순위 낮음 |
| **[tmux-fzf](https://github.com/sainnhe/tmux-fzf)** | **1,523** | 세션·윈도우·pane·명령·키 바인딩·버퍼를 fzf로 검색·조작 | **관리용 퍼지 UI가 필요하면 우선 체험**. extrakto와 목적이 다름 |
| [tmux-sessionx](https://github.com/omerxx/tmux-sessionx) | 1,408 | 미리보기 있는 세션·윈도우 검색, 생성·이름 변경, zoxide 연동 | 세션 관리에 집중할 때. sesh를 쓴다면 중복이 큼 |
| **[tmux-logging](https://github.com/tmux-plugins/tmux-logging)** | **1,263** | pane 출력 로깅, 현재 화면·보존된 Scrollback을 파일로 저장 | **빌드·배포·SSH 출력 보관이 필요하면 체험** |
| [tmux-open](https://github.com/tmux-plugins/tmux-open) | 744 | Copy Mode에서 선택한 파일·URL 열기, 선택 문구 웹 검색 | 선택 후 바로 여는 흐름을 선호할 때 |
| [tmux-prefix-highlight](https://github.com/tmux-plugins/tmux-prefix-highlight) | 674 | prefix 입력 상태를 상태바에 표시 | 기존 테마나 OMT가 이미 표시한다면 추가 이점이 작음 |
| [tmux-which-key](https://github.com/alexwforsythe/tmux-which-key) | 330 | 계층형 명령 메뉴·매크로를 YAML로 구성 | 단축키 암기 대신 메뉴를 선호할 때. 메뉴 설정은 별도로 관리 |

### tmux-fzf — tmux 관리용 명령 팔레트

**tmux-fzf는 tmux 관리용 명령 팔레트에 가깝다.** extrakto가 출력된 문자열을 찾는다면, tmux-fzf는 세션·윈도우·pane 같은 **tmux 객체**를 찾는다. 이동뿐 아니라 pane 합치기·분리·이동, 키 바인딩 검색·실행, tmux 버퍼 선택도 제공한다. 시스템 클립보드 이력까지 접근하려면 별도 CopyQ가 필요하고, 없으면 tmux 버퍼를 사용한다.

앞선 **2026-11-15 조회에서도** Stars는 1,523, 마지막 Push는 2026-10으로 기록했다. 11월 17일의 후보 표와 마찬가지로 당시 활동 단서이며, 관리 UI의 가치나 유지보수 품질을 그 숫자만으로 판정하지 않는다.

기본 실행 키는 `prefix + F`(`prefix`를 누르고 뗀 뒤 `Shift+f`)다. **OMT의 PathPicker도 같은 키를 사용한다.** 두 기능을 모두 유지하려면 `TMUX_FZF_LAUNCH_KEY`로 tmux-fzf의 키를 바꾼다. 반대로 PathPicker를 쓰지 않는다면, 이후 로드되는 tmux-fzf가 `F`를 맡도록 두면 된다. 충돌한다는 이유만으로 무조건 새 단축키를 만들 필요는 없다.

### tmux-open — 선택한 텍스트를 열기·검색하기

extrakto가 화면에서 **문자열을 골라내는 단계**를 돕는다면, [tmux-open](https://github.com/tmux-plugins/tmux-open)은 **이미 선택한 텍스트에 동작을 적용하는 단계**를 맡는다. Copy Mode에서 파일 경로·URL·오류 문구를 선택한 뒤 사용한다.

```tmux
set -g @open-editor-command 'nvim'
set -g @open-S 'https://www.google.com/search?q='
set -g @plugin 'tmux-plugins/tmux-open'
```

이 세 줄은 **플러그인 선언과 그 플러그인의 옵션 두 개**다. 플러그인만 선언해도 기본 동작은 제공된다. `@open-editor-command`는 에디터를 Neovim으로 고정하고, `@open-S`는 검색 키와 검색 엔진을 명시한다. 옵션은 TPM이 플러그인을 로드하기 전에 둔다.

| Copy Mode에서 누를 키 | 선택한 텍스트에 적용할 동작 |
|---|---|
| `o` | macOS `open` / Linux `xdg-open`으로 파일·URL 열기 |
| `Ctrl+o` | 지정한 에디터로 파일 열기 |
| `Shift+s` | Google에서 검색 |

여기서는 **prefix를 다시 누르지 않는다.** `@open-S`의 `S`는 기능명이 아니라 **바인딩할 대문자 키**다. `Shift+s`는 upstream의 기본 검색 키이기도 하다. `@open-s`로 설정하면 소문자 `s`에 검색을 붙일 수 있지만, 기존 Copy Mode 키와의 충돌은 먼저 확인한다.

`Ctrl+o`는 현재 pane에 에디터 명령과 Enter를 보내는 방식이므로 **셸 프롬프트에서 사용한다.** 다른 프로그램이 실행 중인 pane에 명령을 밀어 넣는 용도로 쓰지 않는다. 선택한 오류 문구를 웹 검색할 때는 토큰·개인정보가 섞이지 않았는지도 확인한다. 키와 검색 설정은 [upstream README](https://github.com/tmux-plugins/tmux-open#configuration) 기준이다.

> **설치와 현재 서버의 로드는 구분한다.** 다운로드 여부와 키 등록 여부는 별개다. 설치 후에도 키가 동작하지 않으면 `tmux source-file ~/.tmux.conf`로 다시 로드하고 `tmux list-keys -T prefix`에서 바인딩을 확인한다. TPM 설치 명령 자체도 로드를 수행하므로 매번 별도 초기화를 추가할 필요는 없다.
{: .prompt-tip }

### tmux-logging — 실패한 작업의 출력을 남기기

**tmux-logging은 pane의 터미널 출력을 텍스트 파일로 보관한다.** 화면 녹화나 명령 재실행 도구가 아니라, 빌드·배포·SSH 작업의 결과를 나중에 분석하거나 공유하기 위한 기록 도구다. 로깅을 미리 켜는 것과 실패한 뒤 남은 출력을 저장하는 것을 구분한다.

| 기능 | 저장 범위 | 기본 키 |
|---|---|---|
| 실시간 로깅 켜기·끄기 | 켠 시점부터 이후 pane 출력 | `prefix` → `Shift+P` |
| 현재 화면 저장 | 지금 pane에 보이는 텍스트 | `prefix` → `Alt+P` |
| Scrollback 저장 | 보존된 과거 출력과 현재 화면 | `prefix` → `Alt+Shift+P` |

기본 저장 위치는 홈 디렉터리(`$HOME`)이며, 파일명에 세션·윈도우·pane·시각이 들어간다. 예를 들어 배포 직전에 로깅을 켜고 종료 후 끄면 진행 과정을 남길 수 있다. 미리 켜지 않았더라도 빌드 실패 직후 Scrollback을 저장하면 남아 있는 오류 메시지를 확보할 수 있다. 기능과 기본 키는 [upstream README](https://github.com/tmux-plugins/tmux-logging#readme) 기준이다.

#### 가끔 저장한다면 플러그인 없이 capture-pane

한 번 출력 파일을 남기는 정도라면 tmux 내장 [`capture-pane`](https://man.openbsd.org/tmux#capture-pane)으로 충분하다. **저장하려는 tmux pane 안의 셸에서** 실행한다.

```sh
tmux capture-pane -p -S - > pane-output.txt
```

`-p`는 캡처 결과를 표준 출력으로 보내고, `-S -`는 보존된 히스토리의 시작부터 캡처한다. 끝은 기본값인 현재 화면의 마지막 줄까지다. 따라서 **남아 있는 Scrollback과 현재 화면**이 현재 디렉터리의 `pane-output.txt`에 저장된다. `>`는 같은 이름의 기존 파일을 덮어쓰므로 보관할 파일이 있다면 다른 이름을 쓴다.

이 명령은 **실행 시점의 스냅샷**이지 이후 출력을 계속 기록하는 로깅이 아니다. 플러그인과 내장 명령 모두 tmux가 보존 중인 과거 출력만 저장할 수 있으며, `history-limit`을 넘어 버려진 줄은 복구하지 못한다. 가끔 저장하면 내장 명령, 반복해서 저장하거나 실시간 기록을 켜고 끄려면 tmux-logging을 선택한다.

> **로그에도 민감정보가 남는다.** 출력에 토큰·개인정보가 포함되면 로그 파일에도 기록될 수 있다. 상시 로깅보다 필요한 작업에서만 켜고, 저장 위치·보관 기간·공유 전 내용을 확인한다.
{: .prompt-warning }

### 메뉴가 필요하다면 tmux-which-key

tmux-which-key는 화면 문자열에 힌트를 붙이는 fingers 계열과 다르다. “윈도우 → 이동”, “pane → 레이아웃”처럼 **명령을 계층형 메뉴에서 고르는 방식**이다. 다만 현재 키 설정을 자동으로 전부 설명해주는 도구라기보다는, 원하는 명령과 매크로를 메뉴로 구성하는 도구다.

**선택 기준은 미해결 작업이다.** 관리 동작을 fuzzy 검색하고 싶으면 tmux-fzf, 출력 보관이 필요하면 tmux-logging, 명령을 메뉴로 정리하고 싶으면 tmux-which-key를 검토한다. extrakto로 추출이 충분하다면 추출 플러그인은 더 늘리지 않는다.

---

## 플러그인을 얹는 대신 설정 배포판을 받는다면

[Oh My Tmux!](./2026-07-12-oh-my-tmux.md)는 플러그인이 아니라 **완성형 설정 배포판**이다. 필요한 조각을 직접 고르는 방식과, 상태바·키맵·기본 동작을 한꺼번에 상속하는 방식의 차이다. 기존 설정을 세밀하게 조립했다면 중복과 재조정 비용을 먼저 보고, 완성된 기본 환경을 원한다면 대안으로 검토한다. 채택 판단·상속 범위와 2파일 구조, chezmoi로 upstream을 고정하는 방법은 OMT 글에서 함께 다룬다.

---

## 세션 탐색의 두 형태 — TPM 플러그인과 외부 CLI

**2026-11-17 보강.** [sesh](https://github.com/joshmedeski/sesh)는 tmux를 대체하지 않는 **tmux 전용 세션 관리자**지만, TPM 플러그인이 아니라 별도로 설치하는 CLI다. tmux 안에서는 세션을 전환하고, 밖에서는 세션에 접속할 수 있다. Homebrew는 그 실행 파일을 설치·업데이트하는 수단이지, “tmux와 무관한 도구”라는 뜻이 아니다.

앞의 [tmux-sessionx](https://github.com/omerxx/tmux-sessionx)는 **TPM 플러그인 형태로 제공하는 세션·윈도우 선택기**이고, sesh는 **셸·스크립트에서도 호출할 수 있는 독립 프로그램**이다. 둘 다 세션 탐색·생성에서 역할이 겹친다. sessionx의 미리보기는 선택한 세션·윈도우의 화면 내용이지 **pane별 CPU·메모리 사용량 모니터**가 아니다.

tmux-fzf가 세션·윈도우·pane·버퍼를 두루 다루는 **tmux 객체 관리**에 가깝다면, sesh는 기존 세션과 방문한 디렉터리를 연결해 **프로젝트 사이를 이동하는 흐름**에 집중한다. 이미 tmux-fzf로 이동이 충분하다면 sesh를 더할 필요는 없다. 프로젝트 폴더별로 세션을 만들고 반복해서 오갈 때 도입할 이유가 생긴다.

### sessionx와 sesh — 설치 형태는 달라도 선택기는 겹친다

**2026-11-18 보강.** “TPM 플러그인인가, 외부 CLI인가”는 설치·호출 방식의 차이지, 두 도구를 모두 넣어야 한다는 근거는 아니다. 실제 선택 기준은 **어떤 대상을 찾고, 선택한 뒤 무엇을 할 것인가**다.

| 비교축 | tmux-sessionx | sesh |
|---|---|---|
| 중심 흐름 | 세션·윈도우 검색·관리 | 프로젝트 세션 생성·접속 |
| 탐색·관리 UI | fzf 미리보기·이름 변경·종료 | 내장 picker 또는 외부 선택기 |
| 디렉터리 후보 | 경로 탐색·zoxide·즐겨찾기 | tmux·zoxide·설정 세션 |
| 새 작업 환경 | tmuxinator 연동 | 자체 시작 명령·윈도우 설정 |
| 주 진입점 | tmux 키 바인딩 | tmux 키·셸·스크립트 |

따라서 **“미리보기와 세션 종료는 sessionx, 전환만 sesh”처럼 나누면 현재 기능을 과소평가**한다. sesh의 내장 picker도 미리보기·윈도우 표시·세션 종료를 지원한다. 기능 기준은 [sessionx 공식 문서](https://github.com/omerxx/tmux-sessionx)와 [sesh 공식 문서](https://github.com/joshmedeski/sesh), 내장 picker의 최근 변화는 [sesh 개발자의 2026년 가을 소개](https://www.joshmedeski.com/posts/whats-new-with-sesh-fall-2026/)에서 확인할 수 있다.

### 이 구성에서는 sessionx 선언을 제외한다

프로젝트별 세션 생성·접속은 sesh에 맡기고, tmux 객체 전반의 검색·조작은 tmux-fzf에 맡긴다. 이 역할 분담에서는 **세션 선택기를 하나 더 유지할 이유가 작아 sessionx의 플러그인 선언을 제외한다.** sessionx가 나쁘거나 개발이 중단돼서가 아니라, 같은 목적의 진입점을 줄이는 선택이다.

반대로 sessionx 팝업에서 이름 변경·종료·윈도우 탐색을 처리하는 방식이 더 편하면 sessionx를 유지해도 된다. 이미 둘을 설치했다는 이유로 급하게 지우거나, 기능이 일부 다르다는 이유로 반드시 함께 둘 필요는 없다.

공개 사용기도 보조 근거로만 본다. [Tomasz Wostal의 sesh 사용기](https://wostal.eu/blog/tools-02-sesh-and-tmux/)는 프로젝트별 이름·시작 명령·윈도우를 고정해 작업 환경을 반복 구성하는 수고를 줄였다고 설명한다. 이는 sesh의 활용 사례이지 **sessionx보다 낫다는 커뮤니티 합의**는 아니다. 직접 비교 후기만으로 우열을 단정하기보다 내 작업에서 중복되는 경로를 확인한다.

sesh는 `sesh connect ~/projects/api`처럼 목적지를 지정하거나, `sesh picker`에서 목록을 고른다. 현재 tmux 세션·zoxide 디렉터리 이력·등록한 설정 세션이 후보이며, 내장 picker에는 fzf가 필수가 아니다. `prefix + T`도 자동 등록되는 키가 아니라 사용자가 연결하는 바인딩이다. **목록의 출처, 새 세션 생성과 기존 세션 전환의 차이, 설정 없이 시작하는 방법**은 기존 [sesh — 즉석 tmux 세션 전환](./2026-07-12-sesh-tmux-session-picker.md)에서 이어간다.

고정 레이아웃의 재현이 목적이면 [세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)의 smug·tmuxp·tmuxinator와 비교한다. `tmux-resurrect`/`continuum`의 저장·복원과도 다른 문제다.

### tmuxinator·fzf-marks는 무엇을 더하나

둘은 sessionx에 포함된 필수 기능이 아니라 **필요할 때 연결하는 별도 도구**다. sessionx의 tmuxinator·fzf-marks 모드는 기본적으로 꺼져 있으며, 단순히 sessionx를 설치했다고 함께 사용되는 것은 아니다.

- **[tmuxinator](https://github.com/tmuxinator/tmuxinator): 작업 환경의 설계도.** YAML에 프로젝트 경로, 윈도우·pane 배치와 실행 명령을 정의한다. 예를 들어 프로젝트를 시작할 때 편집기·개발 서버·로그용 윈도우를 함께 띄운다. sessionx는 이 프로젝트 정의를 골라 실행하는 진입점이 될 수 있다. 실행 중 상태를 되살리는 resurrect와는 다르고, sesh의 시작 명령·윈도우 구성과는 일부 겹친다.
- **[fzf-marks](https://github.com/urbainvaes/fzf-marks): 디렉터리 즐겨찾기.** 사용자가 이름과 경로를 직접 등록하고 fzf로 찾아 이동하는 셸 플러그인이다. zoxide가 방문 이력을 바탕으로 경로를 추천한다면, fzf-marks는 명시적으로 저장한 즐겨찾기를 읽는다. sessionx는 이 목록을 세션 생성·접속 대상으로 활용할 수 있다.

고정된 복잡한 작업 배치를 반복해서 띄워야 한다면 tmuxinator를, 방문 이력과 별개로 이름 붙인 디렉터리 목록을 관리해야 한다면 fzf-marks를 검토한다. **sesh와 zoxide만으로 프로젝트 진입이 충분하다면 추가할 필요는 없다.** sessionx의 설치·키·옵션은 [devkit tmux 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md)에 맡기고, 여기서는 도구를 더할 이유와 중복을 구분한다.

### 개발 이력도 기능 중복과 별도로 본다

**2026-11-18 GitHub 기본 브랜치 조회 기준**, 둘 다 최근 기능 추가나 수정이 반영됐다. 다만 확인한 최근 이력에서는 sesh의 변경 주기가 더 촘촘했다.

| 프로젝트 | 최근 커밋 | 확인한 기능 추가·수정 |
|---|---|---|
| [tmux-sessionx](https://github.com/omerxx/tmux-sessionx/commits/main/) | 2026-10-21 | tmuxinator 인자 옵션 추가, fzf-marks로 만든 세션의 전환 버그 수정, Nix 경고 수정 |
| [sesh](https://github.com/joshmedeski/sesh/commits/main/) | 2026-11-17 | 최신 커밋은 README 갱신. 11월 16일 백그라운드 세션 생성 옵션 추가, 15일 경로 처리 버그 수정 |

sesh의 [v2.34.0 릴리스](https://github.com/joshmedeski/sesh/releases/tag/v2.34.0)는 2026-10-25에 공개됐다. 이 날짜들은 확인 시점의 활동 신호이지 유지보수 품질이나 앞으로의 개발을 보장하는 지표는 아니다. **sessionx가 방치돼서 교체해야 하는 상황으로 해석하지 않는다.**

---

## 무엇을 남길까 — 기능마다 주인을 하나씩

- 직접 구성할 때의 기본값 묶음은 sensible, 저장·복원은 resurrect, 자동 저장까지 필요하면 continuum을 고른다. Vim/Neovim 이동 통합은 에디터를 함께 쓰는 경우에만 더한다.
- 상태바는 테마 하나를 먼저 고른다. 클립보드는 OSC52로 충분하면 yank를 생략하고, 출력 문자열 추출이 반복되는 경우 extrakto나 힌트 계열 하나를 시험한다.
- 이 글의 구성에서는 **프로젝트 진입은 sesh, tmux 객체 전반의 관리는 tmux-fzf**에 맡기고 sessionx는 제외한다. 이미 익숙한 선택기가 충분하다면 이 조합을 그대로 따라 할 필요도 없다.
- 고정 작업 배치의 선언형 생성, 실행 중 배치의 저장·복원, 프로젝트 사이의 빠른 전환은 서로 다른 요구다. 이름이 비슷한 도구보다 미해결 작업을 기준으로 선택한다.

**범용 최종 `.tmux.conf`와 옵션 표는 [devkit tmux 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md)를 정본으로 둔다.** 이 글의 예제를 모두 합치는 것이 권장 설정은 아니다. 테마와 continuum의 로드 순서, 기존 키와의 충돌, OMT의 TPM 연동처럼 실제로 선택한 조합에 필요한 조건만 적용한다.

더 찾고 싶다면 [awesome-tmux](https://github.com/rothgar/awesome-tmux)에서 플러그인·설정·아티클을 탐색할 수 있다. 기본 플러그인 여럿은 [`tmux-plugins`](https://github.com/tmux-plugins) 조직에 모여 있지만 tmux 본체와 동일한 지원 범위를 뜻하지는 않는다. 프로젝트별 생성·전환은 [sesh 글](./2026-07-12-sesh-tmux-session-picker.md), 고정 레이아웃 재현은 [부트스트랩 글](./2026-02-21-tmux-bootstrap.md)로 이어진다.
