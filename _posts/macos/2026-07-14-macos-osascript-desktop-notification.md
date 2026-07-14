---
title       : "macOS 데스크톱 알림을 osascript로 쏘기 — 그리고 안 뜰 때 (귀속 함정)"
description : "display notification으로 스크립트·CLI에서 데스크톱 배너를 띄우는 법과, 에러 없이 조용히 사라질 때의 원인인 알림 귀속(attribution)을 추적하는 법."
date        : 2026-07-14 13:00:00 +0900
updated     : 2026-07-14 13:00:00 +0900
categories  : [macos]
tags        : [osascript, applescript, notification, tcc, attribution, cli, guide]
pin         : false
hidden      : false
---

긴 빌드가 끝났을 때, 배포 스크립트가 실패했을 때, CLI 도구가 사용자 입력을 기다릴 때 —
터미널만 쳐다보지 않아도 되게 **데스크톱 알림 배너**를 띄우고 싶을 때가 있다.
macOS에서는 `osascript`(**o**pen **s**cripting **a**rchitecture script — AppleScript를
커맨드라인에서 실행하는 도구) 한 줄이면 된다.

문제는 이게 **에러 없이 조용히 사라지는** 경우가 있다는 것이다. 명령은 성공(exit 0)했는데
배너가 안 뜬다. 이 글은 사용법부터, 안 뜰 때의 진짜 원인인 **알림 귀속(attribution)**까지
정리한다.

## 1. 기본 사용법

가장 단순한 형태:

```sh
osascript -e 'display notification "본문 메시지" with title "제목"'
```

`display notification`은 AppleScript 명령이고, `osascript -e`로 인라인 실행한다.
쓸 수 있는 필드는 세 가지다:

```sh
osascript -e 'display notification "빌드가 끝났습니다" \
  with title "make" \
  subtitle "target: release" \
  sound name "Glass"'
```

| 필드 | 역할 |
|---|---|
| (첫 문자열) | 본문 (필수) |
| `with title` | 굵은 제목 줄 |
| `subtitle` | 제목 아래 보조 줄 |
| `sound name` | 재생할 사운드 (`/System/Library/Sounds/*.aiff` 파일명, 예: `Glass`, `Ping`, `Submarine`) |

### 개발에서 애용하는 패턴

긴 명령 뒤에 붙여 **끝나면 알림** — 다른 창 보다가도 완료를 놓치지 않는다:

```sh
# 성공/실패에 따라 다른 알림
make build \
  && osascript -e 'display notification "성공 ✅" with title "build"' \
  || osascript -e 'display notification "실패 ❌" with title "build" sound name "Basso"'
```

셸 함수로 감싸두면 아무 명령에나 붙일 수 있다:

```sh
notify() {
  "$@"
  local status=$?
  if [ $status -eq 0 ]; then
    osascript -e "display notification \"done ✅\" with title \"$1\""
  else
    osascript -e "display notification \"exit $status ❌\" with title \"$1\" sound name \"Basso\""
  fi
  return $status
}

# 사용: notify make build   /   notify npm test
```

여기까지는 잘 동작한다 — **알림 권한이 제대로 잡혀 있다면.** 안 뜨기 시작하면 아래가 본론이다.

## 2. 안 뜬다? 핵심은 "귀속(attribution)"

`osascript` 알림이 조용히 사라진다면, 명령이 실패한 게 아니라 macOS가 그 알림을
**어느 앱 앞으로 달았는지(귀속, attribution)**를 의심해야 한다.
**귀속된 앱의 알림 권한이 꺼져 있으면 에러 없이 드롭된다.**

핵심 규칙: 같은 `display notification` 명령이어도 **누가 osascript를 실행했느냐(부모/책임
프로세스)**에 따라 귀속 앱이 달라진다.

- **셸에서 직접 실행** → `스크립트 편집기(Script Editor)`로 귀속.
  osascript의 기본 책임 앱이다.
- **CLI 도구/바이너리가 실행** → 그 프로세스의 **책임 조상(responsible process)**으로 귀속.
  터미널 앱이 아니라, 프로세스 트리를 거슬러 올라간 최상위 책임 앱이다.

