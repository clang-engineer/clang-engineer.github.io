---
title       : "Neovim에서 리팩토링 후보 찾기 — 긴 함수·복잡도·중복 코드를 일일이 찾지 않는 방법"
description : "프로젝트 전체를 눈으로 훑지 않고 긴 함수, 높은 복잡도, 중복 코드, Code Smell을 정적 분석으로 찾는 방법과 Neovim·Trouble·SonarQube의 역할을 정리한다."
date        : 2026-09-05 21:30:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [refactoring, static-analysis, sonarqube, sonarlint, trouble, diagnostics]
---

코드를 리팩토링하려고 할 때 의외로 번거로운 일은 **리팩토링 자체보다 대상을 찾는 일**이다.

프로젝트가 커지면 모든 파일을 열어 보면서 다음과 같은 코드를 직접 찾는 것은 현실적이지 않다.

- 지나치게 긴 함수나 메서드
- 분기와 중첩이 많은 복잡한 함수
- 여러 곳에 반복되는 중복 코드
- 너무 큰 클래스나 파일
- 파라미터가 지나치게 많은 함수
- 반복되는 조건식과 기타 Code Smell

여기서 필요한 것은 `Extract Function`을 실행하는 도구가 아니라 **프로젝트 전체에서 리팩토링 후보를 먼저 찾아주는 분석 도구**다.

## 리팩토링 실행과 후보 탐지는 다른 문제다

Neovim에는 `refactoring.nvim`처럼 Extract Function, Extract Variable, Inline Variable 등의 리팩토링을 편하게 실행하는 플러그인이 있다.

하지만 이런 도구는 기본적으로 **어디를 리팩토링해야 하는지 이미 알고 있을 때** 유용하다.

문제는 그 이전 단계다.

```text
프로젝트 전체
    ↓
리팩토링 후보 탐지
    ↓
우선순위 확인
    ↓
해당 코드로 이동
    ↓
LSP / refactoring.nvim / 직접 수정
```

따라서 후보 탐지에는 별도의 정적 분석기가 필요하다.

## Neovim 플러그인 하나로 해결하려 하지 않는다

`nvim-lint`는 이름 때문에 코드 품질을 직접 분석하는 도구처럼 보일 수 있지만 실제 역할은 다르다.

외부 linter나 정적 분석기를 실행하고 그 결과를 Neovim의 `vim.diagnostic`으로 연결하는 **통합 계층**에 가깝다.

마찬가지로 Trouble.nvim은 분석기가 아니다. 이미 생성된 diagnostics를 프로젝트 단위 목록으로 보기 좋게 보여주는 **UI 계층**이다.

역할을 나누면 다음과 같다.

```text
정적 분석기
  SonarQube / SonarLint
  PMD / SpotBugs
  ESLint / SonarJS
  Ruff
  golangci-lint
        ↓
vim.diagnostic
        ↓
Trouble.nvim
        ↓
리팩토링 후보 탐색
        ↓
LSP / refactoring.nvim / 직접 수정
```

이 구조를 이해하면 특정 Neovim 플러그인 하나에서 SonarQube 같은 기능을 찾을 필요가 없다.

## 무엇을 탐지해야 하나

단순히 코드 길이만 보는 것은 부족하다.

예를 들어 150줄짜리 함수라도 대부분 단순한 데이터 매핑이라면 리팩토링 우선순위가 낮을 수 있다. 반대로 50줄밖에 되지 않아도 `if`, `for`, `try`가 여러 단계 중첩되어 있다면 유지보수하기 훨씬 어렵다.

따라서 최소한 다음 지표를 함께 보는 것이 좋다.

### 함수·메서드 길이

너무 긴 함수는 여러 책임이 섞여 있을 가능성을 빠르게 찾는 1차 필터다.

### Cyclomatic Complexity

분기 경로가 얼마나 많은지를 본다. 테스트해야 할 경로가 많고 제어 흐름이 복잡한 함수를 찾는 데 유용하다.

### Cognitive Complexity

