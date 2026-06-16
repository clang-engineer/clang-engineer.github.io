---
title       : 유용한 웹 개발 도구
description : "ERD Cloud·Excalidraw·Learn Git Branching·Wappalyzer 등 ERD·다이어그램·git 학습·브라우저 분석에 자주 쓰는 무료 도구와 대안을 정리한다."
date        : 2021-10-05 11:35:56 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [etc, "개발 도구"]
tags        : [tools, git]
pin         : false
hidden      : false
---

## ERD 작성

### [ERD Cloud](https://www.erdcloud.com/)

브라우저 기반 ERD 도구. 회원가입 없이 시작할 수 있고 public/private 모드 선택, PNG/SQL 추출이 된다. 협업 공유에 가장 무난한 옵션.

**대안**

- [dbdiagram.io](https://dbdiagram.io/) — DBML 코드로 ERD를 정의. 텍스트 기반이라 git에 두기 좋음
- [draw.io](https://app.diagrams.net/) — 자유도가 높지만 ERD 전용은 아님
- [DBeaver](https://dbeaver.io/) — 실제 DB 연결 후 자동 ERD 생성

## 다이어그램

### [Excalidraw](https://excalidraw.com/)

손그림 느낌의 다이어그램 도구. 시스템 구조·플로우·간단한 와이어프레임에 좋고, 협업 모드도 가벼움. `.excalidraw` 파일을 git에 두면 변경 이력 관리도 됨.

**대안**

- [draw.io](https://app.diagrams.net/) — 격식 있는 다이어그램·플로우차트
- [Mermaid](https://mermaid.js.org/) — 텍스트로 정의, GitHub 마크다운에 인라인 렌더링됨

## Git 학습

### [Learn Git Branching](https://learngitbranching.js.org/)

브랜치/머지/rebase/cherry-pick을 시각적으로 보여주는 인터랙티브 튜토리얼. `git rebase`나 `git cherry-pick`을 처음 익힐 때 글로 읽는 것보다 훨씬 빠르다.

## 브라우저 확장

### Wappalyzer

방문 중인 사이트가 어떤 프레임워크·CDN·CMS·언어로 만들어졌는지 표시해주는 확장. 경쟁사 스택 파악, 영감 얻기, 기술 트렌드 관찰에 유용.

- [Chrome Web Store](https://chromewebstore.google.com/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg)

**대안**: [BuiltWith](https://builtwith.com/) — 웹 기반 분석 도구
