---
title       : dotfiles를 git 저장소 + 심볼릭 링크로 관리하기
description : "흩어진 설정 파일을 git 저장소 한곳에 모으고 홈 디렉터리로 심볼릭 링크를 건다. ln -s의 재실행 문제를 없애는 멱등 링크 헬퍼, 도구별 setup.sh를 bootstrap으로 묶는 구조, GNU stow 대안, 시크릿 분리까지 정리한다."
date        : 2026-07-03 13:00:00 +0900
updated     : 2026-07-08 12:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [dotfiles, symlink, bootstrap, stow]
pin         : false
hidden      : false
---

## dotfiles를 git 저장소 + 심볼릭 링크로 관리하기

`~/.zshrc`, `~/.tmux.conf`, `~/.gitconfig`, `~/.config/nvim`... 개발 환경을 다듬을수록 홈 디렉터리 여기저기에 설정 파일이 쌓입니다.
이걸 그대로 두면 새 기기에서 처음부터 다시 만들어야 하고, "어제 뭘 바꿨더라"도 추적이 안 됩니다.

해법은 단순합니다. **설정 파일 원본을 git 저장소 한곳에 모으고, 홈 디렉터리에는 그 원본을 가리키는 심볼릭 링크만** 둡니다.

- 원본이 git에 있으니 변경 이력이 남고, 여러 기기가 같은 저장소를 공유합니다.
- 홈의 링크는 원본을 가리키므로, 저장소 파일을 고치면 즉시 반영됩니다(복사가 아님).

> 이 글은 dotfiles 관리 구조에 집중합니다. 새 맥 전체 셋업 흐름은 [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/)에서 다룹니다.
{: .prompt-info }

---

## 1. 저장소 구조

도구별로 디렉터리를 나눠 관련 파일을 모읍니다.

```
dotfiles/
├── zsh/      .zshrc, 플러그인 설치 스크립트
├── tmux/     .tmux.conf
├── git/      .gitconfig
├── nvim/     init.lua 등 nvim 설정
└── ssh/      config (키는 제외 — 아래 5절)
```

각 파일을 홈의 제자리로 링크하면 됩니다.

```sh
ln -s ~/dotfiles/zsh/.zshrc ~/.zshrc
ln -s ~/dotfiles/tmux/.tmux.conf ~/.tmux.conf
```

문제는 이 `ln -s`를 **다시 실행할 때** 생깁니다. 이미 파일이나 링크가 있으면 에러가 나거나 엉뚱하게 링크가 중첩됩니다. 새 기기 셋업은 대개 한 번에 안 끝나므로, 재실행해도 안전한 형태가 필요합니다.

---

## 2. 멱등 링크 헬퍼

재실행해도 결과가 같도록(멱등), 링크를 걸기 전에 대상 상태를 확인하는 헬퍼를 하나 둡니다.

```sh
# scripts/lib/common.sh
FORCE="${FORCE:-false}"

link_path() {
  local src="$1"
  local dest="$2"

  # 이미 같은 곳을 가리키는 링크면 통과
  if [[ -L "$dest" && "$(readlink "$dest")" == "$src" ]]; then
    printf '✓ %s already linked\n' "$dest"
    return 0
  fi

  # 다른 무언가가 이미 있으면, --force 일 때만 치우고 링크
  if [[ -e "$dest" || -L "$dest" ]]; then
    if [[ "$FORCE" == true ]]; then
      rm -rf "$dest"
    else
      printf '⚠︎ %s 존재 — 건너뜀 (덮어쓰려면 FORCE=true)\n' "$dest"
      return 0
    fi
  fi

  ln -s "$src" "$dest"
  printf '→ Linked %s → %s\n' "$dest" "$src"
}
```

이 헬퍼의 핵심은 세 갈래 분기입니다.

| 대상 상태 | 동작 |
|---|---|
| 이미 올바른 링크 | 통과(다시 안 만듦) |
| 다른 파일/링크가 있음 | 기본은 건너뜀, `FORCE=true`면 치우고 링크 |
| 아무것도 없음 | 링크 생성 |

덕분에 셋업 스크립트를 몇 번을 돌려도 안전하고, 기존 설정을 덮어쓸지 말지는 `FORCE`로 명시적으로 정합니다.

---

## 3. 도구별 setup.sh를 bootstrap으로 묶기

도구마다 링크할 파일과 추가 설치(플러그인 등)가 다릅니다. 그래서 각 디렉터리에 자기 몫만 하는 `setup.sh`를 두고, 최상위 `bootstrap.sh`가 이들을 순서대로 호출합니다.

