---
title       : "iPad에서 GitHub 저장소를 Obsidian으로 동기화하기"
description : "GitHub에서 관리하는 Markdown 저장소를 GitSync Portal로 iPad Obsidian에 동기화하는 방법"
date        : 2026-08-30 12:00:00 +0900
updated     : 2026-08-30 12:00:00 +0900
categories  : [obsidian, "개발 환경"]
tags        : [obsidian, ipad, github, gitsync]
pin         : false
hidden      : false
---

GitHub 저장소에서 Markdown 문서를 관리하고 있는데, iPad에서는 Obsidian으로 읽고 싶었다.

단순히 파일 내용을 보는 것이라면 GitHub나 파일 앱으로도 충분하지만, Obsidian의 `[[문서 링크]]`를 이용해 문서 사이를 이동하려면 저장소 내용을 Obsidian Vault 안으로 가져와야 한다.

## 결론: GitSync Portal

iPad에서는 Obsidian Community Plugin인 **GitSync Portal**을 사용하면 GitHub 저장소와 Vault를 직접 동기화할 수 있다.

구조는 단순하다.

```text
Mac
  ↓ git push
GitHub
  ↓ Pull
GitSync Portal
  ↓
iPad Obsidian
```

Git CLI가 필요한 방식이 아니라 GitHub API를 이용하므로 iPad에서도 사용할 수 있다.

## GitSync Portal 설치

Obsidian에서 다음으로 이동한다.

```text
Settings
→ Community plugins
→ Browse
→ GitSync Portal
```

설치 후 플러그인을 활성화한다.

## GitHub Personal Access Token 발급

GitSync Portal에서 GitHub 저장소에 접근하려면 Personal Access Token(PAT)이 필요하다.

GitHub에서 다음으로 이동한다.

```text
Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens
```

특정 저장소만 사용할 경우 Fine-grained token으로 해당 저장소만 선택하는 편이 안전하다.

iPad에서 Pull만 할 목적이라면 최소 권한은 다음과 같이 설정할 수 있다.

```text
Repository access
→ Only select repositories
→ 사용할 저장소 선택

Repository permissions
→ Contents: Read-only
```

Push도 사용할 예정이라면 Contents에 쓰기 권한이 필요하다.

토큰은 생성 직후 한 번만 표시되므로 바로 복사해 둔다.

## 저장소 연결

Obsidian의 GitSync Portal 설정에서 GitHub Token, Repository, Branch 정보를 입력한다. Branch는 일반적으로 `main`을 사용한다.

연결 후 Pull을 실행하면 GitHub 저장소의 Markdown 파일이 현재 Obsidian Vault로 내려온다. 이후 기존 Markdown 문서의 Obsidian 링크도 그대로 사용할 수 있다.

```text
[[다른 문서]]
```

## Pull과 Push

GitSync Portal에서는 Pull과 Push를 별도로 실행할 수 있다.

```text
Pull
GitHub → Obsidian

Push
Obsidian → GitHub
```

Git을 직접 사용할 때처럼 매번 `git add → git commit → git push`를 수행하는 방식보다는 Vault 동기화에 초점이 맞춰져 있다.

따라서 Mac에서는 기존 Git workflow를 유지하고 iPad에서는 Pull 위주로 사용하는 방식이 편하다.

```text
Mac
nvim → git commit → git push

             ↓
           GitHub
             ↓

iPad
Obsidian → Pull → 문서 열람
```

간단한 Markdown 수정 정도라면 iPad에서 수정 후 Push하는 것도 가능하다.

## Working Copy와 차이

처음에는 iOS Git 클라이언트인 Working Copy도 시도했다.

무료 버전에서도 GitHub 저장소를 clone하고 pull할 수 있으며, 저장소 파일을 iPad 파일 앱에서도 볼 수 있다.

하지만 문제는 **Working Copy에 clone한 폴더를 iOS Obsidian에서 그대로 Vault로 열 수 없다는 것**이다.

Working Copy 저장소와 외부 폴더를 연결하는 기능은 Pro 기능이므로, 단순히 GitHub Markdown 저장소를 Obsidian에서 사용하려는 목적이라면 GitSync Portal이 더 간단했다.

## 정리

iPad에서 GitHub 저장소의 Markdown 문서를 Obsidian으로 읽으려면 GitSync Portal을 이용하는 방법이 간단하다.

특히 GitHub를 원본으로 유지하면서 Mac에서 Git으로 문서를 관리하고, iPad에서는 Obsidian의 링크와 문서 탐색 기능을 활용하려는 경우 잘 맞는다.

```text
Mac에서 문서 관리
        ↓
     GitHub
        ↓
iPad Obsidian에서 Pull
        ↓
[[링크]] 기반 문서 탐색
```

iPad까지 완전한 Git 개발 환경으로 만들 필요 없이, Obsidian을 GitHub 저장소의 모바일 Markdown 뷰어 겸 간단한 편집기로 사용할 수 있다.
