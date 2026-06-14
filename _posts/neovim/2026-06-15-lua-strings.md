---
title       : "Lua 문법 7 — 문자열과 패턴 매칭"
description : "string.format/sub 기본 함수, Lua 패턴(%w/%s/%d/%a) 문법, gmatch/gsub/match, 정규식과의 차이까지."
date        : 2026-06-15 16:00:00 +0900
updated     : 2026-06-15 16:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim]
pin         : false
hidden      : false
---

Lua는 정규식이 없다. 대신 **Lua 패턴**이라는 자체 미니 언어를 쓴다. 정규식보다 단순하지만 그래서 더 빨리 익힐 수 있고, 대부분의 텍스트 처리에 충분하다. 이번 편은 자주 쓰는 문자열 함수와 패턴 문법을 정리한다.

## 결론 먼저

- 메서드 호출 가능: `s:upper()` == `string.upper(s)` (5편 메타테이블 결과).
- 포매팅은 **`string.format("%d %s", n, s)`** — C의 printf.
- Lua 패턴은 **정규식 아님**. `%`로 escape, `%w`/`%s`/`%d` 같은 클래스, `*`/`+`/`-`/`?` 수량자.
- 매칭: **`string.match`**(첫 매치), **`string.gmatch`**(이터레이터), **`string.gsub`**(치환).
- 정규식에 있는 **`|` (or), `{n,m}` (개수)는 없다**. `%f`(frontier) 같은 Lua 고유 기능 있음.

## 기본 함수

| 함수 | 역할 |
| --- | --- |
| `string.len(s)` / `#s` | 바이트 길이 (UTF-8 코드 포인트 아님) |
| `string.upper(s)` / `string.lower(s)` | 대소문자 |
| `string.sub(s, i, j)` | 부분 문자열 (1-indexed, j 포함) |
| `string.rep(s, n)` / `string.rep(s, n, sep)` | 반복 |
| `string.reverse(s)` | 뒤집기 |
| `string.byte(s, i)` / `string.char(n)` | 코드 ↔ 문자 |
| `string.format(fmt, ...)` | printf 스타일 |

```lua
print(#"hello")              -- 5
print(("hello"):sub(2, 4))   -- ell
print(("hi"):rep(3, "-"))    -- hi-hi-hi
print(string.format("%d:%s", 42, "neo"))   -- 42:neo
```

`#s`는 **바이트 길이**다. UTF-8 한글은 한 글자에 3바이트.

```lua
print(#"한")    -- 3
```

문자 단위 길이가 필요하면 Neovim의 `vim.fn.strchars()` 또는 `vim.str_utfindex()`를 쓴다.

## string.format 자주 쓰는 포맷

| 지정자 | 의미 |
| --- | --- |
| `%d` / `%i` | 정수 |
| `%f` / `%.2f` | 실수 / 소수점 2자리 |
| `%s` | 문자열 (또는 `tostring` 결과) |
| `%q` | 안전한 따옴표 escape |
| `%x` / `%X` | 16진수 |
| `%%` | 리터럴 `%` |

```lua
print(string.format("[%5d]", 42))      -- [   42]  (오른쪽 정렬, 너비 5)
print(string.format("[%-5d]", 42))     -- [42   ]  (왼쪽 정렬)
print(string.format("%.3f", 3.14159))  -- 3.142
print(string.format("%q", 'he said "hi"'))  -- "he said \"hi\""
```

LazyVim/플러그인 코드에서 디버그 메시지 만들 때 가장 흔한 패턴.

## Lua 패턴 문법

정규식과 비슷하지만 다르다. 우선 escape가 `\`가 아니라 **`%`**.

### 문자 클래스

| 클래스 | 의미 | 대문자 (반대) |
| --- | --- | --- |
| `%a` | 알파벳 | `%A` |
| `%d` | 숫자 | `%D` |
| `%w` | 영숫자 | `%W` |
| `%s` | 공백 | `%S` |
| `%l` / `%u` | 소/대문자 | `%L` / `%U` |
| `%p` | 구두점 | `%P` |
| `%c` | 제어 문자 | `%C` |
| `%x` | 16진수 | `%X` |
| `.` | 아무 문자 | (반대 없음) |

```lua
print(string.match("abc123", "%d+"))   -- 123
print(string.match("hi neo", "%a+"))   -- hi  (첫 매치)
```

### 수량자

| 수량자 | 의미 |
| --- | --- |
| `*` | 0회 이상 (최대) |
| `+` | 1회 이상 (최대) |
| `-` | 0회 이상 (**최소**, 정규식의 `*?`) |
| `?` | 0 또는 1회 |

정규식의 `{n,m}`은 없다. `-`이 lazy 수량자인 점이 헷갈린다.

```lua
print(string.match("<b>text</b>", "<.->"))   -- <b>     (lazy)
print(string.match("<b>text</b>", "<.*>"))   -- <b>text</b>  (greedy)
```

### 집합 `[]`

```lua
print(string.match("hi_world", "[%w_]+"))   -- hi_world  (단어 + 언더스코어)
print(string.match("hi3", "[^%d]+"))        -- hi  (^ 부정)
```

### 앵커

| 앵커 | 의미 |
| --- | --- |
| `^` (패턴 시작) | 문자열 시작 |
| `$` (패턴 끝) | 문자열 끝 |
| `%b()` | 짝 맞춘 괄호 |
| `%f[set]` | frontier (경계) |

```lua
print(string.match("hello world", "^hello"))   -- hello
print(string.match("hello world", "world$"))   -- world

-- 짝 맞춤
print(string.match("foo(bar(baz))end", "%b()"))   -- (bar(baz))
```

### 캡처 `()`

괄호로 부분을 묶으면 따로 추출된다.

```lua
local k, v = string.match("name=neo", "(%w+)=(%w+)")
print(k, v)   -- name  neo

