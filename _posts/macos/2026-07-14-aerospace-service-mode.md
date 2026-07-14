---
title       : AeroSpace 서비스 모드 — 저빈도·위험 동작을 별도 모드로 격리하는 설계
description : "AeroSpace의 서비스 모드(alt-shift-;)에 어떤 기능이 있고, 왜 floating 토글·레이아웃 리셋·창 대량 닫기를 메인 키맵이 아닌 별도 모드에 뒀는지 설계 철학을 vim·i3 계보와 함께 정리한다. 바인딩이 병합이 아니라 대체라는 함정도 다룬다."
date        : 2026-07-14 14:00:00 +0900
categories  : [macos, "창 관리"]
tags        : [aerospace, window-manager, tiling, service-mode, guide]
pin         : false
hidden      : false
---

[AeroSpace](https://github.com/nikitabobko/AeroSpace) 기본 키맵을 보면 포커스 이동·창 이동·워크스페이스 전환은 `Alt` 조합 하나로 바로 되는데, **floating↔tiling 토글이나 레이아웃 리셋은 메인 키맵에 아예 없다.** 대신 **서비스 모드(service mode)**라는 별도 모드 안에 숨어 있다. 이 글은 서비스 모드에 무엇이 있고, 왜 이렇게 나눴는지를 설계 관점에서 정리한다. 설치·기본 키맵은 [AeroSpace 기본](/posts/macos/2026-07-03-aerospace-basics/)에서 다뤘다.

## 서비스 모드란

`Alt + Shift + ;` 를 누르면 **서비스 모드**로 진입한다. 진입 후 정해진 키를 누르면 해당 동작을 수행하고 **자동으로 메인 모드로 돌아온다**. 키는 대부분 **소문자 맨키**(Shift 없이)로 누른다.

```toml
[mode.service.binding]
esc = ['reload-config', 'mode main']
r = ['flatten-workspace-tree', 'mode main']
f = ['layout floating tiling', 'mode main']
backspace = ['close-all-windows-but-current', 'mode main']
alt-shift-h = ['join-with left', 'mode main']
alt-shift-j = ['join-with down', 'mode main']
alt-shift-k = ['join-with up', 'mode main']
alt-shift-l = ['join-with right', 'mode main']
```

각 바인딩 끝에 붙은 `'mode main'`이 핵심이다 — 동작 하나를 하고 곧바로 일상 모드로 빠져나오는 **one-shot(한 번 쓰고 복귀)** 구조다. 서비스 모드에 "머무는" 게 아니라 잠깐 들렀다 나오는 서랍에 가깝다.

## 무엇이 들어있나

| 키 | 명령 | 하는 일 |
|---|---|---|
| `esc` | `reload-config` | 설정 파일을 다시 읽어 반영 |
| `r` | `flatten-workspace-tree` | 레이아웃 초기화 — 분할 트리를 평탄화 |
| `f` | `layout floating tiling` | floating↔tiling 토글 |
| `backspace` | `close-all-windows-but-current` | 현재 창만 남기고 나머지 닫기 |
| `Alt+Shift+H/J/K/L` | `join-with` | 인접 창과 하나의 컨테이너로 묶기 |

낯선 명령 몇 개만 풀어보면:

- **flatten-workspace-tree**: AeroSpace는 창을 **트리**로 관리한다. 가로 분할 안에 세로 분할이, 그 안에 또 분할이 중첩되는 구조다. "flatten(평탄화)"은 그 중첩을 다 펴서 한 레벨로 되돌린다. 창들이 이상하게 겹치거나 분할이 꼬였을 때의 리셋 버튼이다.
- **join-with**: 타일링 WM에서 창을 개별이 아니라 **컨테이너(그룹)** 단위로 묶는 것. 묶인 창들은 한 분할 셀을 공유해 함께 배치·이동된다. i3의 "split container"와 같은 개념이다.

> 기본 설정에는 `#s = 'layout sticky tiling'`(모든 워크스페이스에 창 고정)도 있지만 **주석 처리로 비활성** 상태다. 필요할 때 주석을 풀어 쓴다.
{: .prompt-tip }

## 왜 메인이 아니라 서비스 모드인가

키를 어디에 둘지는 **빈도와 위험도**로 갈린다.

- **메인 모드 = 고빈도**: 포커스 이동(`Alt+HJKL`), 창 이동, 워크스페이스 전환, 크기 조절. 하루에 수십 번 누르므로 **모디파이어 한 번**으로 끝낸다.
- **서비스 모드 = 저빈도·위험**: 위 표의 동작들은 "필요할 때 가끔"이다. 게다가 일부는 되돌리기 번거롭다.
  - `backspace`(현재 창 빼고 다 닫기)는 실수로 누르면 아프다.
  - `r`(레이아웃 리셋), `esc`(설정 리로드)는 유지보수성 동작이다.

이걸 전부 메인에 두면 **귀한 키 공간을 잡아먹고 오발 위험**도 커진다. 그래서 "모드 진입"이라는 **한 겹의 벽**을 세워 격리한 것이다. 자주 안 쓰는 것과 위험한 것을 일상 키맵에서 떼어내는, 의도된 분류다.

### 계보 — vim과 i3의 모드

이 "모드로 키맵을 계층화" 발상은 새로운 게 아니다.

- **vim**: normal/insert/visual 모드. 같은 키가 모드에 따라 다른 뜻을 갖는다.
- **i3 / sway**: `mode "resize" { ... }` 같은 서브모드. 진입해서 조작하고 `Escape`로 빠져나온다.

AeroSpace가 "i3 스타일 타일링 WM"으로 소개되는 이유가 여기 있다. 서비스 모드 바인딩의 `'mode main'` 접미사는 정확히 i3 서브모드의 "빠져나오기"에 대응한다. 도구의 이름값(i3 스타일)이 키맵 설계에까지 일관되게 반영돼 있는 셈이다.

## 함정 — 바인딩은 병합이 아니라 대체다

서비스 모드를 처음 만나면 흔히 걸리는 함정이 하나 있다. AeroSpace는 **키바인딩을 병합해주지 않는다.**

대부분의 설정값(`gaps`, `start-at-login` 등)은 config에 안 적으면 **기본값으로 폴백**된다. 그런데 `mode.*.binding`만은 예외다. 공식 문서 표현으로는 **"falls back to the empty TOML table"** — 즉 안 적으면 기본값이 아니라 **빈 테이블**로 폴백한다.

결과적으로:

```toml
[mode.main.binding]
alt-shift-f = 'layout floating tiling'   # 이 한 줄만 적으면...
# alt-h, alt-j, ... 기본 포커스 이동 키가 전부 사라진다
```

`[mode.main.binding]`을 **하나라도 정의하는 순간**, 나열하지 않은 기본 바인딩은 전부 없어진다. 그래서 커스텀 키를 추가하려면 **기본 키까지 직접 다 나열**해야 한다.

`[mode.service.binding]`도 마찬가지다. 이 블록을 config에 아예 안 적으면 **서비스 모드 전체가 죽는다** — `esc`·`r`·`f`·`backspace`·join-with가 전부 동작하지 않는다. "기본값이니까 안 적어도 되겠지"가 통하지 않는 지점이다.

> 이 동작 때문에, 기본 config를 커스터마이징할 때는 **기본 config 전체를 복사해 두고 거기서 수정**하는 방식이 안전하다. 지우는 순간 폴백이 아니라 소멸이기 때문이다.
{: .prompt-warning }

## 정리 — "기본값을 따른다"의 진짜 의미

floating 토글을 서비스 모드 `f`에 둘지, 아니면 메인으로 끌어올려 `alt-shift-f` 같은 한 손 키로 만들지는 **취향 문제가 아니다.** "이 동작이 내 워크플로에서 고빈도인가"라는 질문이다.

설계자는 floating 토글을 저빈도로 분류해 서비스 모드에 뒀다. 만약 내가 하루에도 수십 번 토글한다면 그 분류가 내게는 안 맞는 것이고, 그때 비로소 메인으로 올리는 커스텀이 정당화된다. 반대로 어쩌다 한 번이면 기본 자리(서비스 모드)가 옳다.

**기본값을 따른다는 건 단순히 남의 설정을 베끼는 게 아니라, 도구 설계자의 분류 체계(빈도·안전)를 일단 신뢰하고 받아들이는 것이다.** 그 분류가 내 실제 사용 패턴과 어긋날 때만, 근거를 갖고 벗어나면 된다.

## 관련 글

- [AeroSpace 기본 — 워크스페이스·단축키·on-window-detected](/posts/macos/2026-07-03-aerospace-basics/)
- [AeroSpace 단축키가 갑자기 안 될 때 — macOS Secure Input](/posts/macos/2026-06-07-aerospace-secure-input-hotkey-blocked/) — 서비스 모드 키가 안 먹힐 때 의심해볼 시스템 레벨 원인
