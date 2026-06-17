---
title       : "vim-dadbod 어댑터 플러그인 만들기 — 디렉토리 골격부터 dadbod-ui 트리 통합까지"
description : "임의 DBMS CLI를 vim-dadbod / vim-dadbod-ui에 연결하는 절차. 어댑터 함수 5종, table helpers, schema-tree monkey-patch, LazyVim 지연 주입."
date        : 2026-06-12 16:00:00 +0900
updated     : 2026-06-12 16:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [vim-dadbod, vim-dadbod-ui, plugin, adapter, vimscript, lua, lazyvim]
pin         : false
hidden      : false
---

vim-dadbod은 postgres·mysql·sqlite·redis 등 주요 DBMS는 기본 어댑터로 지원하지만, 그 밖의 DB(Vertica, ClickHouse, DuckDB, Snowflake CLI 등)는 직접 어댑터를 붙여야 한다. 어댑터 자체는 5개 함수만 구현하면 되지만, **vim-dadbod-ui의 schema-tree까지 통합하려면 공개 훅이 없어서 monkey-patch가 필요**하다. 이 글은 그 전체 절차를 단계별로 정리한다.

대상 DB로 Vertica를 사례로 들지만, 절차 자체는 모든 CLI 기반 DB에 적용된다. 코드 풀세트는 [dadbod-vertica.nvim](https://github.com/clang-engineer/dadbod-vertica.nvim) 참고.

## 결론 먼저 — 작업 순서표

| 단계 | 작업 | 난이도 | 복사 가능 비율 |
| --- | --- | --- | --- |
| 0 | CLI 매핑 표 만들기 (`--help` 정독) | 쉬움 | 0% (DB별) |
| 1 | 디렉토리 골격 | 쉬움 | 100% |
| 2 | 어댑터 함수 5종 구현 | 중간 | 60% |
| 3 | `:DB SELECT 1` 동작 검증 | 쉬움 | — |
| 4 | dadbod-ui table helpers | 쉬움 | 20% (메타 쿼리 다름) |
| 5 | dadbod-ui schema-tree monkey-patch | **어려움** | 90% |
| 6 | LazyVim 지연 주입 autocmd | 쉬움 | 100% |
| 7 | 설정 단일 출처화 + Lua 래퍼 | 쉬움 | 90% |

## 0. 사전 조사 — 결정해야 할 것들

코딩 들어가기 전에 6개 답을 확정한다. 안 그러면 도중에 처음으로 되돌아간다.

1. **클라이언트 CLI 존재?** — 없으면 wire protocol 직접 구현이라 난이도 폭증.
2. **psql/mysql과 인자 호환?** — Vertica `vsql`처럼 같은 알파벳이라도 의미가 다른 경우 있음 (vsql `-w`는 password 값, psql `-w`는 boolean).
3. **stdout/stderr 포맷?** — 라이선스 banner나 NOTICE를 흘리면 결과 파싱이 깨진다.
4. **카탈로그 스키마 구조?** — 시스템 스키마 이름, 메타데이터 뷰 위치.
5. **인덱스/제약 메타데이터 위치?** — Vertica는 전통적 인덱스가 없어서 `v_catalog.projections`로 대체.
6. **URL 스킴 표기?** — `<scheme>://user:pw@host:port/db`로 정규화 가능한가.

## 1. 디렉토리 골격

vim-dadbod이 기대하는 경로 규칙이 엄격하다.

```
my-adapter.nvim/
├── autoload/
│   └── db/
│       └── adapter/
│           └── <scheme>.vim     ← 파일명 = URL 스킴명
├── plugin/
│   └── my-adapter.vim           ← UI 통합·monkey-patch (선택)
├── lua/
│   └── my-adapter/
│       └── init.lua             ← lazy.nvim 친화 setup (선택)
├── README.md
└── LICENSE
```

- **`autoload/db/adapter/<scheme>.vim`** — 파일명이 곧 URL 스킴명. dadbod이 lazy하게 autoload로 찾는다.
- **`plugin/`** — startup마다 sourced. UI 통합처럼 시점에 민감한 작업만.
- **`lua/`** — lazy.nvim `opts` 패턴 호환용. Vimscript만으로도 충분하지만 있으면 친절.

## 2. 어댑터 함수 5종 구현

vim-dadbod이 호출하는 컨트랙트. 모두 `db#adapter#<scheme>#<name>()` 네이밍.

### 2.1 canonicalize — URL 정규화

```vim
function! db#adapter#vertica#canonicalize(url) abort
  let url = substitute(a:url, '^[^:]*:/\=/\@!', 'vertica:///', '')
  return db#url#absorb_params(url, {
        \ 'user': 'user',
        \ 'password': 'password',
        \ 'host': 'host',
        \ 'port': 'port',
        \ 'dbname': 'database'})
endfunction
```

`substitute` 라인은 짧은 URL(`vertica:`)을 표준형(`vertica:///`)으로 보정. `db#url#absorb_params`가 query string의 옵션을 dict로 흡수한다.

### 2.2 base_command — CLI 인자 매핑

DBMS별로 가장 갈리는 지점. CLI `--help`를 정독하고 표를 만든 다음 매핑한다.

```vim
function! s:base_command(url) abort
  let parsed = db#url#parse(a:url)
  let cmd = [s:vsql()]
  if has_key(parsed, 'host')  | let cmd += ['-h', parsed.host] | endif
  if has_key(parsed, 'port')  | let cmd += ['-p', parsed.port] | endif
  if !empty(get(parsed, 'user', ''))
    let cmd += ['-U', parsed.user]
  endif
  if !empty(get(parsed, 'password', ''))
    " vsql -w는 password 값을 받음 (psql과 의미 다름)
    let cmd += ['-w', parsed.password]
  endif
  let path = get(parsed, 'path', '')
  if !empty(path) && path !=# '/'
    let cmd += ['-d', substitute(path, '^/', '', '')]
  endif
  return cmd
endfunction
```

> **함정**: psql 감각으로 추측하지 말 것. CLI 문서를 읽고 옮긴다. Vertica `vsql`은 psql과 80% 비슷해 보이지만 `-w`·`-P` 등에서 다르다.

### 2.3 filter — stderr 처리 + 안전 옵션

배치 쿼리용. 여기서 noise(NOTICE, 라이선스 banner)를 잡지 않으면 결과 파싱이 깨진다.

```vim
function! db#adapter#vertica#filter(url) abort
  let base = db#adapter#vertica#interactive(a:url,
        \ ['-X', '-q', '-v', 'ON_ERROR_STOP=1'])
  if !has('unix') || !get(g:, 'dadbod_vertica_suppress_notice', 1)
    return base
  endif
  return ['/bin/sh', '-c', '"$@" 2>/dev/null', 'dbvertica-sh'] + base
endfunction
```

핵심:
- `-X`/`-q` 같은 "조용히" 옵션이 있는지 CLI에서 확인.
- 그래도 새는 출력이 있으면 `sh -c '"$@" 2>/dev/null'`로 감싼다.
- `$@` 사용이 중요 — dadbod이 후행 인자(`-c`, `-f`, `-tA`)를 그대로 forward한다.
- Windows 호환은 `has('unix')` 가드로 우회 (희생 인정).

### 2.4 input / interactive — 한 줄

```vim
function! db#adapter#vertica#input(url, in) abort
  return db#adapter#vertica#filter(a:url) + ['-f', a:in]
endfunction

function! db#adapter#vertica#interactive(url, ...) abort
  return s:base_command(a:url) + (a:0 ? a:1 : [])
endfunction
```

### 2.5 tables — introspection + marker 보호

`:DB :tables` 명령과 dadbod-ui flat fallback에 쓰인다.

```vim
function! db#adapter#vertica#tables(url) abort
  let filter = s:user_schema_filter()
  let marker = '__DBV_ROW__'
  let query = "SELECT '" . marker . "' || table_schema || '.' || table_name FROM v_catalog.tables WHERE " . filter
        \ . " UNION ALL SELECT '" . marker . "' || table_schema || '.' || table_name FROM v_catalog.views WHERE " . filter
        \ . " ORDER BY 1;"
  let lines = db#systemlist(db#adapter#vertica#filter(a:url) + ['-tA', '-c', query])
  let prefix_len = len(marker)
  return map(filter(lines, 'strpart(v:val, 0, prefix_len) ==# marker'),
        \ 'v:val[prefix_len :]')
endfunction
```

> **marker prefix 트릭**: `-tA`로 헤더를 끄더라도 일부 CLI 빌드는 banner를 stdout으로 흘린다. 모든 데이터 행에 마커를 붙이고 클라이언트에서 마커 있는 줄만 통과시키면 어떤 noise도 차단된다. SQL injection도 불가능 — 마커는 서버측 리터럴 concat.

## 3. 1차 검증 — 손으로 돌려보기

여기서 막히면 다음 단계로 넘어가지 말 것.

```vim
:let g:db = 'vertica://user:pw@host:5433/dbname'
:DB SELECT 1
:DB :tables
```

흔한 실패 원인:
- canonicalize 결과 빈 dict → `:echo db#url#parse(g:db)`로 점검 후 substitute 정규식 수정.
- stderr noise → CLI 직접 호출해서 어떤 banner가 나오는지 본 후 `filter()` 보강.
- 인자 reject → CLI `--help`로 매핑 재검토.

## 4. dadbod-ui table helpers — 쉬움

`g:db_ui_table_helpers.<scheme>` dict에 `이름 → 쿼리` 매핑만 넣으면 dadbod-ui의 테이블 우클릭 메뉴에 노출된다.

```vim
" plugin/dadbod-vertica.vim
if !exists('g:db_ui_table_helpers')
  let g:db_ui_table_helpers = {}
endif

let s:vertica_helpers = {
      \ 'List': 'SELECT * FROM {optional_schema}"{table}" LIMIT 200',
      \ 'Columns': "SELECT * FROM v_catalog.columns WHERE table_schema = '{schema}' AND table_name = '{table}' ORDER BY ordinal_position",
      \ 'Primary Keys': "SELECT * FROM v_catalog.primary_keys WHERE table_schema = '{schema}' AND table_name = '{table}'",
      \ 'Indexes': "SELECT * FROM v_catalog.projections WHERE anchor_table_schema = '{schema}' AND anchor_table_name = '{table}'",
      \ 'References': "SELECT * FROM v_catalog.foreign_keys WHERE reference_table_schema = '{schema}' AND reference_table_name = '{table}'",
      \ 'Foreign Keys': "SELECT * FROM v_catalog.foreign_keys WHERE table_schema = '{schema}' AND table_name = '{table}'",
      \ }

let g:db_ui_table_helpers.vertica = extend(s:vertica_helpers,
      \ get(g:db_ui_table_helpers, 'vertica', {}))
```

규약:
- **dict insertion order = 메뉴 표시 순서.**
- `{table}`, `{schema}`, `{optional_schema}` 플레이스홀더는 dadbod-ui가 치환.
- `extend(s:vertica_helpers, user_dict)`로 사용자 dict를 후순위에 → 오버라이드 승.

## 5. dadbod-ui Schema-tree 통합 — monkey-patch

여기가 가장 어려운 부분이고, **외부 어댑터 작성자가 반드시 겪는 함정**이다.

### 5.1 왜 어려운가

vim-dadbod-ui는 schema-grouped 트리(Schemas → schema → tables)를 그릴 때 script-local `s:schemas` dict를 본다. postgres/mysql 등 미리 박혀있는 스킴만 들어있고, **외부 어댑터가 추가될 공개 훅이 없다.**

### 5.2 우회 전략

`db_ui#schemas#get()`을 통째로 override한다. 단, **먼저** 원본이 알고 있는 모든 스킴을 snapshot 해둬야 postgres/mysql 사용자가 망하지 않는다.

```vim
function! s:inject_vertica_schema() abort
  if exists('s:schemes_cache') | return | endif
  silent! runtime autoload/db_ui/schemas.vim
  if !exists('*db_ui#schemas#get') | return | endif

  " Snapshot 먼저 — funcref는 이름으로 resolve되므로
  " override 후엔 원본 호출 불가
  let s:schemes_cache = {}
  for scheme in db#adapter#schemes()
    let entry = db_ui#schemas#get(scheme)
    if !empty(entry) | let s:schemes_cache[scheme] = entry | endif
  endfor
  let s:schemes_cache.vertica = s:vertica_scheme

  function! db_ui#schemas#get(scheme) abort
    return get(s:schemes_cache, a:scheme, {})
  endfunction
endfunction
```

핵심 포인트:
- **Vim funcref는 이름으로 resolve된다.** 재정의 후엔 원본을 다시 부를 수 없으므로 snapshot은 재정의 전에 끝낸다.
- `db#adapter#schemes()`는 runtimepath의 모든 dadbod 어댑터를 열거한다. vim-dadbod이 새 어댑터를 추가해도 자동으로 캡처됨.
- **트레이드오프**: vim-dadbod-ui 자체가 신규 스킴을 추가하면 이 플러그인 reload 전까지 노출 안 됨. 한계로 인정하고 주석에 명시.

### 5.3 scheme dict 키 — dadbod-ui 소스를 읽어야 안다

문서화되어 있지 않아서 dadbod-ui 소스를 직접 봐야 알 수 있다.

| key | 역할 |
| --- | --- |
| `callable` | 어댑터 함수명 (`'filter'` → `db#adapter#<scheme>#filter`) |
| `args` | callable 결과 뒤에 붙일 베이스 인자 (예: `['-A', '-c']`) |
| `schemes_query` | 스키마 목록 SELECT (1열) |
| `schemes_tables_query` | 스키마+테이블 쌍 SELECT (2열) |
| `parse_results` | `funcref(results, min_len) → list` 결과 파서 |
| `default_scheme` | 기본 스키마 (없으면 `''`) |
| `quote` | identifier quoting on/off |

```vim
let s:vertica_scheme = {
      \ 'callable': 'filter',
      \ 'args': ['-A', '-c'],
      \ 'schemes_query': "SELECT schema_name FROM v_catalog.schemata WHERE schema_name NOT IN (...) ORDER BY schema_name",
      \ 'schemes_tables_query':
      \   "SELECT table_schema, table_name FROM v_catalog.tables WHERE ..."
      \   . " UNION ALL"
      \   . " SELECT table_schema, table_name FROM v_catalog.views WHERE ..."
      \   . " ORDER BY 1, 2",
      \ 'parse_results': {results, min_len -> s:results_parser(filter(results, '!empty(v:val)')[1:-2], '|', min_len)},
      \ 'default_scheme': '',
      \ 'quote': 1,
      \ }
```

`parse_results`는 dadbod-ui의 내부 `s:results_parser`를 미러링한다 (script-local이라 재사용 불가, 통째로 옮긴다).

## 6. LazyVim 지연 주입

LazyVim 사용자는 보통 `cmd = { "DBUI*" }`로 vim-dadbod-ui를 늦게 로드한다. 이 경우 어댑터 plugin이 먼저 sourced되어도 `db_ui#schemas#get()`이 아직 없다.

즉시 시도 → 실패하면 `SourcePost` 훅으로 재시도하는 패턴:

```vim
call s:inject_vertica_schema()
if !exists('s:schemes_cache')
  augroup dadbod_vertica_schema_inject
    autocmd!
    autocmd SourcePost */vim-dadbod-ui/plugin/db_ui.vim ++once call s:inject_vertica_schema()
  augroup END
endif
```

- `++once`로 한 번만 실행.
- `*/vim-dadbod-ui/plugin/db_ui.vim`은 dadbod-ui plugin 파일이 sourced되는 정확한 시점 — command 본체 실행 직전이라 안전.

## 7. 설정 단일 출처 + Lua 래퍼

`plugin/`과 `autoload/`가 같이 보는 값은 반드시 `g:` 변수로 빼서 drift를 막는다.

```vim
" 단일 출처
g:dadbod_<scheme>_<cli>                  " 실행 파일 경로
g:dadbod_<scheme>_suppress_notice        " stderr 억제 on/off
g:dadbod_<scheme>_system_schemas         " 시스템 스키마 필터 ([]로 비활성)
g:dadbod_<scheme>_disable_schema_tree    " monkey-patch off → flat 목록
```

Lua 래퍼는 lazy.nvim의 `opts` 패턴 호환용. 이게 전부다.

```lua
-- lua/dadbod-vertica/init.lua
local M = {}

function M.setup(opts)
  opts = opts or {}
  if opts.vsql ~= nil then
    vim.g.dadbod_vertica_vsql = opts.vsql
  end
end

return M
```

```lua
-- 사용자 측 lazy.nvim spec
{
  "clang-engineer/dadbod-vertica.nvim",
  dependencies = { "tpope/vim-dadbod", "kristijanhusak/vim-dadbod-ui" },
  ft = "sql",
  opts = { vsql = "/opt/vertica/bin/vsql" },
}
```

## 다른 DB로 갈 때 갈리는 지점

| 지점 | 갈림 정도 | 비고 |
| --- | --- | --- |
| 디렉토리 골격 | 동일 | 거의 복붙 |
| canonicalize | 거의 동일 | substitute 정규식만 스킴명 교체 |
| base_command | **완전히 다름** | CLI별 매핑 |
| filter (stderr) | DBMS별 | noise 없으면 wrapper 불필요 |
| introspection 쿼리 | **완전히 다름** | 카탈로그 학습 필요 |
| table helpers | **완전히 다름** | 메타데이터 뷰별 |
| monkey-patch 흐름 | 동일 | scheme dict만 교체 |
| 지연 주입 | 동일 | 그대로 복사 |

코드 복사 가능 비율 약 **40%**, 나머지는 DBMS별 수작업.

## 최종 검증 시나리오

```vim
" 인터랙티브
:DB vertica://user:pw@host:5433/dbname
:DB SELECT current_database()

" UI
:DBUI
" → 트리에서 커넥션 펼치기 → Schemas → 스키마 → 테이블
" → 액션 키: List/Columns/PK/FK/Indexes/References 모두 작동
```

여기까지 통과하면 출시 준비 완료. 다음 단계는 [Neovim 플러그인 노출 채널 4곳](/posts/neovim/2026-06-12-neovim-plugin-distribution/) — awesome-neovim·GitHub Topics·Dotfyle 등 등록.

## 체크리스트

```
[ ] CLI 매핑 표 (--help 정독)
[ ] 디렉토리 골격 (autoload/db/adapter/<scheme>.vim)
[ ] canonicalize / base_command / filter / input / interactive / tables 6개 구현
[ ] :DB SELECT 1 동작 확인
[ ] stderr 노이즈 처리 (sh wrapper 또는 -q 옵션)
[ ] table helpers dict (g:db_ui_table_helpers.<scheme>)
[ ] db_ui#schemas#get monkey-patch + snapshot
[ ] LazyVim 지연 주입 (SourcePost autocmd)
[ ] g: 변수로 설정 단일 출처화
[ ] Lua setup 래퍼
[ ] :DBUI 전 경로 수동 검증
[ ] README + LICENSE
```
