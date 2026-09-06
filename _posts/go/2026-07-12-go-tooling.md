---
title       : "Go Tooling — build·test·fmt·mod·vet을 언제 쓰나"
description : "Go 표준 배포판이 제공하는 go command와 gofmt를 build/test, formatting, module dependency, static analysis라는 역할로 나눠 정리한다. go build의 package/command 동작, go fmt와 gofmt 차이, go mod, go vet·staticcheck, cgo 배포 경계를 정확히 구분한다."
date        : 2026-07-12 10:58:00 +0900
updated     : 2026-09-06 14:05:00 +0900
categories  : [go]
tags        : [go, tooling, build, modules]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](./2026-07-12-go-roadmap.md)의 마지막 단계가 아니라 **처음부터 옆에 두고 사용하는 Cross-cutting Tool 문서**다.

Go는 언어 specification과 별개로 표준 배포판에 `go` command와 `gofmt`를 함께 제공한다. 일반적인 Go module은 별도 CMake project를 만들지 않고 이 표준 Toolchain만으로 build/test/dependency 작업을 처리할 수 있다.

다만 “Go 언어 자체에 Build System이 문법으로 내장됐다”거나 “외부 Build Tool은 절대 필요 없다”는 뜻은 아니다. Code generation, cgo, native dependency, packaging 같은 프로젝트에서는 Make·Task runner·CI script를 추가할 수도 있다.

## 역할 지도

```text
빠른 실행
→ go run

compile / build validation
→ go build

자동화된 검증
→ go test

canonical formatting
→ gofmt / go fmt

module dependency
→ go mod / go get

의심스러운 코드 패턴 점검
→ go vet
→ 필요하면 staticcheck 등 추가
```

## 1. `go run` — 임시 Build 후 실행

```bash
go run .
```

현재 main package를 build해 임시 executable로 실행한다. 학습·작은 Tool 확인에는 편하지만 배포 artifact를 만드는 명령으로 보지는 않는다.

특정 source file을 직접 넘길 수도 있다.

```bash
go run main.go
```

하지만 실제 module/package 구조를 확인하려면 `go run .`처럼 package 단위로 실행하는 편이 더 자연스럽다.

## 2. `go build` — Package Graph가 Compile되는지 확인

현재 package가 command(`package main`)라면 다음 명령은 executable을 현재 directory에 쓸 수 있다.

```bash
go build .
```

출력 이름을 명시하려면:

```bash
go build -o bin/myapp ./cmd/myapp
```

반면 다음 명령은 repository의 package graph 전체가 build 가능한지 CI에서 확인하는 용도로 자주 쓴다.

```bash
go build ./...
```

`./...`가 여러 package/command를 가리킬 때 이것을 **“실행 파일 하나를 생성하는 명령”이라고 이해하면 안 된다.** 여러 package를 compile/check하는 것이 핵심이고, 배포할 binary는 보통 target command를 명시해 `-o`로 만든다.

## 3. `go test` — Test도 Package 단위

```bash
go test ./...
```

`*_test.go`를 찾아 package별 test binary를 만들고 실행한다.

특정 package:

```bash
go test ./internal/parser
```

Race detector가 필요한 concurrent code에서는:

```bash
go test -race ./...
```

`-race`는 static analysis가 아니라 instrumented binary를 실행하면서 data race를 탐지하는 runtime 도구다.

## 4. `gofmt`와 `go fmt` — Canonical Formatter

Go 생태계는 `gofmt` 결과를 사실상의 canonical source format으로 사용한다. 이는 **compiler가 스타일을 거부한다는 뜻은 아니다.** 표준 Tool이 하나의 일관된 포맷을 제공하고 생태계가 이를 강하게 따르는 것이다.

### 파일을 직접 Format

```bash
gofmt -w main.go internal/parser.go
```

`gofmt`에 directory `.` 하나를 넘겨 recursive formatting을 기대하지 않는다. 여러 package를 따라가며 format하려면 `go fmt`의 package pattern이 편하다.

```bash
go fmt ./...
```

차이는 대략 다음처럼 잡으면 된다.

```text
gofmt
→ source file formatter 자체

go fmt
→ package를 찾고 그 source에 formatter를 적용하는 go command wrapper
```

Editor에서는 save 시 `gofmt`/`goimports` 계열을 자동 실행하게 두는 경우가 많다.

