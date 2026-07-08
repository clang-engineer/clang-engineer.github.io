---
title       : "grep이 한글을 못 찾을 때 — LC_ALL=C와 멀티바이트 문자 클래스"
description : "LC_ALL=C에서 grep이 한글 문자 범위를 바이트로 쪼개 오탐하는 이유와 코드포인트 비교 해법."
date        : 2026-07-08 12:00:00 +0900
updated     : 2026-07-08 12:00:00 +0900
categories  : [shell]
tags        : [grep, locale, utf-8, unicode, korean]
pin         : false
hidden      : false
---

`LC_ALL=C grep '[가-힣]'` 는 한글을 신뢰성 있게 못 잡는다. `LC_ALL=C`(POSIX/C 로케일)에서 grep은 문자열을 **바이트 단위**로 해석하는데, `[가-힣]` 같은 멀티바이트(UTF-8) 문자 범위는 바이트로 쪼개지면 의미가 깨져 **같은 파일이 실행마다 다른 결과**(7 → 0 등)를 낸다. (`grep`(그렙) = ed 편집기의 `g/re/p` = global / regular expression / print에서 유래.)

## 재현

```sh
# 불안정 — 파일/버전에 따라 오탐·누락
LC_ALL=C grep -c '[가-힣]' file.md

# 로케일을 UTF-8로 주면 문자 단위 매칭 (그나마 나음, 환경 의존)
LC_ALL=ko_KR.UTF-8 grep -c '[가-힣]' file.md
```

## 확실한 방법 — 코드포인트로 직접 비교

로케일·grep 구현에 의존하지 않으려면 파이썬으로 유니코드 코드포인트를 직접 검사한다. 한글 음절 블록은 `U+AC00`(가) ~ `U+D7A3`(힣).

```python
# 파일별 한글 문자 수 (git 추적 파일 전수 스캔)
import subprocess
files = subprocess.check_output(["git","ls-files"]).decode().split()
for f in files:
    t = open(f, encoding="utf-8", errors="ignore").read()
    n = sum(1 for c in t if '가' <= c <= '힣')
    if n:
        print(n, f)
```

## 교훈

- `LC_ALL=C`는 **속도/ASCII 안정성**을 위한 것이지 비ASCII 문자 클래스 매칭엔 부적합.
- 두 방법의 결과가 어긋나면 grep 쪽을 의심하고 **코드포인트 비교를 정답으로** 삼는다.
- 리포지토리 i18n(한글 잔여 검출) 같은 정확도가 중요한 작업엔 grep보다 스크립트가 낫다.
