---
title       : 셸로 파일명·문자열 일괄 변경하기
description : "bash 파라미터 확장, sed, brew rename, find -exec로 다수 파일의 이름·경로·내용을 한 번에 바꾸는 패턴. 그리고 -exec vs | xargs 중 언제 무엇을 쓰나."
date        : 2021-11-05 10:36:15 +0900
updated     : 2026-07-09 09:00:00 +0900
categories  : [shell, "검색·파일 처리"]
tags        : [bash, sed, rename, find]
redirect_from:
  - /posts/shell/2025-09-19-exec-vs-pipe/
pin         : false
hidden      : false
---

확장자/접미사 변경, 경로 안의 특정 문자열 치환, 패턴 매칭 후 이동 — 셸에서 자주 마주치는 일괄 변경 패턴을 정리한다.

> 관련 글
> - [셸 백그라운드 잡: &, nohup, disown, tmux의 차이](/posts/shell/2026-06-16-background-jobs-and-session/) — nohup으로 띄우는 법
> - [프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill](/posts/linux/2026-06-16-process-find-and-kill/) — `lsof + kill`로 포트 점유 프로세스 종료

## 1. 확장자/접미사 일괄 변경

bash 파라미터 확장(`${var/pattern/replacement}`)이 가장 가볍다.

```bash
for file in *_h.png; do
  mv "$file" "${file/_h.png/_half.png}"
done
```

한 줄:

```bash
for file in *_h.png; do mv "$file" "${file/_h.png/_half.png}"; done
```

## 2. 경로 안의 문자열 치환 — sed

파일 경로 자체에 들어있는 문자열을 바꿀 때.

```bash
for path in $(find . -name '*.txt'); do
  mv "$path" "$(echo "$path" | sed 's|/e/|/h/|')"
done
```

- 구분자는 `/` 대신 `|`를 쓰면 경로 안의 `/`와 충돌하지 않는다.
- 공백 포함 파일명을 다룬다면 `find ... -print0 | xargs -0` 패턴이 더 안전.

## 3. brew rename — 매크로 한 줄

macOS·리눅스 모두 `rename` 유틸리티가 있다(macOS는 `brew install rename`).

```bash
rename 's/old/new/g' *
```

Perl 정규식이라 표현이 풍부하다. `-n` 옵션으로 실제 변경 없이 미리 결과를 확인할 수 있다.

```bash
rename -n 's/[A-Z]+/lower/g' *.log
```

## 4. find -exec — 매칭 파일을 다른 위치로 이동

이름에 `AAA`가 포함된 파일을 한 번에 옮긴다.

```bash
find path_A -name '*AAA*' -exec mv {} path_B \;
```

- `{}`은 매칭된 파일 경로, `\;` 는 명령 종료자.
- 다수 파일을 한 번에 처리하려면 `+`로 묶는 게 더 빠르다: `... -exec mv -t path_B {} +`.

## 5. `-exec` vs `| xargs` — 어느 걸 쓰나

찾은 파일에 명령을 돌리는 방법은 `find -exec`와 `find ... | xargs` 두 갈래다. 갈림길만 잡으면 된다.

| 특징 | `-exec` | `\| xargs` |
|---|---|---|
| 동작 | 각 파일마다(`\;`) 또는 묶어서(`+`) 실행 | 표준 입력을 인자로 묶어 실행 |
| 공백·특수문자 | 안전 | 주의 — `-print0 \| xargs -0` 필요 |
| 성능 | `\;` 느림 · `+` 빠름 | 묶어서 처리 → 빠름 |
| 적용 범위 | **`find` 전용 옵션** | `find` 밖에서도 씀 (`ls *.txt \| xargs rm`) |

정리하면:

- **`find`로 찾은 파일만** 처리 → `-exec`. 안전하고 문법이 짧다(대량이면 `+`).
- **`find`가 아닌 명령의 출력**을 인자로 넘길 때 → `xargs`. 단, 공백/개행 안전을 위해 가능하면 `-print0 | xargs -0`.

```bash
# find 전용: -exec
find . -name "*.txt" -exec cat {} +

# find 밖에서도 되는 xargs (공백 안전 버전은 find와 -print0 조합일 때)
ls *.txt | xargs rm
```

## 정리

- 단순 확장자 치환 → bash 파라미터 확장.
- 경로 패턴 치환 → `sed` 파이프 + `mv`.
- 표현력 필요 → `rename` (Perl 정규식, `-n` 으로 dry-run).
- 디렉토리 트리에서 골라 이동 → `find -exec ... \;` 또는 `+`.
- 찾은 파일에 명령 돌리기 → `find` 결과만이면 `-exec`, 그 외/파이프 조합이면 `xargs`(`-0`로 공백 안전).
