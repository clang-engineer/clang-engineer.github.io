---
title       : "fzf Ctrl-T 설정을 세 셸에서 한곳으로 모으기 — chezmoi 데이터와 초기화의 경계"
description : "Bash·Zsh·Fish에 복사하던 fzf Ctrl-T 옵션을 chezmoi 데이터로 모으고, 셸별 초기화와 macOS 클립보드 바인딩은 분리한 이유를 정리한다."
date        : 2026-11-23 00:00:00 +0900
updated     : 2026-11-23 00:00:00 +0900
categories  : [reference, "도구 평가"]
tags        : [fzf, chezmoi, shell, dotfiles, guide]
pin         : false
hidden      : false
---

fzf의 Ctrl-T에 `bat` 미리보기를 붙이는 설정은 한 줄이면 된다. 문제는 같은 옵션을 Bash·Zsh·Fish에 각각 적기 시작한 뒤였다. Fish에는 제외 경로와 클립보드 바인딩을 추가했지만, Bash와 Zsh에는 처음 넣은 미리보기 옵션만 남았다. **같은 파일 선택기를 쓰는데, 어느 셸을 여느냐에 따라 동작이 달라졌다.**

해결은 공통 초기화 스크립트를 만드는 것이 아니었다. **옵션 값은 chezmoi 데이터 한곳에 두고, 셸 문법과 초기화 순서는 각 셸에 남겼다.** 이 글은 그 경계를 어떻게 나눴는지 기록한다. 키 조작과 일상적인 사용 순서는 [fzf 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/fzf.md)를 참고한다.

## 미리보기 한 줄이 셸별 차이로 커졌다

