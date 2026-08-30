---
title       : "Obsidian Plugin Architecture 이해하기"
description : "Obsidian이 Plugin API와 Extension Point를 통해 제3자 기능을 네이티브 기능처럼 확장하는 구조를 정리한다."
date        : 2026-08-30 16:00:00 +0900
updated     : 2026-08-30 16:00:00 +0900
categories  : [tools, obsidian]
tags        : [obsidian, plugin, architecture, extension, typescript]
pin         : false
hidden      : false
---

Obsidian을 사용하다 보면 Community Plugin이 단순한 부가 기능을 넘어 본체 기능처럼 자연스럽게 동작하는 것이 인상적이다.

플러그인은 설정 화면을 추가하고, 사이드바에 새로운 View를 만들고, Command Palette에 명령을 등록하거나 파일과 에디터의 이벤트에 반응할 수도 있다.

이 글에서는 플러그인 하나를 만드는 방법만 보기보다, **Obsidian이 어떤 구조를 제공하기 때문에 이런 플러그인 생태계가 가능한지**를 중심으로 정리한다.

## 핵심 구조

Obsidian 내부 구현을 플러그인이 직접 수정하는 구조는 아니다.

Obsidian이 외부에 공개한 Plugin API를 통해 Core의 기능을 제한적으로 사용하고, 미리 준비된 Extension Point에 기능을 등록한다.

```text
Obsidian Core
      │
      ↓
  Plugin API
      │
      ├─ Vault
      ├─ Workspace
      ├─ Commands
      ├─ Events
      ├─ Views
      └─ Settings
      ↑
    Plugin
```

중요한 점은 Core 내부 구현과 Plugin 사이에 **안정적인 API 경계**가 존재한다는 것이다.

플러그인은 Obsidian 내부에서 탭이나 파일 탐색기가 정확히 어떻게 구현되어 있는지 몰라도 된다. 공개된 `Vault`, `Workspace`, `TFile` 등의 추상화와 API를 사용한다.

## Plugin Lifecycle

Obsidian 플러그인은 `Plugin` 클래스를 상속해서 작성한다.

```ts
import { Plugin } from "obsidian";

export default class ExamplePlugin extends Plugin {
  async onload() {
    console.log("plugin loaded");
  }

  onunload() {
    console.log("plugin unloaded");
  }
}
```

`onload()`에서는 보통 명령, 이벤트, View, 설정 화면 등을 등록한다.

```text
Obsidian
   ↓ load
Plugin.onload()
   ↓
register command / event / view / settings
```

플러그인이 Obsidian 전체 실행 흐름을 제어하는 것이 아니라, Obsidian이 플러그인을 로드하고 필요한 시점에 플러그인 코드를 호출한다. 이런 구조는 **Inversion of Control(IoC)**의 한 형태로 볼 수 있다.

## 네이티브 기능처럼 보이는 이유

Obsidian Plugin의 강점은 JavaScript를 실행할 수 있다는 것만이 아니다. Obsidian이 UI와 동작의 여러 지점을 공식적인 Extension Point로 제공한다.

```text
Obsidian
│
├─ Settings API    ← 설정 화면
├─ View API        ← Sidebar / Panel
├─ Command API     ← Command Palette
├─ Ribbon API      ← Ribbon icon
├─ Menu API        ← Context menu
├─ Editor API      ← Editor extension
└─ Event API       ← Core event
```

Plugin은 이 지점에 자신의 기능을 등록한다. 따라서 사용자가 보기에는 플러그인이 별도의 프로그램처럼 동작하지 않고 Obsidian 기능의 일부처럼 느껴진다.

### Command

플러그인은 `addCommand()`를 이용해 Command Palette에 자신의 명령을 추가할 수 있다.

```ts
this.addCommand({
  id: "hello",
  name: "Hello",
  callback: () => console.log("Hello"),
});
```

### Settings

`PluginSettingTab`을 이용하면 플러그인의 옵션을 Obsidian Settings 안에 추가할 수 있다. 별도의 설정 프로그램이 아니라 Obsidian의 네이티브 설정 화면 일부처럼 동작한다.

### View와 Sidebar

`registerView()` 등을 이용하면 새로운 View를 등록하고 Workspace의 leaf에 표시할 수 있다.

```text
Obsidian Workspace
       │
       ├─ Editor
       ├─ File Explorer
       ├─ Backlinks
       └─ Custom View ← Plugin
```

이 구조 때문에 Git 플러그인의 Source Control 화면이나 다른 플러그인의 대시보드가 Obsidian 사이드바 안에서 본체 기능처럼 표시될 수 있다.

### Events

플러그인은 Obsidian에서 발생하는 이벤트에도 반응할 수 있다.

```text
사용자가 파일을 연다
        ↓
   Obsidian Core
        ↓
     Event 발생
        ↓
 ┌──────┴──────┐
Plugin A    Plugin B
```

Plugin이 Core API를 호출하기도 하지만 Core 역시 이벤트를 통해 Plugin을 호출한다.

