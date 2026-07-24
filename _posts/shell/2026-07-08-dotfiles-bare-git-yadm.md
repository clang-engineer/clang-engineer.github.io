---
title       : "bare git repo · yadm로 dotfiles 관리하기 — 심링크 없이 홈을 워크트리로"
description : "심링크도 복사도 없이 홈 디렉터리 자체를 git 워크트리로 삼는 bare git 방식과, 그 위에 템플릿·암호화를 얹은 yadm. init --bare + config 알리아스 셋업, showUntrackedFiles·checkout 충돌 같은 함정, 심링크·chezmoi와의 위치까지."
date        : 2026-07-08 13:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [dotfiles, git, yadm, bare-repo]
pin         : false
hidden      : false
---

dotfiles를 두는 방식은 크게 세 갈래다 — **심링크**(원본을 홈에 링크), **chezmoi**(렌더한 복사본을 홈에 씀), 그리고 이 글의 **bare git repo**(홈 디렉터리 자체가 git 워크트리). bare git은 링크도 복사도 없이 홈 파일을 git이 그 자리에서 직접 추적한다. 여기에 템플릿·암호화를 얹은 매니저가 **yadm**이다.

## bare git repo — 홈이 곧 워크트리

핵심 아이디어: git 히스토리는 `~/.dotfiles`(bare)에 두고, 워크트리는 `$HOME`으로 잡는다. 그러면 홈의 `.zshrc`를 심링크나 복사 없이 그 자리에서 버전 관리한다.

```sh
git init --bare $HOME/.dotfiles
alias config='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
config config --local status.showUntrackedFiles no
```

- `--bare` — 워킹 파일 없는 저장소. 히스토리만 `~/.dotfiles`에 산다.
- `config` 알리아스 — 매번 `--git-dir`/`--work-tree`를 붙이는 대신 `config` 한 단어로 줄인다. 이후 `config add`·`config commit`·`config push`를 일반 git처럼 쓴다. `.zshrc`에 넣어 영속화한다.
- `showUntrackedFiles no` — **이걸 빼면 `config status`가 홈 전체를 untracked로 쏟아낸다.** 홈이 워크트리라 관리 안 하는 수천 개 파일이 다 잡히기 때문. 사실상 필수 설정이다.

일상은 일반 git과 똑같다.

```sh
config add ~/.zshrc
config commit -m "zsh: add alias"
config push
config status        # showUntrackedFiles no 덕에 관리 파일만 보임
```

## 새 머신에 풀기 — 그리고 checkout 충돌

bare git의 진짜 값은 새 머신에서 나온다.

```sh
git clone --bare git@github.com:user/dotfiles.git $HOME/.dotfiles
alias config='git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
config checkout
```

여기서 자주 막힌다 — 홈에 이미 `.bashrc` 같은 파일이 있으면 `config checkout`이 **덮어쓸 수 없다며 실패**한다. git이 추적 안 하던 파일을 함부로 날리지 않으려는 안전장치다. 충돌 파일을 백업하고 다시 checkout하면 된다 (bare git 튜토리얼의 정석 스니펫):

```sh
mkdir -p ~/.dotfiles-backup
config checkout 2>&1 | grep -E "^\s+\." | awk '{print $1}' | \
  xargs -I{} mv {} ~/.dotfiles-backup/{}
config checkout
config config --local status.showUntrackedFiles no
```

## 심링크·chezmoi와 뭐가 다른가

| 방식 | 홈의 파일 정체 | 추가 도구 | 머신 분기 |
|---|---|---|---|
| 심링크 / stow | 원본을 가리키는 **링크** | (stow는 선택) | 런타임 `source` |
| chezmoi | 렌더된 **복사본** | chezmoi | 템플릿(apply 시점) |
| bare git | **홈 파일 그 자체** | 없음(git만) | 없음 — 직접 조건문 |

bare git의 매력은 **군더더기 없음**이다 — 링크도, 복사도, 별도 도구도 없다. git만 있으면 되고, 홈 파일이 곧 추적 대상이라 "apply" 개념 자체가 없다. 대신 대가가 있다.

- **템플릿이 없다.** 머신마다 갈리는 값은 파일 안 조건문이나 `~/.secrets` source로 런타임에 처리해야 한다(심링크 방식과 같은 한계).
- **`showUntrackedFiles no`가 필수**고, 홈이 워크트리라 `config add -A` 같은 실수가 위험하다.
- `config` 탭 자동완성은 별도 설정이 필요하다.

즉 **개인이 도구 없이 git만으로 dotfiles를 두고 싶을 때** 가장 가볍다. 실제로 매니저를 안 쓰는 사용자 상당수가 이 방식이다.

## yadm — bare git에 템플릿·암호화를 얹기

bare git의 "홈이 워크트리" 모델은 좋은데 템플릿·암호화가 아쉽다면, 그걸 얹은 매니저가 **yadm**(Yet Another Dotfiles Manager)이다. 내부적으로 bare git과 같은 구조 위에 chezmoi스러운 기능을 붙였다.

```sh
brew install yadm
yadm clone git@github.com:user/dotfiles.git   # 클론 + checkout 한 번에
yadm add ~/.zshrc
yadm commit -m "zsh: add alias"
yadm push
```

- `yadm` 명령 자체가 `config` 알리아스 역할 — `yadm status`·`add`·`commit`이 홈 워크트리에 바로 동작하고, `showUntrackedFiles`도 알아서 잡아준다.
- **템플릿** — `##template` 지시자로 머신별 렌더. `yadm alt`로 `.zshrc##os.Darwin`처럼 OS별 대체 파일을 고른다.
- **암호화** — `yadm encrypt`로 지정 파일을 gpg/transcrypt로 암호화해 저장소에 담는다.
- **부트스트랩** — `yadm bootstrap` 스크립트로 clone 뒤 설치까지 잇는다.

위치를 한 줄로: **bare git의 무설정과 chezmoi의 템플릿·암호화 사이.** bare git이 너무 날것이고 chezmoi의 소스/apply 분리는 과하게 느껴지면 그 중간 지점이다.

## 정리

- **bare git** — `git init --bare ~/.dotfiles` + `config` 알리아스로 홈을 워크트리 삼아 직접 추적. 링크·복사·도구 없이 가장 가볍다. `showUntrackedFiles no`와 checkout 충돌만 주의하면 된다.
- **yadm** — 그 모델에 템플릿·암호화·부트스트랩을 얹은 매니저. bare git과 chezmoi의 중간.
- 링크 층위 대안인 **GNU stow**는 [심링크 관리 글](/posts/shell/2026-07-03-dotfiles-symlink-management/)에서, 렌더 방식 **chezmoi**는 [chezmoi 사용법](/posts/shell/2026-07-08-chezmoi-usage-source-apply/)에서 다룬다. 방식 선택 전체 그림은 [dotfiles 로드맵](/posts/shell/2026-07-08-dotfiles-roadmap/)에 정리해 두었다.
