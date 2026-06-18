---
title       : "sudo로 jekyll 한 번 빌드하면 root 소유 잔여물 때문에 이후 빌드가 EACCES로 죽는다"
description : "sudo jekyll 빌드가 남긴 root 소유 캐시 파일이 다음 빌드를 EACCES로 죽인다 — find로 잡아 삭제"
date        : 2026-06-16 10:00:00 +0900
updated     : 2026-06-16 10:00:00 +0900
categories  : [jekyll]
tags        : [jekyll, sudo, permission, troubleshooting]
pin         : false
hidden      : false
---

`sudo bundle exec jekyll s`로 한 번이라도 띄우면 `.jekyll-cache/`·`_site/` 안에 root 소유 파일이 섞여서, 다음 일반 권한 빌드가 `Permission denied @ rb_sysopen ... (Errno::EACCES)`로 죽는다. **디렉토리 자체는 사용자 소유로 보여도 안의 파일이 root 소유**라 `ls -ld`로는 안 보인다.

## 증상

```text
/Users/zero/.rbenv/.../jekyll/cache.rb:181:in `initialize':
  Permission denied @ rb_sysopen -
  /Users/zero/.../.jekyll-cache/Jekyll/Cache/Jekyll--Cache/b7/9606...  (Errno::EACCES)
```

`tail`로 보면 Ruby 백트레이스만 가득하니 **로그 앞쪽**(`head -50` 또는 그냥 처음부터)을 봐야 진짜 메시지가 보인다.

## 함정: 디렉토리 소유자만 보면 못 잡는다

```bash
ls -ld _site .jekyll-cache
# drwxr-xr-x  zero  ...  _site
# drwxr-xr-x  zero  ...  .jekyll-cache
# → 디렉토리 자체는 zero 소유라 정상으로 보임
```

내부 파일까지 재귀 확인해야 잔여물이 드러난다:

```bash
find _site .jekyll-cache -not -user zero | head
# .jekyll-cache/Jekyll/Cache
# _site/page19
# ...
find _site .jekyll-cache -not -user zero | wc -l
# 1252
```

## 복구

빌드 산출물·캐시라 그냥 지우면 됨. 다음 빌드에서 재생성.

```bash
sudo rm -rf _site .jekyll-cache
./tools/run.sh > /tmp/jekyll.log 2>&1 &
```

## 예방

- `jekyll s`는 1024 미만 권한 포트를 안 써서 sudo가 애초에 불필요
- `sudo`를 백그라운드(`&`)로 띄우면 비밀번호 프롬프트 못 띄워 `suspended (tty output)`으로 정지됨 (`SIGTTOU`)

## 부수: Claude Code의 Bash는 sudo 비밀번호를 못 받는다

`sudo -n`(NOPASSWD)만 통과 가능. 그 외엔 `a password is required`로 즉시 실패하니 사용자에게 직접 실행 요청.

관련: 2026-06-16-bg-jobs-sudo-pgrep
