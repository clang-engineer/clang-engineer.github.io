---
title       : "🪟 Windows 패키지 매니저 — Winget·Scoop·Chocolatey, 무엇을 어디에 쓸까"
description : "Windows의 대표 패키지 매니저 Winget·Scoop·Chocolatey는 비슷해 보이지만 지향점이 다르다. GUI 앱, CLI 개발 도구, 기업·시스템 관리라는 역할 기준으로 비교하고 개인 개발환경에서의 선택 기준을 정리한다."
date        : 2026-09-05 21:45:00 +0900
updated     : 2026-09-05 21:45:00 +0900
categories  : [Windows, "개발환경"]
tags        : [windows, winget, scoop, chocolatey, package-manager]
pin         : false
hidden      : false
---

Windows에서 개발환경을 구성하다 보면 `winget`, `Scoop`, `Chocolatey` 중 무엇을 써야 할지 애매해진다.

셋 다 **Windows에서 프로그램을 설치하고 업데이트하는 패키지 매니저**지만, 실제로는 지향점이 조금씩 다르다.

결론부터 말하면 개인 개발환경에서는 하나로 통일하기보다 **역할을 나누는 편이 자연스럽다.**

```text
일반 Windows 앱  → Winget
CLI / 개발 도구  → Scoop
기업·시스템 관리 → Chocolatey
```

## 한눈에 비교

| 구분 | Winget | Scoop | Chocolatey |
|---|---|---|---|
| 주 용도 | 일반 Windows 앱 | CLI / 개발 도구 | 시스템 전반 패키지 관리 |
| 관리자 권한 | 앱에 따라 다름 | 대부분 불필요 | 필요한 경우가 많음 |
| 설치 방식 | 기존 Windows 앱 설치 활용 | 사용자 디렉터리 중심 | MSI / EXE 등 다양한 방식 |
| 시스템 변경 | 일반적 | 비교적 적음 | 비교적 많음 |
| GUI 프로그램 | **강함** | 가능 | **강함** |
| CLI 도구 | 좋음 | **매우 편함** | 좋음 |
| 개인 개발환경 | 좋음 | **매우 좋음** | 다소 무거울 수 있음 |
| 기업/자동화 | 보통 | 제한적 | **강점** |

핵심은 단순한 기능 차이가 아니라 **어떤 범위의 소프트웨어를 관리하려는가**다.

---

## Winget — Windows의 기본 선택

`winget`은 Microsoft가 제공하는 Windows 패키지 매니저다.

Chrome이나 VS Code처럼 일반적으로 Windows에 설치하는 프로그램을 관리할 때 가장 자연스럽다.

```powershell
winget install Microsoft.VisualStudioCode
winget install Google.Chrome
winget install Docker.DockerDesktop
```

Windows와 기본적으로 잘 통합되어 있고 별도의 패키지 매니저를 추가로 설치하지 않아도 되는 경우가 많다.

따라서 다음과 같은 프로그램은 Winget으로 관리하기 좋다.

```text
Chrome
VS Code
Docker Desktop
PowerToys
Windows Terminal
```

**Windows 프로그램을 설치한다**는 관점에서는 가장 먼저 고려할 만한 선택이다.

---

## Scoop — 개발자의 CLI 도구함

Scoop은 조금 다르다.

일반 Windows 애플리케이션보다는 **CLI 도구와 개발환경 관리**에서 장점이 크다.

```powershell
scoop install git
scoop install neovim
scoop install ripgrep
scoop install fzf
scoop install jq
scoop install bat
```

Scoop의 중요한 특징은 프로그램을 기본적으로 사용자 디렉터리 아래에서 관리한다는 점이다.

이 때문에 많은 패키지를 관리자 권한 없이 설치할 수 있고, Registry나 Windows 시스템 영역에 대한 변경도 상대적으로 적다.

CLI 도구를 설치했다 지우거나 여러 도구를 실험하는 개발환경에서는 이 구조가 상당히 편하다.

예를 들어 다음과 같은 도구들이다.

```text
Neovim
ripgrep
fzf
jq
bat
lazygit
yazi
Node.js
Python
```

터미널 중심 개발환경이라면 Scoop의 장점이 특히 크게 느껴진다.

