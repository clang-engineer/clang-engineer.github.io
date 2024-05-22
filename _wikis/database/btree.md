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
- B tree는 데이터베이스와 파일 시스템에서 널리 사용되는 자료구조이다.
- B tree는 균형 트리로, 모든 리프 노드가 같은 레벨에 있어야 한다.

## B tree의 특징
- 자녀 노드의 최대 개수를 늘리기 위해서 부모 노드에 key를 하나 이상 저장한다.
- 부모 노드의 key들을 오름차순으로 정렬한다.
- 정렬된 순서에 따라 자녀 노드들의 key값의 범위가 결정된다. 

# B tree 구조
- M: 각 노드의 최대 자녀 노드 수 (최대 M개 자녀를 가질 수 있는 B tree를 M차 B tree라고 한다.)
- M-1: 각 노드의 최대 key 수
- [M/2]: 각 노드의 최소 자녀 노드 수 (M이 홀수인 경우에는 M/2를 올림한 값
- [M/2]-1: 각 노드의 최소 key 수

> root node, leaf node 제외
> internal 노드의 key수가 x개라면 자녀 노드의 수는 언제나 x+1개이다.
노드가 최소 하나의 key는 가지기 때문에 몇차 B tree인지와 상관없이 internal 노드는 최소 두개의 자녀는 가진다

# B tree 데이터 삽입 방식
- 추가는 항상 leaf node에 이루어진다.
- 노드가 넘치면 가운데(median) key를 기준으로 좌우 key들을 분할하고 가운데 key는 승진한다.


# 참고 & 출처
- [쉬운코드](https://www.youtube.com/@ez./playlists)
- [B tree - Wikipedia](https://en.wikipedia.org/wiki/B-tree)