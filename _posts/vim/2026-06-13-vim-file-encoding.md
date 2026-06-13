---
title       : "Vim에서 파일 인코딩 다루기 — :e ++enc과 fileencoding"
description : "euc-kr·utf-8 등 다른 인코딩 파일을 vim에서 정확히 읽고 저장하는 방법"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [vim, "사용·키맵"]
tags        : [vim, encoding, utf-8, euc-kr]
pin         : false
hidden      : false
---

vim은 파일을 열 때 인코딩을 추정한다. 추정이 빗나가면 한글이 깨져 보이거나 저장이 잘못된다.

## 표시 인코딩 강제 변경

이미 연 파일을 다른 인코딩으로 다시 읽는다.

```vim
:e ++enc=utf-8
:e ++enc=euc-kr
```

깨져 보이던 파일이 제대로 표시되면 그 인코딩이 맞다.

## 저장 인코딩 변경

저장될 파일의 인코딩을 바꾼다.

```vim
:set fileencoding=utf-8
:w
```

읽기 인코딩과 저장 인코딩이 다르면 변환되어 저장된다. euc-kr 파일을 열어 utf-8로 저장하면 변환되어 들어간다.

## 자동 추정 순서 설정

`fileencodings`는 vim이 파일 인코딩을 시도하는 순서다. 위에서 아래로 시도하다 디코딩이 성공하면 멈춘다.

```vim
set fileencodings=ucs-bom,utf-8,euc-kr,latin1
```

한국어 환경에서는 `euc-kr`을 포함시켜 둔다. 안 들어 있으면 euc-kr 파일이 latin1로 잘못 해석되어 한글이 깨진다.

## 관련 옵션

| 옵션 | 의미 |
|---|---|
| `encoding` | vim 내부 작업용 인코딩 (보통 `utf-8`) |
| `fileencoding` | 현재 버퍼의 디스크 인코딩 |
| `fileencodings` | 읽을 때 시도 순서 |
| `termencoding` | 터미널 입출력 인코딩 |
