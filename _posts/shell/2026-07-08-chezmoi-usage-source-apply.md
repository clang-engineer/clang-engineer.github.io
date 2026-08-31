---
title       : "chezmoi 사용법 — 소스 표현과 apply 흐름"
description : "chezmoi의 source state, target state, destination 관계를 이해하고, 원본 편집부터 diff와 apply를 거쳐 새 머신에 재현하는 흐름을 하나의 예제로 설명한다."
date        : 2026-07-08 11:00:00 +0900
updated     : 2026-08-31 12:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [dotfiles, chezmoi, template, guide]
pin         : false
hidden      : false
---

chezmoi를 처음 쓰면 `~/.zshrc`를 고쳤는데 왜 원본이 바뀌지 않는지, 반대로 저장소의 파일을 고쳤는데 왜 홈에는 바로 반영되지 않는지 헷갈리기 쉽다. chezmoi는 파일을 양방향으로 동기화하는 도구가 아니다. **원본으로부터 이 머신의 결과를 계산하고, 그 결과를 홈에 적용하는 도구**다.

> 명령·파일명 규칙·템플릿 함수의 전체 목록은 [devkit chezmoi Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/chezmoi.md)에서 계속 관리한다. 이 글은 목록 대신 source에서 destination으로 가는 흐름과 그 이유에 집중한다.

선택 기준이 먼저 필요하다면 [chezmoi vs 심링크](/posts/shell/2026-07-08-chezmoi-vs-symlink-dotfiles/)를 참고하자.

## 소스 표현 — 파일이 어디에, 어떤 이름으로 사는가

chezmoi를 이해할 때는 파일 하나를 세 상태로 나눠 보면 된다.

```text
source state                  target state                 destination state
git으로 추적하는 원본   →    이 머신용으로 계산한 결과   →    홈에 실제로 존재하는 파일
dot_gitconfig.tmpl            렌더된 .gitconfig            ~/.gitconfig
                              chezmoi diff로 비교           chezmoi apply로 반영
```

**source state**는 사람이 관리하고 git으로 공유하는 원본이다. 기본 소스 디렉토리는 `~/.local/share/chezmoi`이며, 실제 위치가 설정에 따라 달라질 수 있어도 역할은 같다. `dot_gitconfig.tmpl`에서 `dot_`은 destination 이름의 선행 `.`을, `.tmpl`은 렌더가 필요한 템플릿임을 나타낸다.

**target state**는 source에 현재 머신의 데이터를 넣어 계산한 결과다. 별도로 손으로 관리할 두 번째 원본이 아니라, "이 머신의 홈은 이렇게 되어야 한다"는 chezmoi의 계산 결과다.

**destination state**는 `~/.gitconfig`처럼 프로그램이 실제로 읽는 홈의 파일이다. `chezmoi apply`는 target을 destination에 쓰는 단방향 작업이다. 따라서 destination을 직접 고친 내용은 source로 자동 역전파되지 않는다.

이 구분만 잡으면 편집 원칙도 자연스럽다.

```text
source를 편집한다 → target 결과를 확인한다 → destination에 apply한다
```

## 템플릿 — 실제로 분기하기

현실적인 예로 회사 머신과 개인 머신에서 Git email만 다르게 써 보자. 두 개의 완성된 `.gitconfig`를 따로 관리하는 대신 source에는 의도가 담긴 `dot_gitconfig.tmpl` 하나를 둔다.

{% raw %}
```gotmpl
[user]
    name = Example Developer
{{- if eq .chezmoi.hostname "work-laptop" }}
    email = developer@work.example.com
{{- else }}
    email = developer@example.com
{{- end }}
```
{% endraw %}

회사 머신에서 target을 계산하면 조건문은 사라지고 회사 email만 남는다. 개인 머신에서는 개인 email만 남는다. 어느 쪽이든 destination인 `~/.gitconfig`는 Git이 읽을 수 있는 평범한 파일이다. 런타임에 분기 기능이 없는 설정 파일도 머신별로 만들 수 있는 이유가 여기에 있다.

중요한 점은 template 자체가 destination으로 복사되는 게 아니라는 것이다. source는 조건을 보존하고, target은 현재 머신에서 결정된 값만 가지며, destination은 apply 당시의 target을 복사해 가진다.

## 명령 흐름 — init에서 apply까지

기존 `~/.gitconfig`를 처음 편입해 두 머신에서 재사용하는 흐름을 끝까지 따라가 보자.

### 1. 기존 파일을 source로 가져온다

```sh
chezmoi init
chezmoi add ~/.gitconfig
chezmoi chattr +template ~/.gitconfig
```

