---
title       : Network Command
description : >-
    linux환경에서 네트워크 통신을 위해 사용되는 명령어인들에 대해 기록한다.
date        : 2021-01-25 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, curl, wget]
pin         : false
hidden      : false
---

## 네트워크 연결 확인 명령연

| 명령어 | 설명 |
|---|---|
| ping <주소> | 대상 호스트가 응답하는지 확인 |
| traceroute <주소> | 목적지까지의 경로 확인 |
| mtr <주소> | ping + traceroute 결합, 실시간 패킷 손실 및 지연 확인 |
| dig <도메인> | DNS 조회 (nslookup 대체) |
| nslookup <도메인> | DNS 조회 (구식, dig 사용 권장) |
| whois <도메인> | 도메인 등록 정보 조회 |
| curl -I <URL> | 웹 서버 응답 헤더 확인 |
| wget <URL> | 파일 다운로드 및 연결 확인 |
| nc -zv <IP> <포트> | 특정 IP와 포트가 열려 있는지 확인 |
| telnet <IP> <포트> | 특정 포트로 접속 시도 (보안상 최신 배포판에서는 비활성화됨) |

## 네트워크 확인 명령어

| 명령어 | 설명 |
|---|---|
| ip a 또는 ip addr | 현재 네트워크 인터페이스 및 IP 주소 확인 |
| ifconfig | 인터페이스 및 IP 확인 (옛날 명령어, ip 명령어 사용 권장) |
| ip r 또는 ip route | 라우팅 테이블 확인 |
| netstat -rn | 라우팅 테이블 확인 (ip route 사용 권장) |
| ss -tulnp | 현재 열려 있는 포트 및 프로세스 확인 (netstat 대체) |
| arp -a | ARP 테이블 확인 |
| hostname -I | 현재 호스트의 IP 주소 확인 |

## curl vs wget

| 특징 | curl | wget |
|---|---|---|
| 기본 목적 | 데이터를 전송(요청/응답) | 파일 다운로드 |
| 프로토콜 지원 | HTTP, HTTPS, FTP, SCP, SFTP, LDAP 등 다양한 프로토콜 지원 | HTTP, HTTPS, FTP만 지원 |
| 재시도 기능 | 기본적으로 없음 (--retry 옵션 필요) | 기본적으로 자동 재시도 |
| 다운로드 기능 | 단일 요청 (파일 다운로드 시 -O 필요) | 다운로드 전용 (자동으로 파일 저장) |
| 배치 다운로드 | 여러 개의 URL을 스크립트로 처리 가능 | -i 옵션으로 여러 개의 URL을 한 번에 다운로드 가능 |
| 레쥬메(이어받기) | -C - 옵션 사용 | 기본적으로 지원 |
| 백그라운드 실행 | 지원하지만 직접 설정 필요 | -b 옵션으로 기본적으로 백그라운드 다운로드 가능 |
| POST 요청 지원 | -X POST -d "data" 등으로 지원 | HTTP 요청 지원은 하지만 제한적 |
| 쿠키 저장 및 사용 | -b, -c 옵션 사용 | 자동 저장 및 사용 가능 |
| 프록시 지원 | --proxy 옵션 사용 | 기본적으로 지원 |