---
title       : "Liquibase 설정과 사용 패턴 정리"
description : "Liquibase의 master.xml 구성, changeset 작성 규칙, CSV/타임스탬프 처리 등 실무 사용 패턴 정리"
date        : 2025-10-17 09:38:36 +0900
updated     : 2026-07-03 12:00:00 +0900
categories  : [db, "도구·연동"]
tags        : [liquibase, changeset, migration]
pin         : false
hidden      : false
---

Liquibase로 CSV 시드 데이터를 넣다 보면 대부분 **timestamp 컬럼**에서 처음 막힌다. `column is of type timestamp but expression is of type character varying` 같은 에러가 그것이다. 이 글은 그 문제를 실무에서 어떻게 우회하는지를 중심으로, master 설정 → 테이블 생성 → CSV 로드 → `dropDefaultValue` 처리까지의 패턴을 정리한 것이다. 핵심은 4장(데이터 로드)과 5장(`dropDefaultValue`)이고, 앞뒤 장들은 그 맥락을 잡기 위한 설정·규칙이다.

> 이 글의 `ph_` 테이블 접두사, `author="zero"`, `config/liquibase/fake-data/` 경로, `-1-schema`/`-2-data` ID 규칙 등은 필자 프로젝트(JHipster 기반)의 관습이다. 문법이 아니라 예시일 뿐이니 각자 프로젝트 컨벤션에 맞춰 읽으면 된다. 반면 timestamp·`dropDefaultValue` 처리는 프로젝트와 무관한 Liquibase 일반 지식이다.
>
> 검증 기준 버전: **Liquibase 4.x**. 아래 timestamp 우회는 현재 4.x 계열에서도 여전히 필요하다(뒤에서 설명).
{: .prompt-info }

## 1. 마스터 설정 (master.xml)

### 데이터베이스별 프로퍼티 정의

#### H2 Database (테스트/개발용)
```xml
<property name="now" value="now()" dbms="h2"/>
<property name="floatType" value="float4" dbms="h2"/>
<property name="uuidType" value="uuid" dbms="h2"/>
<property name="datetimeType" value="datetime" dbms="h2"/>
<property name="clobType" value="longvarchar" dbms="h2"/>
<property name="blobType" value="blob" dbms="h2"/>
```

#### PostgreSQL (운영용)
```xml
<property name="now" value="current_timestamp" dbms="postgresql"/>
<property name="floatType" value="float4" dbms="postgresql"/>
<property name="clobType" value="longvarchar" dbms="postgresql"/>
<property name="blobType" value="bytea" dbms="postgresql"/>
<property name="uuidType" value="uuid" dbms="postgresql"/>
<property name="datetimeType" value="timestamp" dbms="postgresql"/>
```

### 프로퍼티 정의 표

| 프로퍼티 | H2 | PostgreSQL | 용도 |
|---------|-----|------------|------|
| `now` | `now()` | `current_timestamp` | 현재 시간 함수 |
| `floatType` | `float4` | `float4` | 실수형 타입 |
| `uuidType` | `uuid` | `uuid` | UUID 타입 |
| `datetimeType` | `datetime` | `timestamp` | 날짜-시간 타입 |
| `clobType` | `longvarchar` | `longvarchar` | 긴 텍스트 타입 |
| `blobType` | `blob` | `bytea` | 바이너리 타입 |

---

## 2. ChangeSet 네이밍 규칙

### 파일명 형식
```
YYYYMMDDhhmmss_added_entity_EntityName.xml
```

예시:
- `20240819000001_added_entity_Calendar.xml`
- `20230707000000_added_entity_Protocol.xml`

### ChangeSet ID 형식

#### 스키마 생성
```xml
<changeSet id="20240819000001-1-schema" author="zero">
```

#### 데이터 로드
```xml
<changeSet id="20240819000001-2-data" author="zero">
```

#### Context 사용 (선택적)
```xml
<changeSet id="20240819000001-2-data" author="zero" context="faker">
```

---

## 3. 테이블 생성 패턴

### 기본 구조
```xml
<changeSet id="YYYYMMDD000001-1-schema" author="zero">
  <createTable tableName="ph_table_name">
    <!-- 컬럼 정의 -->
  </createTable>
</changeSet>
```

