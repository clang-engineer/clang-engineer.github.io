---
title       : "필수 그다음 — 요즘 얹는 tmux 플러그인 (테마·추출·퍼지)"
description : "TPM 기반 기본 구성 위에 얹는 층. catppuccin으로 상태바 현대화(방치된 themepack 대체), tmux-yank·extrakto로 복사·추출, tmux-fzf 계열 퍼지까지 — 별 개수·정착도를 실측 근거와 함께."
date        : 2026-07-11 16:00:00 +0900
updated     : 2026-11-17 16:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [plugin, catppuccin, extrakto]
pin         : false
hidden      : false
---

> 이 글은 [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)의 **2단계(플러그인으로 확장) > 쓰기** 연장선이다. TPM 설치와 **TPM 기반 기본 구성**(sensible·resurrect·continuum·vim-tmux-navigator)은 [tmux 설정과 TPM 플러그인](./2025-11-17-tmux-tpm.md)에서 이미 다뤘다. 이 글은 그 **기본 구성 다음 층** — 요즘 실력자들이 얹는 플러그인이다.
{: .prompt-tip }

TPM 기반 기본 구성은 "tmux를 쓸 만하게" 만든다. 그 위에 얹는 층은 취향과 워크플로에 가깝다 — 상태바를 현대적으로 바꾸고, 복사·붙여넣기 마찰을 줄이고, 화면의 텍스트를 퍼지로 집어낸다. [awesome-tmux](https://github.com/rothgar/awesome-tmux) 목록은 방대하지만, 이 글은 **별 개수와 실제 정착도**를 근거로 "지금 얹을 만한 것"만 추렸다.

## 한눈에 — 무엇을 왜 얹나

| 축 | 1순위 | 별 | 왜 |
|---|---|---|---|
| 테마·상태바 | **catppuccin/tmux** | 3.1k | 현대 de-facto 표준. 블로그가 쓰던 themepack은 2019 방치 |
| 복사·클립보드 | **tmux-yank** | 3.1k | 선택→시스템 클립보드 브리지의 표준 |
| 추출 | **extrakto** | 1.1k | 화면의 path/URL/git-rev를 퍼지로 집어내는 "killer plugin" |
| 퍼지 검색 | tmux-fzf | 1.5k | 세션·윈도우·키바인딩을 fzf UI로 (정착 후기는 얇음) |

> **별 개수 ≠ 활발함, 별개로 본다.** 별은 높은데 커밋이 뜸한 게 두 종류다 — resurrect·sensible·yank처럼 **성숙·안정이라 손댈 게 없는 것**(여전히 표준)과, themepack처럼 **진짜 방치된 것**. 아래에서 이 둘을 구분해 표기했다. (별 개수·최근 커밋은 2026-07 실측.)
{: .prompt-info }

---

## 1. 상태바 현대화 — themepack에서 catppuccin으로

가장 갭이 큰 자리다. 기존 [플러그인 글](./2025-11-17-tmux-tpm.md)이 쓰는 `jimeh/tmux-themepack`(1.8k⭐)은 **2019년 이후 방치**됐다. 지금 상태바 테마의 사실상 표준은 **catppuccin/tmux**(3.1k⭐, 활발)다 — Neovim·bat·lazygit 등 앱 전반이 같은 팔레트로 통일되는 흐름의 tmux 쪽 조각이다.

```tmux
set -g @plugin 'catppuccin/tmux#v2.1.3'   # 태그 고정 권장 (v2는 config API가 바뀜)
set -g @catppuccin_flavor 'mocha'         # latte / frappe / macchiato / mocha
```

> **catppuccin v2는 상태바를 직접 조립하는 구조다.** v1과 달리 세그먼트를 `status-right`에 명시적으로 꽂아야 한다. 플러그인 로드 뒤 `set -g status-right "#{E:@catppuccin_status_application}#{E:@catppuccin_status_session}"` 식으로 원하는 모듈만 붙인다. 세부 모듈은 저장소 README 참고. 그래서 themepack보다 손이 더 가지만, 그만큼 세밀하게 고를 수 있다.
{: .prompt-info }

### 대안 테마 순위

| 순위 | 플러그인 | 별 | 성격 |
|---|---|---|---|
| 1 | **catppuccin/tmux** | 3.1k | 현대 de-facto. 유일 불만은 "low-contrast/유행" 취향 이슈 |
| 2 | dracula/tmux | 847 | 배터리·CPU 세그먼트 내장. 올인원 선호 시 |
| 3 | tokyo-night-tmux | 566 | 니치하나 활발 |
| 4 | egel/tmux-gruvbox | 695 | gruvbox 팬 |
| - | erikw/tmux-powerline | 3.8k | 별은 최다지만 **폰트 패칭·정렬 마찰**로 테마 플러그인에 밀리는 추세 |
| - | jimeh/tmux-themepack | 1.8k | **2019 방치** — 블로그의 현 설정, 교체 대상 |

powerline은 별이 제일 높지만, Nerd Font 패칭과 세그먼트 정렬 손질이 번거로워 catppuccin류 "설정 한두 줄" 테마로 이탈하는 흐름이 실재한다. **별 개수만 보고 고르면 오판**하는 대표 사례다.

> 💡 **유틸 세트는 테마에 흡수되는 중.** 배터리(tmux-battery 569⭐)·CPU(tmux-cpu 533⭐)·prefix-highlight(669⭐)를 개별 플러그인으로 얹던 시절이 있었지만, catppuccin·dracula가 이걸 **테마 세그먼트로 내장**하면서 개별 설치 필요가 줄었다. HN 기조도 "플러그인 많으면 buggy, 미니멀하게"라, 테마 하나로 세그먼트를 해결하는 쪽이 요즘 결이다.
{: .prompt-tip }

---

## 2. 복사·추출 — 선택을 손에 넣기

tmux 안에서 텍스트를 시스템 클립보드로 빼거나, 화면에 뜬 경로·URL을 집어내는 마찰을 줄이는 층이다. 기존 [클립보드 트러블슈팅 글](./2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md)이 "왜 안 붙나"를 다뤘다면, 여기는 "더 편하게"다.

### tmux-yank — 클립보드 브리지의 표준

```tmux
set -g @plugin 'tmux-plugins/tmux-yank'
```

복사 모드에서 선택한 텍스트를 **시스템 클립보드**로 바로 보낸다(`y`). macOS `pbcopy`, Linux `xclip`/`xsel`/`wl-copy`를 알아서 감지한다. 3.1k⭐, 커밋은 2023에서 멈췄지만 **기능이 완결돼 손댈 게 없는** 쪽 — 여전히 표준이고 불만도 거의 없다.

> **OSC52를 쓴다면 tmux-yank는 대체로 불필요하다.** 둘은 "선택 → 시스템 클립보드"라는 **같은 목적을 다른 수단**으로 푼다 — tmux-yank는 `pbcopy`/`xclip`를 부르고, OSC52는 터미널 이스케이프 시퀀스로 넘긴다. [클립보드 트러블슈팅 글](./2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md)의 결론대로 `set -g set-clipboard on` 한 줄이면 플러그인 없이 해결되므로, **OSC52가 되는(대부분의 모던) 터미널이면 yank는 안 넣어도 된다.** 반대로 OSC52를 지원하지 않는 터미널·환경에선 yank의 `pbcopy`/`xclip` 경로가 폴백이 된다. 뒤의 **extrakto**는 목적이 달라(화면 텍스트 추출) 이 중복과 무관하다.
{: .prompt-tip }

### extrakto — 화면 텍스트 퍼지 추출

```tmux
set -g @plugin 'laktak/extrakto'
# 기본 바인딩: prefix + tab
```

이 층의 진짜 물건. `prefix + tab`을 누르면 **현재 화면(스크롤백 포함)의 단어·경로·URL·git 해시**를 fzf로 띄우고, 고른 걸 커서에 삽입하거나 클립보드로 복사한다. 방금 로그에 뜬 파일 경로나 커밋 해시를 손으로 다시 타이핑할 일이 사라진다. 1.1k⭐, 활발, "killer plugin" 호평이 뚜렷하다.

---

## 3. 화면 출력 탐색 — 정규식·힌트·퍼지 선택 비교

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

### 무엇을 선택할까?

- **extrakto**: 로그·빌드 출력의 경로, URL, 해시를 **목록에서 검색하고 선택**하고 싶을 때. 이 글의 기본 추천은 유지한다.
- **tmux-fingers / tmux-thumbs**: 화면에 보이는 문자열을 **힌트 키로 바로 지정**하고 싶을 때. 목록을 훑는 방식과 사용감이 다르다.
- **tmux-copycat**: **정규식으로 찾은 항목을 순회**하는 흐름을 선호할 때. 기본 Copy Mode 검색과의 중복을 따져본다.
- **tmux-fpp / tmux-fzf-url / tmux-urlview**: 파일 경로 또는 URL만 특별히 다루고 싶을 때. 범용 추출 플러그인으로 충분한지 먼저 확인한다.

**예를 들어** `rg -n 'TODO'`나 빌드 명령이 `src/main.rs:42`를 출력했다면, extrakto는 후보 목록에서 해당 경로를 고르게 하고 fingers는 화면의 해당 문자열에 붙은 힌트 키를 입력하게 한다. copycat은 정규식에 매칭된 항목 사이를 이동한다. 이들은 **출력된 텍스트를 선택하는 도구**이며, 선택 결과를 기존 Neovim pane에서 열기까지 자동화하는 것은 별도의 연동 문제다.

### 다른 축: tmux-fzf

[tmux-fzf](https://github.com/sainnhe/tmux-fzf)는 화면의 파일 경로 추출보다는 **세션·윈도우·pane·키 바인딩 등 tmux 객체를 fzf로 선택**하는 도구다. 출력 텍스트 추출 플러그인과 같은 범주로 묶지 않는다. GitHub Stars **1,523**, 마지막 Push **2026-10** (같은 조회 기준).

**채택 기준:** 이미 Copy Mode와 OSC52를 활용한다면 무작정 설치할 필요는 없다. 실제로 화면의 경로를 다시 타이핑하거나 복사하는 일이 잦을 때 extrakto 또는 fingers 계열 하나부터 시험하는 편이 간결하다.

## 4. 출력 추출 밖의 인기 플러그인 — 관리·기록·메뉴

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

### 먼저 시험할 두 가지

**tmux-fzf는 tmux 관리용 명령 팔레트에 가깝다.** extrakto가 출력된 문자열을 찾는다면, tmux-fzf는 세션·윈도우·pane 같은 **tmux 객체**를 찾는다. 이동뿐 아니라 pane 합치기·분리·이동, 키 바인딩 검색·실행, tmux 버퍼 선택도 제공한다. 시스템 클립보드 이력까지 접근하려면 별도 CopyQ가 필요하고, 없으면 tmux 버퍼를 사용한다.

기본 실행 키는 `prefix + F`다. **OMT의 PathPicker도 같은 키를 사용하므로**, 함께 쓴다면 tmux-fzf의 `TMUX_FZF_LAUNCH_KEY`를 다른 키로 지정해야 한다.

**tmux-logging은 출력 보관이 필요할 때 켠다.** 로깅 시작 이후의 출력 기록과, 이미 남아 있는 화면·Scrollback 저장을 구분한다. 과거 출력은 tmux가 보존 중인 범위만 저장할 수 있으며, `history-limit`을 넘어 버려진 줄은 복구하지 못한다.

> **로그에도 민감정보가 남는다.** 출력에 토큰·개인정보가 포함되면 로그 파일에도 기록될 수 있다. 상시 로깅보다 필요한 작업에서만 켜고, 저장 위치·보관 기간·공유 전 내용을 확인한다.
{: .prompt-warning }

### 메뉴가 필요하다면 tmux-which-key

tmux-which-key는 화면 문자열에 힌트를 붙이는 fingers 계열과 다르다. “윈도우 → 이동”, “pane → 레이아웃”처럼 **명령을 계층형 메뉴에서 고르는 방식**이다. 다만 현재 키 설정을 자동으로 전부 설명해주는 도구라기보다는, 원하는 명령과 매크로를 메뉴로 구성하는 도구다.

**선택 기준은 미해결 작업이다.** 관리 동작을 fuzzy 검색하고 싶으면 tmux-fzf, 출력 보관이 필요하면 tmux-logging, 명령을 메뉴로 정리하고 싶으면 tmux-which-key를 검토한다. extrakto로 추출이 충분하다면 추출 플러그인은 더 늘리지 않는다.

---

## 얹는 게 아니라 통째로 받기 — Oh My Tmux! (다른 축)

지금까지가 "TPM 기반 기본 구성 위에 취향껏 **얹는**" 이야기였다면, 정반대 노선도 있다 — 잘 짜인 `.tmux.conf`를 **통째로 받는** 것. **Oh My Tmux!**(`gpakosz/.tmux`, "oh-my-zsh의 tmux판")가 이 카테고리의 사실상 유일한 강자다. **25.2k⭐**로 이 글의 어떤 플러그인보다 별이 많지만 성격이 다르다 — 플러그인이 아니라 **완성형 config 배포판**이다.

구조는 2파일: `.tmux.conf`(본체, 건드리지 않음) + `.tmux.conf.local`(내 override). 세련된 powerline 상태바, **SSH/Mosh 접속 시 원격 호스트·유저 자동 표시**(로컬일 땐 숨김), prefix·mouse·synchronize 토글 표시등을 즉시 준다. 같은 카테고리에 samoshkin/tmux-config(2.3k⭐, 2024 방치)·tony/tmux-config(1.9k⭐, 예제 성격)도 있지만 살아있는 건 사실상 OMT뿐이다.

**그런데 왜 "얹지 않았나".** 이 블로그의 노선은 TPM 기반 기본 구성에서 시작해 필요한 것만 손으로 얹는 **hand-craft**다. 완성형 배포판을 상속하면 (1) 안 쓰는 기능까지 딸려오고, (2) 손수 다듬은 설정을 OMT의 `.tmux.conf.local` override 방식에 다시 맞춰야 하며, (3) 무엇보다 **스스로 조립하며 배우는 과정**이 사라진다. oh-my-zsh를 통째로 쓰다 결국 자기 zsh를 직접 짜게 되는 것과 같은 흐름이다.

> 💡 **채택보다 "레퍼런스로 훔치기".** OMT의 `.tmux.conf`를 열어 탐나는 아이디어만 내 config로 가져오는 게 실속 있다 — 특히 **SSH/Mosh 접속 시 원격 호스트·유저를 자동 표시하는 상태바**와 **prefix/mouse/synchronize-panes 토글 표시등**. 통째 채택은 이미 curate한 config가 있다면 오히려 후퇴다.
{: .prompt-tip }

> 💡 **그래도 채택한다면 — chezmoi로 규율 있게.** OMT를 통째로 쓰기로 했다면, [chezmoi](https://chezmoi.io) 기준 정공법은 이렇다: 본체(`.tmux.conf`)는 `.chezmoiexternal`로 **upstream을 특정 커밋에 고정해** 가져오고(재현 가능·`apply` 때 예고 없는 변경 차단), `~/.tmux.conf`는 그 파일의 심링크, 내 커스텀은 `.tmux.conf.local` **한 파일로 격리**한다(플러그인도 여기서 `set -g @plugin`으로 선언 — tpm 설치·갱신까지 OMT가 대신 한다). 이러면 "완성형 배포판 상속"의 약점(안 쓰는 기능·upstream 추적 공백)을 상당 부분 상쇄한다 — 규율 있는 채택은 naive한 통째 상속과 다르다.
{: .prompt-tip }

---

## 얹지 *않은* 것 — sesh는 다른 축

인기 급상승 중인 **sesh**(joshmedeski, 2.7k⭐, 활발)를 여기 넣지 않았다. fzf+zoxide로 세션을 온디맨드 전환하는 **모멘텀 툴**이지만, 이건 TPM 플러그인이 아니라 tmux *밖*의 **세션 매니저**다 — resurrect가 *떠 있던* 세션을 저장·복원한다면, sesh는 세션을 처음부터 띄우고 오간다. 그래서 결이 맞는 자리는 이 글이 아니라 [3단계 세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)이다. smug·tmuxp·tmuxinator와 같은 축에서 비교하는 게 맞다.

---

## 얹은 뒤 `.tmux.conf` (기본 구성 + 이 글의 층)

```tmux
# --- TPM ---
set -g @plugin 'tmux-plugins/tpm'

# --- TPM 기반 기본 구성 (tmux-tpm 글) ---
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @plugin 'christoomey/vim-tmux-navigator'

# --- 필수 그다음 (이 글) ---
set -g @plugin 'catppuccin/tmux#v2.1.3'    # 상태바 (themepack 대체)
set -g @plugin 'tmux-plugins/tmux-yank'    # 선택 → 시스템 클립보드
set -g @plugin 'laktak/extrakto'           # prefix+tab: 화면 텍스트 퍼지 추출

# --- catppuccin ---
set -g @catppuccin_flavor 'mocha'
# status-right 세그먼트 조립은 README 참고

# --- resurrect / continuum ---
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

# --- Initialize TPM (must be last) ---
run '~/.tmux/plugins/tpm/tpm'
```

`prefix + I`로 설치하면 끝. 상태바가 catppuccin으로 바뀌고, 복사 모드 `y`가 시스템 클립보드로 나가고, `prefix + tab`으로 화면 텍스트를 집어낼 수 있다.

> 📎 **더 찾기** · [awesome-tmux](https://github.com/rothgar/awesome-tmux) — 위 너머의 플러그인·설정·아티클 카테고리별 인덱스. 세션 매니저(sesh 등)를 찾는다면 [부트스트랩 글](./2026-02-21-tmux-bootstrap.md)로.
{: .prompt-tip }