사람이 코드를 읽고 흐름을 이해하기 얼마나 어려운지를 보는 지표다. 중첩과 복잡한 제어 흐름을 찾는 데 특히 유용하다.

### Duplication

비슷하거나 동일한 코드 블록이 여러 위치에 반복되는지를 찾는다. 공통 로직 추출 후보를 발견하는 데 중요하다.

### Code Smell

과도한 파라미터, 중복 조건, 불필요한 분기, 지나치게 큰 클래스 등 언어별 정적 분석 규칙을 함께 사용한다.

결국 좋은 리팩토링 후보는 단순히 `100줄 이상` 같은 한 가지 숫자로 결정하기보다 **길이 + 복잡도 + 중복 + Code Smell**을 같이 보는 편이 낫다.

## 중복 코드까지 보려면 SonarQube가 강하다

로컬 linter만으로도 긴 함수와 복잡도는 충분히 찾을 수 있다.

하지만 프로젝트 전체의 **중복 코드, Code Smell, Cognitive Complexity와 유지보수성 문제를 한곳에서 탐색**하려면 SonarQube 계열이 잘 맞는다.

이 경우 Neovim 자체를 분석 엔진으로 만들 필요가 없다.

```text
Repository
    ↓
SonarQube 분석
    ↓
Code Smell / Duplication / Complexity
    ↓
리팩토링 우선순위 결정
    ↓
Neovim에서 수정
```

SonarQube 웹 대시보드는 프로젝트 전체를 조망하는 데 사용하고, 편집 중 즉시 확인하고 싶은 진단은 SonarLint나 언어별 분석기를 Neovim diagnostics로 연결하면 된다.

## 언어별로는 분석기를 선택한다

분석 엔진은 언어에 따라 달라질 수 있다.

```text
Java       → PMD / SpotBugs / Sonar
JavaScript → ESLint / SonarJS / Sonar
TypeScript → ESLint / SonarJS / Sonar
Python     → Ruff / Pylint / Sonar
Go         → golangci-lint / Sonar
```

중요한 것은 특정 도구 하나를 모든 언어에 억지로 적용하는 것이 아니라 **각 언어에서 검증된 분석기를 사용하고 Neovim에서는 결과를 동일한 diagnostics UI로 소비하는 것**이다.

## Trouble.nvim의 역할

분석 결과가 파일마다 diagnostics로만 표시되면 다시 파일을 하나씩 찾아다녀야 한다.

Trouble.nvim을 사용하면 프로젝트의 diagnostics를 한곳에 모아 볼 수 있다.

개념적으로는 다음과 같은 목록을 만드는 것이다.

```text
Diagnostics

src/
 ├─ UserService.java
 │   ├─ Cognitive Complexity가 너무 높음
 │   └─ 메서드가 지나치게 김
 │
 ├─ OrderService.java
 │   └─ 복잡한 조건 분기
 │
 └─ PaymentService.java
     └─ 중복 또는 Code Smell 후보
```

이제 프로젝트를 처음부터 끝까지 읽으면서 후보를 찾는 대신 **진단 목록을 리팩토링 작업 큐처럼 사용할 수 있다.**

## 결론

Neovim에서 SonarQube와 동일한 기능을 하는 단일 플러그인을 찾는 것은 문제를 잘못 나눈 접근에 가깝다.

리팩토링 워크플로는 다음 세 계층으로 나누는 것이 깔끔하다.

```text
1. 후보 탐지
   SonarQube / PMD / ESLint / Ruff / golangci-lint

2. 후보 탐색
   vim.diagnostic / Trouble.nvim

3. 실제 리팩토링
   LSP Code Action / refactoring.nvim / 직접 수정
```

특히 프로젝트 전체를 일일이 살펴보는 것이 번거로운 상황이라면 먼저 **긴 함수, Cognitive Complexity, Cyclomatic Complexity, Duplication, Code Smell을 자동으로 수집하는 단계**를 만드는 것이 효과가 크다.

리팩토링을 잘하는 것만큼이나 **리팩토링할 곳을 자동으로 찾아내는 것**도 개발 환경의 일부다.
