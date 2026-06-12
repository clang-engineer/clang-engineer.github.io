---
title       : "MUI 테마 색상 키워드 — primary/secondary/error/warning/info/success/grey의 의미"
description : "Material-UI의 테마 색상 키워드는 단순 색깔이 아니라 UI 요소의 역할을 의미한다"
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [javascript, "React·UI"]
tags        : [mui, material-ui, react, color, palette, frontend]
pin         : false
hidden      : false
---

MUI(Material-UI)의 테마 색상 키워드는 단순한 색깔이 아니라 **UI 요소의 역할**을 의미한다. 컴포넌트의 `color="primary"` 같은 prop은 "파란색을 칠해줘"가 아니라 "이건 앱의 주요 인터페이스 요소다"라는 선언.

| Key | 의도 |
|---|---|
| `primary` | 앱의 주요 인터페이스 요소. 가장 자주 등장하는 색 |
| `secondary` | 보조 인터페이스 요소. 강조·구별용 (선택) |
| `error` | 사용자에게 알려야 할 에러 상태 |
| `warning` | 위험하거나 중요한 메시지 |
| `info` | 중립적인 정보 전달 |
| `success` | 작업의 성공적 완료 |
| `grey` | 비활성·상호작용 불가 요소, 텍스트 힌트 |

테마를 커스터마이즈해서 `primary` 색상을 빨강으로 바꾸면, `<Button color="primary">`는 자동으로 빨강이 된다. 색상이 아닌 역할로 사고하면 디자인 시스템 일관성이 유지된다.

## 참고

- [MUI Palette](https://mui.com/material-ui/customization/palette/)
