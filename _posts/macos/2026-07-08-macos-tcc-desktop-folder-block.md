---
title       : "macOS가 갑자기 ~/Desktop 접근을 막을 때 — TCC 권한 리셋"
description : "터미널·git이 ~/Desktop 하위를 Operation not permitted로 거부하는 TCC 권한 리셋의 진단과 복구."
date        : 2026-07-08 13:00:00 +0900
updated     : 2026-07-08 13:00:00 +0900
categories  : [macos]
tags        : [tcc, permissions, full-disk-access, git, terminal, eperm]
pin         : false
hidden      : false
---

세션 중간에 터미널·git이 `~/Desktop` 하위 파일 접근을 "Operation not permitted"로 거부하기 시작하면, 파일 퍼미션 문제가 아니라 macOS **TCC**(Transparency, Consent, and Control — 앱의 민감 데이터 접근을 사용자 동의로 통제하는 프레임워크) 권한이 리셋된 것이다. TCC는 `Desktop`·`Documents`·`Downloads`를 보호 대상으로 다룬다.

## 증상 (진단 시그니처)

```sh
cat ~/.gitconfig                       # OK  (홈 바로 아래, 보호 대상 아님)
cat ~/Desktop/proj/README.md           # Operation not permitted (EPERM)
ls  ~/Desktop/proj                     # Permission denied (eza: code 13 = EACCES)
git -C ~/Desktop/proj status           # fatal: Unable to read current working directory
ls -ld ~/Desktop/proj                  # drwxr-xr-x zero staff  ← 퍼미션은 멀쩡
```

핵심 판별 포인트:
- 퍼미션이 `drwxr-xr-x` 본인 소유인데도 막힘 → `chmod` 문제 아님
- **디렉토리 엔트리 stat(`ls -ld`)은 되는데 내용 읽기(`cat`)·`getcwd()`는 막힘**
- **홈 바로 아래(`~/.gitconfig`)는 되고 `~/Desktop` 하위만 막힘** → 보호 폴더 경계와 정확히 일치
- 세션 중간에 갑자기 발생 (앱 자동 업데이트/OS의 주기적 재검증이 방아쇠)
- 앱 자체(Claude Code 등)의 파일 툴은 되는데 그 앱이 띄운 **자식 셸/git만** 막힘

## 왜 앱은 되고 자식 git은 안 되나

TCC 권한은 **"책임 프로세스"(responsible process)** 에 귀속된다. CLI 도구는 보통 자신을 띄운 **터미널 앱**이 책임 프로세스가 되므로, 터미널 앱이 Desktop 접근 권한을 잃으면 그 아래 모든 자식(zsh, git, node)이 함께 막힌다. 앱 본체가 Full Disk Access를 가지면 앱의 내장 파일 접근은 되지만 자식 셸은 별개다.

> Claude 샌드박스를 꺼도(`dangerouslyDisableSandbox`) 안 뚫린다 — 이건 앱 샌드박스가 아니라 **OS 레벨 TCC**라 코드로 우회 불가.

## 복구

1. 시스템 설정 → 개인정보 보호 및 보안 → **전체 디스크 접근**(Full Disk Access)
2. 사용하는 **터미널 앱** 토글 껐다 켜기 (없으면 추가)
3. 터미널 **완전 종료**(`Cmd+Q`, 창 닫기 X) 후 재실행 — TCC는 프로세스 재시작 시 재평가
4. `ls ~/Desktop/...` 로 확인

권한 대화상자("'터미널'이 데스크탑 폴더의 파일에 접근하려 합니다")가 다시 뜨면 **"허용"** 한 번으로 즉시 복구.

## 근본 해결

개발 repo를 `~/Desktop`/`~/Documents` 아래 두면 이 마찰이 주기적으로 재발한다. 보호 대상 밖(`~/dev`, `~/src` 등)으로 옮기면 TCC와 무관해진다.