즉 **터미널 창 안에서 명령을 쳤다고 해서 터미널 앱으로 귀속되는 게 아니다.**

### 실제 사례: "터미널 안이니 터미널 앱이겠지"의 함정

터미널 에뮬레이터(예: Ghostty) 안에서 도는 어떤 CLI 도구가 알림을 못 띄우는 문제를 겪었다.
직관적으로 "터미널 창 안에서 떴으니 터미널 앱 권한을 켜면 되겠지" 하고 그 앱의 알림을
켰지만 — **안 떴다.**

원인은 그 도구가 `CLI 런처 → 훅 → 바이너리 → osascript` 체인 안에서 돌고 있었고,
macOS는 알림을 **터미널 앱이 아니라 프로세스 트리 최상단의 책임 앱(여기선 그 CLI 런처)**
앞으로 달았기 때문이다. 그 **런처의** 알림 권한을 켜니 그제서야 배너가 떴다.

> **함정 요약**: "터미널 안에서 실행 = 터미널 앱 귀속"은 틀리다.
> `osascript`를 **직접 호출한 프로세스의 책임 체인**을 따라가야 한다.
> 셸에서 직접이면 `스크립트 편집기`, 어떤 도구/훅을 경유했으면 그 **책임 조상 앱**이다.

## 3. 판별 기법: "발송을 시도했나 vs macOS가 드롭했나"

배너가 안 뜰 때, 문제가 두 층 중 어디에 있는지 눈으로는 못 가린다:

1. **내 코드가 osascript를 아예 안 불렀나** (게이트·조건문에서 막힘)
2. **불렀는데 macOS가 귀속/권한 때문에 드롭했나**

`PATH` 맨 앞에 osascript를 가로채는 **도청 래퍼**를 끼우면 객관적으로 갈린다.
실제 osascript를 호출하기 직전에 인자를 로그로 남기고 진짜 바이너리로 넘긴다:

```sh
SPY=/tmp/spy; mkdir -p "$SPY"
REAL=$(command -v osascript)
cat > "$SPY/osascript" <<EOF
#!/bin/sh
echo "[\$(date +%T)] args: \$*" >> "$SPY/osascript.log"
exec "$REAL" "\$@"
EOF
chmod +x "$SPY/osascript"

# 대상 도구를 PATH="$SPY:$PATH" 로 실행한 뒤 로그 확인
PATH="$SPY:$PATH" your-tool
cat "$SPY/osascript.log"
```

로그를 읽는 법:

- 로그에 `display notification`이 **안 찍힘** → 코드가 osascript를 부르기 전에 막힌 것.
  알림 권한 문제가 아니라 **내 코드/조건 로직**을 봐야 한다.
- `display notification`까지 **찍혔는데 배너가 없음** → 발송은 했고 **macOS가 귀속/권한으로
  드롭**한 것. 2번(귀속 앱 권한)을 손봐야 한다.

## 4. 해결 체크리스트

`osascript` 알림이 안 뜰 때 순서대로:

1. **다른 앱 알림은 뜨나?** → 뜨면 macOS 알림 자체는 정상. 특정 앱 귀속 문제로 좁혀진다.
2. **누가 osascript를 실행하나?** → 셸에서 직접이면 `스크립트 편집기`,
   도구·스크립트를 경유하면 그 **책임 조상 앱**.
3. **시스템 설정 → 알림**에서 **그 귀속 앱**을 찾아 켜고 배너/알림 스타일로 설정.
   (터미널 앱만 켜고 끝내지 말 것 — 2번 규칙 때문에 엉뚱한 앱일 수 있다.)
4. 그래도 안 풀리면 **3장의 PATH-shadow 래퍼**로 "발송 시도 자체가 있었는지"부터 확정한다.

---

이 "누가 실행했나로 권한 주체가 갈린다"는 감각은 macOS 권한 모델 전반에 통한다.
파일 접근 권한(TCC)도 같은 방식으로 **책임 프로세스** 단위로 부여·리셋된다 —
관련해서
[macOS가 갑자기 ~/Desktop 접근을 막을 때 — TCC 권한 리셋](/posts/macos/2026-07-08-macos-tcc-desktop-folder-block/)
글도 참고.
