---
layout  : wiki
title   : DB Index
summary : 
date    : 2023-11-27 13:12:00 +0900
updated : 2023-11-27 15:17:58 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# index가 중요한 이유

- index를 사용하지 않으면, 데이터를 찾기 위해 모든 데이터를 순차적으로 검색해야 한다.
- index를 사용하면, 데이터를 찾기 위해 모든 데이터를 순차적으로 검색하지 않아도 된다.
- index는 B+Tree기반의 자료구조를 사용하기 때문에 시간복잡도가 O(n)에서 O(log n)으로 줄어든다.

# index의 단점
- index를 생성하면 index를 저장하기 위한 공간이 추가로 필요하다.
- index를 생성하면 데이터를 삽입, 삭제, 수정할 때마다 index를 재생성해야 하기 때문에 성능이 저하될 수 있다.

# Full scan 이 더 빠른 경우
- 데이터가 적은 경우
- 조회하려는 데이터가 테이블의 상당 부분을 차지하는 경우 (예를 들어, 테이블의 90% 이상의 데이터를 조회하는 경우)
- 조회하려는 컬럼의 cardinality가 낮은 경우 (예를 들어, 성별 컬럼의 경우, 남자, 여자 두 가지 밖에 없기 때문에 cardinality가 낮다.)

# index의 종류
## unique index
- index에 중복된 값이 없는 경우
- primary key는 unique index이다.

## non-unique index
- index에 중복된 값이 있는 경우

## covering index
- index에 데이터가 모두 포함되어 있는 경우 (index만으로 데이터를 조회할 수 있는 경우)
- index만으로 데이터를 조회할 수 있기 때문에, 테이블에 접근하지 않아도 된다. 때문에, 성능이 매우 빠르다.

## hash index
- hash table을 사용하여 index를 구현한 경우
- 시간복잡도가 O(1)이기 때문에 매우 빠르다.
- 하지만, hash table은 정렬되어 있지 않기 때문에 범위 검색에는 적합하지 않다. (동등 비교에만 적합하다.)
- multicolumn index의 경우 전체 column을 hash한 값을 index로 사용한다. 때문에, 전제 attributes에 대한 조회만 가능하다.

# index 관련 명령
## index 생성
```sql
create index index_name on table_name(column_name);
```

## index 삭제
```sql
drop index index_name on table_name;
```

## table의 index 목록 확인
```sql
show index from table_name;
```

## query 실행시 사용하는 index 확인
```sql
explain select * from table_name;
```

# index 동작 방식
- index는 B+Tree기반의 자료구조를 사용한다.
- B+Tree는 binary search tree의 일종으로, 데이터를 저장할 때 정렬하여 저장한다.
- B+Tree는 leaf node에 데이터를 저장하고, leaf node는 linked list로 연결되어 있다.
- B+Tree는 leaf node를 제외한 모든 node에 key값을 저장한다.
- B+Tree는 leaf node의 linked list를 사용하여 범위 검색을 할 수 있다.
- B+Tree는 leaf node의 linked list를 사용하여 정렬된 데이터를 조회할 수 있다.
- B+Tree는 leaf node의 linked list를 사용하여 데이터를 삽입, 삭제, 수정할 수 있다.


# index 사용 시 참고사항
- primary key는 index가 자동으로 걸린다.
- foreign key는 index가 자동으로 걸릴 수도 있다. (DB마다 다르다.)
- 운영중인 DB에서 index를 걸어야 하는 경우, 운영중인 DB에 영향을 주지 않도록 주의해야 한다. (몇백만건의 데이터가 있는 테이블에 index를 걸면, index를 생성하는데 시간이 오래 걸릴 수 있다.)
- db의 optimizer는 query를 실행할 때 어떤 index를 사용할지 결정한다. (이때, optimizer는 통계정보를 사용한다.) 때문에, optimizer가 잘못된 index를 선택할 수도 있다. (이런 경우, index를 걸지 않는 것이 더 빠를 수도 있다.)
- optimizer가 아닌 개발자가 직접 특정 index를 사용하도록 강제 하려면 `use index(index_name)` 또는 `force index(index_name)`을 사용한다. (이때, `use index`는 index는 optimizer가 선택하지만, `force index`는 index를 강제로 사용한다.)
- index를 사용하지 않도록 하려면 `ignore index(index_name)`을 사용한다.
- 사용하는 query에 맞춰서 적절하게 index를 걸어줘야 query가 빠르게 처리될 수 있다.

  
# 참조
* [유튜브 쉬운코드](https://www.youtube.com/watch?v=IMDH4iAQ6zM&list=PLcXyemr8ZeoREWGhhZi5FZs6cvymjIBVe&index=25)
