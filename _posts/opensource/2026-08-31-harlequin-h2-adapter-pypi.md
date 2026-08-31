---
title       : "Harlequin용 H2 JDBC 어댑터를 만들어 PyPI에 배포하기"
description : "H2 파일·메모리·TCP 연결을 Harlequin에서 직접 사용하고, JPype thread 경계와 Python 3.14 JVM 종료 충돌을 해결해 PyPI에 배포한 과정"
date        : 2026-08-31 12:47:29 +0900
updated     : 2026-08-31 12:54:49 +0900
categories  : [opensource, "개발·배포"]
tags        : [harlequin, h2, jdbc, jpype, pypi, python, adapter, guide]
pin         : false
hidden      : false
---

[Harlequin](https://harlequin.sh)은 터미널에서 사용하는 SQL IDE다. DuckDB, SQLite, PostgreSQL, MySQL, ODBC 등은 전용 또는 범용 어댑터가 있지만, 2026-08-31에 공개된 PyPI 패키지와 GitHub 저장소를 확인한 범위에서는 H2 전용 어댑터를 찾지 못했다.

H2는 Java 애플리케이션에서 자주 사용하는 JDBC 기반 관계형 데이터베이스다. 로컬 파일을 직접 여는 embedded mode뿐 아니라 메모리와 TCP/TLS server mode도 제공한다. 그런데 Python 애플리케이션인 Harlequin에서 H2를 사용하려면 Java와 Python 사이에 연결 계층이 필요하다.

이를 위해 [GitHub의 `harlequin-h2`](https://github.com/clang-engineer/harlequin-h2)를 만들고 [PyPI에 `harlequin-h2`](https://pypi.org/project/harlequin-h2/) 0.1.1을 배포했다.

```bash
brew install h2
uv tool install harlequin --with harlequin-h2

harlequin -a h2 \
  "jdbc:h2:file:/absolute/path/to/database;AUTO_SERVER=TRUE;IFEXISTS=TRUE"
```

이 글은 일반적인 Python 패키징 절차보다 H2 JDBC와 Harlequin을 연결하면서 만난 세 가지 경계에 집중한다.

- Harlequin의 query 실행과 결과 fetch는 서로 다른 worker에서 일어날 수 있다.
- JPype DB-API cursor는 생성된 thread와 다른 thread에서 사용할 때 실패했다.
- JVM 종료 순서가 Python 3.14와 DuckDB native destructor의 종료 순서와 충돌했다.

## 결론 먼저: 구현과 검증 순서

| 단계 | 작업 | 확인한 경계 |
| --- | --- | --- |
| 1 | H2 JDBC URL을 그대로 받는 어댑터 구현 | file 전용이 아니라 mem·tcp·ssl까지 표현 가능 |
| 2 | JPype로 JVM과 H2 driver 로드 | Python DB-API와 JDBC 사이의 수명 관리 |
| 3 | 직접 JDBC `Statement`/`ResultSet` cursor 구현 | execute와 fetch의 worker가 달라도 순차 handoff 가능 |
| 4 | H2 `INFORMATION_SCHEMA`로 lazy catalog 구성 | schema·table·view·column을 필요할 때 조회 |
| 5 | JVM 종료 정책 조정 | TUI 종료 hang과 native SIGSEGV 방지 |
| 6 | credential·DDL 출력 점검 | JDBC URL cache와 H2 user hash 노출 차단 |
| 7 | wheel·sdist·격리 설치·TUI 종료 검증 | 로컬 source가 아닌 배포 산출물 확인 |
| 8 | GitHub Release와 PyPI Trusted Publishing 연결 | 장기 API token 없이 배포 |

## H2는 파일 DB만이 아니다

H2의 JDBC URL은 연결 mode를 URL 자체에 표현한다.

```text
jdbc:h2:file:/path/to/database
jdbc:h2:mem:demo
jdbc:h2:tcp://localhost/~/demo
jdbc:h2:ssl://db.example.com/~/demo
```

따라서 어댑터 이름을 `harlequin-h2-file`로 제한하지 않고 `harlequin-h2`로 정했다. 어댑터는 정확히 하나의 `jdbc:h2:` URL을 받고 H2 driver에 전달한다. 특정 프로젝트에서 file mode를 사용하더라도 어댑터 계약은 H2 전체 연결 mode를 수용한다.

file mode의 장점은 별도 server process와 고정 port가 필요 없다는 점이다. 로컬 Java 애플리케이션이 생성한 DB를 확인하는 용도라면 운영 요소가 가장 적다.

```bash
harlequin -a h2 \
  "jdbc:h2:file:/path/to/database;AUTO_SERVER=TRUE;IFEXISTS=TRUE"
```

- `AUTO_SERVER=TRUE`: 같은 로컬 파일을 다른 JVM process와 함께 사용할 수 있게 한다.
- `IFEXISTS=TRUE`: 경로 오타 때문에 빈 DB가 새로 만들어지는 일을 막는다.

반대로 여러 host의 client가 지속해서 접속해야 한다면 TCP/TLS server mode가 더 자연스럽다. `AUTO_SERVER`는 server mode를 대체하는 범용 분산 연결 방식이 아니라 로컬 file DB의 mixed mode를 위한 선택지다.

## Python에서 H2 JDBC driver를 로드하기

H2는 JDBC가 주 인터페이스이며, Harlequin은 Python 애플리케이션이다. `harlequin-h2`는 [JPype](https://jpype.readthedocs.io/)로 같은 process 안에 JVM을 시작하고 H2 JDBC driver를 로드한다.

```python
def start_jvm(jar: Path) -> None:
    with JVM_LOCK:
        jpype.config.onexit = False
        if jpype.isJVMStarted():
            jpype.addClassPath(str(jar))
            return
        jpype.startJVM(classpath=[str(jar)])
```

H2 JAR은 패키지에 포함하지 않았다. Homebrew 경로에서 자동으로 찾거나 `H2_JAR`, `--jar`로 명시한다.

```bash
export H2_JAR=/path/to/h2.jar
harlequin -a h2 "jdbc:h2:mem:demo"
```

JAR을 번들하지 않으면 사용자가 애플리케이션과 맞는 H2 version을 선택할 수 있고, Java runtime과 JDBC driver의 배포 책임도 Python wheel과 분리된다. 대신 설치 단계가 하나 늘어난다는 trade-off가 있다.

## 첫 번째 실패: execute와 fetch의 worker가 달랐다

처음에는 JPype의 `dbapi2` cursor를 Harlequin cursor로 감싸는 방식으로 구현했다. 단순한 script에서는 동작했지만 실제 Harlequin TUI에서 query를 실행하면 `Threading error`가 발생했다.

원인은 Harlequin의 adapter contract에 있었다. Harlequin은 UI를 멈추지 않기 위해 query 실행과 결과 fetch를 worker에서 수행하며, 이 두 작업이 서로 다른 thread에서 실행될 수 있다.

```text
Worker A                        Worker B
--------                        --------
connection.execute(query)
  └─ DB-API cursor 생성
                                cursor.fetchall()
                                  └─ Threading error
```

JPype DB-API cursor는 내부적으로 자신이 생성된 thread와 연결된 상태를 갖고 있었다. C++에서 특정 executor thread에 묶인 객체를 다른 executor로 넘겼을 때 lifetime과 thread-affinity 계약이 깨지는 상황과 비슷하다. 다만 Python object 자체가 이동했다는 뜻은 아니며, underlying bridge가 요구하는 thread 경계가 문제였다.

Harlequin의 실행 방식을 바꾸는 대신 DB-API cursor를 query 결과 경로에서 제거했다. JDBC `Statement`와 `ResultSet`을 직접 감싸고 execute가 끝난 뒤 fetch worker로 순차 전달했다.

```python
def execute(self, query: str) -> HarlequinH2Cursor | None:
    statement = self.connection.connection.createStatement()
    has_result_set = statement.execute(query)
    if not has_result_set:
        statement.close()
        return None
    return HarlequinH2Cursor(statement, statement.getResultSet())
```

```python
def fetchall(self):
    rows = []
    try:
        while self.result_set.next():
            rows.append([...])
    finally:
        self.result_set.close()
        self.statement.close()
    return rows or None
```

이 방식은 하나의 cursor를 동시에 여러 thread에서 사용하는 것을 허용하지 않는다. Harlequin이 보장하는 `execute 완료 → fetch 한 번`의 순차 handoff에 맞춘 구현이다. JDBC object의 일반적인 thread safety를 주장하는 구조가 아니다.

회귀 테스트도 worker를 의도적으로 분리했다.

```python
with (
    ThreadPoolExecutor(max_workers=1) as execute_worker,
    ThreadPoolExecutor(max_workers=1) as fetch_worker,
):
    cursor = execute_worker.submit(connection.execute, "select 1").result()
    rows = fetch_worker.submit(cursor.fetchall).result()

assert rows == [[1]]
```

## Java 값을 Harlequin이 표시할 Python 값으로 바꾸기

JDBC `ResultSet.getObject()`는 Java wrapper와 JDBC object를 반환한다. 이를 그대로 table backend에 넘기면 숫자가 문자열이 되거나 BLOB·CLOB이 object 설명으로 표시될 수 있다.

0.1.0에서는 다음 경계를 명시적으로 변환했다.

| H2/JDBC 값 | Python 값 |
| --- | --- |
| integer wrapper | `int` |
| float wrapper | `float` |
| `BigDecimal` | `Decimal` |
| `Boolean` | `bool` |
| `Blob` | `bytes` |
| `Clob` | `str` |
| H2 JSON byte array | UTF-8 `str` |
| SQL `Array` | `list` |
| date/time 계열 | 문자열 표현 |

특히 `java.lang.Boolean`을 fallback 문자열로 처리하면 화면에는 비슷하게 보여도 export나 후속 처리는 `bool`이 아니라 `"True"`를 받는다. UI 표시가 같아 보여도 반환 타입의 계약은 별도로 검증해야 한다.

## H2 catalog와 컨텍스트 메뉴

Harlequin Data Catalog는 한 번에 전체 DB를 읽기보다 node를 펼칠 때 하위 항목을 조회하는 lazy catalog를 지원한다. H2 2.x의 `INFORMATION_SCHEMA`에서 schema, table/view, column을 읽어 다음 구조로 만들었다.

```text
Database
  └─ Schema
       └─ Table / View
            └─ Column
```

relation에서 `.`을 누르면 다음 작업을 선택할 수 있다.

- Insert Columns at Cursor
- Preview Data
- Describe
- Show DDL

삭제나 변경 작업은 넣지 않았다. DB 탐색 도구의 컨텍스트 메뉴는 실수로 실행해도 복구 부담이 작은 조회 작업에 집중했다.

### Show DDL에서 발견한 credential hash 노출

H2의 `SCRIPT NODATA TABLE ...` 결과에는 요청한 table DDL뿐 아니라 `CREATE USER ... SALT ... HASH ...`가 포함될 수 있었다. 이를 그대로 editor buffer에 넣으면 password 자체는 아니더라도 offline attack에 사용할 수 있는 credential hash가 query history에 남는다.

따라서 `NOPASSWORDS` option을 사용하고 사용자 관련 statement를 한 번 더 제외했다.

```python
cursor = connection.execute(
    f"script nodata nopasswords table {item.query_name}"
)
```

테스트에서는 password가 있는 DB를 만들고 출력에 `CREATE USER`, `SALT`, `HASH`, 실제 password가 없는지 확인했다. 기능이 정상 동작하는지뿐 아니라 **생성된 text가 어디에 저장되는지**까지 확인해야 발견할 수 있는 문제였다.

## 두 번째 실패: JVM을 명시적으로 종료하자 TUI가 멈췄다

query와 catalog가 동작한 뒤에는 종료 문제가 남았다. 처음에는 Python process 종료 중 JVM과 DuckDB native destructor가 충돌해 `detach_thread`에서 SIGSEGV가 발생했다. 이를 피하려고 `atexit` handler에서 `jpype.shutdownJVM()`을 호출했더니 이번에는 `Ctrl+Q` 후 alternate screen만 사라지고 shell prompt가 돌아오지 않았다.

실제 hang process를 `sample`과 `jstack`으로 확인하니 JVM과 Textual/DuckDB worker가 살아 있었다. JNI의 `DestroyJavaVM`은 종료할 수 없는 thread가 남아 있으면 기다릴 수 있다. 일반적인 `atexit` handler는 TUI worker와 native library의 종료 순서를 조정하기에는 너무 늦다.

이 어댑터는 다음 정책을 선택했다.

1. Harlequin의 정상 quit path에서 H2 connection을 명시적으로 닫는다.
2. cursor는 fetch가 끝나면 `ResultSet`과 `Statement`를 닫는다.
3. `jpype.shutdownJVM()`을 직접 호출하지 않는다.
4. 이 process에서는 `jpype.config.onexit = False`로 JPype의 process-exit JVM destroy를 막는다.
5. 전용 CLI process가 끝날 때 OS가 남은 JVM resource를 회수한다.

이 설정은 process-global이다. Java shutdown hook 실행이 필요한 장기 실행 server나 여러 JPype component를 함께 hosting하는 process에 그대로 적용할 일반 해법은 아니다. Harlequin처럼 DB connection을 먼저 닫고 process 자체가 곧 종료되는 CLI라는 조건에서 선택한 trade-off다.

종료 검증은 단순 unit test만으로 부족했다. pseudo-terminal에서 실제 Harlequin을 시작하고 alternate screen 진입을 확인한 뒤 `Ctrl+Q`를 전송했다.

```text
Ctrl+Q → EOF: 0.48초
exit status: 0
hs_err_pid*.log: 없음
```

## JDBC URL과 password를 cache key에 남기지 않기

초기 `connection_id`는 다음처럼 사용자와 JDBC URL을 그대로 반환했다.

```python
return f"{self.user}@{self.dsn}"
```

Harlequin은 이 값을 catalog와 query history cache를 식별하는 데 사용한다. H2 JDBC URL에는 `USER`나 `PASSWORD` property도 들어갈 수 있으므로 raw URL을 persistent identifier로 쓰면 credential과 로컬 경로가 disk에 남을 수 있다.

override를 제거하고 Harlequin이 initialization argument에서 hash를 계산하게 변경했다. password option도 Harlequin 2.10부터 제공하는 `secret=True`로 선언했다. CLI argument 자체는 OS process list에 노출될 수 있으므로 공유 환경에서는 profile의 환경변수 참조를 사용하는 편이 안전하다.

```toml
[profiles.local_h2]
adapter = "h2"
conn_str = ["jdbc:h2:file:${H2_DATABASE_PATH};IFEXISTS=TRUE"]
password = "${H2_DATABASE_PASSWORD}"
```

## 배포 전 검증 범위

0.1.1은 H2 2.4.240과 Harlequin 2.9 이상을 기준으로 검증했다.

| 검증 | 결과 |
| --- | --- |
| Python 3.10~3.14 | 각 version에서 19개 테스트 통과 |
| Harlequin 최소 version | 2.9에서 테스트 통과 |
| H2 file mode | 생성·재접속·값 유지 확인 |
| `IFEXISTS=TRUE` | 없는 파일을 생성하지 않고 실패 |
| H2 memory mode | query 성공 |
| H2 TCP mode | 임시 TCP server에서 query 성공 |
| worker handoff | 별도 execute/fetch worker에서 성공 |
| 주요 JDBC type | numeric·boolean·LOB·JSON·array·null 확인 |
| wheel·sdist | `twine check`, wheel contents 검사 통과 |
| 공개 PyPI 설치 | entry point와 `hsql` query 확인 |
| TUI 종료 | `Ctrl+Q`, exit code 0, crash log 없음 |

TLS URL은 어댑터가 그대로 전달하지만 0.1.0 자동 테스트에서는 실제 certificate와 TLS server를 구성하지 않았다. URL을 받을 수 있다는 것과 end-to-end TLS 연결을 검증했다는 것은 구분해야 한다.

## PyPI Trusted Publishing으로 첫 배포하기

GitHub Release가 생성되면 workflow가 wheel과 sdist를 빌드하고 PyPI에 올리도록 구성했다.

```yaml
on:
  release:
    types: [published]

jobs:
  publish:
    environment:
      name: pypi
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: astral-sh/setup-uv@v10.0.1
      - run: uv build --no-sources
      - uses: pypa/gh-action-pypi-publish@release/v1
```

PyPI에는 pending Trusted Publisher를 먼저 등록했다.

```text
Project:      harlequin-h2
Owner:        clang-engineer
Repository:   harlequin-h2
Workflow:     publish.yml
Environment:  pypi
```

이 방식은 GitHub Actions가 OIDC(OpenID Connect, 실행 주체의 신원을 증명하는 방식) token으로 PyPI에 자신을 증명한다. repository나 workflow에 장기 PyPI API token을 저장하지 않아도 된다. 첫 실행이 성공하면 pending publisher가 일반 publisher로 전환되고 PyPI project도 생성된다.

배포 후에는 package 이름으로 격리 환경을 다시 만들었다.

```bash
uv run --no-project --isolated --python 3.14 \
  --with harlequin-h2 \
  hsql -a h2 "jdbc:h2:mem:public-check" -c "select 1"
```

`harlequin --version`에서도 다음 entry point를 확인했다.

```text
h2, version 0.1.1
```

## 공개 직후 발견한 Homebrew Harlequin 2.9 호환성

0.1.0은 `TextOption(secret=True)`를 사용하고 Harlequin 2.10 이상을 요구했다. 그러나 개발 중 Homebrew Harlequin 2.9에 설치해 둔 editable package는 dependency resolver를 다시 거치지 않고 최신 source를 바로 읽었다. 그 결과 Harlequin이 모든 adapter entry point를 로드하는 시작 단계에서 다음 오류가 발생했다.

```text
TypeError: TextOption.__init__() got an unexpected keyword argument 'secret'
```

하나의 adapter import 실패가 H2 연결만 막는 것이 아니라 Harlequin CLI 전체 시작을 막았다. plugin은 선택할 때만 안전하면 되는 것이 아니라 **discovery 단계에서도 설치된 host version과 호환돼야 한다.**

0.1.1에서는 `TextOption` signature에 `secret` 매개변수가 있을 때만 전달한다.

```python
def password_option() -> TextOption:
    options = {
        "name": "password",
        "description": "H2 password.",
    }
    if "secret" in signature(TextOption).parameters:
        options["secret"] = True
    return TextOption(**options)
```

Harlequin 2.10 이상에서는 password masking을 유지하고, 2.9에서는 환경변수를 참조하는 profile 사용을 권장한다. 수정 후 Homebrew Harlequin 2.9의 plugin discovery와 실제 H2 query를 다시 확인하고 지원 하한을 2.9로 낮췄다.

## 정리

H2 JDBC 연결 자체보다 어려웠던 부분은 각 runtime의 경계를 맞추는 일이었다.

1. H2 file·memory·server mode는 모두 JDBC URL로 표현되므로 어댑터를 file 전용으로 제한하지 않는다.
2. Harlequin의 execute/fetch worker handoff를 테스트하고 JPype DB-API cursor 대신 직접 JDBC cursor를 사용한다.
3. Java 값을 화면에 보이는 text가 아니라 Harlequin이 기대하는 Python type으로 변환한다.
4. JVM 종료는 connection close와 process teardown을 구분하고, `atexit`에서 무조건 `shutdownJVM()`을 호출하지 않는다.
5. DDL·cache·error message처럼 기능의 부산물이 credential을 남기지 않는지 확인한다.
6. local source가 아니라 PyPI 공개본을 새 환경에 설치해 query와 TUI 종료를 다시 검증한다.

작은 adapter라도 Python worker, JVM, JDBC driver, native library, terminal lifecycle이 만나는 순간 시스템 경계 문제가 된다. 이 경계를 재현 가능한 테스트로 만든 것이 구현 코드 자체보다 중요한 결과였다.

## 관련 글

- [Harlequin용 Vertica ODBC 어댑터를 만들어 PyPI에 배포하기](/posts/opensource/2026-08-31-harlequin-odbc-vertica-adapter-pypi/) - Harlequin entry point, wheel·sdist, 격리 설치와 PyPI 배포의 공통 흐름
- [Harlequin Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/harlequin.md) - profile·keymap·기본 사용법
- [Python PyPI Publishing Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/python-pypi-publishing.md) - 이후 PyPI 배포 절차의 canonical reference
- [GitHub: clang-engineer/harlequin-h2](https://github.com/clang-engineer/harlequin-h2)
- [PyPI: harlequin-h2](https://pypi.org/project/harlequin-h2/)

## 참고

- [Harlequin - Creating an Adapter](https://harlequin.sh/docs/contributing/adapter-guide)
- [Harlequin - Database Adapters](https://harlequin.sh/docs/adapters)
- [H2 - Connection Modes](https://h2database.com/html/features.html#connection_modes)
- [H2 - SCRIPT command](https://h2database.com/html/commands.html#script)
- [JPype - User Guide](https://jpype.readthedocs.io/en/latest/userguide.html)
- [Oracle JNI - DestroyJavaVM](https://docs.oracle.com/en/java/javase/24/docs/specs/jni/invocation.html#destroyjavavm)
- [PyPI - Creating a project with a Trusted Publisher](https://docs.pypi.org/trusted-publishers/creating-a-project-through-oidc/)
