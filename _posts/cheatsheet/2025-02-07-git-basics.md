---
layout: post
title: "Git 기본 명령어"
date: 2025-02-07 10:00:00 +0900
categories: [cheatsheet]
tags: [git, basics]
summary: "일상적으로 가장 많이 쓰는 Git 명령어"
tool_name: Git
tool_icon: fa-brands fa-git-alt
quick_commands:
  - "git status"
  - "git commit -am 'msg'"
  - "git push"
---

## 📊 상태 확인

| 명령어 | 설명 |
|--------|------|
| `git status` | 변경사항 확인 |
| `git status -sb` | 짧은 형식 |
| `git diff` | 변경 내용 상세 |
| `git diff --staged` | 스테이징된 변경사항 |
| `git log --oneline` | 커밋 히스토리 (한 줄) |
| `git log --graph --oneline` | 그래프 형태 히스토리 |

## 🌿 Branch

| 명령어 | 설명 |
|--------|------|
| `git branch` | 브랜치 목록 |
| `git switch <branch>` | 브랜치 이동 |
| `git switch -c <branch>` | 새 브랜치 생성 + 이동 |
| `git branch -d <branch>` | 브랜치 삭제 |
| `git branch -m <new-name>` | 브랜치 이름 변경 |

## 📝 Commit

| 명령어 | 설명 |
|--------|------|
| `git add <file>` | 파일 스테이징 |
| `git add .` | 모든 변경사항 스테이징 |
| `git commit -m "msg"` | 커밋 |
| `git commit -am "msg"` | add + commit (수정된 파일만) |
| `git commit --amend` | 마지막 커밋 수정 |
| `git commit --amend --no-edit` | 파일 추가 (메시지 유지) |

## 🔄 동기화

| 명령어 | 설명 |
|--------|------|
| `git pull` | 원격 변경사항 가져오기 + 병합 |
| `git pull --ff-only` | Fast-forward만 허용 |
| `git push` | 푸시 |
| `git push -u origin <branch>` | 브랜치 최초 푸시 |
| `git fetch origin` | 원격 변경사항만 가져오기 |

## ⏪ 되돌리기

| 명령어 | 설명 |
|--------|------|
| `git restore <file>` | 파일 변경사항 취소 |
| `git restore --staged <file>` | 스테이징 취소 |
| `git reset HEAD <file>` | 스테이징 취소 (구 문법) |
| `git reset --soft HEAD~1` | 커밋 취소 (변경사항 유지) |
| `git reset --hard HEAD~1` | 커밋 취소 (변경사항 삭제) |

## 🔧 설정

| 명령어 | 설명 |
|--------|------|
| `git config --global user.name "name"` | 이름 설정 |
| `git config --global user.email "email"` | 이메일 설정 |
| `git config --list` | 설정 확인 |

## 💡 자주 쓰는 패턴

```bash
# 작업 시작 루틴
git status
git pull --ff-only
git switch -c feature/new-feature

# 커밋 후 실수했을 때
git add forgotten-file
git commit --amend --no-edit

# 변경사항 임시 저장
git stash
git stash pop

# 브랜치 전환 전 확인
git status
git switch main
```
