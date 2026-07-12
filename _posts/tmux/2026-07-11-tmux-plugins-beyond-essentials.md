---
title       : "필수 그다음 — 요즘 얹는 tmux 플러그인 (테마·추출·퍼지)"
description : "tmux-tpm의 필수 6종 위에 얹는 층. catppuccin으로 상태바 현대화(방치된 themepack 대체), tmux-yank·extrakto로 복사·추출, tmux-fzf 계열 퍼지까지 — 별 개수·정착도를 실측 근거와 함께."
date        : 2026-07-11 16:00:00 +0900
updated     : 2026-07-12 11:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [plugin, catppuccin, extrakto]
pin         : false
hidden      : false
---

> 이 글은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)의 **2단계(플러그인으로 확장) > 쓰기** 연장선이다. tpm 설치와 **필수 6종**(sensible·resurrect·continuum·vim-tmux-navigator)은 [tmux 설정 & 플러그인 설명](/posts/tmux/2025-11-17-tmux-tpm/)에서 이미 다뤘다. 이 글은 그 **필수 그다음 층** — 요즘 실력자들이 얹는 플러그인이다.
{: .prompt-tip }

필수 6종은 "tmux를 쓸 만하게" 만든다. 그 위에 얹는 층은 취향과 워크플로에 가깝다 — 상태바를 현대적으로 바꾸고, 복사·붙여넣기 마찰을 줄이고, 화면의 텍스트를 퍼지로 집어낸다. [awesome-tmux](https://github.com/rothgar/awesome-tmux) 목록은 방대하지만, 이 글은 **별 개수와 실제 정착도**를 근거로 "지금 얹을 만한 것"만 추렸다.

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

가장 갭이 큰 자리다. 기존 [플러그인 글](/posts/tmux/2025-11-17-tmux-tpm/)이 쓰는 `jimeh/tmux-themepack`(1.8k⭐)은 **2019년 이후 방치**됐다. 지금 상태바 테마의 사실상 표준은 **catppuccin/tmux**(3.1k⭐, 활발)다 — Neovim·bat·lazygit 등 앱 전반이 같은 팔레트로 통일되는 흐름의 tmux 쪽 조각이다.

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

tmux 안에서 텍스트를 시스템 클립보드로 빼거나, 화면에 뜬 경로·URL을 집어내는 마찰을 줄이는 층이다. 기존 [클립보드 트러블슈팅 글](/posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul/)이 "왜 안 붙나"를 다뤘다면, 여기는 "더 편하게"다.

### tmux-yank — 클립보드 브리지의 표준

```tmux
set -g @plugin 'tmux-plugins/tmux-yank'
```

복사 모드에서 선택한 텍스트를 **시스템 클립보드**로 바로 보낸다(`y`). macOS `pbcopy`, Linux `xclip`/`xsel`/`wl-copy`를 알아서 감지한다. 3.1k⭐, 커밋은 2023에서 멈췄지만 **기능이 완결돼 손댈 게 없는** 쪽 — 여전히 표준이고 불만도 거의 없다.

> **OSC52를 쓴다면 tmux-yank는 대체로 불필요하다.** 둘은 "선택 → 시스템 클립보드"라는 **같은 목적을 다른 수단**으로 푼다 — tmux-yank는 `pbcopy`/`xclip`를 부르고, OSC52는 터미널 이스케이프 시퀀스로 넘긴다. [클립보드 트러블슈팅 글](/posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul/)의 결론대로 `set -g set-clipboard on` 한 줄이면 플러그인 없이 해결되므로, **OSC52가 되는(대부분의 모던) 터미널이면 yank는 안 넣어도 된다.** 반대로 OSC52를 지원하지 않는 터미널·환경에선 yank의 `pbcopy`/`xclip` 경로가 폴백이 된다. 뒤의 **extrakto**는 목적이 달라(화면 텍스트 추출) 이 중복과 무관하다.
{: .prompt-tip }

### extrakto — 화면 텍스트 퍼지 추출

```tmux
set -g @plugin 'laktak/extrakto'
# 기본 바인딩: prefix + tab
```

이 층의 진짜 물건. `prefix + tab`을 누르면 **현재 화면(스크롤백 포함)의 단어·경로·URL·git 해시**를 fzf로 띄우고, 고른 걸 커서에 삽입하거나 클립보드로 복사한다. 방금 로그에 뜬 파일 경로나 커밋 해시를 손으로 다시 타이핑할 일이 사라진다. 1.1k⭐, 활발, "killer plugin" 호평이 뚜렷하다.

---

## 3. 퍼지 검색·힌트 (선택 — 정착 근거는 얇음)

여기부터는 별은 있으나 **실제 정착 후기가 얇은** 영역이다. 소개는 하되 강한 추천은 근거가 부족하니, 겪어 보고 판단하는 걸 권한다.

| 플러그인 | 별 | 무엇 | 유의 |
|---|---|---|---|
| sainnhe/tmux-fzf | 1.5k | 세션·윈도우·패널·키바인딩을 fzf 메뉴로 | 별은 최다지만 이름 충돌로 실 sentiment 추적이 어려움 |
| Morantron/tmux-fingers | 1.4k | 화면 텍스트에 힌트 라벨을 띄워 점프(vimium 류) | 활발하나 언급 상당수가 저자 본인 |
| fcsonline/tmux-thumbs | 1.1k | fingers의 Rust 구현, 빠름 | 2023 이후 stale, "써볼게" 톤이 다수 |
| wfxr/tmux-fzf-url | 720 | 화면의 URL만 모아 fzf로 열기 | 활발하나 정착 후기 스레드 거의 없음 |

화면 텍스트 추출이 목적이면 **extrakto(위) 하나로 대부분 해결**된다. fingers/thumbs는 "마우스 없이 클릭할 지점으로 점프" 성격이라 목적이 다르다.

---

## 얹는 게 아니라 통째로 받기 — Oh My Tmux! (다른 축)

지금까지가 "필수 6종 위에 취향껏 **얹는**" 이야기였다면, 정반대 노선도 있다 — 잘 짜인 `.tmux.conf`를 **통째로 받는** 것. **Oh My Tmux!**(`gpakosz/.tmux`, "oh-my-zsh의 tmux판")가 이 카테고리의 사실상 유일한 강자다. **25.2k⭐**로 이 글의 어떤 플러그인보다 별이 많지만 성격이 다르다 — 플러그인이 아니라 **완성형 config 배포판**이다.

구조는 2파일: `.tmux.conf`(본체, 건드리지 않음) + `.tmux.conf.local`(내 override). 세련된 powerline 상태바, **SSH/Mosh 접속 시 원격 호스트·유저 자동 표시**(로컬일 땐 숨김), prefix·mouse·synchronize 토글 표시등을 즉시 준다. 같은 카테고리에 samoshkin/tmux-config(2.3k⭐, 2024 방치)·tony/tmux-config(1.9k⭐, 예제 성격)도 있지만 살아있는 건 사실상 OMT뿐이다.

**그런데 왜 "얹지 않았나".** 이 블로그의 노선은 필수 6종에서 시작해 필요한 것만 손으로 얹는 **hand-craft**다. 완성형 배포판을 상속하면 (1) 안 쓰는 기능까지 딸려오고, (2) 손수 다듬은 설정을 OMT의 `.tmux.conf.local` override 방식에 다시 맞춰야 하며, (3) 무엇보다 **스스로 조립하며 배우는 과정**이 사라진다. oh-my-zsh를 통째로 쓰다 결국 자기 zsh를 직접 짜게 되는 것과 같은 흐름이다.

> 💡 **채택보다 "레퍼런스로 훔치기".** OMT의 `.tmux.conf`를 열어 탐나는 아이디어만 내 config로 가져오는 게 실속 있다 — 특히 **SSH/Mosh 접속 시 원격 호스트·유저를 자동 표시하는 상태바**와 **prefix/mouse/synchronize-panes 토글 표시등**. 통째 채택은 이미 curate한 config가 있다면 오히려 후퇴다.
{: .prompt-tip }

> 💡 **그래도 채택한다면 — chezmoi로 규율 있게.** OMT를 통째로 쓰기로 했다면, [chezmoi](https://chezmoi.io) 기준 정공법은 이렇다: 본체(`.tmux.conf`)는 `.chezmoiexternal`로 **upstream을 특정 커밋에 고정해** 가져오고(재현 가능·`apply` 때 예고 없는 변경 차단), `~/.tmux.conf`는 그 파일의 심링크, 내 커스텀은 `.tmux.conf.local` **한 파일로 격리**한다(플러그인도 여기서 `set -g @plugin`으로 선언 — tpm 설치·갱신까지 OMT가 대신 한다). 이러면 "완성형 배포판 상속"의 약점(안 쓰는 기능·upstream 추적 공백)을 상당 부분 상쇄한다 — 규율 있는 채택은 naive한 통째 상속과 다르다.
{: .prompt-tip }

---

## 얹지 *않은* 것 — sesh는 다른 축

인기 급상승 중인 **sesh**(joshmedeski, 2.7k⭐, 활발)를 여기 넣지 않았다. fzf+zoxide로 세션을 온디맨드 전환하는 **모멘텀 툴**이지만, 이건 TPM 플러그인이 아니라 tmux *밖*의 **세션 매니저**다 — resurrect가 *떠 있던* 세션을 저장·복원한다면, sesh는 세션을 처음부터 띄우고 오간다. 그래서 결이 맞는 자리는 이 글이 아니라 [3단계 세션 부트스트랩](/posts/tmux/2026-02-21-tmux-bootstrap/)이다. smug·tmuxp·tmuxinator와 같은 축에서 비교하는 게 맞다.

---

## 얹은 뒤 `.tmux.conf` (필수 6종 + 이 글의 층)

```tmux
# --- TPM ---
set -g @plugin 'tmux-plugins/tpm'

# --- 필수 6종 (tmux-tpm 글) ---
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

> 📎 **더 찾기** · [awesome-tmux](https://github.com/rothgar/awesome-tmux) — 위 너머의 플러그인·설정·아티클 카테고리별 인덱스. 세션 매니저(sesh 등)를 찾는다면 [부트스트랩 글](/posts/tmux/2026-02-21-tmux-bootstrap/)로.
{: .prompt-tip }
