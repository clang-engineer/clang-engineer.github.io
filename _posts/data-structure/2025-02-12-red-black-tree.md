---
layout: post
title: "Red Black Tree"
date: 2025-02-12 12:58:25 +0900
categories: [study, data-structure]
tags: [data-structure, tree, red-black-tree, balanced-tree]
summary: "균형 이진 탐색 트리의 일종인 Red Black Tree"
---

# Red Black Tree란?
- Red Black Tree는 `이진 탐색 트리(BST)`를 바탕으로 한 `자기 균형 트리`이다.
- 균형 조건을 높이 차이로 직접 제한하지 않고, `노드의 색`과 회전/재색칠 규칙으로 높이가 `O(log n)`이 되도록 유지한다.
- 삽입·삭제 시 점검/조정해서, 최악의 경우에도 탐색이 선형으로 늘어나지 않게 만든다.

# Red Black Tree의 속성
- 모든 노드는 Red 또는 Black이다.
- Root node는 Black이다.
- 모든 `NIL`(끝 포인터)은 Black으로 본다.
- Red 노드의 자식은 모두 Black이다. 즉, Red가 연속으로 나오지 않는다.
- 어떤 노드에서 자식으로 내려가는 경로든, `NIL`에 도달할 때까지의 `Black 높이(Black-height)`는 모두 동일하다.

# 동작과 복잡도

- 조회/삽입/삭제: 최악의 경우 모두 `O(log N)`
- 삽입: 신규 노드를 Red로 시작한 뒤, **recoloring**과 **회전(좌/우 회전)**을 통해 규칙 위반을 바로잡는다.
- 삭제: 삭제 후 검은색 높이 불균형을 해소하기 위해 회전·재색칠을 진행한다.

# 요약 정리

- AVL처럼 "매 삽입마다 엄격한 높이균형"을 강제하지는 않지만, 더 완만한 균형 규칙 덕분에 회전 횟수가 상대적으로 적은 편이다.
- 장점: 검색-삽입-삭제 모두 성능이 안정적이고, C++ STL의 `std::map`/`std::set` 구현 계열에서 널리 쓰인다고 알려져 있다.
