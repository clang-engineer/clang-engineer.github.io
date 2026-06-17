---
title       : "프론트에서 form POST로 새 탭 띄우기 — target=_blank 외부 시스템 연동"
description : "백엔드 WebClient로는 302 리다이렉트 화면을 사용자 브라우저에서 열 수 없어, 프론트가 직접 form POST를 만들어 새 탭으로 보낸다"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [javascript, "언어·패키지"]
tags        : [form, html-pattern, sso]
pin         : false
hidden      : false
---

SSO 로그인, 외부 신청 화면처럼 "다른 시스템 화면을 사용자 브라우저에서 열어줘야" 하는 연동이 있다. 백엔드에서 `WebClient`로 POST해도 결과로 받는 302 리다이렉트 화면을 사용자 브라우저에 띄울 수 없다. 프론트가 직접 form을 만들어 submit하는 방식이 정석.

## 코드

```javascript
const openPostWindow = (url, data) => {
  const form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', url);
  form.setAttribute('target', '_blank');

  for (const key in data) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', key);
    input.setAttribute('value', data[key]);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
```

## 왜 이렇게?

- `window.open(url + '?' + queryString)`은 GET이라 길이 제한·민감 정보 노출 문제
- `fetch`는 응답을 JS가 받아 화면 전환에 쓸 수 없음 — 외부 시스템이 HTML 화면을 돌려주는 경우 무용
- form submit + `target="_blank"`은 브라우저가 직접 새 탭으로 네비게이션을 받아 화면 전환

## 디버깅 팁

새 탭의 첫 POST 요청을 보고 싶다면 Chrome을 `--auto-open-devtools-for-tabs`로 실행. 자세한 건 [Chrome 새 탭에서 자동으로 개발자도구 열기](/posts/etc/2026-03-31-chrome-auto-open-devtools/) 참고.