```sh
# zsh/setup.sh — zsh 몫만
source "$REPO/scripts/lib/common.sh"

link_path "$REPO/zsh/.zshrc" "$HOME/.zshrc"
sh "$REPO/zsh/install-oh-my-zsh.sh"     # 링크만이 아니라 설치도
sh "$REPO/zsh/install-zsh-plugins.sh"
```

```sh
# bootstrap.sh — 전체 오케스트레이션
sh "$REPO"/zsh/setup.sh
sh "$REPO"/tmux/setup.sh
sh "$REPO"/git/setup.sh
sh "$REPO"/nvim/setup.sh
```

이렇게 나누면 좋은 점:

- **부분 실행**: zsh만 다시 잡고 싶으면 `sh zsh/setup.sh`만 돌립니다.
- **추가가 쉬움**: 새 도구는 디렉터리 + `setup.sh`를 만들고 bootstrap에 한 줄 더합니다.
- **링크 이상의 셋업**: 심볼릭 링크뿐 아니라 플러그인 설치 같은 도구별 절차를 같은 자리에 둘 수 있습니다.

---

## 4. 대안 — GNU stow

링크 헬퍼를 직접 쓰기 싫다면, 심볼릭 링크 관리 전용 도구인 **GNU stow**가 정공법 대안입니다. dotfiles 커뮤니티에서 가장 널리 쓰이는 방식입니다.

```sh
brew install stow
# stow는 "패키지 디렉터리 구조 = 홈 기준 구조"로 보고 자동으로 링크
cd ~/dotfiles
stow zsh    # zsh/ 안의 구조를 그대로 ~/ 아래로 심볼릭 링크
```

| 방식 | 장점 | 단점 |
|---|---|---|
| 직접 링크 헬퍼 | 링크 외 설치 절차까지 한 스크립트에, 동작이 투명 | 스크립트를 직접 관리해야 함 |
| GNU stow | 스크립트 없이 링크 자동화, 표준 도구 | 링크 외 설치는 별도로, 디렉터리 구조 규칙을 따라야 함 |

**단순히 파일 링크만** 필요하면 stow가 가볍고 표준적입니다. 링크와 함께 **플러그인 설치·시크릿 처리 같은 절차**를 엮어야 하면 직접 스크립트가 더 유연합니다.

> stow는 이 글과 같은 **심링크 층위**의 대안입니다. 한 층 다른 접근으로, 템플릿을 apply 시점에 머신용 실파일로 **렌더**하는 [chezmoi](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/)가 있습니다 — 머신마다 config *내용*이 갈리거나 남이 클론해 바로 돌리게 할 때 값을 합니다. 방식 선택 전체 그림은 [dotfiles 로드맵](/posts/shell/2026-07-08-dotfiles-roadmap/)에 정리해 두었습니다.
{: .prompt-info }

---

## 5. 시크릿은 저장소에 넣지 않는다

dotfiles를 공개 저장소로 두는 순간, **비밀 값이 함께 올라가지 않도록** 선을 그어야 합니다.

- SSH 개인키, `known_hosts`, 토큰·API 키는 `.gitignore`로 제외합니다.
- 기기별로 다른 환경변수는 저장소 대신 `~/.secrets` 같은 파일에 두고, `.zshrc`에서 있으면 로드하게 합니다.

```sh
# .gitignore
id_rsa*
known_hosts*
.secrets
```

```sh
# .zshrc — 시크릿 파일이 있으면 로드
[[ -f ~/.secrets ]] && source ~/.secrets
```

이러면 설정 구조는 git으로 공유하되, 비밀 값은 각 기기에만 남습니다.

---

## 마무리

정리하면 dotfiles 관리의 뼈대는 이렇습니다.

- 설정 원본은 git 저장소 한곳에, 홈에는 **심볼릭 링크**만
- `ln -s` 대신 **멱등 링크 헬퍼**로 재실행 안전하게
- 도구별 `setup.sh`를 `bootstrap.sh`로 묶어 부분 실행·확장 쉽게
- 링크만 필요하면 **GNU stow**도 좋은 표준 대안
- **시크릿은 gitignore + 기기별 파일**로 분리

SSH 설정을 여러 계정으로 나누는 방법은 [GitHub 다중 계정 관리](/posts/git/2025-10-03-git-multiple-config/)에서 이어집니다.
