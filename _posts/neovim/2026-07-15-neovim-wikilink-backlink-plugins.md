---
title       : "Neovim에서 [[위키링크]] 따라가기·백링크 — 어떤 플러그인? (그리고 vimwiki 함정)"
description : "평범한 마크다운 디렉토리에서 위키링크 점프와 백링크만 원할 때, 직접 짜지 말고 기존 플러그인을 고른다. snacks picker 유저 기준으로 obsidian.nvim 포크와 Marksman LSP가 갈리고, '이미 깔린 vimwiki를 확장'하는 게 오히려 함정인 이유를 지표와 함께 정리한다."
date        : 2026-07-15 12:00:00 +0900
updated     : 2026-07-15 12:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [neovim, obsidian-nvim, vimwiki, marksman, wikilink, backlink, snacks, pkm, guide]
pin         : false
hidden      : false
---

평범한 `.md` 파일 디렉토리 — 이를테면 노트 95개 중 41개가 `[[다른-노트]]`로 서로를 참조하는 상태 — 에서 딱 두 가지만 하고 싶다고 하자. **링크 위에서 눌러 점프**하고, **이 노트를 참조하는 다른 노트들(백링크)을 찾기**. 직접 플러그인을 짤 필요는 없다. 이미 하는 도구가 여럿 있다.

문제는 **어떤 걸 고르느냐**인데, 여기서 두 가지가 결정을 뒤흔든다. 하나는 쓰고 있는 picker가 [telescope가 아니라 snacks](/posts/neovim/2026-07-03-telescope-vs-fzf/)냐이고, 다른 하나는 — 반직관적이지만 — **"이미 깔려 있는 vimwiki를 확장"하는 게 최악의 선택**이라는 점이다.

> PKM(Personal Knowledge Management, 개인 지식관리) 전반을 org-mode·Obsidian과 비교하는 상위 관점은 [Neovim과 PKM](/posts/neovim/2026-07-12-neovim-pkm-obsidian-orgmode/)에서 다룬다. 이 글은 그 아래 층위 — "링크 점프·백링크"라는 구체적 기능을 어느 플러그인으로 얻느냐 — 의 실전 결정 가이드다.
{: .prompt-info }

## ⚠️ 함정 먼저: vimwiki 확장은 하지 마라

vimwiki가 이미 깔려 있다면 (블로그·위키 용도로 흔하다) "그거 vault에도 걸면 공짜 아냐?"라는 생각이 든다. 함정이다.

