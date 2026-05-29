---
title       : "Chrome 새 탭에서 자동으로 개발자도구 열기 + form POST 디버깅"
description : "target=_blank 새 탭의 네트워크 요청을 디버깅하기 위해 --auto-open-devtools-for-tabs로 Chrome을 띄우는 방법"
date        : 2026-03-31 10:00:00 +0900
updated     : 2026-03-31 10:00:00 +0900
categories  : [dev, tools]
tags        : [chrome, devtools, form-post, target-blank]
pin         : false
hidden      : false
---

`target="_blank"`로 열린 새 탭은 개발자도구가 닫혀있어 네트워크 요청을 볼 수 없다.

## 해결: CLI 옵션으로 Chrome 실행

Chrome 버전에 따라 `chrome://flags` 플래그가 없을 수 있다. 확실한 방법은 CLI 옵션:

```bash
# macOS — 기존 Chrome 종료 후 실행
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --auto-open-devtools-for-tabs
```

모든 새 탭에서 개발자도구가 자동으로 열린다. 디버깅 끝나면 일반 방식으로 Chrome 재실행.

## 프론트에서 form POST로 외부 시스템 연동하는 패턴

```javascript
const openPostWindow = (url, data) => {
  const form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', url);
  form.setAttribute('target', '_blank'); // 새 탭
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

백엔드에서 WebClient로 보내면 302 리다이렉트 화면을 사용자 브라우저에서 열 수 없다. 브라우저에서 화면을 열어야 하는 경우(SSO, 외부 신청 화면 등)는 프론트에서 직접 form POST해야 한다.