-- 다중 캡처 + 다중 반환
local h, m, s = string.match("12:34:56", "(%d+):(%d+):(%d+)")
```

### 리터럴 escape

특수 문자(`. * + - ? ^ $ ( ) [ ] %`)를 그대로 매칭하려면 앞에 `%`.

```lua
print(string.match("3.14", "%d%.%d+"))   -- 3.14
```

## 매칭 함수

### string.match — 첫 매치만

```lua
local s = string.match("hello123world", "(%a+)(%d+)(%a+)")
-- 다중 반환: "hello", "123", "world"

-- 캡처 없으면 매치 전체 반환
print(string.match("hi42", "%d+"))   -- 42
print(string.match("abc", "%d+"))    -- nil
```

### string.find — 위치도 반환

```lua
local i, j = string.find("hello world", "world")
print(i, j)   -- 7  11
```

`plain` 인자(4번째)를 true로 주면 패턴 해석 없이 리터럴 검색.

### string.gmatch — 이터레이터

모든 매치를 순회.

```lua
for word in string.gmatch("hi neo, how are you", "%w+") do
  print(word)
end
-- hi
-- neo
-- how
-- are
-- you
```

캡처가 여러 개면 `for k, v in ...`.

```lua
for k, v in string.gmatch("a=1, b=2, c=3", "(%w+)=(%w+)") do
  print(k, v)
end
```

### string.gsub — 치환

```lua
local s, n = string.gsub("hello world", "o", "O")
print(s, n)   -- hellO wOrld  2
```

세 번째 인자는 **문자열**, **테이블**, 또는 **함수**.

```lua
-- 캡처 참조
print((string.gsub("name=neo", "(%w+)=(%w+)", "%2:%1")))
-- neo:name

-- 함수로 치환
print((string.gsub("a1b2c3", "%d", function(d) return d * 10 end)))
-- a10b20c30

-- 테이블로 치환 (캡처를 키로)
local map = { hello = "안녕", world = "세계" }
print((string.gsub("hello world", "%w+", map)))
-- 안녕 세계
```

4번째 인자로 치환 횟수 제한.

```lua
print((string.gsub("aaaa", "a", "X", 2)))   -- XXaa
```

## 정규식과의 차이

| 기능 | 정규식 | Lua 패턴 |
| --- | --- | --- |
| escape | `\` | `%` |
| or | `\|` | **없음** |
| 개수 `{n,m}` | 있음 | **없음** |
| lazy 수량자 | `*?`, `+?` | `-` (개념상 `*?` 자리) |
| lookahead/behind | `(?=)`, `(?<=)` | **없음** |
| 앵커 `^`, `$` | 있음 | 있음 |
| 캡처 `()` | 있음 | 있음 |
| named capture | 있음 | **없음** |
| 짝 맞춤 | 없음 (대부분) | **`%b()` 있음** |
| frontier | 없음 | **`%f` 있음** |

**Lua 패턴이 빠르고 단순하지만 표현력은 약하다**. 복잡한 패턴이면 여러 단계로 쪼개거나 `vim.regex`(Vim regex)/`vim.lpeg`(LPeg) 사용.

## Neovim 컨텍스트

**경로 처리**

```lua
local function basename(path)
  return path:match("([^/\\]+)$") or path
end
print(basename("/a/b/c.lua"))   -- c.lua
```

**파일 확장자**

```lua
local function ext(path)
  return path:match("%.([^.]+)$")
end
print(ext("init.lua"))   -- lua
```

**메시지 파싱 (LSP 에러 등)**

```lua
local msg = "main.lua:42:5: 'foo' is not defined"
local file, line, col, text = msg:match("([^:]+):(%d+):(%d+):%s*(.+)")
-- main.lua, 42, 5, 'foo' is not defined
```

**커맨드라인에서 키맵 desc 만들기**

```lua
local function fmt_keys(lhs, rhs)
  return string.format("%-10s → %s", lhs, rhs)
end
```

**vim.fn vs Lua**

Vim 정규식이 필요하면 `vim.regex` 또는 `vim.fn.matchstr` 사용. Lua 패턴은 어디까지나 Lua 한정.

```lua
-- Vim 정규식 (vim.fn 경유)
print(vim.fn.matchstr("hello123", "\\d\\+"))   -- 123 (Vim regex)

-- Lua 패턴
print(string.match("hello123", "%d+"))         -- 123 (Lua pattern)
```

## 함정 정리

1. **escape는 `\`가 아니라 `%`**. `\d`로 쓰면 안 됨. `%d`.
2. **`|`(or)이 없다**. 두 패턴 중 하나 매칭은 별도 시도 또는 집합 `[]`로 우회.
3. **`-`는 lazy 수량자**, 빼기 아님. 빼기는 그냥 리터럴이 안 되니 의미 없음.
4. **`%s`는 공백류, 정규식 `\s`와 같음**. 헷갈리지 말 것은 `%w`(영숫자, `\w`와 거의 같음).
5. **`#s`는 바이트 길이**. UTF-8 코드 포인트 수가 아님.
6. **gsub 결과는 다중 반환**(`new, count`). 출력만 보려면 `print((s:gsub(...)))`처럼 괄호로 감싸 두 번째 반환 잘라내기.
7. **`%` 자체를 매칭하려면 `%%`**. 패턴에서도, `string.format`에서도.

## 다음 편

8편(마지막)은 **에러 처리**: `error`, `pcall`, `xpcall`. Neovim 플러그인에서 에러를 어떻게 다루는지(보통 그대로 던지고 UI 콜백에서만 감싸기), `vim.notify`로 사용자에게 보여주는 관행까지.
