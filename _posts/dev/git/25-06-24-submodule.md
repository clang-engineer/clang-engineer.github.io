---
title       : Git Submodule 을 사용하여 다른 Git 저장소를 포함하기
description : >-
    Git Submodule을 사용하면 다른 Git 저장소를 현재 프로젝트에 포함시킬 수 있습니다. 
    이 기능은 외부 라이브러리나 다른 프로젝트를 의존성으로 추가할 때 유용합니다.
date        : 2025-06-24 10:00:00 +0900
updated     : 2025-06-24 10:00:00 +0900
categories  : [dev, git]
tags        : [git, submodule, version control]
pin         : false
hidden      : false
---

Git Submodule을 사용하면 다른 Git 저장소를 현재 프로젝트에 포함시킬 수 있다. 
이 기능은 외부 라이브러리나 다른 프로젝트를 의존성으로 추가할 때 유용하다.

## Submodule 추가하기
다른 Git 저장소를 현재 프로젝트에 Submodule로 추가하려면 다음 명령어를 사용
```bash
git submodule add <repository-url> <path>
```

예를 들어, `https://github.com/clang-engineer/sub1`라는 Git 저장소를 현재 프로젝트에 `sub1`라는 디렉토리로 추가하려면 다음과 같이 입력한다.

```bash
git submodule add https://github.com/clang-engineer/sub1 sub1
```

## Submodule 명령어
| 명령어                                       | 설명                               |
| ----------------------------------------- | -------------------------------- |
| `git submodule add <repo> [path]`         | 서브모듈 추가                          |
| `git submodule init`                      | `.gitmodules`의 내용을 기준으로 초기화      |
| `git submodule update`                    | 서브모듈 코드 체크아웃                     |
| `git submodule update --init --recursive` | 서브모듈 및 그 안의 서브모듈까지 모두 초기화        |
| `git submodule status`                    | 현재 서브모듈 상태 확인                    |
| `git submodule foreach <command>`         | 모든 서브모듈에서 명령 실행                  |
| `git clone --recurse-submodules <repo>`   | 서브모듈까지 포함해 클론                    |
| `git submodule sync`                      | `.gitmodules`와 `.git/config` 동기화 |
