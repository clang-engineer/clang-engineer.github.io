---
title       : "Neovim 플러그인 문서화 — vimdoc 포맷과 panvimdoc"
description : "README를 :help로 변환하는 panvimdoc, doc/*.txt vimdoc 포맷(태그·링크·모드라인), :helptags 생성. awesome-neovim 등록 요건인 헬프 문서를 자동으로 만드는 법."
date        : 2026-06-19 22:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [lua, plugin, vimdoc]
pin         : false
hidden      : false
---

플러그인 발행 순서의 마지막 관문 중 하나가 **헬프 문서**다. 사용자가 `:help my-plugin`으로 찾아볼 수 있어야 하고, awesome-neovim 등록 요건이기도 하다. 손으로 vimdoc을 쓸 수도 있지만, 실무는 거의 **README.md를 panvimdoc으로 변환**한다. 이 글은 둘 다 정리한다.

## 결론 먼저

- 헬프 문서는 `doc/*.txt` (vimdoc 포맷) + `:helptags`로 만든 `doc/tags`다.
- 손으로 쓰기보다 **panvimdoc**(GitHub Action)으로 `README.md` → `doc/plugin.txt` 자동 변환이 사실상 표준.
- vimdoc 포맷의 핵심은 **태그 `*name*`(정의)와 링크 `|name|`(참조), 섹션 구분선, 끝줄 모드라인** 세 가지.
- `:helptags`는 플러그인 매니저(lazy.nvim 등)가 설치 시 자동 실행하므로 사용자는 신경 안 써도 된다.

## vimdoc 포맷 — 무엇이 생성되는가

panvimdoc을 쓰더라도 결과물이 뭔지는 알아야 디버깅이 된다. vimdoc은 일반 텍스트에 몇 가지 규칙을 얹은 포맷이다.

```
*myplugin.txt*    내 플러그인 한 줄 설명

==============================================================================
INTRODUCTION                                              *myplugin-intro*

내용. 다른 곳을 참조할 땐 |myplugin-config| 처럼 링크.

==============================================================================
CONFIG                                                   *myplugin-config*

>lua
    require("myplugin").setup({ enabled = true })
<

 vim:tw=78:ts=8:ft=help:norl:
```

규칙 세 가지만 잡으면 된다:

| 요소 | 문법 | 역할 |
| --- | --- | --- |
| **태그(정의)** | `*myplugin-config*` (별표로 감쌈, 우측 정렬) | `:help`로 점프할 앵커 |
| **링크(참조)** | `\|myplugin-config\|` (파이프로 감쌈) | 그 태그로 가는 하이퍼링크 |
| **코드 블록** | `>lua` ~ `<` | 들여쓰기된 예제 |
| **모드라인** | 끝줄 `vim:...:ft=help:` | 이 파일을 헬프로 렌더링하게 함 |

`====` 구분선으로 섹션을 나누고, 섹션 제목 우측에 태그를 붙이는 게 관례다.

## :helptags — 태그 인덱스 생성

`doc/*.txt`의 `*tags*`를 긁어 `doc/tags` 인덱스를 만드는 명령이다.

```vim
:helptags doc/
```

이걸 해야 `:help myplugin-config`가 동작한다. **단, 사용자는 직접 할 필요가 없다** — lazy.nvim·packer 등 플러그인 매니저가 설치/업데이트 시 자동으로 돌린다. 개발 중 로컬 확인할 때만 수동 실행한다.

## panvimdoc — README를 헬프로 변환

손으로 vimdoc을 유지하는 건 README와 이중 관리라 깨지기 쉽다. **panvimdoc**(`kdheepak/panvimdoc`)은 Pandoc 기반으로 `README.md`를 vimdoc으로 변환하는 GitHub Action이다. awesome-neovim 생태계에서 가장 널리 쓰인다.

`.github/workflows/panvimdoc.yml`:

```yaml
name: panvimdoc
on:
  push:
    branches: [main]
    paths: [README.md]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kdheepak/panvimdoc@main
        with:
          vimdoc: myplugin          # 생성될 doc/myplugin.txt 이름
          version: "NVIM v0.10.0"
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "auto-generate vimdoc"
          file_pattern: doc/*.txt
```

흐름: **README.md를 푸시 → Action이 `doc/myplugin.txt` 생성 → 자동 커밋.** 이후 README만 관리하면 헬프 문서가 따라온다.

### Markdown 작성 시 매핑

panvimdoc은 Markdown 구조를 vimdoc 요소로 변환한다.

| README.md | → vimdoc |
| --- | --- |
| `# 제목` / `## 섹션` | 섹션 구분선 + 태그 |
| `` `code` `` 펜스 블록 | `>` ~ `<` 코드 블록 |
| 헤더 텍스트 | `*myplugin-헤더*` 태그 자동 생성 |

세부 옵션(`titledatepattern`, `treesitter`, 태그 접두사 등)은 Action `with:` 항목으로 조정한다. 기본값으로도 등록 요건은 충분히 통과한다.

## 대안과 위치

| 방법 | 대중성 | 특징 |
| --- | --- | --- |
| **panvimdoc** | 주류 (awesome-neovim 다수) | README 단일 소스, Action 자동화 |
| 손으로 vimdoc | 소수 (mini.nvim 등 정밀 관리 플러그인) | 완전 제어, 유지비 큼 |
| lemmy-help | 소수 | Lua 주석(annotation)에서 doc 추출, API 문서에 적합 |

결론: **일반 플러그인은 panvimdoc이 정답이다.** README를 어차피 쓰니 추가 비용이 거의 없다. `lemmy-help`는 함수 시그니처 중심의 API 레퍼런스가 필요한 라이브러리성 플러그인에서 고려할 만하다.

## 함정 정리

1. 모드라인(`vim:...:ft=help:`)이 없으면 헬프로 렌더링되지 않고 평범한 텍스트로 열린다.
2. 태그(`*name*`)와 링크(`|name|`)는 **다른 문법**이다. 정의는 별표, 참조는 파이프.
3. `:helptags`는 사용자가 아니라 플러그인 매니저가 돌린다. README에 "수동 실행하라"고 쓰지 말 것.
4. panvimdoc Action에 `paths: [README.md]` 트리거를 두면 불필요한 재생성을 줄인다.
5. 자동 커밋 Action을 안 걸면 doc이 생성만 되고 저장소엔 안 남는다.

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [Neovim 플러그인 작성 규칙](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | `doc/`가 runtimepath에서 차지하는 위치 |
| [직접 만든 플러그인 노출시키기 — 4가지 채널](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | 헬프 문서가 요건인 등록 채널들 |
| [awesome-neovim에 PR 보내기](/posts/neovim/2026-06-12-awesome-neovim-pr-walkthrough/) | 문서까지 갖춘 뒤의 마지막 단계 |

정식 레퍼런스는 `:h help-writing`, `:h :helptags`, panvimdoc 저장소 README.
