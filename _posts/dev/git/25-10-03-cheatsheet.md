---
title       : Git Cheat Sheet
description : 자주 쓰는 Git 명령어를 카테고리별로 정리
date        : 2025-10-03 12:46:15 +0900
updated     : 2025-10-03 13:21:56 +0900
categories  : []
tags        : []
pin         : false
hidden      : false
---

# 📝 Git Cheat Sheet (실무용)

> 자주 쓰는 Git 명령어를 카테고리별로 정리한 실무용 가이드

---

## 1️⃣ Branch 관련 명령어

| 명령어                                              | 설명                     |
| ------------------------------------------------ | ---------------------- |
| `git branch -r`                                  | 원격 브랜치 목록 보기           |
| `git checkout -t {remote branch}`                | 원격 브랜치로 체크아웃           |
| `git branch -m <oldname> <newname>`              | 브랜치 이름 변경              |
| `git checkout -b {local branch} {remote branch}` | 원격 브랜치를 로컬 이름 다르게 체크아웃 |
| `git branch -m <newname>`                        | 현재 브랜치 이름 변경           |
| `git branch -d <branch>`                         | 로컬 브랜치 삭제              |
| `git push origin --delete <branch>`              | 원격 브랜치 삭제              |
| `git branch --list`                              | 브랜치 목록 확인              |

### 로컬 브랜치 정리

```sh
git remote prune origin   # 원격 저장소에 없는 로컬 브랜치 삭제
git fetch -p              # fetch 후 없는 브랜치 삭제
```

---

## 2️⃣ Clean 관련 명령어

| 명령어                  | 설명                      |
| -------------------- | ----------------------- |
| `git clean -f`       | untracked 파일 삭제         |
| `git clean -d -f`    | 디렉토리 포함 untracked 파일 삭제 |
| `git clean -d -f -x` | gitignore 포함 모든 파일 삭제   |

---

## 3️⃣ Diff 관련 명령어

| 명령어                            | 설명                     |
| ------------------------------ | ---------------------- |
| `git diff`                     | commit vs 수정 중인 파일 비교  |
| `git diff --cached`            | commit vs add된 파일 비교   |
| `git diff HEAD^`               | commit vs 이전 commit 비교 |
| `git diff {branch1} {branch2}` | 브랜치 간 비교               |
| `git diff HEAD~1 HEAD`         | 이전 커밋과 현재 커밋 비교        |

---

## 4️⃣ Commit 관련 명령어

| 명령어                                                                  | 설명                   |
| -------------------------------------------------------------------- | -------------------- |
| `git commit --amend --no-edit --date "$(date)"`                      | 마지막 커밋 날짜를 현재 날짜로 설정 |
| `git commit --amend --no-edit --date "Mon 20 Aug 2018 20:19:19 KST"` | 마지막 커밋 날짜를 임의 날짜로 설정 |
| `git commit -m "This is a blank commit" --allow-empty`               | 빈 커밋 생성              |

---

## 5️⃣ Reset
- head^n or head~n: 마지막 n번째 커밋

| 명령어                                    | 설명                            |
| -------------------------------------- | ----------------------------- |
| `git reset --soft HEAD~n`              | 마지막 n개의 커밋 되돌리기 (변경 내용, add 보존) |
| `git reset --mixed HEAD~n`             | 마지막 n개의 커밋 되돌리기 (변경 내용 보존)    |
| `git reset --hard HEAD~n`              | 마지막 n개의 커밋 되돌리기 (변경 내용 삭제)   |

### 특정 파일만 되돌리기
```sh
git checkout -- <file> # 수정 내용 삭제
git checkout HEAD -- <file> # 마지막 커밋 시점으로 되돌리기
```

---

## Revert

| 명령어                               | 설명                           |
| `git revert <commit hash>`             | 개별 커밋 되돌리기 (revert commit 생성) |
| `git revert --no-commit <commit hash>` | revert commit 자동 생성 X         |
| `git revert HEAD`                      | HEAD 커밋 되돌리기                  |

---

## 6️⃣ Git Log

| 명령어                                                                          | 설명                         |
| ---------------------------------------------------------------------------- | -------------------------- |
| `git log --oneline`                                                          | 커밋 로그를 한 줄로 보기             |
| `git log --graph --oneline --decorate`                                       | 커밋 로그를 그래프로 보기             |
| `git log --pretty=format:"%h - %an, %ar : %s" --author clang --since=2.days` | author가 clang인 최근 2일 커밋 보기 |
| `git log --name-only -1 <commit hash>`                                       | 특정 커밋의 파일 목록 확인            |
| `git log -p`                                                                | 각 커밋의 diff 보기                |


---

## 7️⃣ 파일/폴더 Git 관리 취소

| 명령어                           | 설명          |
| ----------------------------- | ----------- |
| `git rm --cached <file>`      | 파일 이력 관리 취소 |
| `git rm -r --cached <folder>` | 폴더 이력 관리 취소 |

---

##  Merge 관련 명령어
- no-commit: 병합 후 커밋하지 않음
- no-ff: fast-forward 병합 방지
- squash: 현재 브랜치 위에 단일 커밋 생성

| 명령어                                                                 | 설명                     | 
| ------------------------------------------------------------------- | ---------------------- |
| `git merge <branch> --no-commit --no-ff`                             | 병합 후 커밋하지 않음          |
| `git merge <branch> --squash`                                       | 현재 브랜치 위에 단일 커밋 생성      |
| `git merge --abort`                                                 | 병합 중단                  |


---

##  Remote 관련 명령어
| 명령어                           | 설명          |
| ----------------------------- | ----------- |
| `git remote -v`               | 원격 저장소 주소 확인 |
| `git remote set-url [주소]`   | 원격 저장소 주소 변경  |
| `git fetch -p`                | fetch 후 없는 브랜치 삭제 |
| `git push origin --delete <branch>` | 원격 브랜치 삭제      |


---

## Stash 관련 명령어
| 명령어                           | 설명               |
| ----------------------------- | ---------------- |
| `git stash`                   | 작업 중인 내용 임시 저장    |
| `git stash list`              | 저장한 stash 목록 확인   |
| `git stash apply [stash 이름]` | 특정 stash 적용        |
| `git stash apply --index`     | staged 상태까지 복원    |
| `git stash drop [stash 이름]`  | 특정 stash 제거        |
| `git stash pop`               | apply + drop        |
| `git stash show -p \| git apply -R` | 잘못 적용한 stash 되돌리기 | 
| `git stash push -m "message"` | stash에 메시지 남기기 |

---

> 💡 Tip:
>
> * 필요할 때마다 복사해서 터미널에 붙여 쓰기 좋게 구성
> * 브랜치, 커밋, diff, log 등 카테고리별로 구분하면 실무에서 빠르게 검색 가능


