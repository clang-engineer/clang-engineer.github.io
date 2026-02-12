---
layout: post
title: "Array vs List: ArrayList와 LinkedList"
date: 2025-02-12 13:40:29 +0900
categories: [study, data-structure]
tags: [data-structure, array, list, arraylist, linkedlist]
summary: "Array와 List의 차이점, ArrayList와 LinkedList 비교"
---

# Array
- 연속된 메모리 공간에 같은 타입의 데이터를 순차적으로 저장하는 자료구조
- 인덱스를 통해 O(1)에 접근 가능
-

# List
- 순서를 가지며 추가, 삭제, 탐색이 가능한 ADT(Abstract Data Type)
(* ADT: 구조의 형태와 연산의 의미만 정의한 것, what과 how를 분리한 것. what은 ADT, how는 구현체)

# List를 구현하는 방법
- Array
- Linked node

## Array List
- Array를 이용하여 List를 구현한 것
- 장점: 
    - 인덱스를 통해 O(1)에 접근 가능
    - 메모리 공간을 연속적으로 사용하기 때문에 캐시 효율이 좋다.
- 단점:
    - 크기가 고정되어 있어서 크기를 변경할 수 없다.
    - 중간에 데이터를 삽입하거나 삭제할 경우 O(n)의 시간이 소요된다.
    - 데이터를 삽입하거나 삭제할 경우 데이터를 이동시켜야 한다.

## Linked List
- Linked node를 이용하여 List를 구현한 것
- 장점:
    - 크기가 고정되어 있지 않아서 크기를 변경할 수 있다.
    - 중간에 데이터를 삽입하거나 삭제할 경우 O(1)의 시간이 소요된다.
    - 데이터를 삽입하거나 삭제할 경우 데이터를 이동시킬 필요가 없다.
- 단점:
    - 인덱스를 통해 접근할 수 없다.
    - 메모리 공간을 연속적으로 사용하지 않기 때문에 캐시 효율이 좋지 않다.

# 정리
- List는 ADT이고 Array는 이를 구현한 Data Structure이다.
- List는 Array와 Linked node로 구현할 수 있다.