## 5. `go mod` — Module Graph 관리

Module 시작:

```bash
go mod init example.com/myapp
```

의존성 추가/버전 조정:

```bash
go get example.com/lib@latest
```

Source import와 `go.mod`/`go.sum`을 정리:

```bash
go mod tidy
```

```text
go.mod
→ module path
→ Go version/toolchain 관련 directive
→ direct/indirect module requirements

go.sum
→ download한 module content의 checksum 검증 정보
```

`go.sum`을 “lock file이라 정확히 한 dependency graph를 고정한다”고 단순화하지 않는다. Go module version selection과 checksum 기록은 일반적인 lockfile 모델과 동일하지 않다.

## 6. Tool 설치 — `go install package@version`

현재 project dependency를 바꾸는 것과 개발 Tool executable을 설치하는 것은 분리한다.

```bash
go install honnef.co/go/tools/cmd/staticcheck@latest
```

CI나 재현 가능한 bootstrap에서는 `@latest`보다 프로젝트가 정한 version을 명시하는 편이 좋다.

## 7. `go vet` — Compiler가 허용하지만 수상한 패턴

```bash
go vet ./...
```

`go vet`은 모든 bug를 찾는 general-purpose linter가 아니다. Go toolchain이 제공하는 analyzer 집합으로, printf-like call mismatch 등 특정 suspicious construct를 검사한다.

더 넓은 static analysis가 필요하면 project 정책에 따라 `staticcheck` 같은 외부 Tool을 추가할 수 있다.

```text
go compiler
→ type/syntax 등 compile 가능성

go vet
→ 특정 suspicious pattern

staticcheck 등
→ 더 넓은 analyzer/lint 정책
```

## 8. 순수 Go Binary와 cgo 경계

많은 pure-Go command는 target OS/architecture용 binary 하나로 배포하기 쉽다.

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app .
```

하지만 이를 “Go binary는 항상 완전 static”이라는 규칙으로 외우면 안 된다.

- cgo 사용 여부
- external linker
- system library
- platform resolver·plugin 사용
- build tags/options

등에 따라 runtime dependency가 달라질 수 있다.

배포 전에 실제 artifact를 확인한다.

```bash
file ./app
ldd ./app        # Linux, dynamic binary라면
```

macOS에서는 `otool -L` 등을 사용할 수 있다.

## 9. 일상 Workflow

```text
처음 module 생성
→ go mod init

코드 작성
→ go fmt ./...

빠른 검증
→ go test ./...
→ go vet ./...

전체 build 가능성
→ go build ./...

배포 binary
→ go build -o <output> <command-package>

의존성 변경 후
→ go mod tidy
```

Tool 명령을 번호 순서대로 한 번씩 배우고 끝내는 것이 아니라 **개발 Loop에 반복해서 배치**한다.

## C++ 경험과의 경계

| 문제 | C++에서 흔한 구성 | Go에서 흔한 기본 경로 |
|---|---|---|
| Build | CMake + Ninja/Make/MSBuild 등 | `go build` |
| Test | Framework/CTest 등 선택 | `go test` |
| Format | clang-format config | gofmt canonical format |
| Dependency | vcpkg/Conan/CMake FetchContent 등 | Go modules |
| Static analysis | compiler + clang-tidy 등 | compiler + `go vet`, 필요 시 외부 analyzer |

이 표는 “Go가 모든 외부 Tool을 없앤다”는 우열표가 아니라 **언어 배포판이 기본 Workflow를 얼마나 표준화했는지**를 비교하는 좌표다.

## 통과 기준

다음을 구분하면 된다.

- `go build .`와 `go build ./...`의 목적 차이
- `gofmt`와 `go fmt`의 역할 차이
- project dependency 변경과 Tool 설치의 차이
- `go vet`과 race detector의 차이
- pure Go와 cgo build의 배포 dependency 차이

Roadmap에서는 이 문서를 어느 마지막 단계에 놓지 않고 **필요한 순간마다 참조하는 Tool/Reference**로 사용한다.

## Reference

- [Go command](https://pkg.go.dev/cmd/go)
- [gofmt](https://pkg.go.dev/cmd/gofmt)
- [Managing dependencies](https://go.dev/doc/modules/managing-dependencies)
- [go vet](https://pkg.go.dev/cmd/vet)
