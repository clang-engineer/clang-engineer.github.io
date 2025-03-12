---
title       : Mybatis 관련 기록
description : >-
date        : 2021-11-22 09:00:45 +0900
updated     : 2021-12-10 09:01:11 +0900
categories  : [dev, java]
tags        : [mybatis]
pin         : false
hidden      : false
---

## Sequence 사용하기

```xml
<mapper namespace="io.test.TestDao">
    <insert id="save">
        <selectKey keyProperty="IDENTIFIER_SEQUENCE" resultType="java.lang.Integer" order="BEFORE">
            select SEQUENCE_GENERATOR.NEXTVAL from dual
        </selectKey>
        INSERT INTO tbl_test (id, title, description)
        VALUES (#{IDENTIFIER_SEQUENCE}, 'title', 'desciption')
    </insert>
</mapper>
```

- order는 before, after 두가지가 있다. before는 쿼리문 실행 전에 시퀀스 값을 생성하고, after는 쿼리문 실행 후에 시퀀스 값을 생성한다.
- <insert> 가 사용하는 parameterType 에 sequence keyProperty 를 setting 할 수 있는 속성과 setter 메서드가 있어야 한다.


## 컬렉션 매핑

- 컬렉션 매핑은 1:N 관계를 매핑할 때 사용한다.
- 컬렉션 매핑은 collection 태그를 사용한다.
- collection 태그는 property, javaType, ofType 속성을 사용한다.
  - property : 컬렉션을 담을 프로퍼티 이름
  - javaType : 컬렉션의 타입 (ArrayList, HashSet, ...)
  - ofType : 컬렉션에 담길 객체의 타입

```xml
<mapper namespace="io.test.TeamDao">
    <resultMap id="teamResultMap" type="io.test.Team">
        <id property="id" column="id"/>
        <result property="title" column="title"/>
        <result property="description" column="description"/>
        <collection property="members" javaType="java.util.ArrayList" ofType="io.test.Member">
            <id property="id" column="member_id"/>
            <result property="name" column="name"/>
        </collection>
    </resultMap>
    <select id="selectTest" resultMap="teamResultMap">
        SELECT
            t.id,
            t.title,
            t.description,
            m.id AS member_id,
            m.name
        FROM tbl_team t
        LEFT JOIN tbl_member m ON t.id = m.team_id
    </select>
</mapper>
```