---
title       : macOS 생산성 런처 비교와 생산성 앱 큰 그림 (Spotlight · Alfred · Raycast)
description : "macOS 런처 Spotlight·Alfred·Raycast를 가격·확장성·클립보드·동기화·개발자 친화성으로 비교해 유형별로 추천하고, 런처 너머 창 관리(Rectangle)·입력 자동화(BTT)까지 생산성 앱 전반의 큰 그림을 한 장으로 정리한다."
date        : 2025-10-31 09:20:19 +0900
updated     : 2026-07-09 09:00:00 +0900
categories  : [macos, "런처·생산성"]
redirect_from:
  - /posts/etc/2025-10-31-productivity-launchers/
  - /posts/macos/2025-12-29-mac-productivity-tool/
  - /posts/etc/2025-12-29-mac-productivity-tool/
tags        : [macos, productivity, raycast]
pin         : false
hidden      : false
---

## 🌟 Spotlight (기본 내장)

**설명:**  
macOS에 기본 내장된 검색 런처로, 앱 실행・파일 검색・웹 검색 등을 지원합니다.

**장점:**
- 기본 제공, 추가 설치 불필요  
- 시스템 자원 소모 적음  
- 단순한 사용 경험  

**단점:**
- 확장성 부족 (커스터마이징 불가)  
- 자동화/워크플로 기능 없음  

---

## ⚡ Alfred

**설명:**  
Spotlight를 대체하는 고급 런처.  
앱 실행, 파일 검색, 클립보드 히스토리, 자동화 워크플로 등 강력한 기능을 제공합니다.

**설치:**  
```bash
brew install --cask alfred
````

**주요 특징:**

* **Powerpack (유료)**: 워크플로, 클립보드 매니저, 스니펫 등 고급 기능 활성화
* **로컬 중심 동작**: 프라이버시 보장
* **스크립트 기반 자동화**: AppleScript, Bash, Python 등과 연동 가능

**추천 사용자:**

* 맥 파워유저
* 복잡한 자동화를 선호하는 개발자
* 로컬 환경 제어를 선호하는 사용자

---

## 🚀 Raycast

**설명:**
모던한 UI와 풍부한 확장 기능을 제공하는 차세대 런처.
개발자 친화적인 확장 API를 갖추고 있으며 대부분의 기능이 무료입니다.

**설치:**

```bash
brew install --cask raycast
```

**주요 특징:**

* **무료로 워크플로 지원** (Extension Store 내장)
* GitHub, VSCode, Notion, ChatGPT 등과 쉽게 연동
* JavaScript/TypeScript 기반의 확장 개발 가능
* 클라우드 동기화, 설정 자동 백업

**추천 사용자:**

* 개발자 및 팀 단위 사용자
* 현대적 UI, 쉬운 설정 선호자
* 무료 + 자동화 둘 다 원하는 사람

---

## ⚔️ 간단 비교표

| 항목            | Spotlight | Alfred               | Raycast        |
| ------------- | --------- | -------------------- | -------------- |
| 💰 가격         | 무료        | 기본 무료 / Powerpack 유료 | 완전 무료          |
| ⚡ 속도          | 빠름        | 매우 빠름                | 매우 빠름          |
| 🧩 확장성        | 없음        | 워크플로 (스크립트 기반)       | 확장 스토어 (JS 기반) |
| 💾 클립보드 / 스니펫 | 없음        | Powerpack 필요         | 기본 제공          |
| ☁️ 동기화        | macOS 연동  | iCloud/Dropbox 수동    | 자동             |
| 👨‍💻 개발자 친화성 | 낮음        | 중간                   | 매우 높음          |
| 🎨 UI         | 기본적       | 클래식                  | 현대적            |

---

## 💡 결론

| 사용자 유형              | 추천            |
| ------------------- | ------------- |
| 기본 검색만 필요           | **Spotlight** |
| 세밀한 자동화, 스크립트 제어 선호 | **Alfred**    |
| 현대적 UI, 개발자 확장성, 무료 | **Raycast**   |

---

## 🧩 런처 너머 — 생산성 앱 큰 그림

런처는 "무엇을 빠르게 호출하나"의 한 축일 뿐이다. macOS 생산성 앱은 크게 **검색·호출(런처) · 창 관리 · 입력 자동화** 세 갈래로 나뉜다. 대표 앱을 한 장으로 보면 이렇다.

| 구분    | Raycast   | Rectangle | BetterTouchTool |
| ----- | --------- | --------- | --------------- |
| 주요 역할 | 런처·생산성 허브 | 창 관리      | 입력·자동화          |
| 난이도   | 낮음        | 매우 낮음     | 높음              |
| 무료 사용 | 가능        | 가능        | 체험만 가능          |
| 추천 대상 | 모든 사용자    | 창 정리 위주   | 파워 유저           |

- **Rectangle** — 창 분할 표준. 코드 없이 단축키·드래그 스냅으로 창을 배치한다. → [Rectangle.app 기본](/posts/macos/2026-07-03-rectangle-app-basics/)
- **BetterTouchTool(BTT)** — 트랙패드·마우스·키보드 제스처, 앱별 단축키, 매크로·워크플로 자동화까지 잡는 입력 커스터마이즈 도구. 45일 체험 후 유료. 파워 유저용.

**대표 조합**: `Raycast + Rectangle`(가장 대중적, 생산성+창 관리 균형) · `Raycast + BTT`(키보드·제스처 중심) · 셋 다(개발자 풀세트).

그 밖에 자주 쓰이는 유틸: [**AltTab**](/posts/macos/2026-07-03-alttab-window-switcher/)(Windows식 창 전환) · CleanShot X(스크린샷) · Keyboard Maestro(매크로) · Maccy(클립보드).

> Raycast에도 창 관리 기능이 있어 Rectangle 같은 도구와 역할이 겹칠 수 있다. "무엇을 끄고 어디까지만 맡기느냐"는 [Raycast를 검색 계층으로 한정하기](/posts/macos/2026-07-03-raycast-search-layer-role/)에서 정리한다.
{: .prompt-tip }

---

## 🔗 참고 링크

* [Alfred 공식 사이트](https://www.alfredapp.com/)
* [Raycast 공식 사이트](https://www.raycast.com/)
* [Homebrew 공식 사이트](https://brew.sh/)
