---
layout  : wiki
title   : 잘못 입력된 커밋의 author 정보 수정하기 
summary : 
date    : 2023-11-22 09:04:51 +0900
updated : 2023-11-22 09:10:31 +0900
tags    : 
toc     : true
public  : true
parent  : [[git/index]]
latex   : false
---
* TOC
{:toc}


# 문제 상황
pc 재셋팅 과정에서 git global author 정보를 잘못 기록하여, 잘못된 author 정보로 커밋이 며칠째 기록되었다.
일괄로 수정하는 방법을 찾아보았다.

# 해결 방법
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
