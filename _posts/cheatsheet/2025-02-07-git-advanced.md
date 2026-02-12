---
layout: post
title: "Git 고급 명령어"
date: 2025-02-07 10:05:00 +0900
categories: [cheatsheet]
tags: [git, advanced, rebase]
summary: "Rebase, Tag, 히스토리 정리 등"
tool_name: Git Advanced
tool_icon: fa-brands fa-git-alt
quick_commands:
  - "git rebase -i HEAD~3"
  - "git cherry-pick <sha>"
  - "git tag -a v1.0"
---

## 🔀 Rebase

| 명령어 | 설명 |
|--------|------|
| `git rebase <branch>` | 브랜치에 rebase |
| `git rebase -i HEAD~3` | 최근 3개 커밋 인터랙티브 편집 |
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

## 🏷️ Tag

| 명령어 | 설명 |
|--------|------|
| `git tag` | 태그 목록 |
| `git tag <name>` | 현재 커밋에 태그 |
| `git tag -a <name> -m "msg"` | Annotated 태그 |
| `git tag <name> <commit>` | 특정 커밋에 태그 |
| `git push origin <tag>` | 태그 푸시 |
| `git push origin --tags` | 모든 태그 푸시 |
| `git tag -d <tag>` | 로컬 태그 삭제 |
| `git push origin :refs/tags/<tag>` | 원격 태그 삭제 |

## 🍒 Cherry-pick

| 명령어 | 설명 |
|--------|------|
| `git cherry-pick <commit>` | 특정 커밋 가져오기 |
| `git cherry-pick <sha1> <sha2>` | 여러 커밋 가져오기 |
| `git cherry-pick --continue` | 충돌 해결 후 계속 |
| `git cherry-pick --abort` | Cherry-pick 취소 |

## 🔍 고급 검색

| 명령어 | 설명 |
|--------|------|
| `git log -p <file>` | 파일 변경 이력 상세 |
| `git log --grep="pattern"` | 커밋 메시지 검색 |
| `git log -S"text"` | 코드 내용 검색 |
| `git show <commit>` | 커밋 상세 |
| `git show <commit>:<file>` | 특정 커밋의 파일 내용 |
| `git blame <file>` | 줄별 커밋 정보 |
| `git bisect start` | 이진 탐색으로 버그 찾기 |

## 🧹 히스토리 정리

| 명령어 | 설명 |
|--------|------|
| `git clean -n` | 삭제될 untracked 파일 미리보기 |
| `git clean -fd` | Untracked 파일/폴더 삭제 |
| `git gc` | 로컬 저장소 최적화 |
| `git prune` | 참조 없는 객체 정리 |
| `git reflog` | 모든 참조 로그 (복구용) |
| `git reflog expire --expire=now --all` | Reflog 정리 |

## 🔁 Stash 고급

| 명령어 | 설명 |
|--------|------|
| `git stash save "msg"` | 메시지와 함께 저장 |
| `git stash list` | Stash 목록 |
| `git stash apply stash@{n}` | 특정 stash 적용 (유지) |
| `git stash pop stash@{n}` | 특정 stash 적용 (삭제) |
| `git stash drop stash@{n}` | Stash 삭제 |
| `git stash clear` | 모든 stash 삭제 |
| `git stash show -p` | Stash 내용 상세 보기 |

## 🔗 Submodule

| 명령어 | 설명 |
|--------|------|
| `git submodule add <url>` | Submodule 추가 |
| `git submodule update --init` | Submodule 초기화 |
| `git submodule update --remote` | Submodule 업데이트 |
| `git submodule foreach git pull` | 모든 submodule pull |

## 🎯 고급 설정

| 명령어 | 설명 |
|--------|------|
| `git config --global alias.<name> <cmd>` | Alias 설정 |
| `git config rerere.enabled true` | 충돌 해결 재사용 |
| `git config --global core.editor vim` | 에디터 설정 |
| `git config --global pull.rebase true` | Pull 시 기본 rebase |

## 💡 유용한 조합

```bash
# 여러 커밋을 하나로 합치기
git rebase -i HEAD~5
# pick → squash로 변경

# 특정 브랜치의 커밋 하나만 가져오기
git cherry-pick abc123

# 실수로 삭제한 커밋 복구
git reflog
git checkout <commit-hash>

# 커밋 메시지 일괄 수정
git rebase -i HEAD~10
# pick → reword로 변경

# 충돌 재해결 방지
git config rerere.enabled true

# 브랜치 간 파일 비교
git diff main..feature -- path/to/file

# 특정 커밋의 파일 복구
git show abc123:path/to/file > recovered-file.txt
```

## ⚠️ 위험한 명령어 (주의)

| 명령어 | 설명 | 주의사항 |
|--------|------|---------|
| `git reset --hard` | 변경사항 완전 삭제 | 복구 불가 |
| `git push --force` | 강제 푸시 | 팀 히스토리 파괴 |
| `git push --force-with-lease` | 안전한 강제 푸시 | 원격 변경 확인 후 푸시 |
| `git filter-branch` | 히스토리 재작성 | 전체 히스토리 변경 |
| `git clean -fdx` | .gitignore 파일도 삭제 | 빌드 산출물 삭제 |
