---
title       : GitHub 다중 계정 관리 Cheat Sheet
description : 
date        : 2025-10-03 12:37:44 +0900
updated     : 2025-10-03 12:43:03 +0900
categories  : [dev, git]
tags        : [git, github, ssh, cheat sheet]
pin         : false
hidden      : false
---

# GitHub 다중 계정 관리 Cheat Sheet

회사 계정과 개인 계정을 한 PC에서 안전하게 관리하기 위한 통합 가이드입니다.

---

## 1️⃣ SSH 키 기반 계정 구분

### 1.1 SSH 키 생성
```bash
# 개인 계정
ssh-keygen -t rsa -C "your_personal_email@domain.com" -f "~/.ssh/id_rsa_personal"

# 업무 계정
ssh-keygen -t rsa -C "your_work_email@domain.com" -f "~/.ssh/id_rsa_work"
````

### 1.2 SSH 키 등록

```bash
ssh-add ~/.ssh/id_rsa_personal
ssh-add ~/.ssh/id_rsa_work
```

### 1.3 SSH config 설정 (`~/.ssh/config`)

```text
# 개인 계정
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_personal

# 업무 계정
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_work
```

### 1.4 테스트

```bash
ssh -T github.com-personal
ssh -T github.com-work
```

### 1.5 Git remote URL 예시

```bash
# 개인
git remote set-url origin git@github.com-personal:personal/project.git

# 업무
git remote set-url origin git@github.com-work:work/project.git
```

---

## 2️⃣ Git 사용자 정보 관리 (includeIf)

### 2.1 전역 사용자 설정

```bash
git config --global user.name "defaultuser"
git config --global user.email "default@example.com"
```

### 2.2 디렉토리별 커스텀 설정

#### 예: 업무 디렉토리

`~/workspace/company/company.inc`

```ini
[user]
    name = customuser
    email = customuser@gmail.com
```

#### 전역 Git 설정파일에 includeIf 추가 (`~/.gitconfig`)

```ini
[user]
    name = defaultuser
    email = default@example.com

[includeIf "gitdir:~/workspace/company/"]
    path = ~/workspace/company/company.inc
```

> ⚠️ 경로 끝에 `/`를 포함해야 하위 디렉토리까지 적용됨

### 2.3 확인

```bash
cd ~/workspace/company/projectA
git config --get user.email
# → customuser@gmail.com
```

---

## 3️⃣ 요약

| 기능    | SSH 키 + Remote URL  | Git includeIf                 |
| ----- | ------------------- | ----------------------------- |
| 목적    | GitHub 계정 인증        | 커밋 작성자 정보 자동 설정               |
| 적용 범위 | Remote 접근           | 커밋 작성자                        |
| 장점    | 여러 GitHub 계정 로그인 가능 | 저장소별 user 정보 자동 적용, 초기화 문제 없음 |
| 단점    | 매번 SSH 키 등록 필요      | 인증 자체는 SSH 키 필요               |

---

## 4️⃣ 참고 자료

* [Managing Multiple GitHub Accounts (Medium)](https://medium.com/the-andela-way/a-practical-guide-to-managing-multiple-github-accounts-8e7970c8fd46)
* [Multiple GitHub Accounts (Velog)](https://velog.io/@jay/multiplegithubaccounts)

