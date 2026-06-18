---
title       : "crate-ci/typos 액션이 제품명을 오타로 잡으면 .github/typos.toml에 허용 단어 등록"
description : "typos 액션이 고유명사를 오타로 잡으면 typos.toml의 extend-words에 자기 자신으로 매핑해 허용한다"
date        : 2026-06-12 10:00:00 +0900
updated     : 2026-06-12 10:00:00 +0900
categories  : [opensource]
tags        : [typos, ci, lint, awesome-list]
pin         : false
hidden      : false
---

`crate-ci/typos` GitHub Action은 일반 영단어 사전 기반이라 `Vertica`(분석 DB 제품명) 같은 고유명사를 오타(`Vertical`)로 잘못 잡을 수 있다. 리포지토리 루트의 `.github/typos.toml`에 허용 단어를 한 줄 추가하면 해결된다.

## 해결

```toml
[default.extend-words]
Strat = "Strat"
Vertica = "Vertica"
```

좌변이 입력 단어, 우변이 "이걸로 교정해라"인데 동일하게 두면 사실상 허용 단어(allowlist) 역할을 한다. URL이나 백틱 코드(`` `vertica` ``) 안의 단어는 보통 통과되므로, 산문(prose)에 등장하는 대문자 형태만 문제가 되는 경우가 많다.

## 참고

- [crate-ci/typos](https://github.com/crate-ci/typos)
- [awesome-neovim PR #2355](https://github.com/rockerBOO/awesome-neovim/pull/2355) — 동일 PR에 `typos.toml` 수정을 묶어 통과시킨 사례
