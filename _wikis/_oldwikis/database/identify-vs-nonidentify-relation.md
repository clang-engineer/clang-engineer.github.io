---
layout  : wiki
title   : 식별 비식별 관계
summary : 
date    : 2024-11-22 21:47:06 +0900
updated : 2024-11-22 21:47:34 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# 식별 관계 (Identifying Relationship)
- 관계의 한쪽 엔티티의 주 식별자가 다른 엔티티의 주 식별자 역할을 하는 관계 
- 부모 엔티티의 주 식별자가 자식 엔티티의 주 식별자 역할을 함 (ex> 부모 엔티티의 기본키가 자식 엔티티의 기본키 역할을 함)


# 비식별 관계 (Non-Identifying Relationship)
- 관계의 한쪽 엔티티의 주 식별자가 다른 엔티티의 주 식별자 역할을 하지 않는 관계
- 부모 엔티티의 주 식별자가 자식 엔티티의 주 식별자 역할을 하지 않음 (ex> 부모 엔티티의 기본키가 자식 엔티티의 외래키 역할을 함)