vimwiki에는 백링크 명령 `:VimwikiBacklinks`(줄여서 `:VWB`)가 있다. 그런데 **마크다운 모드에서는 `[[위키 스타일]]` 링크를 인식하지 못한다.** [issue #1244](https://github.com/vimwiki/vimwiki/issues/1244)로 2022년부터 열려 있는 회귀(regression) 버그다. `[텍스트](파일)` 형태의 표준 마크다운 링크만 찾는다.

즉 노트의 링크가 전부 `[[ ]]` 스타일이면 **백링크 결과가 항상 비어 있다.** 주 요구사항 자체를 못 채운다.

여기에 더해 vimwiki는 wiki로 등록된 파일의 `filetype`을 `markdown`이 아니라 **`vimwiki`로 바꿔 버린다.** 그러면 render-markdown, treesitter의 마크다운 파서, 마크다운 LSP가 그 파일에서 동작을 멈춘다. `<Tab>`·`<Enter>`·`<Backspace>` 키도 vimwiki가 가로챈다. `g:vimwiki_global_ext=1`(모든 `.md`를 wiki로 취급)을 켜면 이 하이재킹이 **시스템의 모든 마크다운 파일로 번진다.**

**교훈: "이미 깔려 있으니 공짜"를 의심하라.** 확장에 드는 비용(버그 + 하이재킹)이 새 플러그인 하나 도입보다 클 수 있다. vimwiki는 원래 쓰던 용도(예: 블로그 포스트)에만 남겨 두고, 노트 디렉토리에는 붙이지 않는 게 맞다.

## 후보 지형 (2026년 7월 기준)

채택도를 볼 때 GitHub 스타만 보면 오해한다 — 스타는 오래된 프로젝트에 누적된 "레거시 질량"일 수 있다. 여기서는 **dotfyle**(dotfyle.com — 공개된 Neovim 설정을 추적하는 사이트) 의 config 수를 함께 본다. "몇 명이 실제로 굴리고 있나"에 스타보다 가까운 신호다.

| 플러그인 | ⭐ | config | 링크 따라가기 | 백링크 | snacks picker | 비고 |
|---|---|---|---|---|---|---|
| **obsidian.nvim** (포크) | 2.0k | 141 | `gf` / `follow_link` | `:Obsidian backlinks` → **snacks** | ✅ 네이티브 | 모멘텀 리더, v3.16.5(2026-06) |
| **Marksman** (LSP) | — | — | `gf` / `lsp.definition` | `lsp.references` → snacks | ✅ | 플러그인 0개, LSP 서버만 |
| mkdnflow.nvim | 819 | 17 | `MkdnFollowLink` | `:MkdnBacklinks` (quickfix) | ❌ 의존 없음 | 최소·니치 |
| zk-nvim | 844 | 32 | `lsp.definition` | `:ZkBacklinks` | ✅ | 외부 `zk` 바이너리 + notebook 필요 |
| telekasten.nvim | 1.7k | 26 | ✅ | ✅ | ❌ telescope 종속 | zettelkasten 강제 |
| vimwiki | 9.5k | — | ✅ | ⚠️ `[[ ]]` 못 봄 (#1244) | ❌ | 스타는 2010년대 레거시 질량 |

몇 가지 짚을 점:

- 원조 `epwalsh/obsidian.nvim`은 아카이브됐다. 유지되는 건 **커뮤니티 포크 `obsidian-nvim/obsidian.nvim`**이다. 원작자 방치 뒤 커뮤니티가 포크해 활발히 개발한다는 것 자체가 "사람들이 정착했다"는 신호다.
- telekasten가 강제하는 **zettelkasten**(독일어 "쪽지 상자" — 원자적 노트를 링크로 엮어 지식을 키우는 PKM 방법론)은 데일리 노트·템플릿·uuid를 요구해서, 링크만 원하는 평범한 디렉토리에는 과하다. 게다가 telescope에 묶여 있어 snacks 유저가 telescope를 되불러오는 꼴이 된다.
- zk-nvim은 강력하지만 외부 `zk` CLI(Go 바이너리) 설치와 `.zk` notebook 초기화가 필요하다 — 평범한 md 디렉토리에는 격식이 과하다.
- mkdnflow는 의존성 0에 가장 가볍지만, 백링크가 snacks가 아니라 quickfix 창으로 뜨고 채택도가 낮다(config 17).

## 두 갈래 결론

snacks picker를 쓰는 사람 기준으로 진짜 후보는 둘이다. 축은 하나 — **플러그인을 아예 안 늘릴 것이냐, 전용 명령·기능을 얹을 것이냐.**

### 미니멀 — Marksman LSP (플러그인 0개)

가장 "있는 것 쓰기"에 부합한다. 노트 플러그인을 하나도 안 깔고, LSP 서버 `marksman`(마크다운 전용 language server) 하나만 붙인다. LazyVim이면 `lang.markdown` extra로 바로 들어온다.

- `[[ ]]` 위에서 `gf` 또는 `vim.lsp.buf.definition()` → 점프
- **백링크 = LSP references** — `vim.lsp.buf.references()`가 snacks picker로 뜬다
- 상태도, 의견도 없다. 어떤 평문 md 디렉토리에나 그냥 붙는다

트레이드오프는 멘탈 모델이 살짝 다르다는 것 — "백링크"를 별도 개념이 아니라 **LSP의 참조 찾기**로 얻는다. 하지만 결과는 같다: 이 노트를 가리키는 노트들의 목록. Neovim 노트 콘텐츠로 알려진 크리에이터 linkarzu가 telescope를 버리고 정확히 이 조합(Marksman + snacks)을 쓴다.

### 전용 명령·리팩터링 — obsidian.nvim 포크

"제대로 된 노트 플러그인 + 이름 있는 명령"을 원하면 이쪽. Obsidian 앱은 **필요 없다** — `.obsidian` 폴더 없이 평범한 md 디렉토리에 workspace 경로만 지정하면 된다.

```lua
-- lua/plugins/obsidian.lua
return {
  {
    "obsidian-nvim/obsidian.nvim",
    version = "*",
    ft = "markdown",
    opts = {
      workspaces = { { name = "notes", path = "~/path/to/notes-dir" } },
      picker = { name = "snacks.picker" }, -- telescope/fzf/mini도 지원
    },
  },
}
```

Marksman에 없는 것을 얹어 준다:

- **`:Obsidian rename`** — 노트 이름을 바꾸면 vault 전체의 링크를 자동으로 갱신한다. 수동으로는 못 하는 리팩터링이다.
- `[[` 를 타이핑하면 노트 이름 자동완성 (in-process LSP)
- `:Obsidian backlinks` → snacks picker로 백링크
- `:Obsidian paste_img` — 클립보드 이미지를 저장하고 링크 삽입

daily notes·템플릿·frontmatter 관리 같은 machinery가 딸려오지만 대부분 opt-out할 수 있다. 다만 **frontmatter 자동 관리는 이미 front-matter를 스스로 다루는 워크플로우(예: Jekyll 블로그 자동화)와 충돌**하니 꺼 두는 게 안전하다.

## 정리

- 노트의 링크가 `[[ ]]` 스타일이면 **vimwiki 확장은 하지 마라** — `:VimwikiBacklinks`가 이걸 못 보고(#1244), filetype 하이재킹으로 다른 마크다운 도구까지 깨진다. "이미 깔림 = 공짜"는 함정.
- snacks 유저 기준 두 갈래: **미니멀이면 Marksman LSP**(플러그인 0개, references가 곧 백링크), **전용 명령·링크 리네임까지면 obsidian.nvim 포크**.
- 도구를 고를 땐 스타 수보다 **config 수·릴리스 최신성**으로 모멘텀을 본다. 원작자 방치 후 커뮤니티 포크가 활발하면 그게 정착의 증거다.
- 백링크는 꼭 노트 전용 플러그인이 있어야 얻는 게 아니다 — **LSP의 참조 찾기로도** 된다. 가장 적게 늘리는 길이다.

> LazyVim 기본 너머의 플러그인 지형은 [LazyVim 너머 인기 플러그인](/posts/neovim/2026-07-12-popular-plugins-beyond-lazyvim/)도 함께 참고.
{: .prompt-info }
