---
layout  : wiki
title   : 일반 사용자로 80 포트 서비스하기
summary : 
date    : 2023-08-08 09:38:03 +0900
updated : 2023-08-08 09:40:52 +0900
tags    : 
toc     : true
public  : true
parent  : [[index]]
latex   : false
---
* TOC
{:toc}

# 일반 사용자로 80 포트 서비사하기

리눅스에서 일반 계정은 well known port인 1024 이하의 포트 사용이 불가능하다.
이를 해결하기 위해서는 다음과 같이 하면 된다.

# 1. setcap 을 이용한 방법

## 1.1. setcap 설치

```bash
sudo apt-get install libcap2-bin
```

## 1.2. setcap 설정

```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/python3.8
```

## 1.3. setcap 설정 확인

```bash
getcap /usr/bin/python3.8
```

# 2. authbind 을 이용한 방법

## 2.1. authbind 설치

```bash
sudo apt-get install authbind
```

## 2.2. authbind 설정

```bash
sudo touch /etc/authbind/byport/80
sudo chown $USER /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80
```

## 2.3. authbind 설정 확인

```bash
ls -l /etc/authbind/byport/80
```

## 2.4. authbind 사용

```bash
authbind --deep python3.8 manage.py runserver
```

# 3. 포트 포워딩 - iptables

## 3.1. 포트 포워딩 설정

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
```

## 3.2. 포트 포워딩 설정 확인

```bash
sudo iptables -t nat -L
```

## 3.3. 포트 포워딩 해제

```bash
sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
```

# 4. 포트 포워딩 - filewall

## 4.1. 포트 포워딩 설정

```bash
sudo firewall-cmd --permanent --zone=public --add-forward-port=port=80:proto=tcp:toport=8080
sudo firewall-cmd --reload
```

## 4.2. 포트 포워딩 설정 확인

```bash
sudo firewall-cmd --permanent --zone=public --list-all
```

## 4.3. 포트 포워딩 해제

```bash
sudo firewall-cmd --permanent --zone=public --remove-forward-port=port=80:proto=tcp:toport=8080
sudo firewall-cmd --reload
```

# 5. 기타 - setuid, sudoers

- 관리자 계정이 되는 것과 마찬가지이므로 권장하지 않음

## 5.1. setuid 설정

```bash
sudo chmod u+s /usr/bin/python3.8
```

## 5.2. sudoers 설정

```bash
sudo visudo
```

```bash
# Allow user to run any commands anywhere
username ALL=(ALL) NOPASSWD: ALL
```

## 5.3. sudoers 설정 확인

```bash
sudo -l
```
