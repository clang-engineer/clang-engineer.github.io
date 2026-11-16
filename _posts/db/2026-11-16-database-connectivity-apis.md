---
title       : "JDBC·ODBC·R2DBC는 어떻게 다른가 — 언어별 DB 접속 API까지"
description : "JDBC·ODBC·R2DBC의 드라이버 구조와 실행 방식을 비교하고, SQLDBC·ADO.NET·Python DB-API·Go database/sql을 언제 쓰는지 정리한다."
date        : 2026-11-16 09:00:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [jdbc, odbc, r2dbc, sqldbc, ado-net, python-db-api, database-sql, guide]
pin         : false
hidden      : false
---

DB 연결 설정을 살펴보다 보면 JDBC URL, ODBC DSN, R2DBC 드라이버가 나란히 등장한다. 이름만 보면 셋이 같은 규격의 변형처럼 보이지만, **어느 언어의 프로그램이 어떤 드라이버를 통해 DB에 접근하는가**와 **쿼리 결과를 기다리는 방식**이 다르다. 더구나 ADO.NET이나 Python DB-API처럼 이름에 DBC가 없는 대응 인터페이스도 있다.

이 글은 각 기술의 사용법을 모두 나열하기보다, 연결 계층에서의 위치와 선택 기준을 비교한다. 핵심은 **DB 제품, 애플리케이션 언어, 데이터 접근 API, 드라이버를 별도로 보는 것**이다.

## 먼저 층을 분리한다

PostgreSQL 같은 **DBMS**는 데이터를 저장하고 SQL을 처리한다. JDBC 같은 **API**는 애플리케이션이 연결·쿼리·결과·트랜잭션을 다루는 방식을 정의한다. **드라이버**는 그 API의 호출을 특정 DB가 이해하는 통신으로 연결한다. ORM은 그 위에서 객체 매핑이나 쿼리 구성을 도울 수 있지만, 드라이버의 대체물은 아니다.

따라서 같은 PostgreSQL에 접속하더라도 Java 애플리케이션은 JDBC 드라이버를, Go 애플리케이션은 `database/sql`용 드라이버를 선택할 수 있다. API가 공통이라고 SQL 방언, 데이터 타입, 드라이버별 지원 기능까지 동일해지는 것은 아니다.

## JDBC — Java에서 쓰는 동기식 DB 접근 API

JDBC(Java Database Connectivity)는 Java의 `java.sql`·`javax.sql` API를 중심으로 한다. 애플리케이션은 `Connection`을 얻고, `PreparedStatement`에 값을 바인딩해 SQL을 실행하며, `ResultSet`에서 행을 읽는다. PostgreSQL용 JDBC 드라이버처럼 실제 DB에 대응하는 드라이버가 필요하다.

```text
Java 애플리케이션 → JDBC API → DB별 JDBC 드라이버 → DB
```

`DriverManager`로 연결을 만들 수도 있지만, 서버 애플리케이션에서는 보통 `DataSource`와 커넥션 풀을 통해 연결을 얻는다. `Connection`은 트랜잭션 경계도 관리한다. JDBC의 일반적인 쿼리 호출은 결과를 기다리는 동안 **호출 스레드를 블로킹**한다. 이는 쿼리가 언제나 느리다는 뜻이 아니라, 기다리는 방식을 설명하는 말이다.

Spring JDBC, MyBatis, JPA 같은 상위 계층을 사용하더라도 JDBC 드라이버를 통해 DB와 통신하는 구성이 흔하다. Java에서 SQL을 직접 실행하거나 기존 동기식 데이터 접근 스택을 사용한다면 JDBC가 기본 선택지다.

## ODBC — 여러 언어·도구가 사용하는 범용 드라이버 인터페이스

ODBC(Open Database Connectivity)는 애플리케이션과 DB별 드라이버 사이의 인터페이스다. **드라이버 관리자**가 적절한 드라이버를 로드하고 호출을 전달한다. API 자체는 C 기반이며, 다른 언어와 도구는 이를 직접 또는 라이브러리를 거쳐 사용한다.

```text
분석 도구 또는 애플리케이션 → ODBC 드라이버 관리자 → DB별 ODBC 드라이버 → DB
```

여러 DB를 지원해야 하는 BI·데이터 분석 도구, 범용 SQL 클라이언트에서 유용하다. **DSN(Data Source Name)**은 드라이버와 연결 정보를 이름으로 등록해 사용하는 방법이지, ODBC 연결의 필수 조건은 아니다. 드라이버를 지정하는 연결 문자열로 DSN 없이 연결할 수도 있다.