```text
Plugin ── API call ──→ Obsidian
Plugin ←── Event ───── Obsidian
```

## Obsidian Git에서 볼 수 있는 구조

Obsidian Git 같은 플러그인을 보면 이 구조를 실제로 확인할 수 있다. 상위 수준에서는 Obsidian Plugin API에 붙고, 플러그인 내부에서는 다시 Git 기능을 추상화한다.

```text
Obsidian Core
      ↓
Obsidian Plugin API
      ↓
  Obsidian Git
      ↓
   GitManager
    ↙      ↘
SimpleGit  IsomorphicGit
 Desktop      Mobile
```

즉 하나의 애플리케이션 안에서도 추상화 계층이 반복된다. Obsidian Git은 Obsidian의 Workspace, View, Command 같은 확장 지점을 이용하면서 Git 구현 자체는 별도의 계층으로 분리할 수 있다.

## Core를 수정하는 것과 무엇이 다른가

플러그인 시스템이 없다면 기능을 추가하기 위해 Core 자체를 수정해야 한다.

```text
Custom Feature
      ↓
Core 수정
      ↓
새로운 Application build
```

Plugin Architecture에서는 다르다.

```text
Core
 ↓
Extension API
 ↑
Plugin
```

Core가 확장 지점을 안정적으로 유지한다면 새로운 기능을 추가하기 위해 본체를 fork하거나 다시 빌드할 필요가 없다. 이것은 **Open/Closed Principle**과도 연결된다.

> Core의 수정은 최소화하면서 새로운 기능의 확장은 허용한다.

## Neovim과 비슷한 점

Neovim 역시 Core의 기능을 API와 이벤트로 외부에 노출하고 Plugin이 이를 조합한다.

```text
Neovim
  ↓
Lua API / autocmd / commands
  ↓
Plugin
```

두 시스템 모두 내부 구현을 직접 수정하기보다 공개된 Extension API를 통해 기능을 확장한다는 공통점이 있다.

Neovim은 비교적 낮은 수준의 primitive를 폭넓게 공개해 사용자가 에디터의 동작 자체를 크게 재구성할 수 있고, Obsidian은 Vault, Workspace, Editor 같은 자신의 애플리케이션 도메인을 중심으로 확장 지점을 제공한다.

## Chrome Extension과 비교

Chrome Extension 역시 같은 원리를 더 강한 보안 경계와 함께 사용한다.

```text
Chrome Core
     ↓
Extension API
     ↓
Permission / Sandbox
     ↓
Extension
```

Chrome에서는 Extension이 필요한 권한을 manifest에 선언하고 허용된 API와 웹사이트 범위 안에서 동작한다. 반면 Obsidian이나 Neovim Plugin은 일반적으로 훨씬 높은 자유도를 가진다.

따라서 **Extension API의 경계와 Security Boundary는 서로 다른 설계 문제**라는 점도 중요하다.

## Plugin Ecosystem을 만드는 요소

플러그인을 실행할 수 있다는 것만으로 생태계가 만들어지는 것은 아니다.

```text
Stable Core
    ↓
Extension API
    ↓
Composable primitives
    ↓
Commands / Events / Hooks / Views
    ↓
Plugin lifecycle
    ↓
Developer tooling & documentation
    ↓
Registry / Search / Install / Update
    ↓
Compatibility & Security
    ↓
Plugin Ecosystem
```

특히 Core가 어떤 기능을 Extension API로 공개할 것인지가 중요하다. 너무 적게 공개하면 Plugin이 할 수 있는 일이 제한되고, 내부 구현을 지나치게 공개하면 Core를 변경하기 어려워진다.

따라서 좋은 Plugin API는 **내부 구현은 숨기면서도 새로운 기능을 조합할 수 있을 정도의 primitive를 안정적으로 제공하는 것**이 중요하다.

## 정리

Obsidian의 Community Plugin 생태계는 단순히 JavaScript Plugin을 실행할 수 있기 때문에 만들어진 것이 아니다.

핵심은 Obsidian이 자신의 기능과 UI를 Plugin이 사용할 수 있는 **Extension API와 Extension Point로 설계했다는 것**이다.

```text
Stable Core
    ↓
Plugin API
    ↓
Extension Point
    ↓
Third-party Plugin
    ↓
새로운 기능
```

플러그인이 Core를 직접 수정하지 않고도 설정 화면, 사이드바, 명령, 이벤트, 에디터 기능을 자연스럽게 확장할 수 있기 때문에 제3자 개발자가 Obsidian 자체를 하나의 플랫폼처럼 활용할 수 있다.

결국 Plugin Architecture에서 중요한 질문은 단순히 "어떻게 Plugin을 로드할 것인가"가 아니다.

**"Core의 어떤 능력을 안정적인 API로 공개해야 제3자가 우리가 예상하지 못한 기능까지 만들 수 있는가"**가 더 중요한 설계 문제다.
