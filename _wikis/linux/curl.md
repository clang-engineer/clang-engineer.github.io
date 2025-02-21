---
layout  : wiki
title   : curl
summary : cli에서 요청을 전송하게 도와주는
date    : 2022-01-07 16:26:32 +0900
updated : 2022-07-19 13:59:02 +0900
tags    : 
toc     : true
public  : true
parent  : [[linux/index]]
latex   : false
---
* TOC
{:toc}

#
curl 명령어를 통해서 terminal에서 다른 서버로 데이터를 전송할수 있다.

## curl --help, curl --manual
- 명령어 사용법

## Ubuntu, Debian에 Curl 설치

```sh
sudo apt update
sudo apt install curl
```

## CentOS, Fedora에 Curl설치

```sh
sudo yum install curl
```

## 자주 사용하는 옵션

### -v 옵션

- -v(Verbose) 옵션을 줄 경우 상세한 로그도 함께 표시됨

```sh
curl -v https://google.com
```

### -H 옵션

- -H 옵션을 이용해 헤더를 정의
- ex> -H "Cotent-Type: test/xml", -H "Host: "
 
```sh
curl -H 'Foo: Bar' https://google.com
```

### -d 옵션

- POST로 폼 데이터를 함께 요청하려면 -d 옵션을 사용
 
```sh
curl -d 'key=value' -d "foo=bar" https://google.com
```

- JSON데이터를 POST하려면 별도의 헤더 필요
 
```sh
curl -H 'Content-Type: application/json' -d '{"foo": "bar"}' https://google.com
```

### -F 또는 --form 옵션

- 파일을 업로드할 수 있음.
- 요청이 multipart/form-data형식으로 날아감
- @를 통해서 파일을 구분
 
```sh
curl -F 'file=@/foo/bar/path' -F 'key=value' https://google.com
```

### -X옵션

- 요청메소드의 형식을 지정

```sh
curl -X PUT -d 'foo=bar' https://google.com
```

### 파일 다운로드

```sh
// 방법1. 응답을 리다이렉트
curl https://www.google.com > test.html

// 방법2. 별도의 --output 옵션 지정
curl https://www.google.com/image.jpg --output doewnloaded_image.jpg
```

### -k(--insecure) 옵션

- 검증을 하지 않는 옵션인 -k (사설 인증서 붙인 서버 확인할 때 사용)
 
```sh
curl -k https://www.test.com

curl --insecure https://www.google.com

```
