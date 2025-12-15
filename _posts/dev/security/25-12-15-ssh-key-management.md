---
title       : SSH 키 관리와 ssh-add 이해하기
description : >-
  SSH 에이전트와 ssh-add를 통한 SSH 키 관리 방법
date        : 2025-12-15 15:30:00 +0900
updated     : 2025-12-15 15:30:00 +0900
categories  : [dev, security]
tags        : [ssh, ssh-agent, ssh-add, github, authentication, key-management]
pin         : false
hidden      : false
---

## 문제 상황

`ssh -T git@github.com`을 실행하면 예상과 다른 계정이 표시된다.

```bash
$ ssh -T git@github.com
Hi work-account! You've successfully authenticated...
```

분명 SSH Config에는 두 개의 설정이 있는데, 왜 항상 work-account가 선택될까?

```bash
# ~/.ssh/config
Host github.com-personal
  HostName github.com
  IdentityFile ~/.ssh/id_rsa_github_personal

Host github.com-work
  HostName github.com
  IdentityFile ~/.ssh/id_rsa_github_work
```

이 문제를 이해하려면 **SSH 에이전트**와 **ssh-add**의 동작 방식을 알아야 한다.

## SSH 에이전트란?

**SSH 에이전트(SSH Agent)**는 SSH 개인키를 메모리에 보관하는 백그라운드 프로그램이다.

### 주요 기능

- **비밀번호 재입력 방지**: 한 번 키를 등록하면 매번 비밀번호를 입력할 필요 없음
- **키 재사용**: 여러 SSH 연결에서 같은 키를 자동으로 사용
- **보안**: 개인키를 메모리에만 보관하여 디스크 접근 최소화

### SSH 에이전트 확인

```bash
# 실행 중인지 확인
pgrep -x ssh-agent

# 시작
eval "$(ssh-agent -s)"
```

## ssh-add: 키 관리 명령어

`ssh-add`는 SSH 에이전트에 키를 등록하고 관리한다.

### 기본 명령어

```bash
# 등록된 키 목록 보기
ssh-add -l

# 특정 키 추가
ssh-add ~/.ssh/id_rsa_github_personal

# 모든 키 삭제
ssh-add -D
```

### 현재 등록된 키 확인

```bash
$ ssh-add -l
4096 SHA256:abc1... user@company.com (RSA)     ← work 키
4096 SHA256:def2... user@personal.com (RSA)    ← personal 키
```

**중요**: 키의 **순서**가 중요하다. SSH는 위에서부터 순서대로 시도한다.

## SSH Config: 연결 설정

SSH는 `~/.ssh/config` 파일로 연결 설정을 관리한다.

### 기본 구조

```bash
Host <별칭>
  HostName <실제 호스트>
  User <사용자>
  IdentityFile <키 경로>
  IdentitiesOnly yes
```

### 실제 설정 예시

```bash
# ~/.ssh/config

# 개인 계정
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_personal
  IdentitiesOnly yes

# 회사 계정
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_work
  IdentitiesOnly yes
```

### Host 매칭 규칙

SSH는 **정확한 매칭**만 인식한다.

```bash
# ❌ 매칭 안 됨
ssh -T git@github.com
# "github.com"은 설정에 없음

# ✅ 매칭 됨
ssh -T git@github.com-personal
# Host 이름과 정확히 일치
```

## 원인 분석

왜 `git@github.com`이 항상 work-account로 인증될까?

### 3단계 과정

1. **Host 매칭 실패**
   ```bash
   git@github.com ≠ github.com-personal
   git@github.com ≠ github.com-work
   ```

2. **에이전트 키 순서대로 시도**
   ```bash
   $ ssh-add -l
   첫 번째: work 키 ← 이것부터 시도
   두 번째: personal 키
   ```

3. **첫 번째 키로 인증 성공**
   - work 키를 GitHub에 제공
   - GitHub가 "Hi work-account!" 응답

## 해결 방법

### 방법 1: Host 이름 명시 (권장)

가장 명확하고 안전한 방법이다.

```bash
# SSH 테스트
ssh -T git@github.com-personal
ssh -T git@github.com-work

# Git clone
git clone git@github.com-personal:username/repo.git

# 기존 저장소 변경
git remote set-url origin git@github.com-personal:username/repo.git
```

