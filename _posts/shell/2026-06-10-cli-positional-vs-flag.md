---
title       : "CLI 인자 컨벤션 — positional과 --flag는 왜 섞어 쓰나"
description : "위치 인자와 옵션 플래그의 역할 분담, bash 파싱 최소 패턴, env var와의 비교."
date        : 2026-06-10 12:00:00 +0900
updated     : 2026-06-10 12:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [bash, cli, posix, convention, getopts]
pin         : false
hidden      : false
---

쉘 스크립트나 CLI 도구를 만들 때 인자를 모두 `--키` 형태로 줄까, 그냥 값만 쭉 나열할까 헷갈렸는데, 사실상 표준은 **둘을 섞어 쓰는 것**이다. 역할이 다르다.

## 위치 인자 vs 옵션 플래그

| 종류 | 형태 | 의미 |
|---|---|---|
| **위치 인자(positional)** | `snuh`, `private` | 명령의 핵심 대상. 순서로 의미가 정해짐. "뭘 할 건가" |
| **옵션 플래그(flag)** | `--keep-wifi`, `-v` | 위치 무관한 부가 옵션. 부울 토글이나 보조 값 |

예:
```bash
./setup.sh snuh private --keep-wifi
#          ^^^^ ^^^^^^^ ^^^^^^^^^^^
#          위치 인자들    옵션 플래그
```

## 주요 도구들도 같은 패턴

| 도구 | 위치 인자 | 플래그 |
|---|---|---|
| `git commit` | (없음) | `-m "msg"`, `--amend` |
| `git checkout` | `<branch>` | `-b`, `--track` |
| `docker run` | `<image>` | `--rm`, `-p 8080:80` |
| `kubectl apply` | (없음) | `-f file.yaml`, `--dry-run` |
| `npm install` | `<package>` | `--save-dev`, `-g` |
| `ssh` | `<user@host>` | `-p 22`, `-i key` |
| `cp` | `<src> <dst>` | `-r`, `-v` |

POSIX/GNU 컨벤션: 짧은 플래그 `-x`(자주 쓰는 한 글자), 긴 플래그 `--xxx`(가독성 우선).

## 왜 섞어 쓰나

1. **모호성 회피.** 모두 `--` 없이 쓰면 `./setup.sh snuh keep-wifi`에서 `keep-wifi`가 mode 자리에 들어와서 파싱이 깨진다.
2. **간결성 vs 확장성 균형.** 필수 인자는 짧게(위치), 부가 옵션은 명시적으로(플래그).
3. **확장성.** 새 옵션이 늘어나도 `--xxx` 형태로 자연스럽게 추가됨.

## bash에서 플래그 파싱하는 가장 짧은 방법

순서 자유 + 위치 인자와 섞기:
```bash
KEEP_WIFI=""
POSARGS=()
for arg in "$@"; do
  case "$arg" in
    --keep-wifi) KEEP_WIFI=1 ;;
    -h|--help)   usage; exit 0 ;;
    *)           POSARGS+=("$arg") ;;
  esac
done
set -- "${POSARGS[@]}"

HOSPITAL="$1"
MODE="${2:-private}"
```

플래그를 따로 걷어내고 위치 인자만 `$1`, `$2`로 다시 세팅. 옵션이 늘어나면 `getopts`(POSIX, 짧은 플래그 전용)나 `getopt`(GNU, 긴 플래그 지원)로 옮길 수 있다.

## env var와의 차이

`KEEP_WIFI=1 ./setup.sh ...` 같은 환경변수 전달 방식과의 비교:

- env var: bash가 명령 실행 직전에 변수로 주입. 셸 코드는 짧지만, 한 단어 토글로는 `KEEP_WIFI=1`처럼 `=값`이 무조건 필요. 그냥 `KEEP_WIFI`만 쳐서 켤 수 없음.
- 플래그: args 파싱 코드가 ~5줄 필요하지만, `--keep-wifi` 한 단어로 켤 수 있고 CLI 컨벤션에 부합.
