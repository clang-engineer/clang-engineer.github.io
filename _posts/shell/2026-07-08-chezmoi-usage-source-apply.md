---
title       : "chezmoi 사용법 — 소스 표현과 apply 흐름"
description : "chezmoi가 dotfiles를 어떻게 표현하고 적용하는지: 소스 디렉토리(git repo), 파일명에 인코딩된 메타(dot_·private_·encrypted_·.tmpl), 템플릿으로 머신 분기(.chezmoi.hostname·[data]), init→apply와 edit·update 일상 명령, encrypted_·패스워드 매니저로 시크릿, run_ 스크립트로 apply 시 부트스트랩까지 한 장으로."
date        : 2026-07-08 11:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [dotfiles, chezmoi, template, guide]
pin         : false
hidden      : false
---

chezmoi를 쓰기로 했다면(그 선택 기준은 [chezmoi vs 심링크](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/) 참고), 실제로 알아야 할 건 두 가지다 — **dotfiles를 어떻게 표현하나**(소스), 그리고 **어떻게 적용하나**(apply). 이 글은 그 메커니즘과 명령 흐름을 정리한다.

## 소스 표현 — 파일이 어디에, 어떤 이름으로 사는가

chezmoi의 모든 것은 하나의 **소스 디렉토리**에서 시작한다.

- 소스 디렉토리: `~/.local/share/chezmoi` — 그냥 git 저장소다. 여기 있는 파일들이 홈 디렉토리로 렌더된다.
- 파일명이 **메타데이터를 인코딩**한다. 홈에 그대로 두면 숨김 파일이라 다루기 불편한 것들을, 소스에서는 접두어로 표현한다:
  - `dot_zshrc` → `~/.zshrc` (`dot_`이 앞의 `.`을 대신)
  - `private_` / `executable_` / `readonly_` → 렌더된 파일의 퍼미션
  - `.tmpl` 확장자 → 이 파일은 템플릿이니 렌더가 필요하다는 표시
{% raw %}
- 템플릿 데이터: `.tmpl` 파일 안에서 `{{ .chezmoi.hostname }}`, `{{ .chezmoi.os }}`, `{{ .chezmoi.arch }}` 같은 내장 변수를 쓸 수 있고, `chezmoi.toml`에 커스텀 값을 정의해 끌어 쓸 수도 있다.
{% endraw %}

즉 `~/.local/share/chezmoi/dot_zshrc.tmpl`은 "머신별로 렌더될 `~/.zshrc`의 원본"이라는 뜻을 파일명만으로 담는다.

## 템플릿 — 실제로 분기하기

`.tmpl` 파일은 Go 템플릿 문법으로 머신별 분기를 담는다. 개념보다 예시가 빠르다 — 회사·개인 머신에서 git 이메일을 가르는 `dot_gitconfig.tmpl`:

{% raw %}
```
[user]
    name = clang
{{- if eq .chezmoi.hostname "work-laptop" }}
    email = developer@work.example.com
{{- else }}
    email = developer@example.com
{{- end }}
```
{% endraw %}

apply 시점에 `.chezmoi.hostname`이 평가돼, 이 머신에 맞는 한 줄만 남은 **평범한 `~/.gitconfig`**로 렌더된다. 파일엔 조건문 흔적이 없다 — 분기는 이미 apply 때 끝났다. (`.gitconfig`는 런타임에 `source`로 분기할 수 없는 대표적 파일이라, 이런 렌더 분기가 chezmoi를 쓰는 이유 중 하나다.)

자주 쓰는 내장 변수:

- `.chezmoi.hostname` — 머신 이름으로 분기 (가장 흔함)
- `.chezmoi.os` / `.chezmoi.arch` — `darwin`/`linux`, `amd64`/`arm64`로 OS·아키텍처 분기
- `.chezmoi.username` — 사용자명

{% raw %}
내장 변수로 안 갈리는 값(회사 프록시 주소 등)은 **직접 정의**한다. `~/.config/chezmoi/chezmoi.toml`의 `[data]`에 넣으면 템플릿에서 `{{ .email }}`로 끌어 쓴다:
{% endraw %}

```toml
# chezmoi.toml — 이 머신의 값
[data]
    email = "developer@work.example.com"
```