---

## Chocolatey — Windows 시스템 관리에 가까운 패키지 매니저

Chocolatey는 Scoop보다 전통적인 Windows 패키지 관리 방식에 가깝다.

```powershell
choco install vscode
choco install googlechrome
choco install 7zip
```

MSI나 EXE 등 기존 Windows 설치 생태계를 활용하면서 매우 다양한 프로그램을 관리한다.

따라서 Chocolatey의 강점은 단순히 "개발 도구 몇 개 설치"보다는 다음과 같은 상황에서 더 잘 드러난다.

- 머신 단위 소프트웨어 설치
- Windows 서버 및 업무용 PC 관리
- 설치 스크립트 자동화
- 조직에서 동일한 환경 반복 구성
- 기존 Chocolatey 기반 배포 체계

개인 개발 PC에서도 충분히 사용할 수 있지만, CLI 도구 위주의 환경에서는 Scoop 쪽이 더 단순하게 느껴질 수 있다.

---

## Scoop과 Chocolatey의 가장 큰 차이

둘의 차이를 단순화하면 **설치 범위와 철학**이다.

Chocolatey는 Windows 시스템의 소프트웨어를 관리한다는 성격이 강하다.

```text
Windows
 ├─ Registry
 ├─ Program Files
 ├─ MSI / EXE
 └─ Chocolatey
```

반면 Scoop은 가능한 한 자기 관리 영역 안에서 프로그램을 다룬다.

```text
User
 └─ scoop
     ├─ apps
     │   ├─ neovim
     │   ├─ ripgrep
     │   └─ fzf
     └─ shims
```

이 구조 덕분에 Scoop은 Unix 계열 패키지 매니저를 사용하다 Windows로 온 개발자에게도 비교적 익숙하게 느껴진다.

---

## 그럼 하나만 써야 할까?

굳이 그럴 필요가 없다.

패키지 매니저 자체를 통일하는 것보다 **관리 대상의 성격에 따라 역할을 나누는 편이 더 깔끔하다.**

내 기준에서는 다음 조합이 가장 이해하기 쉽다.

### Winget

일반 Windows 애플리케이션.

```text
Chrome
VS Code
Docker Desktop
PowerToys
Windows Terminal
```

### Scoop

CLI와 개발 도구.

```text
Neovim
ripgrep
fzf
jq
bat
lazygit
yazi
Node.js
Python
```

### Chocolatey

조직이나 시스템 차원의 패키지 관리가 필요한 경우.

```text
기업 Windows 환경
머신 단위 패키지 설치
설치·배포 자동화
기존 Chocolatey 스크립트가 존재하는 환경
```

---

## 왜 Winget + Scoop인가

개인 개발환경에서는 현재 **Winget + Scoop** 조합이 가장 자연스럽다고 본다.

Winget은 Windows 자체의 애플리케이션 관리자로 사용하고,

```text
Windows 앱 → Winget
```

Scoop은 터미널 안의 개발 도구 관리자로 사용한다.

```text
CLI 도구 → Scoop
```

각 도구가 잘하는 영역을 그대로 맡기는 셈이다.

특히 Neovim, `fzf`, `ripgrep`, `lazygit`, `yazi`처럼 작은 CLI 프로그램을 많이 조합하는 환경에서는 Scoop으로 개발 도구를 따로 관리하는 것이 편하다.

---

## 정리

세 패키지 매니저를 경쟁 제품으로만 볼 필요는 없다.

각각의 중심 영역이 다르다.

| 목적 | 선택 |
|---|---|
| 일반 Windows 프로그램 | **Winget** |
| CLI / 개발 도구 | **Scoop** |
| 기업·시스템 단위 관리 | **Chocolatey** |

개인 개발환경이라면 우선 다음 정도로 시작하면 충분하다.

```text
GUI / 일반 Windows 앱 → Winget
CLI / 개발 도구        → Scoop
```

Chocolatey는 필요가 생겼을 때 추가해도 늦지 않다.

결국 중요한 것은 **패키지 매니저를 하나로 통일하는 것보다, 어떤 계층의 도구를 누가 관리할지 경계를 명확히 하는 것**이다.
