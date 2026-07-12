---
title       : "tmux 훅의 두 함정 — #{window_id}와 pane-exited가 안 잡는 kill-pane"
description : "tmux 훅 안에서 #{window_id}는 이벤트 윈도우가 아니고, pane-exited는 kill-pane에 안 뜬다. 계측으로 두 함정을 잡은 기록."
date        : 2026-07-11 21:00:00 +0900
updated     : 2026-07-11 21:00:00 +0900
categories  : [tmux]
tags        : [hooks, plugin, debugging, format-variables]
pin         : false
hidden      : false
---

tmux 훅(hook)은 "특정 이벤트가 나면 이 명령을 실행"하는 이벤트 바인딩이다. 겉보기엔 단순하지만 두 가지 비자명한 함정이 있다 — **훅 안에서 포맷 변수(`#{window_id}` 등)가 무엇으로 확장되는가**, 그리고 **어떤 이벤트가 실제로 언제 발화하는가**. 둘 다 이름의 표면 의미에 속으면 놓친다.

"사이드바 패널만 남으면 윈도우를 자동으로 닫는다"는 기능이 안 먹는 걸 파다가 두 함정을 동시에 만났고, 계측으로 각각을 특정했다. (예시는 `hiroppy/tmux-agent-sidebar` 플러그인이지만 교훈은 tmux 훅 전반에 적용된다.)

1. **훅 안의 `#{window_id}`는 이벤트 윈도우가 아니라 attached 클라이언트의 현재 윈도우로 확장된다.**
   → 이벤트 대상은 `#{hook_window}` / `#{hook_pane}`을 써야 한다.
2. **`pane-exited` 훅은 쉘의 프로세스 종료(`exit`/`C-d`)에만 뜨고, `kill-pane`(prefix+x)엔 안 뜬다.**
   → "패널이 어떤 방식으로든 사라짐"을 잡으려면 `window-layout-changed`를 써야 한다.

## 원래 훅 (버그 둘 다 들어있음)

```tmux
set-hook -ga pane-exited 'run-shell "\"#{@agent_sidebar_bin}\" auto-close \"#{window_id}\""'
```

`auto-close`는 인자로 받은 윈도우의 패널을 세서 "사이드바 아닌 패널이 0개면 kill-window" 한다.
로직(`should_kill_window`) 자체는 멀쩡 — 문제는 **어느 윈도우를, 언제** 검사하느냐였다.

## 버그 1 — `#{window_id}`가 엉뚱한 윈도우

발화 시점에 두 변수를 나란히 로깅:

```tmux
set-hook -ga pane-exited "run-shell -b '/bin/echo winid=[#{window_id}] hookwin=[#{hook_window}] >> /tmp/h.log'"
# → winid=[@0]  hookwin=[@43]
#   @43 = 실제로 패널이 종료된 윈도우 (정답)
#   @0  = 내가 붙어있는 클라이언트의 현재 윈도우 (엉뚱)
```

포맷 변수는 "기준 대상(target)"에 상대적이다. 훅이 명령을 실행할 때 tmux가 세우는 기준은
**이벤트 윈도우가 아니라 세션/클라이언트의 현재 윈도우**다. 그래서 `auto-close @0`이 호출되고,
@0엔 작업 패널이 멀쩡히 있으니 "안 죽여도 됨" → 고아 @43은 방치. 이벤트가 난 대상은 tmux가
따로 스냅샷해 두는 `#{hook_window}`(=@43)에만 정확히 담겨 있다.

## 버그 2 — `pane-exited`는 kill-pane에 안 뜬다

버그 1을 `#{hook_window}`로 고쳤더니 `exit`은 되는데 `prefix+x`(kill-pane)로 닫으면 여전히 고아.
어떤 훅이 뜨는지 계측:

```tmux
# 사이드바 있는 윈도우에서 작업 패널을 kill-pane 했을 때 발화한 훅
after-kill-pane        hookwin=(빈값)      # 발화하지만 hook_window를 못 줌
window-layout-changed  hookwin=@88         # 발화 + 올바른 이벤트 윈도우
window-pane-changed    hookwin=@88
pane-exited            → 발화 안 함          # ← kill-pane엔 안 뜸
```

`pane-exited`는 이름대로 **패널 안 프로세스가 exit**할 때만 뜬다. `kill-pane`은 프로세스 exit이
아니라 패널을 강제로 제거하는 것이라 안 뜬다. 즉 플러그인이 `pane-exited` 하나만 건 건
"닫는 방법의 절반(자연 종료)"만 커버한 설계 구멍.

## 최종 수정 — 훅 하나로 둘 다 해결

