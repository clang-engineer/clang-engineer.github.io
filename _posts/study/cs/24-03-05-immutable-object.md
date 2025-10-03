---
title       : Immutable Object (불변 객체)
description : >-
    Immutable Object에 대해 정리한 글입니다.
date        : 2024-03-05 15:02:03 +0900
updated     : 2024-03-05 15:02:43 +0900
categories  : [study, programming]
tags        : [immutable object]
pin         : false
hidden      : false
---

Immutable Object란, 생성된 후에는 내부의 상태를 변경할 수 없는 객체를 의미한다.

## Immutable Object의 장점
- Immutable Object는 내부의 상태를 변경할 수 없기 때문에, Thread-Safe하다. (일반적으로 Thread-Safe하다고 보면 된다.)
    * 외부에 노출되는 상태 정보는 immutable 하지만 내부에서 사용되는 상태 정보는 mutable한 경우에도 Immutable Object라고 부르기도 한다. (이 경우 Thread-Safe하지 않다.)
- Immutable Object는 이해하기 쉽고 안정적인 서비스 개발에 도움이 된다.
- map, set, cache 에 쓰기에 적합하다.
- 불변 객체를 필드로 쓰면 방어적 복사가 필요 없다.
(* 방어적 복사란, 객체를 복사할 때, 객체의 내부 상태를 변경할 수 없도록 복사하는 것을 의미한다.)

## Immutable Object의 단점
- Immutable Object는 내부의 상태를 변경할 수 없기 때문에, 객체를 생성할 때 많은 메모리, 시간을 사용한다.

## Immutable Object의 설계 원칙
- 상태 변경 메소드를 제공하지 않는다.
- 모든 필드를 변경 불가능하게 선언한다. (c++의 경우 const로 선언, java의 경우 final로 선언)
- 클래스간 상속을 금지한다. (final로 선언한다.)
- mutable 객체의 레퍼런스를 공유하지 않는다. (만약 객체의 필드 중에 mutable 객체를 가리키는 레퍼런스가 있다면, 해당 필드를 복사할 때, 방어적 복사를 해야한다.)
- 모든 필드를 불변객체만 사용하면 방어적 복사가 필요 없다.

## Java의 String 클래스
- String은 Java에서 Immutable Object를 구현한 대표적인 클래스이다.


> 출처 & 참고
- [쉬운코드](https://www.youtube.com/watch?v=EOGOJdBy2Rg&list=PLcXyemr8ZeoRRaTfapB8GMMrLMlCTN4wJ)
