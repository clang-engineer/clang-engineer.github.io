---
title       : "XSS 분류 — Reflected·Stored·DOM-based와 Source/Sink"
description : "세 XSS의 갈림길은 '악성 스크립트가 어디서 페이지에 삽입되는가'다. 서버 응답이면 Reflected, 저장 후 전달이면 Stored, 클라이언트 JS의 DOM 조작이면 DOM-based. View Source로 구분하는 법과, DOM-based를 관통하는 Source→Sink 흐름을 정리한다."
date        : 2026-07-12 19:00:00 +0900
updated     : 2026-07-12 19:00:00 +0900
categories  : [security, "웹 취약점"]
tags        : [xss, security, dom, reflected, source-sink]
pin         : false
hidden      : false
---

XSS를 Reflected/Stored/DOM-based로 나누긴 하는데, 셋의 진짜 갈림길은 **악성 스크립트가 어디서 페이지에 삽입되는가**다. 삽입 주체가 서버냐 클라이언트 JS냐를 잡으면 분류도 방어 위치도 따라온다.

## 세 유형

| | 삽입되는 곳 | 취약점 원인 |
|---|---|---|
| **Reflected(반사형)** | 요청값이 **서버 응답 HTML**에 되돌아 실림 | 서버 측 출력 처리 미흡 |
| **Stored(저장형)** | 페이로드가 DB 등에 **저장됐다가** 나중에 전달 | 저장·출력 시 미흡 |
| **DOM-based** | 서버 무관, **클라이언트 JS가 DOM 조작** 중 실행 | 클라이언트 JS의 DOM 처리 미흡 |

쉽게 말해 **Reflected는 "서버가 되돌려준 응답"에서 터지고, DOM-based는 "브라우저 안 JS"에서 터진다.** Stored는 페이로드가 서버에 저장됐다 재전달된다는 점에서 또 다르다.

## Reflected vs DOM-based — View Source로 구분

가장 헷갈리는 두 유형이다. 결정적 판별은 **"페이지 소스 보기(View Source)에 페이로드가 보이느냐"**다.

**Reflected** — 페이로드가 요청(URL 쿼리스트링)에 담겨 **서버까지 갔다가 응답 HTML에 삽입**돼 되돌아온다.

```
공격 URL:  https://site/search?q=<script>steal()</script>
서버 응답: <p>검색 결과: <script>steal()</script></p>   ← 응답에 그대로 실림
```

→ 서버 응답에 페이로드가 있으니 **View Source에 보인다.** 서버 응답 검사로 탐지 가능.

**DOM-based** — 서버는 페이로드를 **본 적도 없다.** 클라이언트 JS가 `location.hash` 같은 값을 읽어 DOM에 집어넣는다.

```html
<!-- 서버가 보낸 건 멀쩡한 HTML -->
<div id="o"></div>
<script>
  // URL의 # 뒤 값을 읽어 그대로 DOM에 삽입
  document.getElementById("o").innerHTML = location.hash.substring(1);
</script>
```

→ **서버 응답엔 페이로드가 없다.** View Source엔 안 보이고 개발자도구의 DOM을 봐야 보인다. DOM 동적 분석이 필요.

| | Reflected | DOM-based |
|---|---|---|
| 페이로드가 서버까지 감 | O | △ (fragment면 X) |
| 응답 HTML에 삽입 | O (서버가) | X (JS가) |
| View Source에 페이로드 | **보임** | **안 보임** |
| 탐지 | 서버 응답 검사 | DOM 동적 분석 |

> 주의: DOM-based가 꼭 `#fragment`만 쓰는 건 아니다. `?q=...`(서버로 가는 값)를 클라이언트 JS가 읽어 처리하는 DOM-based도 있다. 이땐 페이로드가 서버로도 가지만 **서버는 정상 처리하고, 실제 취약점은 클라이언트 JS의 DOM 조작에서 발생**한다. 진짜 기준은 **"어느 코드가 페이로드를 페이지에 넣어 실행시키는가"** — 서버 출력이면 Reflected, 클라이언트 JS면 DOM-based다.
{: .prompt-warning }

## 방어 위치가 다르다

결함이 생기는 위치가 다르니 막는 위치도 다르다.

- **Reflected/Stored** — **서버 측 출력 인코딩/이스케이프**로 막는다. 응답에 실을 때 `<`, `>`, `&` 등을 엔티티로 바꾼다.
- **DOM-based** — **클라이언트 JS에서 안전한 API 사용**으로 막는다. `innerHTML` 대신 `textContent`, `eval`·`document.write` 회피.

## DOM-based를 관통하는 것 — Source → Sink

DOM-based XSS는 결국 **"공격자가 통제 가능한 값(source)이 검증 없이 위험한 지점(sink)으로 흘러간다"**는 하나의 구조다.

- **Source(소스)** — 공격자가 통제할 수 있는 입력을 JS가 읽어오는 지점. `location.hash`, `location.search`, `document.referrer`, `window.name` 등.
- **Sink(싱크)** — 그 값이 흘러 들어가 실행으로 이어지는 위험한 지점. `innerHTML`, `outerHTML`, `eval`, `document.write`, `setTimeout(문자열)` 등.

```js
let x = location.hash.substring(1);           // ← source (공격자 통제)
document.getElementById("o").innerHTML = x;   // ← sink (실행)
```

막는 법은 둘 중 하나다.

- 위험한 sink를 안전한 것으로 교체 — `innerHTML` → `textContent`
- source 값을 sink에 넣기 전 인코딩·검증

"JS로 DOM을 통제한다"는 그 통제 과정에 **외부 입력이 섞여드는 게 취약점**이다. source와 sink만 추적하면 DOM-based는 대부분 잡힌다.

## 정리

- 세 XSS의 갈림길은 **삽입 주체** — 서버 응답(Reflected) / 저장 후 전달(Stored) / 클라이언트 JS의 DOM 조작(DOM-based).
- Reflected vs DOM-based는 **View Source에 페이로드가 보이느냐**로 직관적으로 갈린다.
- 방어 위치가 다르다: Reflected/Stored는 **서버 출력 인코딩**, DOM-based는 **클라이언트 안전 API**.
- DOM-based의 본질은 **source → sink** 흐름. 위험한 sink 교체나 source 검증으로 끊는다.
