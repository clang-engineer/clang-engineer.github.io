---
title       : macOS 생산성 런처(Spotlight vs Alfred vs Raycast)
description : 
date        : 2025-10-31 09:20:19 +0900
updated     : 2025-10-31 09:28:20 +0900
categories  : [dev, tip]
tags        : [macOS, productivity, launcher, alfred, raycast, spotlight]
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

## 🔗 참고 링크

* [Alfred 공식 사이트](https://www.alfredapp.com/)
* [Raycast 공식 사이트](https://www.raycast.com/)
* [Homebrew 공식 사이트](https://brew.sh/)
