---
title       : Liquibase 설정과 사용 패턴 정리
description : 
date        : 2025-10-17 09:38:36 +0900
updated     : 2025-10-17 09:39:45 +0900
categories  : [dev, tools]
tags        : [dev, tools, liquibase, database, migration, changelog, csv, timestamp, postgres, h2]
pin         : false
hidden      : false
---

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

#### Timestamp (중요!)
```xml
<!-- createTable에서는 timestamp 직접 사용 -->
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

## 4. 데이터 로드 패턴 (중요!)

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
| `2024-01-01T10:00:00` | `timestamp` | **`date`** ⚠️ | **중요!** |

### ⚠️ Timestamp 처리 (핵심 패턴)

**잘못된 방법:**
```xml
<!-- ❌ 에러 발생! -->
<loadData ...>
  <column name="start_date" type="timestamp" />
</loadData>
```

**올바른 방법:**
```xml
<!-- ✅ 올바른 방법 -->
<loadData
  file="config/liquibase/fake-data/calendar.csv"
  separator=";"
  tableName="ph_calendar"
  usePreparedStatements="true">
  <column name="id" type="numeric" />
  <column name="title" type="string" />
  <column name="start_date" type="date" />        <!-- date 사용! -->
  <column name="end_date" type="date" />          <!-- date 사용! -->
  <column name="created_by" type="string" />
</loadData>
<!-- dropDefaultValue 필수! -->
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

### 용도
1. **CSV 데이터 정확성 보장**: timestamp 컬럼의 기본값 제거
2. **타입 변환 문제 해결**: Liquibase-PostgreSQL 간 타입 정보 동기화

### 문법
```xml
<dropDefaultValue 
  tableName="테이블명" 
  columnName="컬럼명" 
  columnDataType="${datetimeType}"/>
```

### 사용 규칙
- **timestamp 타입 컬럼마다 필수**
- loadData 직후에 배치
- `columnDataType`에는 `${datetimeType}` 변수 사용 (DB 독립성)

### 예시
```xml
<loadData ...>
  <column name="created_date" type="date" />
  <column name="last_modified_date" type="date" />
</loadData>
<dropDefaultValue tableName="ph_user" columnName="created_date" 
                  columnDataType="${datetimeType}"/>
<dropDefaultValue tableName="ph_user" columnName="last_modified_date" 
                  columnDataType="${datetimeType}"/>
```

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

## 8. 테이블 네이밍 규칙

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
- [ ] loadData에서 **timestamp → date** 타입 사용
- [ ] CSV의 **모든 컬럼** loadData에 정의
- [ ] **dropDefaultValue** 추가 (timestamp 컬럼마다)
- [ ] master.xml에 include 추가

### 데이터 로드 문제 해결

에러: `column is of type timestamp but expression is of type character varying`

해결:
1. loadData에서 `type="timestamp"` → `type="date"` 변경
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

## 11. 주요 주의사항 ⚠️

### 1. loadData에서 timestamp 절대 금지
```xml
<!-- ❌ 절대 이렇게 하지 마세요 -->
<column name="created_date" type="timestamp" />

<!-- ✅ 항상 date를 사용하세요 -->
<column name="created_date" type="date" />
```

### 2. CSV 컬럼 순서 정확히 일치
CSV 헤더 순서와 loadData의 column 순서가 **정확히 일치**해야 함

### 3. dropDefaultValue 필수
timestamp 컬럼마다 반드시 dropDefaultValue 추가

### 4. 프로퍼티 변수 사용
타입 정의 시 변수 사용으로 DB 독립성 확보
```xml
columnDataType="${datetimeType}"  <!-- 권장 -->
columnDataType="timestamp"         <!-- 비권장 -->
```

---

## 참고 문서

- [Liquibase 공식 문서](https://docs.liquibase.com/)
- [JHipster Liquibase 가이드](https://www.jhipster.tech/using-liquibase/)