### 표준 컬럼 타입

#### 숫자형
```xml
<column name="id" type="bigint">
  <constraints primaryKey="true" nullable="false"/>
</column>
<column name="order_no" type="integer" defaultValueNumeric="0">
  <constraints nullable="false" />
</column>
```

#### 문자열
```xml
<column name="title" type="varchar(50)">
  <constraints nullable="false" />
</column>
<column name="description" type="varchar(255)">
  <constraints nullable="true" />
</column>
```

#### Boolean
```xml
<column name="activated" type="boolean" defaultValueBoolean="true">
  <constraints nullable="false" />
</column>
```

#### Timestamp
```xml
<!-- createTable에서는 timestamp 직접 사용 (loadData와 다르다, 4장 참고) -->
<column name="created_date" type="timestamp" />
<column name="last_modified_by" type="varchar(50)" />
<column name="last_modified_date" type="timestamp" />
```

### 감사(Audit) 컬럼 패턴
```xml
<column name="created_by" type="varchar(50)">
  <constraints nullable="false"/>
</column>
<column name="created_date" type="timestamp"/>
<column name="last_modified_by" type="varchar(50)"/>
<column name="last_modified_date" type="timestamp"/>
```

### 제약조건 패턴

#### Primary Key
```xml
<constraints primaryKey="true" nullable="false"/>
```

#### Unique
```xml
<constraints nullable="false" unique="true"/>
```

#### Foreign Key (외래키는 별도 ChangeSet 권장)
```xml
<addForeignKeyConstraint 
  baseTableName="ph_field" 
  baseColumnNames="collection_id"
  constraintName="fk_ph_field_ph_collection"
  referencedTableName="ph_collection"
  referencedColumnNames="id"/>
```

---

## 4. 데이터 로드 패턴 — timestamp 함정

### 기본 구조
```xml
<changeSet id="YYYYMMDD000001-2-data" author="zero">
  <loadData
    file="config/liquibase/fake-data/table_name.csv"
    separator=";"
    tableName="ph_table_name"
    usePreparedStatements="true">
    <!-- 컬럼 타입 정의 -->
  </loadData>
  <!-- timestamp 컬럼이 있으면 dropDefaultValue 필수 -->
</changeSet>
```

### loadData 컬럼 타입 매핑

#### CSV → loadData 타입 매핑 규칙

| CSV 데이터 | createTable 타입 | loadData 타입 | 비고 |
|-----------|-----------------|---------------|-----|
| `1`, `123` | `bigint`, `integer` | `numeric` | 숫자 |
| `"text"` | `varchar(N)` | `string` | 문자열 |
| `true`, `false` | `boolean` | `boolean` | 불린 |
| `2024-01-01T10:00:00` | `timestamp` | `date` 또는 `datetime` | 핵심 함정 |

### Timestamp 처리 (핵심 패턴)

createTable에서는 `type="timestamp"`가 정상 동작하지만, **loadData의 `type` 속성에는 `timestamp`라는 값이 존재하지 않는다.** loadData가 받는 제네릭 타입은 `BOOLEAN`, `NUMERIC`, `STRING`, `DATE`, `DATETIME`뿐이다. 그래서 컬럼 타입을 `timestamp`로 적으면 문자열로 취급돼 `column is of type timestamp but expression is of type character varying` 에러가 난다.

