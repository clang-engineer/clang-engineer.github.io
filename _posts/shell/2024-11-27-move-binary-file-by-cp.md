---
title       : 바이너리 파일을 텍스트로 변환하여 복사 붙여넣기
description : "망 분리 환경에서 xxd·base64·certutil로 바이너리를 텍스트화해 클립보드로 옮긴 뒤 복원, split으로 분할 전송과 해시 무결성 검증까지."
date        : 2025-02-21 22:50:30 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [shell, "검색·파일 처리"]
tags        : []
pin         : false
hidden      : false
---

망 분리 환경처럼 파일 전송은 막혀 있고 클립보드를 통한 텍스트 복사만 허용되는 경우가 있다. 바이너리를 그대로 복사 붙여넣기 하면 인코딩에서 깨지니, hex 또는 base64로 텍스트화한 뒤 목적지에서 다시 복원한다.

## 16진수(hex) 사용

### 인코딩

```sh
# Linux/Mac
xxd -p MyClass.class > MyClass.class.hex

# Windows (PowerShell/cmd)
certutil -encodehex MyClass.class MyClass.class.hex 0
```

### 디코딩

```sh
# Linux/Mac
xxd -r -p MyClass.class.hex > MyClass.class

# Windows
certutil -decodehex MyClass.class.hex MyClass.class 0
```

## Base64 사용

base64는 hex보다 약 30% 더 작아 큰 파일에 유리하다.

### 인코딩

```sh
# Linux: -w 0으로 줄바꿈 제거 (한 줄 출력)
base64 -w 0 MyClass.class > MyClass.class.b64

# macOS: -w 옵션 없음. 기본이 줄바꿈 있음, 디코드는 그대로 됨
base64 -i MyClass.class -o MyClass.class.b64

# Windows
certutil -encodebase64 MyClass.class MyClass.class.b64
```

### 디코딩

```sh
# Linux/Mac
base64 -d MyClass.class.b64 > MyClass.class

# Windows
certutil -decodebase64 MyClass.class.b64 MyClass.class
```

## 큰 파일은 쪼개서

클립보드 길이 제한에 걸리면 분할 전송 후 목적지에서 합친다.

```sh
# 1MB 단위로 분할
split -b 1M MyClass.class.b64 part_

# 목적지에서 합치기
cat part_* > MyClass.class.b64
```

## 무결성 검증

복원이 잘 됐는지는 해시로 확인. 한 글자만 잘려도 바이너리가 망가진다.

```sh
# 원본에서
sha256sum MyClass.class

# 목적지에서 같은 값이 나오는지
sha256sum MyClass.class
```