범용 인터페이스는 DB 간 차이를 없애지 않는다. 예를 들어 SQL 쿼리 실행은 되는데 드라이버가 반환하는 메타데이터가 도구의 기대와 달라 탐색 기능이 실패할 수 있다. 실제 사례는 [Harlequin용 Vertica ODBC 어댑터 제작기]({% post_url reference/open-source/2026-08-31-harlequin-vertica-odbc-adapter %})에 정리했다.

## R2DBC — 리액티브 JVM 애플리케이션의 DB 접근 SPI

R2DBC(Reactive Relational Database Connectivity)는 Java와 다른 JVM 언어에서 사용하는 **리액티브 DB 드라이버 규격(SPI)**이다. JDBC 호출을 다른 스레드로 옮겨 감싼 이름이 아니라, 리액티브 방식에 맞는 별도의 드라이버 인터페이스다.

```text
리액티브 JVM 애플리케이션 → R2DBC 클라이언트/API → DB별 R2DBC 드라이버 → DB
```

R2DBC는 Reactive Streams의 `Publisher`·`Subscriber`를 사용한다. 구독과 결과 소비를 중심으로 실행이 지연되며, 논블로킹 I/O와 수요에 맞춘 결과 전달(backpressure)을 목표로 한다. 연결·SQL 실행·결과·트랜잭션 역시 이 모델에서 다룬다.

Spring WebFlux처럼 요청 처리 경로에서 블로킹을 피하도록 설계한 시스템이라면 검토할 만하다. 하지만 **R2DBC가 JDBC보다 무조건 빠르지는 않다.** 이미 동기식으로 구성된 애플리케이션이라면 JDBC가 더 단순하고, 선택 가능한 DB별 드라이버와 상위 라이브러리 지원도 함께 확인해야 한다.

## 이름이 비슷해도 같은 범주의 대안은 아니다

| 기술 | 주 사용 환경 | API 또는 규격의 위치 | 구분할 점 |
|---|---|---|---|
| JDBC | Java·JVM | Java의 DB 접근 API | 일반적인 호출은 블로킹 |
| ODBC | 여러 언어·도구 | 범용 API + 드라이버 관리자 | DSN은 선택 사항 |
| R2DBC | Java·JVM | 리액티브 드라이버 SPI | JDBC의 비동기 래퍼가 아님 |
| SQLDBC | SAP HANA 클라이언트 내부 | SAP HANA 전용 기반 API | 일반 앱의 범용 대안이 아님 |
| ADO.NET | .NET | .NET의 데이터 접근 API | DB별 provider 사용 |
| Python DB-API | Python | 드라이버 간 공통 API 규약 | 드라이버별 차이 남음 |
| `database/sql` | Go | 표준 라이브러리의 DB API | `sql.DB`가 연결 풀 관리 |

### SQLDBC — SAP HANA 내부 클라이언트 계층

