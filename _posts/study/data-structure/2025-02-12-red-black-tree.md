---
layout: post
title: "Red Black Tree"
date: 2025-02-12 12:58:25 +0900
categories: [study, data-structure]
tags: [data-structure, tree, red-black-tree, balanced-tree]
summary: "균형 이진 탐색 트리의 일종인 Red Black Tree"
---

# Red Black Tree란?
- Red Black Tree는 균형 이진 탐색 트리의 일종이다.
- Red Black Tree는 BST의 일종으로, 모든 노드의 왼쪽 서브트리와 오른쪽 서브트리의 높이 차이가 1 이하인 트리를 말한다.
- Red Black Tree는 BST의 일종으로, 모든 노드가 Red 또는 Black인 트리를 말한다.
- Red Black Tree는 균형을 맞추기 위해 노드의 삽입과 삭제가 일어날 때마다 색을 변경한다.

# Red Black Tree의 속성
- 모든 노드는 Red 또는 Black이다.
- Root node는 Black이다.
- 모든 nil(leaf) node는 Black이다.
- Red node의 자식은 모두 Black이다. (Red node는 연속해서 나타날 수 없다.)
- 임의의 노드로부터 leaf node까지의 모든 경로에는 Black node의 개수가 동일하다. (Black height가 동일하다.)