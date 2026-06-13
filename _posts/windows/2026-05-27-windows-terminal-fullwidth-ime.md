---
title       : "Windows Terminal에서 영문이 넓게 나오고 명령어가 안 먹히면 IME 전각 모드"
description : "ｅｘｉｔ가 not recognized로 안 먹히면 폰트가 아니라 한글 IME 전각 모드가 켜진 것. Shift+Space로 해제."
date        : 2026-05-27 10:00:00 +0900
updated     : 2026-05-27 10:00:00 +0900
categories  : [windows, "터미널·입력"]
tags        : [hangul, encoding]
pin         : false
hidden      : false
---

Windows Terminal에서 영문 글자 간격이 비정상적으로 넓어 보이고 `exit` 같은 명령이 `not recognized` 오류로 안 먹히면, 폰트나 인코딩 문제가 아니라 **한글 IME의 전각(全角) 입력 모드**가 켜진 것이다.

## 증상

```text
❯ ｅｘｉｔ
ｅｘｉｔ : The term 'ｅｘｉｔ' is not recognized as the name of a cmdlet, ...
```

`ｅｘｉｔ`는 일반 `exit`가 아니라 **전각 라틴 문자**(U+FF45 `FULLWIDTH LATIN SMALL LETTER E` 등)다. 한글 같은 CJK 문자처럼 한 글자가 2칸을 차지해서 넓어 보이고, 일반 ASCII `exit`와 코드포인트가 완전히 다르므로 셸이 명령어로 인식하지 못한다.

## 원인과 해결

한글 IME에는 영문 입력 시 반각(`exit`)으로 넣을지 전각(`ｅｘｉｔ`)으로 넣을지 정하는 토글이 있고, 이게 어쩌다 전각으로 켜진 것이다.

- `Shift + Space` 가 전각/반각 토글로 잡혀 있는 경우가 많아, 한 번 눌러보면 바로 돌아온다.
- 또는 작업표시줄 IME 아이콘(`한`/`A`) 우클릭 → "반각/전각" 항목을 **반각(반자)** 으로 변경.

## 진단 팁

- **메모장에서 영문을 쳐본다.** 거기서도 넓게 나오면 IME 전각 모드 확정, 메모장은 멀쩡한데 터미널만 그러면 터미널 설정 문제.
- "영문이 넓다" → 폰트 문제로 단정하기 쉽지만, **명령어가 `not recognized`로 안 먹힌다**면 입력 자체가 다른 문자로 바뀌는 것이므로 IME 전각 모드가 범인이다.
