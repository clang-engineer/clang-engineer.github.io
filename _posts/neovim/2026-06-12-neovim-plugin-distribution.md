---
title       : "직접 만든 Neovim 플러그인 노출시키기 — 4가지 채널 비교"
description : "GitHub에 푸시했지만 검색에 안 잡히는 플러그인을, awesome-neovim·Dotfyle·VimAwesome·GitHub Topics에 어떻게 등록할지 정리"
date        : 2026-06-12 14:00:00 +0900
updated     : 2026-06-16 10:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [plugin, awesome-neovim, github]
pin         : false
hidden      : false
---

직접 만든 Neovim 플러그인을 GitHub에 푸시해도 그 자체로는 발견되지 않는다. 누군가가 정확히 레포 이름으로 검색해야 도달할 뿐, 카테고리(예: "Vertica adapter")로 찾으면 안 잡힌다. 사용자의 진입점 — 큐레이션 리스트, 디렉토리, 검색 인덱스 — 에 등록해야 한다.

플러그인 등록 채널 4곳을 효과·난이도 기준으로 비교한다.

## 결론 먼저

| 채널 | 소요 | 효과 | 우선순위 |
| --- | --- | --- | --- |
| GitHub Topics | 5분 | 중 | **먼저 한다** |
| awesome-neovim PR | 10분 | 매우 큼 | **반드시 한다** |
| Dotfyle | 3분 | 중 | 한다 |
| VimAwesome | 3분 | 낮음 (Vim 시절 강세, 지금은 약함) | 여유 있으면 |
| Reddit r/neovim | 30분+ | 변동 큼 | 선택 |

## 1. GitHub Topics — 가성비 최고

GitHub 레포 우상단 ⚙️ "Topics"에 키워드를 추가하면 GitHub 자체 검색·discover 페이지에서 잡힌다. 사용자가 GitHub에서 `vertica neovim`처럼 검색하는 경로가 생기는 것.

CLI로도 가능:

```sh
gh api -X PUT repos/OWNER/REPO/topics \
  -f 'names[]=neovim-plugin' \
  -f 'names[]=vim-plugin' \
  -f 'names[]=database' \
  -f 'names[]=YOUR-DOMAIN-KEYWORD'
```

확인:

```sh
gh api repos/OWNER/REPO --jq '.topics'
```

권장 태그 조합:
- `neovim-plugin`, `vim-plugin` — 어느 쪽 호환되는지 둘 다 표시
- 도메인 키워드 (예: `database`, `lsp`, `completion`)
- 차별점 키워드 (예: `vertica`, `kotlin`, `tailwindcss`)

## 2. awesome-neovim PR — 실질 노출 1위

[rockerBOO/awesome-neovim](https://github.com/rockerBOO/awesome-neovim)은 Neovim 사용자가 플러그인을 찾을 때 **가장 많이 보는 큐레이션 리스트**다. 한 줄 추가 PR이지만 효과는 가장 크다.

### 포맷

`README.md`의 적절한 섹션(예: `## Database`)에 한 줄 추가:

```markdown
- [owner/repo](https://github.com/owner/repo) - 한 줄 설명.
```

### 주의

- **정렬은 알파벳순이 아니라 등록순**이다. 섹션 맨 아래에 append.
- 섹션을 직접 확인:
  ```sh
  curl -s https://raw.githubusercontent.com/rockerBOO/awesome-neovim/main/README.md \
    | grep -n "^##" | head -50
  ```

### 절차

```sh
gh repo fork rockerBOO/awesome-neovim --clone=false
git clone git@github.com:YOUR_USER/awesome-neovim.git
cd awesome-neovim
git checkout -b add-my-plugin
# README.md 편집
git add README.md
git commit -m "Add owner/repo to Section name"
git push -u origin add-my-plugin
gh pr create --title "Add owner/repo to Database section" --body "..."
```

## 3. Dotfyle

[dotfyle.com](https://dotfyle.com/) — 모던한 Neovim 플러그인 디렉토리. GitHub 로그인 후 본인 플러그인을 등록하면 메타데이터(별 개수, README, 카테고리)가 자동 sync된다. VimAwesome보다 UI가 깔끔하고 Neovim 진영에서 활발히 사용되는 편.

## 4. VimAwesome

[vimawesome.com/submit](https://vimawesome.com/submit) 폼:

| 필드 | 비고 |
| --- | --- |
| Plugin Name ⭐ | 필수 |
| Author ⭐ | 필수 (GitHub 핸들 권장) |
| GitHub Link | 권장 |
| Category | Language / Completion / Code display / Integrations / Interface / Commands / Other |
| Tags | 최대 4개 |

브라우저 폼이라 JS 필요, CLI 자동화는 불가. **Vim 시절에는 표준 디렉토리였지만 Neovim 진영에서는 활용도가 떨어지는 추세**다. Lua 플러그인은 awesome-neovim·Dotfyle 쪽이 우세.

## 5. Reddit r/neovim (선택)

"I made a thing" 포스트. 스크린샷 1장 첨부하면 반응 좋다. 단점은 본인 홍보 글의 부담과 변동성(타이밍·태그 운에 따라 노출이 들쭉날쭉).

## 안 해도 되는 것

- **상위 의존 플러그인의 README PR (예: tpope vim-dadbod)**: 메인테이너가 본인 README에 third-party 어댑터를 잘 받지 않는다. 거절 위험 크다.
- **HN, Twitter/X**: 도메인이 너무 좁은(니치) 플러그인은 반응이 거의 없다. 시간 낭비.
- **거대 메일링리스트/Discord 광고성 포스팅**: 반발만 산다.

## 카테고리 선택 팁

awesome-neovim·VimAwesome 모두 카테고리 선택이 있다. 헷갈리면 다음 우선순위:

1. 가장 정확한 한 카테고리 — 예: DB 연동은 `Database` / `Integrations`
2. 사용자가 "이 플러그인이 있을 만한 곳"이라고 생각할 위치
3. 모호하면 가장 활발한(엔트리 많은) 섹션

이미 등록된 비슷한 플러그인이 어느 섹션에 들어가 있는지 검색해보면 답이 나온다.

## 정리

- **반드시**: GitHub Topics + awesome-neovim PR
- **권장**: Dotfyle 등록
- **여유 있으면**: VimAwesome, r/neovim
- **하지 말 것**: 메인테이너 README에 끼워달라는 PR, 도메인 좁은데 거대 채널 광고

플러그인을 푸시했다면 위 두 가지(Topics + awesome-neovim PR)부터 처리하자. 합쳐서 15분이면 끝나고, 이후 검색 노출이 완전히 달라진다.

## 플러그인 작성 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [언어 선택](/posts/neovim/2026-06-12-neovim-plugin-language-choice/) | Lua가 표준이지만 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [runtimepath 디렉토리 관례](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | `plugin/` vs `lua/`, 헬프·헬스체크·after/ 자동 로드 규칙 |
| **4가지 채널로 노출시키기 (현재 글)** | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

실전 케이스로 [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/)에서 위 4가지 원칙을 한 번에 적용해본다.