`add`는 현재 destination을 source로 가져오는 **한 번의 스냅샷**이다. 이후 두 파일이 자동으로 연결되는 것은 아니다. 템플릿 속성을 붙인 다음에는 `chezmoi edit ~/.gitconfig`으로 source를 열어 위의 분기문을 작성한다.

### 2. target을 검토하고 destination에 적용한다

source를 바꿨다고 홈 파일이 즉시 바뀌면, 잘못된 템플릿이 셸이나 Git 설정을 바로 망가뜨릴 수 있다. 그래서 먼저 현재 target과 destination의 차이를 확인한다.

```sh
chezmoi diff ~/.gitconfig
chezmoi apply ~/.gitconfig
```

`diff`는 "source 파일과 destination의 문자 차이"가 아니라 **렌더를 마친 target과 현재 destination의 차이**를 보여준다. 검토한 결과가 의도와 같을 때만 apply한다. 이 한 단계가 source와 destination이 분리된 구조의 번거로움이자 안전장치다.

### 3. source를 git으로 공유한다

적용 결과가 정상이라면 source 저장소에서 변경을 커밋하고 원격에 push한다. Git 작업 자체는 일반 저장소와 같다.

```sh
chezmoi cd
git add dot_gitconfig.tmpl
git commit -m "Configure Git identity by machine"
git push
exit
```

이때 공유하는 것은 회사 머신에서 렌더된 `~/.gitconfig`가 아니라 분기 의도를 보존한 source다. 그래서 같은 커밋으로도 머신마다 다른 destination을 재현할 수 있다.

## destination을 직접 고치면 왜 덮이는가

급해서 `~/.gitconfig`를 직접 수정했다고 하자. 당장은 Git이 새 값을 읽으므로 문제가 해결된 것처럼 보인다. 하지만 source와 target은 그대로이고 destination만 달라진 상태다.

```text
source:      기존 email을 만드는 템플릿
target:      기존 email
destination: 방금 손으로 바꾼 email
```

다음 `chezmoi apply`는 source로 target을 다시 계산한 뒤 destination을 target에 맞춘다. destination의 직접 수정분이 덮이는 것은 예외나 충돌이 아니라 apply의 본래 역할이다. chezmoi에는 destination 변경을 source와 자동 병합할 근거가 없다. 템플릿의 어느 조건을 고쳐야 하는지, 단순히 이 머신만의 임시 변경인지 알 수 없기 때문이다.

직접 수정한 내용을 살려야 한다면 우선 변경분을 따로 확인한 뒤 source에 의도적으로 반영한다. 템플릿 파일이라면 destination을 통째로 다시 가져오기보다 `chezmoi edit ~/.gitconfig`으로 조건과 원본 구조를 고치는 편이 안전하다. 렌더된 결과를 source에 덮어쓰면 머신 분기 자체를 잃을 수 있다.

## 핵심 한 방 — init --apply

두 번째 머신에서는 저장소를 내려받고 그 머신의 target을 계산한 뒤 destination에 적용한다.

```sh
chezmoi init --apply <repo>
```

첫 머신에서 source에 `work-laptop` 조건을 넣었더라도, 새 머신의 hostname이 다르면 개인 email이 들어간 target이 만들어진다. apply가 그 결과를 `~/.gitconfig`에 쓴다. 저장소의 동일한 source가 각 머신의 destination으로 변환되는 전체 흐름이 여기서 닫힌다.

이미 사용 중인 홈 파일을 바꿀 수 있으므로, 낯선 저장소라면 바로 `--apply`하지 말고 source를 먼저 검토해야 한다. 자신의 저장소이고 적용 결과를 알고 있을 때 초기 설정을 한 번에 줄여 주는 명령으로 보는 편이 정확하다.

## 정리

- source state는 git으로 추적하는 원본이고, target state는 source에서 계산한 이 머신의 기대 상태이며, destination state는 홈에 실제로 놓인 파일이다.
- 평소 흐름은 **source 편집 → `diff`로 target과 destination 비교 → `apply`로 destination 갱신**이다.
- destination 직접 편집은 source를 바꾸지 않는다. 다음 apply가 덮는 것은 단방향 상태 적용 모델의 의도된 결과다.
- 템플릿을 source에 보존하면 같은 저장소로 머신마다 다른 destination을 재현할 수 있다.

전체 명령과 속성, 시크릿, 자동화 스크립트, 삭제 절차가 필요할 때는 [devkit chezmoi Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/chezmoi.md)를 기준으로 확인하자.
