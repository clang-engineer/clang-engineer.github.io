---
layout  : wiki
title   : 삭제된 로그 찾기
summary : 
date    : 2023-01-09 10:16:01 +0900
updated : 2023-01-09 10:23:17 +0900
tags    : 
toc     : true
public  : true
parent  : [[git/index]]
latex   : false
---
* TOC
{:toc}

# git 삭제된 로그 찾기

기껏 작업해놓은 로그가 삭제되어버릴 때가 있다. 그럴 때는 `git reflog`명령어를 사용하면 된다.

1. git reflog
git rebase 또는 git reset 등으로 커밋이 삭제될 수 있다.
하지만, git 이력은 보관되고 있는데 이러한 이력을 볼 수 있는 명령어가 git reflog

2. commit 복구하기
git reflog 명령어로 삭제된 commit id 확인 후
git reset --hard <커밋해시id>

3. branch 복구하기
git reflog 또는 git reflog |grep 브랜치명 으로 log확인
git checkout -b <삭제한 브랜치명> <커밋해시id>


## full log 확인
```sh
git log --all --full-history -- <path-to-file>
```
