---
title       : "Go 프로그램 구조 — package·module과 C++ 헤더 비교"
description : "Go의 package와 module이 소스 파일·헤더·빌드 단위와 어떻게 다른지, import 경로와 대소문자 export가 어떤 역할을 하는지 C++과 비교해 정리한다."
date        : 2026-07-12 10:10:00 +0900
updated     : 2026-11-27 16:00:00 +0900
categories  : [go]
tags        : [go]
pin         : false
hidden      : false
---

> Go 문법과 기본 기능은 [A Tour of Go](https://go.dev/tour/)에서 연습하고, 이 글에서는 C++과 Go의 프로그램 구성 차이만 살펴본다. 전체 안내는 [Go 학습 지도](./2026-07-12-00-go-roadmap.md)를 참고한다.

## 파일보다 package를 먼저 본다

Go 코드는 디렉터리를 기준으로 package를 구성한다. 같은 디렉터리의 Go 파일은 보통 같은 package에 속하며, 서로의 선언을 파일 간에 바로 사용할 수 있다. C++처럼 선언용 헤더와 구현용 소스 파일을 짝지어 `#include` 하는 방식이 기본이 아니다.

```text
Go module
└── package (보통 한 디렉터리)
    ├── *.go
    └── import → 다른 package
```

package 이름은 해당 코드의 사용 단위이고, module은 여러 package를 묶어 버전과 의존성을 관리하는 단위다. module 루트의 `go.mod`에 module 경로와 의존성 정보가 기록된다.

```bash
go mod init example.com/myapp
```

C++의 include 경로와 링크 설정을 그대로 옮기는 대신, Go는 module 경로를 바탕으로 package를 찾아 빌드한다. 다만 module이 CMake와 완전히 같은 역할을 하는 것은 아니다. Go module은 주로 package 경로와 의존성 버전을 정의하고, 빌드·테스트는 `go` 명령이 맡는다.

## 대소문자가 공개 범위를 정한다

Go에는 `public`이나 `private` 키워드가 없다. 이름이 대문자로 시작하면 다른 package에서 사용할 수 있고, 소문자로 시작하면 선언된 package 내부에서만 쓸 수 있다.

```go
package geometry

func Area(r Rect) float64 { // export: 다른 package에서 호출 가능
    return r.Width * r.Height
}

func scale(f float64) { // unexported: 이 package 내부에서만 사용
}
```

C++의 접근 지정자처럼 타입의 각 필드와 메서드에 `public`/`private`를 붙이지 않는다. 이름 표기 자체가 package 경계의 공개 API를 결정한다.

## C++과 비교해 기억할 점

| C++에서 익숙한 구조 | Go의 구조 |
|---|---|
| 헤더와 구현 파일 | 같은 package 안의 여러 `.go` 파일 |
| `#include`와 include path | package import와 module 경로 |
| `public`·`private` 접근 지정자 | 이름 첫 글자의 대소문자 |
| CMake 타깃·외부 의존성 설정 | `go.mod`의 module·의존성과 `go` 명령 |

이 대응은 역할을 빠르게 떠올리기 위한 비교다. Go package, module, C++ 빌드 타깃은 경계와 동작이 서로 다르므로 같은 개념으로 취급하지 않는다.

## 다음에 볼 자료

- 문법, 변수, 함수, 제어문, 자료구조: [A Tour of Go](https://go.dev/tour/)
- module과 의존성 관리: [Managing dependencies](https://go.dev/doc/modules/managing-dependencies)
- build·test·format·분석 명령: [Go Tooling 참고 글](./2026-07-12-go-tooling.md)
