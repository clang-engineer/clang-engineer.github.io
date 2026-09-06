---
title       : "Jekyll·Chirpy 운영 트러블슈팅 — 카테고리, 미래 시각, sudo 권한 문제"
description : "Chirpy 하위 카테고리 구성, future date로 글이 빌드에서 빠지는 문제, sudo 빌드가 남긴 root 소유 캐시로 EACCES가 발생하는 문제를 한곳에 정리한다."
date        : 2026-06-16 10:00:00 +0900
updated     : 2026-09-05 21:45:00 +0900
categories  : [jekyll, "빌드·운영"]
tags        : [jekyll, chirpy, troubleshooting, category, permission]
pin         : false
hidden      : false
redirect_from:
  - /posts/etc/2026-06-16-jekyll-chirpy-troubleshooting/
  - /posts/etc/2026-06-12-jekyll-chirpy-sub-categories/
  - /posts/etc/2026-06-15-jekyll-future-date-skip/
  - /posts/etc/2026-06-16-jekyll-sudo-root-owned-cache-eacces/
---

Jekyll·Chirpy 블로그를 운영하면서 실제로 마주친 작은 함정들을 한곳에 모은다. 각각 별도 글로 둘 만큼 큰 주제는 아니지만, 다시 만나면 원인을 떠올리기 어려운 문제들이다.

## Chirpy 하위 카테고리는 front matter로 만든다

`_posts/`의 물리 폴더는 이 블로그의 파일 정리와 permalink에는 영향을 주지만, Chirpy의 카테고리 계층은 글의 `categories` front matter로 구성한다.

예를 들어:

```yaml
categories: [neovim, "LazyVim"]
```

처럼 두 단계로 지정하면 `neovim` 아래에 `LazyVim` 하위 카테고리가 생긴다.

따라서 `_posts/neovim/`처럼 파일을 옮겼다고 카테고리가 자동으로 바뀌는 것은 아니다. **파일 경로와 게시 카테고리는 별개의 축**으로 관리한다.

Chirpy의 `/categories/` 페이지에서 펼치기/접기 화살표가 활성화되는 것도 실제 하위 카테고리가 있을 때다.

### incremental build 후 카테고리 페이지가 비는 경우

개발 중 incremental build가 `_site/archives/index.html` 같은 산출물을 비정상적으로 만들었다면 전체 빌드로 확인한다.

```bash
bundle exec jekyll build
```

필요하면 개발 서버를 재시작한다.

## 글 시각이 미래면 빌드에서 빠질 수 있다

글이 보이지 않을 때 빌드 로그에 다음과 비슷한 메시지가 있는지 확인한다.

```text
Skipping: _posts/.../foo.md has a future date
```

Jekyll은 기본적으로 `date`가 현재 시각보다 미래인 글을 빌드에서 제외할 수 있다. 날짜만이 아니라 **시각까지 비교**하므로, 오전에 글을 작성하면서 같은 날 오후 시각을 front matter에 넣어도 미래 글이 된다.

### 해결

로컬에서 빠르게 확인하려면:

```bash
bundle exec jekyll serve --future
```

사이트 전체에서 미래 글도 빌드하려면 `_config.yml`:

```yaml
future: true
```

예약 발행 의도가 없다면 가장 단순한 방법은 글의 `date`를 현재 이전 시각으로 맞추는 것이다.

## sudo로 빌드한 뒤 EACCES가 발생하는 경우

`sudo bundle exec jekyll serve`처럼 Jekyll을 root로 실행하면 `_site/`나 `.jekyll-cache/` 내부에 root 소유 파일이 남을 수 있다. 이후 일반 사용자로 실행하면 다음과 같은 오류가 난다.

```text
Permission denied @ rb_sysopen ... (Errno::EACCES)
```

디렉터리 자체의 소유자만 보면 정상처럼 보일 수 있으므로 내부까지 확인한다.

```bash
find _site .jekyll-cache ! -user "$(id -un)" | head
```

둘 다 빌드 산출물/캐시이므로 문제가 확인되면 지우고 다시 생성하면 된다.

```bash
sudo rm -rf _site .jekyll-cache
bundle exec jekyll serve
```

예방책은 단순하다. 일반적인 개발 서버 포트에서는 Jekyll을 `sudo`로 실행할 이유가 없다.

## 정리

| 증상 | 먼저 볼 것 | 해결 방향 |
|---|---|---|
| 하위 카테고리가 안 보임 | `categories` 배열 | `[상위, 하위]`로 지정 |
| 새 글만 빌드에서 빠짐 | front matter `date`와 현재 시각 | 시각 수정 또는 `future` 설정 |
| 이전엔 되던 빌드가 EACCES | `_site`, `.jekyll-cache` 내부 소유자 | root 산출물 제거 후 일반 사용자로 재빌드 |

이 세 문제는 서로 원인은 다르지만 공통적으로 **Jekyll이 소스 파일만 읽는 단순 변환기가 아니라 front matter, 빌드 정책, 로컬 파일 권한의 영향을 함께 받는다**는 점을 보여준다.