SQLDBC는 이름 때문에 JDBC나 ODBC의 범용 경쟁 규격처럼 보이기 쉽다. 그러나 [SAP HANA 클라이언트 문서](https://help.sap.com/doc/b01bb8ddc72e41f795034092b9bf541d/2.24/en-US/SAP_HANA_Client_Interface_Programming_Reference_en.pdf)는 SQLDBC를 **내부 사용을 위한 API**로 분류하고, 대부분의 SAP HANA 클라이언트 인터페이스의 기반이지만 애플리케이션이 직접 사용하지는 않는다고 설명한다. SAP HANA의 JDBC 드라이버는 그 기반을 사용하지 않는다고도 구분한다.

따라서 새 애플리케이션의 접속 방식을 고를 때 SQLDBC를 JDBC·ODBC와 동등한 선택지로 놓지 않는다. SAP HANA에 접속한다면 사용하는 언어에 맞는 공식 JDBC·ODBC·ADO.NET·Python·Go 인터페이스부터 확인한다.

### ADO.NET — .NET의 데이터 접근 계층

ADO.NET은 .NET 애플리케이션에서 연결, 명령 실행, 결과 처리를 다루는 API다. DB에 맞는 **data provider**가 연결과 명령 구현을 제공한다. 예를 들어 SQL Server용 provider를 통해 `SqlConnection`, `SqlCommand`, `SqlDataReader`를 사용할 수 있다.

동기 호출과 `ExecuteReaderAsync` 같은 비동기 호출이 모두 있다. provider에 따라 ODBC를 경유할 수도 있으므로 **ADO.NET 대 ODBC**가 언제나 양자택일인 것은 아니다. Entity Framework Core 같은 ORM은 더 높은 추상화 계층이고, ADO.NET은 그 아래의 DB 접근 계층이 될 수 있다.

### Python DB-API — Python 드라이버들의 공통 약속

[PEP 249](https://peps.python.org/pep-0249/)가 Python DB-API 2.0을 정의한다. 드라이버 모듈의 `connect()`, 연결 객체의 `cursor()`·`commit()`, 커서의 `execute()`·`fetchone()` 같은 형태를 맞춰 드라이버 사용법을 비슷하게 만든다. 표준 라이브러리의 `sqlite3`도 익숙한 예다.

하지만 **DB-API는 단일 드라이버가 아니다.** 실제 구현은 DB별 모듈이며, 연결 인자나 파라미터 표기법(`?`, `%s`, `:name` 등)은 다를 수 있다. Python 프로그램이 ODBC 기반 드라이버를 쓰는 경우에도 애플리케이션에서는 DB-API 스타일 인터페이스를 볼 수 있다. 두 계층을 혼동하지 않는 것이 중요하다.

### Go `database/sql` — 표준 API와 내장 연결 풀

Go 표준 라이브러리의 `database/sql`은 연결, 쿼리, 결과, 트랜잭션을 위한 공통 API를 제공한다. 실제 DB 통신에는 별도의 드라이버가 필요하다. `QueryContext`, `ExecContext` 등의 호출에는 `context.Context`를 전달해 취소나 기한을 전파할 수 있다.

특히 `sql.DB`라는 이름이 헷갈리기 쉽다. **단일 DB 연결이 아니라 동시 사용 가능한 연결 풀을 관리하는 핸들**이다. 특정 연결을 계속 사용해야 하면 `sql.Conn`이나 트랜잭션용 `sql.Tx`를 사용한다. `database/sql` 자체가 SQL 방언을 통일하거나 ORM 기능을 제공하지는 않는다.

## 실제로 선택할 때

1. **먼저 애플리케이션 언어를 본다.** Java의 기본 경로는 JDBC, .NET은 ADO.NET, Python은 DB-API 형태의 드라이버, Go는 `database/sql`과 드라이버다.
2. **JVM에서 논블로킹 리액티브 경로가 필요한지 본다.** 그 요구가 명확하고 DB별 드라이버가 지원하면 R2DBC를 검토한다. 단지 이름이 더 현대적이라는 이유로 JDBC를 교체할 필요는 없다.
3. **도구나 여러 DB를 연결하는 범용 접점이 필요한지 본다.** ODBC가 맞는 경우가 많지만, 드라이버의 SQL·타입·메타데이터 지원까지 확인한다.
4. **제품 내부 API와 상위 추상화를 구분한다.** SQLDBC는 SAP HANA 내부 기반 계층이고, ORM·쿼리 라이브러리는 보통 여기서 비교한 접속 API 위에 놓인다.

같은 DB에 접근해도 **어떤 언어에서 어떤 호출 모델로 연결할 것인가**가 선택을 가른다. 연결 인터페이스를 통일해도 SQL 방언이나 드라이버 기능 차이는 남는다는 점까지 확인해야 이식성의 범위를 정확히 판단할 수 있다.

## 참고 자료

- [Oracle — `java.sql` 패키지와 JDBC API](https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/package-summary.html)
- [Microsoft — ODBC Architecture](https://learn.microsoft.com/en-us/sql/odbc/reference/odbc-architecture)
- [R2DBC Specification 1.0](https://r2dbc.io/spec/1.0.0.RELEASE/spec/html/)
- [SAP — SAP HANA Client Interface Programming Reference](https://help.sap.com/doc/b01bb8ddc72e41f795034092b9bf541d/2.24/en-US/SAP_HANA_Client_Interface_Programming_Reference_en.pdf)
- [Microsoft — ADO.NET Overview](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/ado-net-overview)
- [Python — PEP 249: Python Database API Specification v2.0](https://peps.python.org/pep-0249/)
- [Go — Accessing relational databases](https://go.dev/doc/database/)

관련 구현 사례: [Python에서 H2 JDBC 드라이버를 연결한 Harlequin 어댑터]({% post_url reference/open-source/2026-08-31-harlequin-h2-adapter %}).