**이 제약은 Liquibase 4.x 현재까지도 유효하다.** loadData의 타입 처리는 4.4.0에서 `date`/`time`/`datetime`을 인식하도록 개선됐지만 `timestamp` 값은 여전히 추가되지 않았다([liquibase#2383](https://github.com/liquibase/liquibase/issues/2383), [공식 loadData 문서](https://docs.liquibase.com/change-types/load-data.html)). 즉 아래 우회는 지금도 그대로 필요하다.

- 시각(시:분:초)까지 보존하려면 **`type="datetime"`** 이 의미상 정확하다.
- `type="date"` 로도 ISO 형식(`yyyy-MM-dd'T'HH:mm:ss`) 값이 파싱되며, 필자 프로젝트는 이 방식으로 동작을 확인했다. 시간 손실이 걱정되면 `datetime`을 쓰면 된다.
- 어느 쪽이든 뒤이어 `dropDefaultValue`가 필요하다(→ 5장).

**잘못된 방법:**
```xml
<!-- 에러: timestamp는 loadData 타입이 아니다 -->
<loadData ...>
  <column name="start_date" type="timestamp" />
</loadData>
```

**올바른 방법:**
```xml
<loadData
  file="config/liquibase/fake-data/calendar.csv"
  separator=";"
  tableName="ph_calendar"
  usePreparedStatements="true">
  <column name="id" type="numeric" />
  <column name="title" type="string" />
  <column name="start_date" type="date" />        <!-- timestamp 대신 date/datetime -->
  <column name="end_date" type="date" />
  <column name="created_by" type="string" />
</loadData>
<!-- date/datetime로 로드한 timestamp 컬럼은 dropDefaultValue로 마무리 (→ 5장) -->
<dropDefaultValue tableName="ph_calendar" columnName="start_date" 
                  columnDataType="${datetimeType}"/>
<dropDefaultValue tableName="ph_calendar" columnName="end_date" 
                  columnDataType="${datetimeType}"/>
```

### 완전한 예시 (Calendar 엔티티)

#### CSV 파일 (calendar.csv)
```csv
id;title;description;all_day;start_date;end_date;color;text_color;created_by
1;Event 1;Description 1;false;2024-01-01T10:00:00;2024-01-01T12:00:00;#FF0000;#FFFFFF;system
```

#### ChangeSet
```xml
<changeSet id="20240819000001-2-data" author="zero">
  <loadData
    file="config/liquibase/fake-data/calendar.csv"
    separator=";"
    tableName="ph_calendar"
    usePreparedStatements="true">
    <column name="id" type="numeric" />
    <column name="title" type="string" />
    <column name="description" type="string" />
    <column name="all_day" type="boolean" />
    <column name="start_date" type="date" />
    <column name="end_date" type="date" />
    <column name="color" type="string" />
    <column name="text_color" type="string" />
    <column name="created_by" type="string" />
  </loadData>
  <dropDefaultValue tableName="ph_calendar" columnName="start_date" 
                    columnDataType="${datetimeType}"/>
  <dropDefaultValue tableName="ph_calendar" columnName="end_date" 
                    columnDataType="${datetimeType}"/>
</changeSet>
```

---

## 5. dropDefaultValue 사용법

4장에서 timestamp 컬럼을 `date`/`datetime`으로 로드하고 나면, loadData가 컬럼에 기본값(default) 정보를 남기는 경우가 있어 이후 데이터 정합성이 어긋날 수 있다. `dropDefaultValue`는 이 기본값을 제거해 Liquibase와 PostgreSQL 간 타입 정보를 맞춘다.

### 문법
```xml
<dropDefaultValue 
  tableName="테이블명" 
  columnName="컬럼명" 
  columnDataType="${datetimeType}"/>
```

### 사용 규칙
- date/datetime로 로드한 timestamp 컬럼마다 하나씩, loadData **직후**에 배치한다.
- `columnDataType`에는 `${datetimeType}` 변수를 써서 DB(H2/PostgreSQL) 독립성을 유지한다.

실제 배치 예시는 [4장 완전한 예시](#완전한-예시-calendar-엔티티)를 참고하면 된다.

---

## 6. CSV 파일 형식 규칙

### 구분자
- **세미콜론(`;`)** 사용 (쉼표 아님!)

### 날짜-시간 형식
```csv
# ISO 8601 형식 지원
2024-01-01T10:00:00
2025-07-01 00:00:00
2024-01-01T10:00:00.000Z
```

### 문자열 이스케이프
```csv
# 따옴표로 감싸기
"text with; semicolon"
"O'Brien"
```

### 헤더 필수
```csv
id;title;description;created_date
1;"Title 1";"Description";2024-01-01T10:00:00
```

---

## 7. Context 사용

### faker context
테스트 데이터 로드용
```xml
<changeSet id="20230705000000-1-data" author="zero" context="faker">
  <loadData ... />
</changeSet>
```

실행 시:
```bash
# faker 데이터 포함
./gradlew bootRun -Pcontexts=faker

# faker 데이터 제외 (운영)
./gradlew bootRun
```

---

## 8. 테이블 네이밍 규칙 (프로젝트 예시)

아래는 필자 프로젝트의 내부 컨벤션일 뿐이며 Liquibase 문법과 무관하다. 팀마다 접두사·표기법을 정해 두면 충분하다.

### Prefix
모든 테이블은 `ph_` 접두사 사용
```
ph_calendar
ph_protocol
ph_user
ph_authority
```

### Snake Case
단어 구분은 언더스코어(`_`)
```
ph_field_type
ph_user_protocol
ph_formula_attribute
```

---

## 9. 체크리스트

### 새 엔티티 추가 시

- [ ] 파일명: `YYYYMMDDhhmmss_added_entity_EntityName.xml`
- [ ] ChangeSet 1: 스키마 생성 (`-1-schema`)
- [ ] ChangeSet 2: 데이터 로드 (`-2-data`)
- [ ] 테이블명: `ph_entity_name`
- [ ] 감사 컬럼 포함 (`created_by`, `created_date`, 등)
- [ ] CSV 파일 준비 (세미콜론 구분자)
- [ ] loadData에서 timestamp 컬럼은 **`date` 또는 `datetime`** 타입 사용 (`timestamp` 아님)
- [ ] CSV 헤더와 **같은 순서**로 모든 컬럼을 loadData에 정의
- [ ] **dropDefaultValue** 추가 (timestamp 컬럼마다)
- [ ] master.xml에 include 추가

### 데이터 로드 문제 해결

에러: `column is of type timestamp but expression is of type character varying`

해결:
1. loadData에서 `type="timestamp"` → `type="date"`(또는 `datetime`)로 변경
2. `dropDefaultValue` 추가
3. CSV의 모든 컬럼이 loadData에 정의되었는지 확인

---

## 10. 공통 패턴 템플릿

### 전체 ChangeLog 템플릿
```xml
<?xml version="1.0" encoding="utf-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog 
                      http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

  <!-- 1. 스키마 생성 -->
  <!-- 참고: 재현성을 위해서는 dbchangelog-latest.xsd 대신 dbchangelog-4.x.xsd 처럼
       고정 버전 xsd를 명시하는 편이 낫다. latest는 Liquibase 업그레이드 시
       스키마가 조용히 바뀔 수 있어 통설상 고정 버전이 권장된다. -->
  <changeSet id="YYYYMMDD000001-1-schema" author="zero">
    <createTable tableName="ph_entity_name">
      <column name="id" type="bigint">
        <constraints primaryKey="true" nullable="false" />
      </column>
      <column name="title" type="varchar(50)">
        <constraints nullable="false" />
      </column>
      <column name="created_by" type="varchar(50)">
        <constraints nullable="false" />
      </column>
      <column name="created_date" type="timestamp" />
      <column name="last_modified_by" type="varchar(50)" />
      <column name="last_modified_date" type="timestamp" />
    </createTable>
  </changeSet>

  <!-- 2. 데이터 로드 -->
  <changeSet id="YYYYMMDD000001-2-data" author="zero">
    <loadData
      file="config/liquibase/fake-data/entity_name.csv"
      separator=";"
      tableName="ph_entity_name"
      usePreparedStatements="true">
      <column name="id" type="numeric" />
      <column name="title" type="string" />
      <column name="created_by" type="string" />
      <column name="created_date" type="date" />
      <column name="last_modified_date" type="date" />
    </loadData>
    <dropDefaultValue tableName="ph_entity_name" columnName="created_date" 
                      columnDataType="${datetimeType}"/>
    <dropDefaultValue tableName="ph_entity_name" columnName="last_modified_date" 
                      columnDataType="${datetimeType}"/>
  </changeSet>
</databaseChangeLog>
```

---

## 참고 문서

- [Liquibase 공식 문서](https://docs.liquibase.com/)
- [loadData change type 문서](https://docs.liquibase.com/change-types/load-data.html)
- [JHipster Liquibase 가이드](https://www.jhipster.tech/using-liquibase/)
- [liquibase#2383 — loadData에 timestamp 타입 미지원](https://github.com/liquibase/liquibase/issues/2383)
