---
title       : "Vertica에서 쓸 만한 터미널 DB 클라이언트는 무엇일까?"
description : "Harlequin이 조회 전용인지, 테이블 행을 직접 편집할 수 있는지, 그리고 Vertica 환경에서 다른 TUI DB 클라이언트와 비교해 왜 Harlequin을 선택했는지 정리한다."
date        : 2026-09-05 21:20:00 +0900
categories  : [opensource, "개발·배포"]
tags        : [harlequin, vertica, tui, database, sql, rainfrog]
pin         : false
hidden      : false
---

[Harlequin](https://harlequin.sh)에 Vertica를 연결하고 Data Catalog까지 정상화한 뒤 실제로 사용하다 보니 두 가지가 궁금해졌다.

- Harlequin은 조회 전용인가?
- DBeaver나 DataGrip처럼 테이블의 셀을 직접 수정할 수 있는가?

결론부터 말하면 **Harlequin은 조회 전용이 아니다.** 접속한 DB 계정에 권한이 있다면 `INSERT`, `UPDATE`, `DELETE`, DDL도 실행할 수 있다. 다만 Results Viewer에서 셀을 직접 수정하고 저장하는 **Data Editor 방식은 지원하지 않는다.**

그리고 Vertica까지 조건에 넣으면 TUI DB 클라이언트의 선택지는 더 좁아진다.

## Harlequin은 조회 전용이 아니다

Harlequin은 SQL IDE이므로 변경 가능 여부는 Harlequin이 아니라 접속 계정의 권한으로 결정된다.

```sql
SELECT * FROM patient;

UPDATE patient
SET status = 'ACTIVE'
WHERE patient_id = 100;
```

권한이 있다면 DML과 DDL을 실행할 수 있다. 운영 DB를 조회하는 용도라면 오히려 Read Only 계정을 별도로 사용하는 편이 안전하다.

## Results Viewer는 Data Editor가 아니다

DBeaver나 DataGrip에서는 테이블을 열고 셀 값을 수정한 뒤 저장할 수 있다. 클라이언트가 PK 등을 이용해 적절한 `UPDATE`를 만들어 주는 방식이다.

```text
┌────┬──────────┬─────────┐
│ ID │ NAME     │ STATUS  │
├────┼──────────┼─────────┤
│ 1  │ Alice    │ ACTIVE  │
│ 2  │ Bob      │ ACTIVE  │
│ 3  │ Charlie  │ BLOCKED │
└────┴──────────┴─────────┘
```

Harlequin의 Results Viewer는 이런 Data Editor가 아니다. 결과를 탐색하고 복사하거나 내보내는 데는 편리하지만 값을 변경하려면 SQL을 직접 작성해야 한다.

```sql
UPDATE users
SET status = 'ACTIVE'
WHERE id = 3;
```

현재 사용하면서 가장 아쉬운 부분이다.

## 다른 TUI DB 클라이언트는 어떨까?

### Harlequin

Harlequin은 SQL Editor와 Results Viewer뿐 아니라 Data Catalog를 제공한다.

```text
Database
└── Schema
    ├── Table
    │   ├── Column
    │   └── Column
    └── View
```

어댑터 구조를 가지고 있어 DBMS별 확장도 가능하다. Vertica의 경우 범용 ODBC 어댑터에서 발생한 Data Catalog 문제를 별도 어댑터로 보완했다.

다만 앞서 본 것처럼 inline cell editing은 없다.

### Rainfrog

[Rainfrog](https://github.com/achristmascarl/rainfrog)는 Rust로 작성된 터미널 DB 클라이언트다. Vim 스타일 조작과 깔끔한 TUI가 매력적이지만 현재 지원 대상은 PostgreSQL, MySQL, SQLite 계열이 중심이고 Vertica를 직접 지원하지 않는다.

Vertica가 필수인 환경에서는 이 차이가 크다.

### LazySQL 계열

lazygit과 비슷한 사용 경험을 지향하는 DB TUI 프로젝트들도 있다. 하지만 이쪽 역시 PostgreSQL, MySQL, SQLite처럼 대중적인 DBMS를 중심으로 지원하는 경우가 많다.

결국 **TUI + Vertica**라는 조건을 넣는 순간 선택지가 크게 줄어든다.

## 결국 문제는 Vertica 지원이다

PostgreSQL을 사용한다면 여러 TUI를 비교할 수 있다.

```text
PostgreSQL
   │
   ├── Harlequin
   ├── Rainfrog
   ├── LazySQL 계열
   └── 기타 TUI
```

하지만 내가 필요한 조건은 조금 다르다.

```text
Terminal UI
    +
SQL Editor
    +
Data Catalog
    +
Vim-friendly
    +
Vertica
```

이 조건에서는 현재 Harlequin이 가장 현실적인 선택이다.

범용 ODBC로 Vertica 쿼리 실행 자체는 가능했고, Data Catalog에서 발생한 호환성 문제는 [`harlequin-odbc-vertica`](https://github.com/clang-engineer/harlequin-odbc-vertica) 어댑터를 만들어 해결했다.

## 행 편집은 SQL로 대신한다

현재 사용 방식은 단순하다.

조회와 탐색은 Harlequin에서 한다.

```sql
SELECT *
FROM patient
WHERE patient_id = 100;
```

수정이 필요하면 SQL을 직접 작성한다.

```sql
UPDATE patient
SET status = 'ACTIVE'
WHERE patient_id = 100;
```

GUI의 Data Editor만큼 편리하지는 않지만 변경 대상과 조건이 SQL에 그대로 남는 장점도 있다. 특히 운영 데이터에서는 `UPDATE`와 `DELETE`의 `WHERE` 조건을 직접 확인한 뒤 실행하는 방식이 오히려 명확하다.

## 결론

Harlequin이 모든 면에서 DBeaver나 DataGrip을 대체하는 것은 아니다. 특히 **테이블 셀을 직접 수정하는 Data Editor 기능은 분명히 아쉽다.**

하지만 내 우선순위는 다음과 같다.

1. 터미널에서 사용할 수 있을 것
2. SQL 작성 경험이 좋을 것
3. Data Catalog가 있을 것
4. Vim 스타일로 조작할 수 있을 것
5. Vertica를 사용할 수 있을 것

이 조건에서는 현재 Harlequin이 가장 잘 맞는다.

```text
Harlequin
    │
    ├── SQL Editor
    ├── Results Viewer
    ├── Data Catalog
    │
    └── harlequin-odbc-vertica
             │
             └── Vertica
```

행 편집 기능 하나 때문에 GUI DB 클라이언트로 돌아가기보다는 당분간 **Harlequin + 직접 SQL 작성** 방식으로 사용하는 것이 내 환경에는 더 잘 맞아 보인다.

## 관련 글

- [Harlequin용 Vertica ODBC 어댑터를 만들어 PyPI에 배포하기](/posts/opensource/2026-08-31-harlequin-odbc-vertica-adapter-pypi/) - 범용 ODBC에서 발생한 Vertica Data Catalog 문제와 전용 어댑터 구현 과정
- [Harlequin Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/harlequin.md) - profile·keymap·기본 사용법
