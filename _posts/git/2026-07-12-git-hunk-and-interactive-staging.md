---
title       : "Git hunk이란 — diff 덩어리와 부분 스테이징(git add -p)"
description : "hunk는 diff에서 @@로 구분되는 연속 변경 덩어리다. 이 단위를 알면 한 파일에 뒤섞인 여러 변경을 git add -p로 골라 커밋을 깔끔하게 나눌 수 있다. 개념과 CLI 흐름을 정리하고, 에디터(gitsigns) 쪽은 별도 글로 잇는다."
date        : 2026-07-12 18:40:00 +0900
updated     : 2026-07-12 18:40:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [git, hunk, staging, diff]
pin         : false
hidden      : false
---

`git add -p`나 gitsigns를 쓰다 보면 "hunk"라는 말이 계속 나온다. 커밋을 깔끔하게 나누는 기술의 최소 단위라 알아둘 값이 있다.

## hunk = diff의 한 덩어리

hunk는 **파일 안에서 연속적으로 바뀐 부분의 한 묶음**이다. `git diff` 출력에서 `@@ -10,7 +10,9 @@` 같은 줄로 시작하는 각 구간이 하나의 hunk다.

```diff
@@ -10,7 +10,9 @@ def handler():
     x = load()
-    return x
+    y = transform(x)
+    return y
```

`@@ -10,7 +10,9 @@`는 "원본 10번째 줄부터 7줄, 새 버전 10번째 줄부터 9줄 구간"이라는 좌표다. 한 파일에서 10번째 줄 근처와 200번째 줄 근처를 각각 고쳤다면, 떨어진 두 변경은 보통 **별개의 hunk**로 나뉜다.

## 왜 중요한가 — 부분 스테이징

한 파일에 성격이 다른 변경이 섞였을 때(버그 수정 + 리팩터링), 파일 전체를 `git add` 하면 한 커밋에 뭉친다. hunk 단위로 고르면 **논리적으로 나눠 커밋**할 수 있다.

```bash
git add -p        # (= git add --patch) hunk 단위로 물어보며 스테이징
```

각 hunk마다 프롬프트가 뜬다. 자주 쓰는 응답:

| 키 | 동작 |
|---|---|
| `y` | 이 hunk를 stage |
| `n` | 건너뜀 |
| `s` | hunk를 더 잘게 쪼갬(split) |
| `e` | hunk를 직접 편집해 일부 줄만 stage |
| `q` | 종료 |

`s`로도 안 나뉘는 인접 변경은 `e`로 diff를 직접 편집해 원하는 줄만 남긴다. `git reset -p`, `git checkout -p`, `git stash -p`도 같은 hunk 단위로 동작한다.

## 커밋을 깔끔하게 나누는 습관

- 작업하다 보면 한 파일에 여러 의도가 섞이기 마련이다. 커밋 전에 `git add -p`로 훑으면 **의도별로 분리**된다.
- 리뷰어 입장에서 "한 커밋 = 한 의도"가 읽기 쉽다. hunk 단위 스테이징이 그 규율을 만든다.

## 에디터에서 — gitsigns

CLI의 `git add -p`를 Neovim에서 그대로 하는 게 gitsigns다. `]h`/`[h`로 hunk 사이를 이동하고, 커서가 있는 hunk만 `:Gitsigns stage_hunk`(LazyVim은 `<leader>ghs`)로 스테이징한다. Visual 모드로 일부 줄만 선택해 hunk보다 더 잘게 고를 수도 있다.

> LazyVim의 gitsigns 키맵·동선 상세는 [LazyVim Git 플러그인 정리](/posts/lazyvim/2026-06-09-lazyvim-git-plugins/) 참고.
{: .prompt-tip }
