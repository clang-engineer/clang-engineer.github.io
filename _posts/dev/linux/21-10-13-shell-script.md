---
title       : 유용한 shell script
description : >-
date        : 2021-11-05 10:36:15 +0900
updated     : 2025-10-03 14:18:54 +0900
categories  : [dev, linux]
tags        : [shell, script]
pin         : false
hidden      : false
---

## 1. Java Jar 파일 백그라운드 실행

```bash
#!/bin/sh
nohup java -jar xxx.jar &
```

* `nohup` : 터미널 종료 후에도 프로세스 계속 실행
* `&` : 백그라운드 실행

---

## 2. 포트 번호로 프로세스 종료

```bash
#!/bin/sh
pid="$(lsof -t -i :$1 -s TCP:LISTEN)";

if [ "$pid" != "" ]; then
  kill -9 $pid
  echo "$1 port num"
  echo "$pid process kill complete"
else
  echo "port num $1"
  echo "pid is empty"
fi
```

* 사용법: `./stop.sh 80`
* 설명: 80 포트를 사용하는 프로세스를 찾아 강제 종료

---

## 3. 폴더 내 파일명 일괄 변경

### 예제 1: `_h.png` → `_half.png`

```bash
for file in *_h.png
do
  mv "$file" "${file/_h.png/_half.png}"
done
```

* 한 줄로 작성 시:

```bash
for file in *.png; do mv "$file" "${file/_h.png/_half.png}"; done
```

---

## 4. 특정 문자열 일괄 변경

```bash
#!/bin/bash
for i in `find .`
do
  mv $i `echo $i | sed -e 's/\/e/\/h/'`
done
```

* 설명: 파일 경로나 이름 내 `/e`를 `/h`로 변경

---

## 5. Brew rename 유틸리티 사용

```bash
brew install rename
rename 's/old/new/g' *
```

* 설명: `old` 문자열을 `new`로 일괄 변경
* Mac에서 유용한 방법

---

## 6. 파일 목록 찾고 이동

```bash
find path_A -name "*AAA*" -exec mv {} path_B \;
```

* 설명: `path_A` 내 이름에 `AAA`가 포함된 파일을 모두 `path_B`로 이동

---

