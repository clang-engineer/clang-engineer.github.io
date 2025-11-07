---
title       : Git - 잘못 입력된 커밋의 author 정보 수정하기
description : >-
date        : 2021-12-08 09:00:45 +0900
updated     : 2025-10-03 12:15:14 +0900
categories  : [dev, git]
tags        : [git, commit, author, change]
pin         : false
hidden      : false
---

## 문제 상황
pc 재셋팅 과정에서 git global author 정보를 잘못 기록하여, 잘못된 author 정보로 커밋이 며칠째 기록되었다.
일괄로 수정하는 방법을 찾아보았다.

## 해결 방법
- 아래 참고 링크를 통해, 여러가지 방법을 확인할 수 있었고, 그 중에 아래 방법을 선택하여 해결하였다.

```sh
git filter-branch --commit-filter '
        if [ "$GIT_COMMITTER_NAME" = "<Old Name>" ];
        then
                GIT_COMMITTER_NAME="<New Name>";
                GIT_AUTHOR_NAME="<New Name>";
                GIT_COMMITTER_EMAIL="<New Email>";
                GIT_AUTHOR_EMAIL="<New Email>";
                git commit-tree "$@";
        else
                git commit-tree "$@";
        fi' HEAD
```

```cmd
git filter-branch --commit-filter "
        if [ "$GIT_COMMITTER_NAME" = "<Old Name>" ];
        then
                GIT_COMMITTER_NAME="<New Name>";
                GIT_AUTHOR_NAME="<New Name>";
                GIT_COMMITTER_EMAIL="<New Email>";
                GIT_AUTHOR_EMAIL="<New Email>";
                git commit-tree "$@";
        else
                git commit-tree "$@";
        fi" HEAD
```


# 참고
* [https://stackoverflow.com/questions/750172/how-do-i-change-the-author-and-committer-name-email-for-multiple-commits]
