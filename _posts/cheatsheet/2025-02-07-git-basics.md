---
layout: post
title: "Git Cheatsheet"
date: 2025-02-07 10:00:00 +0900
categories: [cheatsheet]
tags: [git, cheatsheet, version-control]
summary: "실무에서 자주 쓰는 Git 명령어를 흐름별로 정리"
tool_name: Git
tool_icon: fa-brands fa-git-alt
quick_commands:
  - "git status"
  - "git commit -m 'msg'"
  - "git push"
---

## 상태 확인 & 변경 비교

| 명령어 | 설명 |
|--------|------|
| `git status` | 변경사항 확인 |
| `git status -sb` | 짧은 형식 |
| `git diff` | 변경 내용 상세 |
| `git diff --staged` | 스테이징된 변경사항 |
| `git diff <branch1>..<branch2>` | 브랜치 간 비교 |

## 브랜치

| 명령어 | 설명 |
|--------|------|
| `git branch` | 브랜치 목록 |
| `git switch <branch>` | 브랜치 이동 |
| `git switch -c <branch>` | 새 브랜치 생성 + 이동 |
| `git branch -d <branch>` | 브랜치 삭제 |
| `git branch -m <new-name>` | 브랜치 이름 변경 |
| `git branch -r` | 원격 브랜치 목록 |

## 스테이징 & 커밋

| 명령어 | 설명 |
|--------|------|
| `git add <file>` | 파일 스테이징 |
| `git add .` | 모든 변경사항 스테이징 |
| `git commit -m "msg"` | 커밋 |
| `git commit -am "msg"` | add + commit (수정된 파일만) |
| `git commit --amend` | 마지막 커밋 수정 |
| `git commit --amend --no-edit` | 파일 추가 (메시지 유지) |

## 원격 동기화

| 명령어 | 설명 |
|--------|------|
| `git pull` | 원격 변경사항 가져오기 + 병합 |
| `git pull --ff-only` | Fast-forward만 허용 |
| `git push` | 푸시 |
| `git push -u origin <branch>` | 브랜치 최초 푸시 |
| `git fetch origin` | 원격 변경사항만 가져오기 |
| `git remote -v` | 원격 저장소 확인 |
| `git remote set-url origin <url>` | 원격 주소 변경 |
| `git push origin --delete <branch>` | 원격 브랜치 삭제 |

## 되돌리기 & 복구

| 명령어 | 설명 |
|--------|------|
| `git restore <file>` | 파일 변경사항 취소 |
| `git restore --staged <file>` | 스테이징 취소 |
| `git reset HEAD <file>` | 스테이징 취소 (구 문법) |
| `git reset --soft HEAD~1` | 커밋 취소 (변경사항 유지) |
| `git reset --hard HEAD~1` | 커밋 취소 (변경사항 삭제) |
| `git revert <commit>` | 특정 커밋 되돌리기 (revert 커밋 생성) |
| `git reflog` | HEAD 이동 기록 확인 |

## 로그 & 검색

| 명령어 | 설명 |
|--------|------|
| `git log --oneline` | 커밋 히스토리 (한 줄) |
| `git log --graph --oneline --decorate` | 그래프 형태 히스토리 |
| `git log -p` | 커밋별 diff 보기 |
| `git log --grep="pattern"` | 커밋 메시지 검색 |
| `git log -S"text"` | 코드 내용 검색 |
| `git show <commit>` | 커밋 상세 |
| `git blame <file>` | 줄별 커밋 정보 |
| `git bisect start` | 이진 탐색으로 버그 찾기 |

## Merge & Rebase

| 명령어 | 설명 |
|--------|------|
| `git merge <branch>` | 브랜치 병합 |
| `git merge --no-ff <branch>` | Merge 커밋 강제 |
| `git merge --squash <branch>` | Squash 병합 |
| `git merge --abort` | 병합 중단 |
| `git rebase <branch>` | 브랜치에 rebase |
| `git rebase -i HEAD~3` | 인터랙티브 rebase |
| `git rebase --continue` | 충돌 해결 후 계속 |
| `git rebase --abort` | Rebase 취소 |
| `git rebase --skip` | 현재 커밋 건너뛰기 |

### Rebase 인터랙티브 명령어

| 명령 | 설명 |
|------|------|
| `pick` | 커밋 유지 |
| `reword` | 커밋 메시지 수정 |
| `edit` | 커밋 수정 (멈춤) |
| `squash` | 이전 커밋과 합치기 (메시지 유지) |
| `fixup` | 이전 커밋과 합치기 (메시지 버림) |
| `drop` | 커밋 삭제 |

## Stash

| 명령어 | 설명 |
|--------|------|
| `git stash` | 작업 중인 내용 임시 저장 |
| `git stash list` | Stash 목록 |
| `git stash apply stash@{n}` | 특정 stash 적용 (유지) |
| `git stash pop stash@{n}` | 특정 stash 적용 (삭제) |
| `git stash drop stash@{n}` | Stash 삭제 |
| `git stash clear` | 모든 stash 삭제 |
| `git stash show -p` | Stash 내용 상세 |
| `git stash push -m "msg"` | 메시지와 함께 저장 |

## Tag

| 명령어 | 설명 |
|--------|------|
| `git tag` | 태그 목록 |
| `git tag <name>` | 현재 커밋에 태그 |
| `git tag -a <name> -m "msg"` | Annotated 태그 |
| `git tag -d <tag>` | 로컬 태그 삭제 |
| `git push origin <tag>` | 태그 푸시 |
| `git push origin --tags` | 모든 태그 푸시 |

## Clean & 유지보수

| 명령어 | 설명 |
|--------|------|
| `git clean -n` | 삭제될 untracked 파일 미리보기 |
| `git clean -fd` | untracked 파일/폴더 삭제 |
| `git clean -fdx` | .gitignore 포함 모두 삭제 |
| `git gc` | 로컬 저장소 최적화 |
| `git prune` | 참조 없는 객체 정리 |
| `git reflog expire --expire=now --all` | Reflog 정리 |

## Submodule

| 명령어 | 설명 |
|--------|------|
| `git submodule add <url>` | Submodule 추가 |
| `git submodule update --init` | Submodule 초기화 |
| `git submodule update --remote` | Submodule 업데이트 |
| `git submodule foreach git pull` | 모든 submodule pull |

## 설정

| 명령어 | 설명 |
|--------|------|
| `git config --global user.name "name"` | 이름 설정 |
| `git config --global user.email "email"` | 이메일 설정 |
| `git config --global alias.<name> <cmd>` | Alias 설정 |
| `git config --global pull.rebase true` | Pull 시 기본 rebase |
| `git config --list` | 설정 확인 |

## 자주 쓰는 패턴

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

## 위험한 명령어 (주의)

| 명령어 | 설명 | 주의사항 |
|--------|------|---------|
| `git reset --hard` | 변경사항 완전 삭제 | 복구 불가 |
| `git push --force` | 강제 푸시 | 팀 히스토리 파괴 |
| `git push --force-with-lease` | 안전한 강제 푸시 | 원격 변경 확인 후 푸시 |
| `git filter-branch` | 히스토리 재작성 | 전체 히스토리 변경 |
