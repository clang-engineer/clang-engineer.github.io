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
- 크기 변경은 보통 재할당이 필요

# List (ADT)
- 순서를 가지며 추가, 삭제, 탐색이 가능한 추상 자료형
- 구현체에 따라 성능이 달라진다

# List 구현 방법
- Array (ArrayList)
- Linked node (LinkedList)

## ArrayList
- Array를 이용하여 List를 구현
- 장점
  - 인덱스를 통해 O(1)에 접근 가능
  - 연속 메모리로 캐시 효율이 좋다
- 단점
  - 중간 삽입/삭제 시 O(n)
  - 크기 확장 시 재할당 비용 발생

## LinkedList
- Linked node를 이용하여 List를 구현
- 장점
  - 중간 삽입/삭제가 O(1) (노드 참조가 있을 때)
  - 크기 제약이 없다
- 단점
  - 인덱스 접근이 O(n)
  - 포인터 오버헤드로 캐시 효율이 낮다

## 연산 복잡도 비교

| 연산 | ArrayList | LinkedList |
|------|-----------|------------|
| 인덱스 접근 | O(1) | O(n) |
| 중간 삽입/삭제 | O(n) | O(1) (참조 보유 시) |
| 끝 삽입 | 평균 O(1) | O(1) |
| 메모리 locality | 좋음 | 나쁨 |

## 선택 기준
- 데이터 접근이 빈번하고 캐시 효율이 중요하면 ArrayList
- 중간 삽입/삭제가 많고 노드 참조를 유지한다면 LinkedList
- 단순 순회/읽기 위주면 ArrayList가 유리한 경우가 많다

# 정리
- List는 ADT이고 Array/LinkedList는 구현체다
- 상황에 따라 접근 패턴, 삽입/삭제 위치, 메모리 특성을 보고 선택한다