`window-layout-changed`는 **패널이 추가/제거/리사이즈되어 레이아웃이 바뀔 때마다** 뜬다.
exit이든 kill-pane이든 패널이 사라지면 레이아웃이 바뀌므로 **모든 종료 경로를 커버**하고,
`#{hook_window}`도 올바르게 준다. auto-close는 "사이드바만 남았을 때"만 kill하므로,
split·resize 같은 추가 발화는 전부 무해한 no-op이다.

```tmux
# .tmux.conf에서 run tpm 이후에 (플러그인 훅을 이기게)
set-hook -gu pane-exited                 # 플러그인의 버그 훅 제거
set-hook -gu window-layout-changed       # 리로드 시 내 훅 중복 방지 (이 훅은 아무도 안 씀)
set-hook -ga window-layout-changed 'run-shell "\"#{@agent_sidebar_bin}\" auto-close \"#{hook_window}\""'
```

검증(작업패널 종료 → 닫혀야 / 사이드바 종료 → 살아야), focused·detached × exit·kill-pane 전 조합 통과.

## 교훈

- **훅 안에서 이벤트 대상은 `#{hook_window}` / `#{hook_pane}`.** `#{window_id}`·`#{pane_id}`는
  훅 컨텍스트에선 "현재 클라이언트가 보고 있는 것"으로 풀린다 — 이벤트 대상과 다를 수 있다.
- **훅 이벤트 선택이 절반이다.** `pane-exited`(프로세스 종료)와 "패널이 사라짐"은 다른 사건이다.
  kill-pane·강제 제거까지 잡으려면 `window-layout-changed`가 맞다. 이벤트 이름의 표면 의미에
  속지 말고 "실제로 언제 뜨는가"를 계측해서 고를 것.
- 디버깅 순서: (1) 로직을 손으로 호출해 정상 확인 → 범인은 로직 아닌 **호출 인자/시점**으로 좁힘,
  (2) 발화 시점에 변수 로깅으로 `@0` vs `@43` 불일치 확인, (3) 여러 후보 훅에 마커 걸고 kill-pane
  때 뭐가 뜨는지 관찰 → 올바른 훅 선정.
- **"우연히 되는 케이스"에 속지 말 것.** 처음엔 kill-pane이 되는 것처럼 보였는데, 재현 조건
  (포커스·detached, 종료 방식)을 통제하니 사실은 pane-exited가 kill-pane에 아예 안 떴던 것.
  결정적 repro가 나올 때까지 조건을 강제해야 진짜 그림이 보인다.

## 훅 스코프와 `-gu` 클로버

위 수정에서 `set-hook -gu`로 훅을 갈아끼웠는데, 그 `-g`/`-u`의 의미가 핵심이다.

- **훅은 보통 `-g`(global)로 심는다.** `-g`는 tmux **서버 전역**(모든 세션·윈도우) 스코프다.
  사이드바처럼 "어디서 윈도우/패널이 생기고 닫히든 반응한다"가 목적인 플러그인엔 global이
  유일하게 말이 되는 선택. (플러그인 훅은 전부 `set-hook -ga` = global + append)
- **`set-hook -gu <event>`는 인덱스 없이 쓰면 그 이벤트의 global 훅을 *전부* 지운다.**
  그 이벤트를 남(다른 플러그인)도 쓰면 같이 날아가는 footgun. 통째로 `-gu`는 그 이벤트를
  나만 쓸 때만 안전.
- **남 것 안 건드리고 내 것만 지우려면** 플러그인이 쓰는 dedup 관용구 — `show-hooks`로 목록을
  뽑아 내 마커가 든 줄의 **인덱스만** 골라 제거:

  ```bash
  tmux show-hooks -g <event> | awk '/내마커/ { print $1 }' | xargs -rn1 tmux set-hook -gu
  # $1 = "event[3]" 같은 인덱스 문자열 → 그 항목만 언셋
  ```

- **플러그인 훅을 이기려면 내 override도 같은 `-g` + `run tpm` 이후**에 실행돼야 한다.
  스코프가 안 맞으면(예: `-g` 누락) 플러그인의 global 훅이 안 지워진다.

사례: `pane-exited`는 이 이벤트의 global 훅이 플러그인 것 하나뿐이라 `-gu` 통째로 안전.
`window-layout-changed`는 아무도 안 쓰던 이벤트라 `-gu` 후 재등록이 안전하고, 따로 얹은
사이드바 폭-고정 훅과도 파일 순서상(`-gu` → auto-close 등록 → 폭고정 등록) 공존한다.

플래그·관용구 레퍼런스는 `man tmux`의 hooks 섹션, 플러그인 제작 전반은 [tmux 플러그인은 어떻게 만드나](/posts/tmux/2026-07-09-tmux-plugin-authoring/) 참고.
