---
layout  : wiki
title   : B tree 
summary : 
date    : 2023-11-29 09:42:39 +0900
updated : 2023-11-29 09:45:08 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# B tree 개념 
- B tree는 데이터베이스에서 사용되는 자료구조로서, 데이터를 저장하는데 사용되는 트리형 자료구조이다.
B tree는 BST(Binary Search Tree)의 일반화된 형태이다.
- 자녀 노드의 최대 개수를 늘리기 위해서 부모 노드에 key를 하나 이상 저장한다.
- 부모 노드의 key들을 오름차순으로 정렬한다.
- 정렬된 순서에 따라 자녀 노드들의 key값의 범위가 결정된다.


# DB index로 B tree를 사용하는 이유
- DB는 기본적으로 secondary storage(하드디스크)에 데이터를 저장한다.
- B tree index는 self-balancing BST(AVL tree, red-black tree)에 비해 secondary storage 접근을 적게 한다. (disk I/O가 적게 발생한다.)
- B tree 노드는 block 단위의 저장 공간을 효율적으로 사용할 수 있다.
- vs Hash Index: B tree는 범위 검색이 가능하다. (Hash Index는 불가능하다.)


# B tree에서 사용하는 파라미터
- M : 각 노드의 최대 자녀 노드 수
- M-1 : 각 노드의 최대 key 수
- M/2(올림) : 각 노드의 최소 자녀 노드 수 (root, leaf node 제외)
- M/2(올림)-1 : 각 노드의 최소 key 수 (root node를 제외)


# B tree의 특징
- B tree는 balanced tree이다.
- B tree의 최악, 평균의 경우 시간 복잡도는 O(log n)이다.
- 모든 leaf node는 같은 레벨에 존재한다.
- root node는 최소 2개의 자녀 노드를 가져야 한다.
- root node를 제외한 모든 노드는 최소 M/2(올림)개의 자녀 노드를 가져야 한다.
- root node를 제외한 모든 노드는 최대 M개의 자녀 노드를 가져야 한다.
- leaf node를 제외한 모든 노드는 최소 M/2(올림)-1개의 key를 가져야 한다.
- leaf node를 제외한 모든 노드는 최대 M-1개의 key를 가져야 한다.
- leaf node는 최소 1개의 key를 가져야 한다.
- leaf node는 최대 M-1개의 key를 가져야 한다.

# B tree의 예시
![B tree](https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/B-tree.svg/600px-B-tree.svg.png)


# B tree 데이터 삽입
- 추가는 항상 leaf node에서 이루어진다.
- 노드가 넘치면 가운데 key를 기준으로 좌우 key들은 분할하고 가운데 key는 부모 노드로 올린다.


# B tree 데이터 삭제
- 삭제는 항상 leaf node에서 이루어진다.
- 삭제 후 최소 key 수보다 적은 key를 가지고 있으면 재조정한다.
    - 형제 지원 -> 부모 지원 & 형제와 합침 -> 부모 재조정
- internal 노드의 경우 선임자와 위치 바꾼 후 삭제한다.

## 재조정 순서
1. key수가 여유있는 형제의 지원을 받는다.
2. 1번이 불가능하면 부모의 지원을 받고 형제와 합친다.
3. 2번 후 부모에 문제가 있다면 거기서 다시 재조정한다.

## 재조정 순서 상세
1. key 수가 여유있는 형제의 지원을 받는다. (key를 가져올 때는 부모 노드의 key를 하나 가져와야 한다.)
- 1.1 동생(왼쪽 형제)가 여유가 있으면
- -> 동생의 가장 큰 key를 부모 노드의 나와 동생 사이에 둔다
- -> 원래 그 자리에 있던 key는 나의 가장 왼쪽에 둔다.
- 1.2 형(오른쪽 형제)가 여유가 있으면
- -> 형의 가장 작은 key를 부모 노드의 나와 형 사이에 둔다.
- -> 원래 그 자리에 있던 key는 나의 가장 오른쪽에 둔다.

2. 형제의 지원이 불가능하면 부모의 지원을 받고 형제와 합친다.
- 2.1 동생이 있으면 동생과 나 사이의 key를 부모로부터 받는다.
- -> 그 key와 나의 key를 차례대로 동생에게 합친다.
- -> 나의 노드를 삭제한다.
- 2.2 동생이 없으면 형과 나 사이의 key를 부모로부터 받는다.
- -> 그 key와 형의 key를 차례대로 나에게 합친다.
- -> 형의 노드를 삭제한다. 

3. 부모가 지원한 후 부모에 문제가 있다면 상황에 맞게 대응한다.
- 3.1 부모가 root노드가 아니라면
- -> 그 위치에서부터 다시 1번부터 재조정을 시작한다.
- 3.2 부모가 root노드라면
- -> 부모 노드를 삭제하다.
- -> 직접에 합쳐진 노드가 root 노드가 된다.

## internal 노드 데이터 삭제
- internal 노드에 있는 데이터를 삭제하려면 leaf 노드에 있는 데이터와 위치를 바꾼 후 삭제한다.
    - 선임자나 후임자는 항상 leaf 노드에 있으므로 삭제할 데이터의 선임자나 후임자와 위치를 바꾼 후 삭제한다.
    - 선임자(predecessor) : 삭제할 데이터의 왼쪽 서브트리에서 가장 큰 데이터
    - 후임자(successor) : 삭제할 데이터의 오른쪽 서브트리에서 가장 작은 데이터
- leaf 노드에서 삭제하고 필요하면 재조정


# 참고
- [쉬운코드](https://www.youtube.com/watch?v=bqkcoSm_rCs&list=PLcXyemr8ZeoREWGhhZi5FZs6cvymjIBVe&index=26)