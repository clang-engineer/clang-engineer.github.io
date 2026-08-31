---
title       : "Harlequin용 Vertica ODBC 어댑터를 만들어 PyPI에 배포하기"
description : "Vertica ODBC에서 비어 있던 Data Catalog와 HYC00 컬럼 조회 오류를 얇은 Harlequin 어댑터로 해결하고, Python entry point·wheel·PyPI 배포까지 연결한 과정"
date        : 2026-08-31 11:11:11 +0900
updated     : 2026-08-31 11:11:11 +0900
categories  : [opensource, "개발·배포"]
tags        : [harlequin, vertica, odbc, pypi, python, adapter, guide]
pin         : false
hidden      : false
---

[Harlequin](https://harlequin.sh)은 터미널에서 사용하는 SQL IDE다. ODBC(Open Database Connectivity) 어댑터를 이용하면 Vertica에도 접속하고 쿼리를 실행할 수 있지만, 실제로 붙여보니 두 가지가 깨졌다.

- Data Catalog에 데이터베이스·스키마·테이블이 표시되지 않았다.
- 테이블을 펼쳐 컬럼을 조회하면 ODBC 오류 `HYC00`이 발생했다.

쿼리 실행 자체는 되는데 메타데이터 탐색만 실패했다. 원인은 Harlequin이 아니라 **범용 ODBC 어댑터가 기대하는 메타데이터 형태와 Vertica ODBC 드라이버의 동작 차이**였다. Vertica별 메타데이터 로직을 두 메서드에 한정한 어댑터를 별도 Python 패키지로 만들고 [PyPI의 `harlequin-odbc-vertica`](https://pypi.org/project/harlequin-odbc-vertica/)로 배포했다.

> 아래 동작은 당시 macOS에서 사용한 Vertica ODBC 드라이버로 관찰한 결과다. 첫 릴리스에서 드라이버 버전을 기록하지 못했으므로 다른 버전·플랫폼에서도 같은지 먼저 재현해야 한다.

전체 코드는 [GitHub 저장소](https://github.com/clang-engineer/harlequin-odbc-vertica)에서 볼 수 있다.

## 결론 먼저 — 한 사이클의 작업 순서

| 단계 | 작업 | 핵심 확인점 |
| --- | --- | --- |
| 1 | 기존 `harlequin-odbc`로 재현 | 쿼리 실행과 메타데이터 조회를 분리해서 본다 |
| 2 | Vertica ODBC 반환값 확인 | 테스트한 드라이버에서 catalog가 `None`, `SQLColumns`의 catalog 인자가 미지원 |
| 3 | 연결 클래스의 두 메서드 override | 테이블과 컬럼 조회만 Vertica에 맞춘다 |
| 4 | `harlequin.adapter` entry point 등록 | Harlequin이 설치된 어댑터를 런타임에 발견한다 |
| 5 | wheel·sdist 빌드와 격리 설치 테스트 | Harlequin과 어댑터가 같은 Python 환경에 있어야 한다 |
| 6 | PyPI 배포와 공개본 재설치 | 로컬 소스가 아니라 PyPI 산출물을 검증한다 |

## 문제 1 — 테스트한 Vertica 드라이버는 catalog 이름을 `None`으로 돌려줬다

ODBC의 `Cursor.tables()`는 보통 다음과 비슷한 행을 반환한다.

```text
catalog, schema, table, type, ...
```

그런데 사용한 Vertica ODBC 드라이버에서는 catalog 자리가 `None`이었다. 범용 어댑터의 catalog 구성 흐름과 맞지 않아 테이블이 화면에 올라오지 않았다.

Vertica에서는 현재 접속한 데이터베이스를 SQL로 확인할 수 있다.

```sql
SELECT current_database();
```

따라서 `tables()`가 catalog를 주지 않을 때만 `current_database()`를 한 번 조회해 fallback으로 사용했다.

```python
class HarlequinOdbcVerticaConnection(HarlequinOdbcConnection):
    def _list_tables(self) -> dict[str, dict[str, list[tuple[str, str]]]]:
        cur = self.aux_conn.cursor()
        catalog: dict[str, dict[str, list[tuple[str, str]]]] = {}
        default_db: str | None = None

        for db_name, schema_name, rel_name, rel_type, *_ in cur.tables(catalog="%"):
            if db_name is None:
                if default_db is None:
                    cur2 = self.aux_conn.cursor()
                    cur2.execute("SELECT current_database()")
                    default_db = cur2.fetchone()[0]
                db_name = default_db

            if db_name not in catalog:
                catalog[db_name] = {}

            if schema_name is None:
                continue
            if schema_name not in catalog[db_name]:
                catalog[db_name][schema_name] = []

            if rel_name is not None:
                catalog[db_name][schema_name].append((rel_name, rel_type or ""))

        return catalog
```

fallback을 row마다 조회하지 않고 첫 `None`에서 한 번만 구하는 점이 중요하다. 테이블 수만큼 `current_database()`를 반복할 이유가 없다.

## 문제 2 — 테스트한 드라이버는 `SQLColumns`의 catalog 인자를 지원하지 않았다

테이블 목록을 고치고 나니 컬럼 조회에서 `HYC00`이 발생했다. `HYC00`은 드라이버가 요청한 선택 기능을 지원하지 않을 때 사용하는 ODBC 상태 코드다. 이 경우 Vertica 드라이버는 `SQLColumns` 호출의 catalog 인자를 지원하지 않았다.

범용 호출에서 catalog만 빼면 된다.

```python
def _list_columns_in_relation(
    self,
    catalog_name: str,
    schema_name: str,
    rel_name: str,
) -> list[tuple[str, str]]:
    cur = self.aux_conn.cursor()
    raw_cols = cur.columns(table=rel_name, schema=schema_name)
    return [(col[3], col[5]) for col in raw_cols]
```

매개변수 `catalog_name`은 상위 클래스와의 메서드 계약을 맞추기 위해 남겨두되 Vertica 호출에는 전달하지 않는다. 범용 어댑터 전체를 복사하지 않고 **DBMS별로 다른 두 경계만 override**했기 때문에 핵심 `adapter.py`가 67줄로 끝났다.

마지막으로 연결 클래스만 교체한다.

```python
class HarlequinOdbcVerticaAdapter(HarlequinOdbcAdapter):
    ADAPTER_OPTIONS = ODBC_OPTIONS

    def connect(self) -> HarlequinOdbcVerticaConnection:
        return HarlequinOdbcVerticaConnection(self.conn_str)
```

## Harlequin이 어댑터를 발견하는 방법 — Python entry point

소스 파일을 만들었다고 Harlequin이 자동으로 찾는 것은 아니다. Python 패키지 메타데이터의 entry point에 어댑터를 등록해야 한다.

```toml
[project.entry-points."harlequin.adapter"]
odbc-vertica = "harlequin_odbc_vertica:HarlequinOdbcVerticaAdapter"
```

각 부분의 의미는 다음과 같다.

| 항목 | 값 | 역할 |
| --- | --- | --- |
| entry point group | `harlequin.adapter` | Harlequin이 검색하는 플러그인 그룹 |
| 어댑터 이름 | `odbc-vertica` | `harlequin -a odbc-vertica`에서 사용할 이름 |
| 로드 대상 | `module:object` | import할 모듈과 어댑터 클래스 |

Harlequin은 런타임에 `entry_points(group="harlequin.adapter")`를 조회하고 각 entry point를 로드한다. C++의 정적 링크 등록과 달리 실행 시 설치된 패키지 메타데이터를 스캔하는 구조다. 그래서 **어댑터가 Harlequin과 같은 Python 환경에 설치되어야 한다.** 시스템 Python에 어댑터를 설치하고 격리된 `uv tool` 환경의 Harlequin을 실행하면 서로 보이지 않는다.

## `pyproject.toml`로 패키지 만들기

빌드 백엔드는 설정이 작은 `hatchling`을 사용했다.

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "harlequin-odbc-vertica"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "harlequin>=1.25,<3",
    "harlequin-odbc>=0.4.0",
]

[project.entry-points."harlequin.adapter"]
odbc-vertica = "harlequin_odbc_vertica:HarlequinOdbcVerticaAdapter"
```

`dependencies`에는 상속하는 `harlequin-odbc`뿐 아니라 플러그인을 로드할 Harlequin도 선언했다. 다만 `<3`처럼 넓은 범위를 선언하면 이후 Harlequin 2.x의 내부 API 변화도 호환한다고 약속하는 셈이다.

더 직접적인 위험은 `harlequin-odbc>=0.4.0`에 상한이 없다는 점이다. 이 어댑터는 부모 클래스의 underscore 메서드인 `_list_tables`, `_list_columns_in_relation`을 override한다. Python은 underscore를 접근 금지로 강제하지 않지만 공개 API가 아니라는 관례이므로, 부모 패키지가 catalog 검색 경로를 추가하거나 메서드 계약을 바꾸면 기존 두 override만으로 부족할 수 있다. 다음 릴리스에서는 다음 중 하나가 필요하다.

- 테스트한 `harlequin-odbc` 범위에 상한을 둔다.
- 지원 범위의 최솟값·최댓값에서 테이블 펼치기와 catalog 검색을 모두 통합 테스트한다.
- upstream이 공개 extension point를 제공하면 비공개 메서드 상속에서 이동한다.

## 빌드 — wheel 하나만 확인하면 부족하다

첫 배포에서는 다음 명령으로 wheel을 만들었다.

```bash
python3 -m build
```

현재 `uv` 기준으로는 다음 흐름이 더 간단하다.

```bash
uv build --no-sources
```

`--no-sources`는 로컬 `tool.uv.sources` 같은 uv 전용 소스 설정 없이도 표준 빌드가 되는지 확인한다. 정상적으로 끝나면 `dist/`에 두 형식이 생긴다.

```text
dist/
├── harlequin_odbc_vertica-0.1.0-py3-none-any.whl
└── harlequin_odbc_vertica-0.1.0.tar.gz
```

- wheel은 설치 가능한 빌드 산출물이다. 이 패키지 자체는 순수 Python이므로 `py3-none-any` wheel 하나로 여러 플랫폼에 설치할 수 있다. 실제 연결에는 플랫폼별 `pyodbc`, ODBC driver manager, Vertica ODBC 드라이버가 별도로 필요하다.
- sdist(source distribution)는 소스와 빌드 메타데이터를 담는다. wheel을 사용할 수 없는 환경에서는 sdist에서 wheel을 다시 빌드할 수 있다.

PyPA는 일반적으로 sdist와 지원 플랫폼용 wheel을 함께 배포하길 권장한다. 그런데 `0.1.0`에서는 `uv publish`에 wheel 파일 하나만 지정해 **PyPI에도 wheel만 올라갔다.** 파일명이 다른 sdist를 같은 릴리스에 추가하는 것은 가능하지만, 기존 wheel은 교체할 수 없고 파일마다 포함된 메타데이터가 달라질 수도 있다. 이번에는 다음 버전에서 두 산출물을 함께 올리는 편을 택했다.

## 설치 검증 — Homebrew Cellar에 직접 넣지 않는다

개발 중에는 Homebrew로 설치한 Harlequin의 내부 `site-packages` 경로에 `pip --target`으로 어댑터를 직접 넣었다. 당장은 동작하지만 Homebrew가 관리하는 Cellar는 패키지 관리자의 영역이다.

- `brew upgrade harlequin`으로 새 버전 경로가 생기면 직접 넣은 패키지가 사라진다.
- 일반 `python3 -m pip show` 결과와 실제 Harlequin 환경이 달라 설치 상태를 오판하기 쉽다.
- 로컬 디렉토리 설치 흔적이 남으면 PyPI 공개본을 검증했다고 착각할 수 있다.

격리된 도구 환경에 Harlequin과 어댑터를 함께 설치하는 편이 재현 가능하다.

```bash
uv tool install harlequin --with harlequin-odbc-vertica
harlequin --version
```

정상이라면 설치된 어댑터 목록에 다음 항목이 보인다.

```text
odbc-vertica, version 0.1.0
```

배포 전에는 PyPI 이름 대신 로컬 wheel 경로를 `--with`에 넣어 같은 방법으로 확인할 수 있다. 핵심은 로컬 소스 import가 우연히 성공한 것이 아니라 **빌드된 산출물이 깨끗한 환경에서 설치되고 entry point까지 발견되는지** 보는 것이다.

접속 정보를 공개 명령에 직접 쓰지 않으려면 DSN(Data Source Name)에 설정을 분리하고 다음처럼 실행할 수 있다.

```bash
harlequin -a odbc-vertica 'DSN=vertica-example'
```

최소 확인 항목은 세 가지다.

1. Data Catalog에 데이터베이스·스키마·테이블이 나타난다.
2. 테이블을 펼치면 컬럼 이름과 타입이 나타난다.
3. `SELECT 1`과 실제 테이블 쿼리가 성공한다.

단순 import 테스트만으로는 ODBC 드라이버별 메타데이터 차이를 검증할 수 없다. 이 패키지에서 가장 가치 있는 테스트는 실제 Vertica ODBC 연결을 사용하는 통합 테스트다.

## PyPI 배포 — 토큰을 명령행에 쓰지 않는다

빌드와 검증이 끝나면 `dist/`의 산출물을 올린다.

```bash
uv publish
```

첫 배포에서는 API 토큰을 `--token` 인자에 직접 넣었다. 명령은 성공했지만 좋은 방식이 아니다. 명령행 인자는 셸 히스토리, 자동화 도구 로그, 프로세스 정보에 남을 수 있다. 토큰이 노출됐다면 즉시 폐기하고 다시 발급해야 한다.

수동 배포가 필요하다면 `UV_PUBLISH_TOKEN`을 저장소 밖의 secret manager나 CI secret에서 주입한다. 더 나은 방법은 PyPI Trusted Publishing이다.

```text
GitHub Actions
  └─ OIDC 신원 증명
       └─ PyPI가 짧게 유효한 프로젝트 전용 토큰 발급
            └─ uv publish
```

Trusted Publishing을 쓰면 장기 API 토큰을 GitHub에 저장하지 않아도 된다. publish job에만 `id-token: write` 권한을 주고, build와 publish job을 분리하며, GitHub Environment 승인 규칙을 두는 편이 안전하다.

## 배포 후에는 공개본을 다시 설치한다

업로드 성공 메시지가 끝이 아니다. PyPI 메타데이터와 공개 파일을 확인한다.

```bash
curl -s https://pypi.org/pypi/harlequin-odbc-vertica/json \
  | jq '{version: .info.version, files: [.urls[].filename]}'
```

그리고 로컬 개발 환경과 분리된 환경에서 패키지 이름으로 다시 설치한다.

```bash
uv tool install harlequin --with harlequin-odbc-vertica
harlequin --version
```

이 단계에서 로컬 경로의 `direct_url.json`이 남아 있거나 이미 설치된 파일이 덮어쓰기를 막으면 PyPI 패키지가 아니라 개발 사본을 계속 실행할 수 있다. **배포 검증의 기준은 "내 컴퓨터에서 된다"가 아니라 "공개 저장소에서 받은 산출물이 새 환경에서 된다"다.**

## 첫 릴리스에서 놓친 것

`0.1.0`은 실제 문제를 해결하고 PyPI 설치까지 가능하지만, 릴리스 과정은 완성형이 아니었다.

| 놓친 것 | 영향 | 다음 릴리스에서 할 일 |
| --- | --- | --- |
| wheel만 업로드 | sdist가 없는 불완전한 파일 구성 | `uv build --no-sources` 후 `uv publish`로 전체 업로드 |
| Homebrew 환경에 직접 설치 | upgrade 시 소실, 설치 출처 혼동 | `uv tool` 격리 환경에서 설치 |
| CLI 인자에 API 토큰 사용 | 히스토리·로그 노출 가능 | 토큰 폐기 후 Trusted Publishing 사용 |
| 자동 테스트 없음 | Harlequin·`harlequin-odbc` 내부 API 변화 감지 불가 | 지원 버전별 import·entry point·catalog 검색 테스트 추가 |
| Git tag·GitHub Release 없음 | 코드와 PyPI 버전의 대응이 약함 | `v0.1.1` tag와 release 생성 |
| 프로젝트 URL 불일치 | PyPI에서 잘못된 저장소로 연결 | 다음 버전 메타데이터에서 실제 URL로 수정 |

PyPI에 한 번 사용된 배포 파일명은 파일을 삭제해도 다시 사용할 수 없다. 누락된 다른 형식의 파일은 기존 릴리스에 추가할 수 있지만, 이미 올라간 wheel 자체와 그 안의 메타데이터는 교체할 수 없다. 기존 산출물을 고치려면 버전을 올려 새 릴리스로 배포해야 한다. 이 불변성 때문에 publish 전에 **메타데이터 → 두 산출물 → 격리 설치 → 실제 연결** 순서로 확인하는 게 중요하다.

## 정리

이번 작업에서 어댑터 구현 자체는 작았다. 어려운 부분은 범용 ODBC 계층과 Vertica 드라이버 사이에서 정확히 어느 계약이 다른지 찾는 일이었다.

1. 테스트한 드라이버에서 catalog가 `None`이면 `current_database()`로 보완한다.
2. 테스트한 드라이버가 거부한 `SQLColumns`의 catalog 인자를 전달하지 않는다.
3. `harlequin.adapter` entry point로 Harlequin에 등록한다.
4. Harlequin과 어댑터를 같은 격리 환경에 설치한다.
5. wheel과 sdist를 모두 검증한 뒤 PyPI에 배포한다.
6. 장기 토큰 대신 Trusted Publishing을 사용하고 공개본을 새 환경에서 다시 검증한다.

67줄짜리 핵심 adapter module이라도 패키징, 실제 DB 통합 테스트, 공개 배포까지 한 바퀴 돌면 다음 프로젝트에서 그대로 재사용할 판단 기준이 생긴다. 작은 문제를 끝까지 제품화해보는 가치가 여기에 있다.

## 관련 글

- [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/) — 같은 Vertica 메타데이터 문제를 Neovim 플러그인 생태계에서 푼 사례
- [jvm-env.nvim 발행 회고](/posts/neovim/2026-06-17-jvm-env-nvim-publication-retrospective/) — 첫 OSS 플러그인의 tag·release·CI 보강 사이클
- [Harlequin Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/harlequin.md) — Harlequin 프로필·키맵·기본 사용법

## 참고

- [Harlequin — Database Adapters](https://harlequin.sh/docs/adapters)
- [Harlequin plugin loader source](https://github.com/tconbeer/harlequin/blob/main/src/harlequin/plugins.py)
- [PyPA — Creating and discovering plugins](https://packaging.python.org/en/latest/guides/creating-and-discovering-plugins/)
- [PyPA — Package formats](https://packaging.python.org/en/latest/discussions/package-formats/)
- [uv — Building and publishing a package](https://docs.astral.sh/uv/guides/package/)
- [PyPI — Trusted Publishing](https://docs.pypi.org/trusted-publishers/)
- [PyPI — Distribution filename reuse policy](https://pypi.org/help/#file-name-reuse)
