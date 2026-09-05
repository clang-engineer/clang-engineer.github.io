---
title       : "GitHub Fork vs Use this template — 관계를 이어갈 것인가, 출발점만 복사할 것인가"
description : "Fork와 Use this template을 단순 복사 기능으로 비교하지 않고 원본 저장소와의 관계, commit history, upstream 기여·동기화라는 비교축으로 선택 기준을 정리한다."
date        : 2026-06-08 11:00:00 +0900
updated     : 2026-09-05 19:20:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, fork, template, comparison]
pin         : false
hidden      : false
---

GitHub의 **Fork**와 **Use this template**은 둘 다 기존 저장소에서 새 저장소를 시작할 수 있지만 같은 종류의 복사 기능은 아니다.

가장 중요한 비교축은 하나다.

> **새 저장소가 원본과 계속 관계를 맺어야 하는가, 아니면 원본을 출발점으로만 사용하고 독립해야 하는가?**

```text
원본과 관계 유지
→ Fork

초기 구조만 가져와 독립
→ Use this template
```

이 좌표를 먼저 잡으면 세부 차이는 대부분 여기서 따라온다.

## 1. 큰 차이 — 관계를 복제하나, 시작점을 복제하나

### Fork

Fork는 GitHub 플랫폼에서 원본 저장소와 **fork network 관계**를 가진 새 저장소를 만든다.

```text
Upstream Repository
       ↓ fork 관계
Your Fork
       ↓
변경 / Pull Request
       ↓
Upstream
```

원본에 기여하거나 원본 변경을 계속 따라가는 흐름에 적합하다.

### Use this template

Template은 저장소의 현재 구조를 새 프로젝트의 출발점으로 사용한다.

```text
Template Repository
       ↓ 초기 내용으로 생성
New Repository
       ↓
이후 독립 History
```

새 저장소는 fork network에 들어가지 않고 원본에 대한 upstream contribution 관계도 자동으로 생기지 않는다.

## 2. 같은 비교축에서 보기

| 비교축 | Fork | Use this template |
|---|---|---|
| 원본과 GitHub 관계 | fork network 유지 | 독립 저장소 |
| 주 목적 | 원본 기반 개발·기여 | 새 프로젝트 시작점 |
| Commit history | 원본 history를 이어받음 | 새 저장소 history로 시작 |
| Upstream PR | 자연스러운 workflow | template 관계만으로는 없음 |
| 원본 변경 추적 | upstream/fork sync와 잘 맞음 | 필요하면 별도 remote·merge 전략 구성 |
| GitHub 표시 | `forked from` 관계 표시 | 독립 repo |

즉 "어느 쪽이 더 많이 복사하나"보다 **원본과의 관계를 저장소 정체성에 포함할 것인가**가 더 중요한 차이다.

## 3. Fork가 맞는 경우

다음 질문에 Yes라면 Fork가 자연스럽다.

```text
원본 프로젝트에 변경을 다시 기여할 것인가?
원본 History와 계보를 유지하는 것이 의미 있는가?
Upstream 변경을 계속 따라갈 것인가?
```

예를 들면 오픈소스 라이브러리나 테마 본체를 수정해 Pull Request를 보내는 작업이다.

## 4. Template이 맞는 경우

다음 상황은 Template 쪽에 가깝다.

```text
원본은 프로젝트 뼈대일 뿐이다
        ↓
생성 이후에는 독립 제품·사이트·서비스가 된다
        ↓
원본 fork network에 포함될 이유가 없다
```

boilerplate, starter, 프로젝트 skeleton처럼 **같은 구조로 여러 독립 프로젝트를 시작하기 위한 저장소**가 대표적이다.

## 5. 예시 — Chirpy 본체와 Starter

Chirpy 계열을 예로 들면 역할이 다르다.

```text
jekyll-theme-chirpy
→ 테마 본체
→ 본체 수정·기여 목적이면 Fork

chirpy-starter
→ 개인 사이트를 시작하기 위한 Template
→ Use this template
```

starter를 기술적으로 fork할 수 있느냐보다 **그 저장소가 어떤 관계를 만들기 위해 제공됐는가**를 보는 편이 중요하다.

## 6. 독립 저장소도 Upstream 변경을 가져올 수 있다

GitHub의 fork 관계가 없다고 Git level에서 다른 저장소의 변경을 가져올 수 없는 것은 아니다.

독립 저장소에도 remote를 추가할 수 있다.

```bash
git remote add upstream https://github.com/<org>/<repo>.git
git fetch upstream
git merge upstream/main
```

따라서 두 개념을 구분해야 한다.

```text
GitHub Fork 관계
≠
Git Remote를 통한 변경 가져오기
```

Fork는 **GitHub 플랫폼의 저장소 관계와 contribution workflow**를 제공하고, remote는 Git 자체에서 다른 저장소의 reference를 가져오는 메커니즘이다.

## 7. 선택 기준

```text
원본에 계속 기여·동기화하는 파생 저장소인가?
├─ Yes → Fork
└─ No
    ↓
원본 구조를 출발점으로 독립 프로젝트를 만드는가?
├─ Yes → Use this template
└─ No → 단순 clone/remote 등 다른 방법 검토
```

## 주의할 점

기존 독립 repository를 GitHub UI에서 단순히 다른 repository의 fork로 전환하는 일반적인 기능은 제공되지 않는다. fork network 관계 자체가 필요하다면 처음부터 Fork workflow를 선택하는 편이 단순하다.

서로 unrelated한 Git history를 기술적으로 합치는 것과 GitHub의 fork network 관계를 만드는 것도 별개의 문제다.

## 정리

```text
Fork
= 원본과의 관계를 유지하는 파생 저장소

Use this template
= 원본 구조를 출발점으로 만드는 독립 저장소
```

둘의 핵심 차이는 **복사 방식보다 원본과의 관계를 계속 유지할 것인지**에 있다.