### 방법 2: 키 순서 변경

특정 키를 기본으로 사용하고 싶을 때.

```bash
# 모든 키 제거
ssh-add -D

# 원하는 순서로 추가
ssh-add ~/.ssh/id_rsa_github_personal  # 첫 번째
ssh-add ~/.ssh/id_rsa_github_work      # 두 번째

# 확인
ssh-add -l
```

### 방법 3: IdentitiesOnly 설정

지정된 키만 사용하도록 강제.

```bash
# ~/.ssh/config

Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_personal
  IdentitiesOnly yes  # 이 키만 사용
```

## SSH 키 생성 스크립트

새 SSH 키를 생성하고 자동으로 에이전트에 등록하는 스크립트:

```bash
#!/bin/bash

# 설정
EMAIL="user@personal.com"
KEY_PATH="$HOME/.ssh/id_rsa_github_personal"

# 1. SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "$EMAIL" -f "$KEY_PATH" -N ""

# 2. SSH 에이전트 시작 (없으면)
if ! pgrep -x ssh-agent > /dev/null; then
  eval "$(ssh-agent -s)"
fi

# 3. 에이전트에 키 추가
ssh-add "$KEY_PATH"

echo "✓ SSH 키 생성 완료: $KEY_PATH"
```

### 옵션 설명

| 옵션 | 의미 |
|------|------|
| `-t rsa` | RSA 알고리즘 |
| `-b 4096` | 4096비트 (보안 강화) |
| `-C "email"` | 주석 (키 식별용) |
| `-f path` | 저장 경로 |
| `-N ""` | 비밀번호 없음 |

## macOS Keychain 설정

재부팅 후에도 키를 자동으로 로드하려면:

```bash
# Keychain에 키 추가
ssh-add --apple-use-keychain ~/.ssh/id_rsa_github_personal
ssh-add --apple-use-keychain ~/.ssh/id_rsa_github_work
```

### SSH Config 전체 설정

```bash
# ~/.ssh/config

# Global 설정
Host *
  AddKeysToAgent yes
  UseKeychain yes
  ServerAliveInterval 60

# 개인 계정
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_personal
  IdentitiesOnly yes

# 회사 계정
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_work
  IdentitiesOnly yes
```

## 트러블슈팅

### Permission denied (publickey)

```bash
# 1. 키가 등록되어 있는지 확인
ssh-add -l

# 2. 없으면 추가
ssh-add ~/.ssh/id_rsa_github_personal

# 3. 상세 로그로 테스트
ssh -vT git@github.com-personal
```

### 의도하지 않은 키로 인증됨

```bash
# 어떤 키가 제공되는지 확인
ssh -vT git@github.com 2>&1 | grep "Offering public key"

# IdentitiesOnly 추가
Host github.com-personal
  IdentitiesOnly yes
```

### SSH 에이전트에 키가 너무 많음

SSH는 최대 5개까지만 시도한다. 초과하면 인증 실패 가능.

```bash
# 초기화하고 필요한 키만 추가
ssh-add -D
ssh-add ~/.ssh/id_rsa_github_personal
ssh-add ~/.ssh/id_rsa_github_work
```

또는 각 Host에 `IdentitiesOnly yes` 추가.

## 핵심 정리

### SSH 동작 순서

```
1. SSH Config에서 Host 매칭 찾기
   ├─ 매칭 성공 → IdentityFile의 키 사용
   └─ 매칭 실패 → ssh-add -l의 키를 순서대로 시도
```

### 문제 해결 체크리스트

- [ ] `git remote -v`로 현재 URL 확인
- [ ] URL을 `git@github.com-personal:user/repo.git` 형식으로 변경
- [ ] SSH Config에 `IdentitiesOnly yes` 추가
- [ ] `ssh -T git@github.com-personal`로 테스트

### 권장 설정

```bash
# 1. SSH Config에서 Host 명시
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_github_personal
  IdentitiesOnly yes  # 필수!

# 2. Git remote에 Host 이름 사용
git@github.com-personal:username/repo.git

# 3. macOS Keychain 활용
ssh-add --apple-use-keychain ~/.ssh/id_rsa_github_personal
```

이렇게 설정하면 SSH가 정확히 의도한 키를 사용하여 예측 가능하게 동작한다.