새 머신에서 클론하는 사람마다 자기 값을 넣게 하려면, 소스에 `.chezmoi.toml.tmpl`을 두고 `promptString`으로 init 때 프롬프트를 띄운다.

## 명령 흐름 — init에서 apply까지

```sh
chezmoi init                 # 소스 repo 생성
chezmoi add ~/.zshrc         # 기존 파일을 관리 대상으로 편입 (dot_zshrc로 저장)
chezmoi chattr +template ~/.zshrc   # 이 파일을 템플릿으로 전환 (.tmpl 부여)
chezmoi diff                 # apply하면 무엇이 바뀌는지 미리보기
chezmoi apply                # 템플릿을 렌더해 홈에 실제로 씀
```

흐름을 말로 풀면 이렇다.

1. `chezmoi init` — 소스 저장소를 만든다. 이후 모든 편집은 이 저장소 안에서 일어난다.
2. `chezmoi add ~/.zshrc` — 지금 홈에 있는 실파일을 소스로 가져온다. chezmoi가 알아서 `dot_zshrc`라는 이름으로 저장한다.
{% raw %}
3. `chezmoi chattr +template ~/.zshrc` — 머신별로 내용이 갈려야 하는 파일을 템플릿으로 승격한다. 이제 그 파일 안에서 `{{ .chezmoi.hostname }}` 같은 분기를 쓸 수 있다.
{% endraw %}
4. `chezmoi diff` — apply를 실행하면 홈 파일이 어떻게 바뀌는지 **미리** 보여준다. 복사 방식이라 원본과 어긋날(drift) 수 있는 chezmoi에서, 이 미리보기가 안전장치다.
5. `chezmoi apply` — 템플릿을 이 머신용으로 렌더해 홈에 실제로 쓴다. 편집→반영이 즉시가 아니라 이 단계를 거친다는 점이 심링크 방식과 결정적으로 다른 지점이다.

초기 셋업이 끝나면 일상은 다른 명령 몇 개로 돈다.

```sh
chezmoi edit ~/.zshrc    # 소스 파일을 직접 열어 편집 (dot_zshrc를 찾아줌)
chezmoi cd               # 소스 저장소로 이동 — git 커밋/푸시는 여기서
chezmoi apply            # 편집분을 홈에 반영
chezmoi update           # git pull + apply 한 방 (다른 머신에서 밀어둔 변경 당겨오기)
chezmoi managed          # chezmoi가 관리 중인 파일 목록
```

`chezmoi edit`은 홈의 실파일이 아니라 **소스**를 연다 — chezmoi에선 항상 소스를 고쳐야 하고, 홈 파일을 직접 고치면 다음 apply에 덮인다(drift). 여러 머신을 쓴다면 한쪽에서 `chezmoi cd && git push`, 다른 쪽에서 `chezmoi update`가 기본 리듬이다.

## 시크릿 — 암호화해서 저장소에 넣기

심링크 방식은 시크릿을 저장소 *밖*(`~/.secrets` + gitignore)에 두는 게 정석이다. chezmoi는 반대로 **암호화해서 저장소 안에** 넣을 수 있다 — 이게 심링크 대비 실질적 차별점이다.

- **`encrypted_` 접두어 + age(또는 gpg)** — `encrypted_private_id_rsa`처럼 두면 소스엔 암호문으로 저장되고 apply 때 복호화돼 홈에 쓰인다. 키 하나만 안전하게 옮기면 개인키·토큰도 저장소에 담아 재현할 수 있다.
{% raw %}
- **패스워드 매니저 연동** — 템플릿 안에서 `{{ onepasswordRead "op://..." }}`, `{{ (bitwarden "item" "id").login.password }}` 같은 함수로 apply 시점에 값을 끌어온다. 저장소엔 시크릿이 아예 안 들어가고 참조만 남는다.
{% endraw %}

즉 chezmoi에선 시크릿을 "저장소에서 뺄지"가 아니라 "암호화해 넣을지 / 매니저에서 당길지"의 선택이 된다. 여러 머신에 개인키까지 재현하려면 이 기능이 심링크 + `.secrets`보다 편하다.

## apply에 붙는 자동화 — run_ 스크립트 & .chezmoiignore

chezmoi는 apply 때 스크립트를 실행할 수 있다. 파일명 접두어가 실행 시점을 정한다:

- `run_` — apply마다 실행
- `run_once_` — 내용이 바뀔 때 딱 한 번. 부트스트랩용(Homebrew 설치 등)
- `run_onchange_` — 그 스크립트 내용이 바뀌었을 때만. Brewfile 갱신 시 재설치 같은 데

`run_once_before_install-packages.sh`에 `brew bundle` 한 줄을 넣어 두면, 새 머신에서 `chezmoi init --apply` 한 방에 **패키지 설치까지** 딸려 온다. [2단계 Brewfile](/posts/shell/2026-07-03-homebrew-brewfile-bundle/)이 여기서 chezmoi 흐름 안으로 들어온다.

{% raw %}
머신마다 있어야/없어야 하는 파일은 `.chezmoiignore`로 가른다 — `.gitignore`와 같은 문법이고 템플릿도 먹어서, `{{ if ne .chezmoi.os "darwin" }}Library/{{ end }}`처럼 OS별로 제외할 수 있다.
{% endraw %}

## 지우기 — forget·destroy·purge

라이프사이클의 반대편. 핵심은 **소스에서 파일만 지워도 홈의 실파일은 안 지워진다**(관리만 끊길 뿐)는 것 — 목적별로 명령이 갈린다.

- `chezmoi forget ~/.zshrc` — 소스에서 빼 **관리만 중단**. 홈 파일은 그대로 둔다.
- `chezmoi destroy ~/.zshrc` — 소스와 **홈 파일까지 삭제**. 되돌릴 수 없으니 `--dry-run`으로 먼저 확인.
- `chezmoi purge` — 대상 dotfile은 남겨 두고 chezmoi의 설정·상태·소스 디렉터리를 제거. 먼저 `chezmoi source-path`와 원격 push 상태를 확인하고, 소스까지 버릴 의도가 분명할 때만 실행한다. 설정만 일부 지우고 싶다면 `purge` 대신 `chezmoi doctor`로 실제 경로를 확인한 뒤 해당 항목만 명시적으로 처리한다.

흔한 오해 하나: 소스에서 파일만 지우고 `apply`하면 홈엔 **고아 파일로 남는다**. chezmoi는 관리하지 않게 된 파일을 임의로 지우지 않기 때문. 홈에서도 없애려면 `destroy`나 `.chezmoiremove`를 써야 한다.

## 핵심 한 방 — init --apply

chezmoi를 쓰는 진짜 이유에 가장 가까운 명령은 이것 하나다.

```sh
chezmoi init --apply <repo>  # 클론 + 렌더 + 적용을 한 번에
```

새 머신에서 이 한 줄이면 저장소를 클론하고, 이 머신용으로 템플릿을 렌더하고, 홈에 적용하는 것까지 끝난다. "남이 클론해 자기 머신에서 그대로 돌리게" 하는 공유 경험 — 심링크 방식으로는 주기 어려운 이 지점이 chezmoi의 대표 기능이다.

## 정리

- 소스는 `~/.local/share/chezmoi`(git repo) 하나. 파일명 접두어(`dot_`·`private_`·`executable_`·`encrypted_`)와 `.tmpl`이 메타를 담는다.
- 머신 분기는 `.tmpl` 안에서 `.chezmoi.hostname`·`.os`나 `[data]` 커스텀 값으로. 편집은 소스에서 하고 `chezmoi apply`로 렌더해 홈에 반영한다 — `diff`로 먼저 확인하는 습관이 drift를 막는다.
- 일상 리듬은 `edit`(소스 편집) → `cd && git push` → 다른 머신에서 `update`.
- 시크릿은 `encrypted_`나 패스워드 매니저 함수로 저장소 안에서 다룬다.
- 지울 땐 `forget`(관리만 중단) / `destroy`(홈 파일까지) / `purge`(chezmoi째)를 목적에 맞게. 소스가 저장소 하위면 `purge`가 저장소를 지우니 주의.
- 공유의 핵심은 `chezmoi init --apply <repo>` — 클론·렌더·(`run_once_` 스크립트로) 설치까지 한 방.

chezmoi를 아직 쓸지 말지 고민 중이라면, 심링크와의 선택 기준은 [chezmoi vs 심링크 dotfiles](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/)에 정리해 두었다.
