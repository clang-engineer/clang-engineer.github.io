---
layout  : wiki
title   : B tree
summary : 
date    : 2024-05-23 08:41:19 +0900
updated : 2024-05-23 08:41:26 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# B tree 개념과 특징

## B tree란?
- B tree는 이진탐색트리(BST)의 일반화된 형태로, 각 노드에 여러 개의 키를 가질 수 있는 트리 구조이다. 
- 부모  노드가  두 개 이상의 자식 노드를 가질 수 있는 트리 구조이다.
- B tree는 데이터베이스와 파일 시스템에서 널리 사용되는 자료구조이다.
- B tree는 균형 트리로, 모든 리프 노드가 같은 레벨에 있어야 한다.

## B tree의 특징
- 노드가 자녀를 x개 가졌다면 key는 x-1개를 가진다.
- 자녀 노드의 최대 개수를 늘리기 위해서 부모 노드에 key를 하나 이상 저장한다.
- 부모 노드의 key들을 오름차순으로 정렬한다.
- 정렬된 순서에 따라 자녀 노드들의 key값의 범위가 결정된다. 
- 모든 leaf node는 같은 레벨에 있어야 한다.

# B tree 구조
- M: 각 노드의 최대 자녀 노드 수 (최대 M개 자녀를 가질 수 있는 B tree를 M차 B tree라고 한다.)
- M-1: 각 노드의 최대 key 수
- [M/2]: 각 노드의 최소 자녀 노드 수 (M이 홀수인 경우에는 M/2를 올림한 값
- [M/2]-1: 각 노드의 최소 key 수 (root, leaf node 제외)

> root node, leaf node 제외
> internal 노드의 key수가 x개라면 자녀 노드의 수는 언제나 x+1개이다.
노드가 최소 하나의 key는 가지기 때문에 몇차 B tree인지와 상관없이 internal 노드는 최소 두개의 자녀는 가진다

# B tree 데이터 삽입 방식
- 추가는 항상 leaf node에 이루어진다.
- 노드가 넘치면 가운데(median) key를 기준으로 좌우 key들을 분할하고 가운데 key는 승진한다.

# B tree 데이터 삭제 방식
- 삭제는 항상 leaf node에서 이루어진다.
- internal 노드를 삭제할 경우 선임자 또는 후임자와 위치를 바꾼후 삭제한다.
- 삭제 후 최소 key수보다 적어졌다면 재조정이 필요하다.

## 재조정
1. key수가 여유있는 형제 노드로부터 key를 빌려온다.
2. 1.이 불가능하다면 부모의 key를 빌려오고 형제 노드와 병합한다.
3. 2.후 부모 노드에 문제가 생겼다면 재균형을 위해 부모 노드를 재조정한다.


# B tree가 DB 인덱스에 사용되는 이유

|tree|B tree(B+, B*) | self-balancing BST(AVL, Red-Black) |
|case| avg, worst | avg, worst |
|--|--|--|
|search| O(logN) | O(logN) |
|insert| O(logN) | O(logN) |
|delete| O(logN) | O(logN) |

- B tree는 데이터베이스와 파일 시스템에서 널리 사용되는 자료구조이다.
- B tree 계열(B+ tree, B* tree)와 self-balancing tree 계열(AVL tree, Red-Black tree)의 조회, 삽입, 삭제 성능은 비슷하다. 그러나 B tree 계열은 데이터베이스와 파일 시스템에서 널리 사용되는 이유는 다음과 같다.

1. DB는 secondary storage에 저장된다.
2. DB에서 데이터를 조회할 때 secondary storage에 최대한 적게 접근하는 것이 성능 면에서 좋다.
3. file system이 block 단위로 데이터를 읽고 쓰기 때문에 연관된 데이터를 모아서 저장하면 더 효율적으로 읽고 쓸 수 있다.

> self-balancing BST의 노드들을 연속적으로 저장하면 B tree와 비슷한 성능을 낼 수 있다. 그러나 self-balancing BST는 노드들을 연속적으로 저장하지 않는다.
> 

# 참고 & 출처
- [쉬운코드](https://www.youtube.com/@ez./playlists)
- [B tree - Wikipedia](https://en.wikipedia.org/wiki/B-tree)