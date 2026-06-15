---
title       : "Jekyll Chirpy 하위 카테고리는 폴더가 아니라 front matter 배열로 만든다"
description : "_posts/ 하위 폴더는 카테고리와 무관. categories: [상위, 하위] 배열로만 다단계 카테고리가 생긴다."
date        : 2026-06-12 11:00:00 +0900
updated     : 2026-06-12 11:00:00 +0900
categories  : [opensource, "Jekyll"]
tags        : [jekyll, chirpy]
pin         : false
hidden      : false
---

Chirpy 테마 `/categories/` 페이지의 펼치기/접기 화살표는 **하위 카테고리가 있을 때만** 활성화된다. 모든 글이 `categories: [lazyvim]`처럼 단일 카테고리만 쓰면 모든 화살표에 `disabled` 클래스가 붙어 금지 커서가 뜨고 클릭이 안 된다.

## 핵심: 폴더 구조는 카테고리와 무관

Jekyll은 `_posts/` 하위 폴더를 카테고리로 인식하지 않는다. URL과 카테고리는 오직 front matter의 `categories:` 필드로만 결정된다. 폴더는 순수 정리 용도.

## 다단계 카테고리 만들기

`_posts/lazyvim/2025-10-04-plugin.md` 같은 글의 front matter:

```yaml
---
title: Lazyvim Plugin 정리
categories: [lazyvim, 플러그인]   # [상위, 하위]
---
```

이러면 `/categories/` 페이지의 lazyvim 카드에 화살표가 활성화되고, 펼치면 `플러그인` 하위 카테고리가 보인다.

## Chirpy의 카테고리 페이지 정렬

`_layouts/categories.html`에서 `site.categories | sort`로 가나다순 정렬. 한글이 영문 뒤로 가는 게 마음에 안 들면 `_data/`에 순서 데이터 파일을 두고 레이아웃을 바꾸면 된다.

## 보너스: jekyll serve의 빈 파일 버그

incremental build가 가끔 `_site/archives/index.html` 같은 파일을 **1바이트(개행 하나)** 로 잘못 만들어 흰 화면이 나올 때가 있다. 전체 빌드로 복구:

```bash
bundle exec jekyll build
```

증상이 반복되면 dev 서버 재시작이 답.