출발점은 선택한 파일을 오른쪽 50% 영역에 줄 번호와 함께 보여주는 옵션이었다. 여기에 [공식 Ctrl-T 예제](https://junegunn.github.io/fzf/shell-integration/#ctrl-t)의 제외 경로와 미리보기 전환을 더하고, macOS에서는 경로 복사를 붙였다.

목표는 파일을 고르는 순간 필요한 동작에 한정했다.

- `.git`, `node_modules`, `target`은 기본 후보 생성에서 제외한다.
- 파일을 열기 전에 `bat`으로 내용을 확인한다.
- 필요할 때 미리보기를 아래로 옮기거나 숨긴다.
- macOS에서는 현재 경로를 복사하고 선택기를 닫을 수 있게 한다.

이 옵션을 셸마다 복사하면 변경 누락을 사람이 기억해야 한다. 그렇다고 fzf 하나 때문에 셸 전체를 공통 로더로 감싸면, 옵션 중복을 줄이려다 초기화 흐름까지 추적하기 어려워진다. 필요한 것은 **값의 단일 원본**이지 새로운 실행 계층이 아니었다.

## 옵션은 YAML, 실행은 각 셸

chezmoi는 데이터 파일을 읽어 템플릿에 전달한다. 이를 이용해 `chezmoi/.chezmoidata/fzf.yaml`에 다음 값을 둔다.

```yaml
fzf:
  ctrlT: >-
    --no-height
    --walker-skip .git,node_modules,target
    --preview 'bat --color=always --style=numbers -- {}'
    --preview-window 'right,50%'
    --bind 'ctrl-/:change-preview-window(down|hidden|)'
  ctrlTByOS:
    darwin: >-
      --bind 'ctrl-y:execute-silent(realpath -- {} | perl -pe chomp | pbcopy)+abort'
      --bind 'alt-y:execute-silent(printf %s {} | pbcopy)+abort'
      --header 'Ctrl-Y: 절대 경로 복사 · Alt-Y: 상대 경로 복사'
```

`>-`는 여러 줄을 공백으로 합치고 마지막 줄바꿈은 제거하는 YAML 표기다. 편집할 때는 옵션별로 줄을 나누지만, 셸에는 하나의 옵션 문자열로 전달할 수 있다.

`ctrlT`는 세 셸의 공통 값이고, `ctrlTByOS.darwin`은 chezmoi 대상 OS가 macOS일 때만 붙일 값이다. Linux·Windows에서도 `pbcopy`를 호출하게 만드는 대신, 해당 환경의 복사 기능은 이번 구성에 포함하지 않았다.

높이도 명시했다. 설치된 fzf의 셸 통합은 Ctrl-T 실행 시 자체적으로 `--height`를 추가한다.
Bash·Zsh 통합의 기본값은 `${FZF_TMUX_HEIGHT:-40%}`이고, Fish도 `FZF_TMUX_HEIGHT`를 사용한다.
따라서 사용자 옵션에 높이를 적지 않았다고 Ctrl-T가 전체 화면이 되는 것은 아니다.
여기서는 `--no-height`로 그 제한을 덮어써 **현재 터미널 pane 전체**를 사용한다.
`--height=80%`는 전체 UI의 세로 크기를 제한하는 옵션이고, `right,50%`는 그 UI 안에서 미리보기에 배정할 가로 너비다.
코드 미리보기의 세로 공간을 확보하려는 목적이므로 높이 제한은 두지 않았다.

중요한 점은 **이 파일을 fzf가 직접 읽는 것이 아니라는 것**이다. chezmoi가 적용할 때 값을 합쳐 셸 설정을 생성한다. 셸 시작 시 YAML 파서나 별도 fzf 설정 로더를 실행하지 않는다.

## 공통 문자열도 셸 문법에 맞게 출력해야 한다

각 셸 템플릿은 공통 옵션과 대상 OS 옵션을 합친다. OS에 해당하는 값이 없으면 빈 문자열을 사용한다.

{% raw %}
```go
{{ $options := printf "%s %s" .fzf.ctrlT (get .fzf.ctrlTByOS .chezmoi.os | default "") | trim }}
```
{% endraw %}

합친 값의 내용이 같아도 환경변수 설정 문법은 다르다. Bash·Zsh는 `export`, Fish는 `set -gx`를 사용한다. 옵션 안에 작은따옴표가 있으므로 문자열을 그대로 작은따옴표로 감싸는 것만으로는 부족하다. 기존 셸 템플릿의 이스케이프 방식을 그대로 사용했다.

{% raw %}
```sh
export FZF_CTRL_T_OPTS='{{ $options | replace "'" "'\\''" }}'
```

```fish
set -gx FZF_CTRL_T_OPTS '{{ $options | replace "\\" "\\\\" | replace "'" "\\'" }}'
```
{% endraw %}

이 코드는 rc에 직접 붙여 넣는 셸 코드가 아니라 **chezmoi 템플릿의 일부**다. 생성된 파일에는 템플릿 표현식 대신 실제 옵션 문자열이 들어간다.

변수를 설정한 다음의 `fzf --bash`, `fzf --zsh`, `fzf --fish` 초기화는 각 셸에 그대로 남겼다. Atuin은 fzf 다음에 초기화하여 Ctrl-R을 맡긴다. [Ctrl-R만 Atuin으로 바꾼 이유](2026-11-23-atuin-vs-fzf-shell-history.md)와 이번 변경은 별개다. 이번에 통일한 것은 Ctrl-T의 파일 선택 옵션이다.

## 공통화하지 않은 경계

파일 미리보기를 `FZF_DEFAULT_OPTS`로 옮기지는 않았다. 그 변수는 다른 도구가 실행하는 fzf에도 영향을 줄 수 있다. 파일 경로가 아닌 브랜치나 명령 이력을 `bat`에 넘기는 상황을 만들지 않으려면 `FZF_CTRL_T_OPTS`에 한정하는 편이 맞다.

제외 경로도 모든 입력에 적용되는 필터는 아니다. `--walker-skip`은 fzf의 기본 후보 생성기에 적용된다. `FZF_CTRL_T_COMMAND`로 `fd` 같은 별도 생성기를 지정한다면 그 명령에서 제외 규칙을 관리해야 한다.

Ctrl-Y는 `realpath`로 현재 후보의 절대 경로를 구하고 심볼릭 링크를 해석한다. `perl -pe chomp`는 결과의 줄 끝 개행을 제거한다. Alt-Y는 `printf %s`로 후보를 그대로 복사한다. 기본 walker의 후보는 상대 경로지만, 별도 생성기가 절대 경로를 제공한다면 Alt-Y도 그 값을 그대로 복사한다. 두 키의 역할은 macOS 전용 헤더에도 표시했다.

두 바인딩의 `{}`는 현재 강조된 후보 하나다. 여러 항목 전체를 복사하는 동작이 아니며, `+abort` 때문에 복사 후 경로를 명령행에 삽입하지 않고 닫힌다. 명령 실패 시에도 닫힐 수 있다는 제약은 남는다. macOS에서 `pbcopy`뿐 아니라 `realpath`와 `perl`도 필요하다. `perl -pe chomp`는 각 출력 줄의 끝을 제거하므로 파일명 자체에 개행이 들어간 경우 이를 보존하는 복사 방식은 아니다.

또한 Ctrl-T에는 디렉터리도 나타나지만, 위 `bat` 명령은 텍스트 파일 미리보기용이다. 디렉터리 구조나 이미지까지 보여주는 범용 미리보기로 확장하지 않았다. 미리보기 스크롤은 Shift+위·아래 방향키와 마우스 휠이라는 기본 동작을 사용하고, 별도 바인딩은 추가하지 않았다.

## 확인한 범위와 적용

Bash·Zsh·Fish 템플릿을 렌더링하고 문법을 검사한 뒤, 세 셸이 동일한 옵션 문자열을 내보내는지 확인했다. Linux·Windows 대상 렌더링에서는 공통 옵션을 유지하면서 macOS 복사 바인딩이 빠지는 것도 확인했다. 다른 OS에서 실제 셸을 실행한 검증은 아니다.

실제 fzf 선택 화면에서는 제외 디렉터리의 파일이 후보에 없는지, `bat` 내용이 표시되는지, Ctrl-/가 아래쪽 → 숨김 → 오른쪽으로 전환되는지 확인했다. 별도로 `--height=80%`를 먼저 넣은 상태에서도 `--no-height`가 전체 화면으로 전환하는지, 파일 선택 결과가 유지되는지 확인했다.

복사 검증에서는 시스템 클립보드를 바꾸지 않도록 `pbcopy`만 대체 명령으로 받았다. 세 셸에서 내보낸 옵션으로 실제 fzf를 실행하고, 공백·작은따옴표·`$`가 들어간 심볼릭 링크 후보에 Ctrl-Y와 Alt-Y를 각각 입력했다. Ctrl-Y는 링크 대상의 절대 경로, Alt-Y는 상대 경로 후보를 개행 없이 전달했고, 두 경우 모두 선택기는 경로 출력 없이 닫혔다. 헤더 표시도 확인했다. 실제 `pbcopy` 클립보드 쓰기까지 검증한 것은 아니다.

변경할 곳은 생성된 홈 파일이 아니라 YAML이다. 적용 전에 변경 내용을 확인하고 셸 설정만 반영한다.

```sh
chezmoi diff ~/.bashrc ~/.zshrc ~/.config/fish/config.fish
chezmoi apply ~/.bashrc ~/.zshrc ~/.config/fish/config.fish
```

적용 후 새 대화형 셸을 열면 된다. fzf의 셸 통합과 `--walker-skip`을 지원하는 버전, 미리보기용 `bat`이 필요하다.

이 구조의 이점은 파일 수가 줄어드는 것이 아니다. **옵션 변경은 한곳에서 하고, 실행 순서는 각 셸 파일에서 읽을 수 있다.** 이후 셸별 차이가 필요해지면 차이를 명시하면 된다. 지금은 동일한 Ctrl-T 경험을 제공하는 데 필요한 만큼만 공통화했다.
