---
title       : "Neovim swap 파일 안전하게 정리하기"
description : "복구 후 swap이 자동 삭제되지 않아 경고가 반복되는 문제. 파일명 규칙과 자동 판정 휴리스틱."
date        : 2026-06-11 10:00:00 +0900
updated     : 2026-06-11 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [bash]
pin         : false
hidden      : false
---

`nvim -r` 는 swap 내용을 복구만 하고 swap 파일은 자동 삭제하지 않는다. 그리고 같은 원본에 swap 이 여러 개 쌓일 수 있어서 (`.swp`, `.swo`, `.swn`, …) 하나만 지워도 경고가 계속 뜬다.

## swap 파일명 → 원본 경로 규칙

Neovim 은 `/` 를 `%` 로 치환해 swap 파일명을 만든다. 선두 `%` 가 leading `/` 역할:

```text
%Users%zero%.pgpass.swp  →  /Users/zero/.pgpass
```

쉘에서 역변환:

```bash
name="${name%.sw?}"   # 확장자 제거
echo "${name//%//}"   # % → /
```

## 복구 후 정리 순서

복구만 하고 swap 을 안 지우면 다음 번에도 경고가 뜬다. 같은 원본에 swap 이 6 개 쌓여 있으면 `.swl` → `.swm` → … 순서로 계속 경고.

```bash
nvim -r ~/.pgpass               # 복구
# :w 저장 후 :q
rm ~/.local/share/nvim/swap/%Users%zero%.pgpass.sw*  # 같은 원본의 swap 전부 제거
```

## 안전한 자동 판정 휴리스틱

- **사용 중**: `lsof -t -- "$swap"` 으로 감지 → 절대 삭제 금지
- **원본보다 swap 이 오래됨**: 저장 후 남은 잔재 → 자동 삭제 안전
- **원본보다 swap 이 최신**: 미저장 변경 가능성 → 보존 또는 사용자 확인
- **원본 파일 없음**: 삭제된 파일의 잔재 → 사용자 확인

bash `[[ "$swap" -nt "$original" ]]` 로 mtime 비교가 핵심.

## 인터랙티브 프롬프트 패턴

`y / N / a` (이후 전부 자동 삭제) 컨벤션. `read` 가 stdin 이 파이프된 환경에서도 동작하려면 `/dev/tty` 명시:

```bash
read -rp "삭제? (y/N/a=이후 전부) " ans </dev/tty
```
