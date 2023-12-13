---
layout  : wiki
title   : 함수적 종속과 정규화 (Functional Dependency and Normalization)
summary : 
date    : 2023-12-14 08:33:54 +0900
updated : 2023-12-14 08:34:21 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# 함수적 종속 (Functional Dependency)
- 함수적 종속은 테이블의 속성들 간의 종속성을 의미한다.
- X -> Y 라고 할 때, X는 Y를 함수적으로 결정한다. ("X가 주어지면 Y가 유일하게 결정된다." 라는 의미)
- X는 결정자(Determinant), Y는 종속자(Dependent)라고 한다.

# 함수적 종속의 특징
- X -> Y 라고 할 때, X의 값이 Y의 값을 유일하게 결정한다.
- X -> Y 라고 할 때, X의 값이 변하면 Y의 값도 변한다.
- X -> Y 라고 할 때, Y의 값이 변해도 X의 값은 변하지 않는다.
- X -> Y 를 만족하는 것이 Y -> X를 만족하는 것을 의미하지는 않는다. 
- {} -> Y 를 만족하는 것은 Y가 테이블의 모든 행에 대해 동일한 값을 가지는 경우이다.

# 함수적 종속의 종류
## Trivial Functional Dependency
- X -> Y 이고 Y ⊆ X 일 때(즉, Y가 X의 부분집합일 때) X -> Y는 Trivial Functional Dependency이다.
ex> {A, B} -> {A}, {A, B} -> {B}, {A, B} -> {A, B}

## Non-Trivial Functional Dependency
- X -> Y 이고 Y ⊈ X 일 때(즉, Y가 X의 부분집합이 아닐 때) X -> Y는 Non-Trivial Functional Dependency이다.
ex> {A, B} -> {C}

## Partial Functional Dependency
- X -> Y 일 때, X의 어떠한 속성을 제거할 수 있는 경우
ex> {A, B} -> {C} 이면 {A} -> {C}, {B} -> {C} 는 Partial Functional Dependency이다.

## Full Functional Dependency
- X -> Y 일 때, X의 어떠한 속성도 제거할 수 없는 경우
ex> {A, B} -> {C} 이면 {A, B} -> {C} 는 Full Functional Dependency이다.

## Transitive Functional Dependency
- X -> Y, Y -> Z 일 때, X -> Z
ex> {A} -> {B}, {B} -> {C} 이면 {A} -> {C} 는 Transitive Functional Dependency이다.

# 정규화 (Normalization)
- 정규화는 테이블의 속성들 간의 종속성을 분석하여 테이블을 더 작은 테이블로 분해하는 과정이다.
- 정규화를 통해 테이블의 중복을 제거하고, 이상(Anomaly)을 제거할 수 있다. (삽입 이상, 삭제 이상, 갱신 이상)
- 정규화되기 위해 준수해야하는 규칙을 Normal Form(NF)이라고 한다. (1NF, 2NF, 3NF, BCNF, 4NF, 5NF, 6NF)
- 정규화는 1NF부터 시작하여 순차적으로 진행된다. (앞의 NF를 만족해야 뒤의 NF를 만족할 수 있다.)
- 3NF까지만 진행하면 대부분의 문제를 해결할 수 있다.
- 실무에서는 보통 3NF 혹은 BCNF까지만 진행한다.
