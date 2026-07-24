---
title       : 마지막 ⑦ 도구 — build·mod·fmt·vet
description : "Go는 도구가 언어에 내장돼 있어 CMake 같은 외부 빌드 시스템이 필요 없다. build·run·test 명령 하나씩, 스타일을 언어 표준으로 강제하는 gofmt(논쟁이 사라진다), go.mod 의존성 관리, 그리고 go vet·staticcheck 정적 분석까지. C++의 파편화된 도구 생태계와 비교하며 로드맵을 마무리한다."
date        : 2026-07-12 10:58:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **⑦ 마지막(도구)** 단계입니다. 앞 글: [⑥ 표준 라이브러리·관용구·testing](/posts/go/2026-07-12-go-stdlib-idiom-testing/)

Go는 도구가 **언어에 내장**되어 있습니다. C++이 CMake·Make·패키지 매니저·포매터를 따로 조합하던 것을, Go는 `go` 명령 하나로 통합합니다. 그래서 이 단계는 외울 게 적습니다.

## build / run / test

```bash
go run main.go        # 컴파일 후 바로 실행 (임시 바이너리)
go build ./...        # 실행 파일 생성
go test ./...         # 테스트 실행 (⑥의 _test.go를 찾아서)
go install            # 빌드 후 $GOBIN에 설치
```

`go build`는 실행 파일 하나를 만듭니다. **순수 Go 코드**는 흔히 별도 Go 런타임 설치 없이 배포 가능한 self-contained 바이너리가 됩니다. 하지만 cgo, 시스템 resolver, plugin, 외부 링커나 공유 라이브러리를 사용하면 동적 의존성이 생길 수 있습니다. 배포 전에는 Linux의 `ldd`, macOS의 `otool -L` 등으로 실제 링크 결과를 확인해야 합니다.

## gofmt — 스타일 논쟁이 사라진다

Go에서 코드 포맷은 **언어 표준으로 강제**됩니다.

```bash
gofmt -w .        # 현재 디렉터리 이하 전부 표준 포맷으로
go fmt ./...      # 위의 래퍼
```

들여쓰기 탭/스페이스, 중괄호 위치, 정렬 — **논쟁거리가 아예 없습니다.** 정답이 하나로 정해져 있고 도구가 강제합니다. C++에서 팀이 `.clang-format`을 합의하느라 쓰던 에너지가 Go엔 통째로 없습니다. 저장 시 자동 포맷을 에디터에 걸어 두면 신경 쓸 일이 사라집니다.

## go mod — 의존성 관리

①에서 `go mod init`으로 시작한 모듈의 의존성을 다룹니다.

```bash
go mod init example.com/myapp   # 모듈 시작 (go.mod 생성)
go get github.com/some/pkg      # 의존성 추가
go mod tidy                     # 안 쓰는 의존성 제거 + 빠진 것 추가
```

`go.mod`가 의존성과 버전을, `go.sum`이 무결성 해시를 기록합니다. 두 파일을 커밋하면 어디서 빌드하든 **같은 버전**이 재현됩니다. `go mod tidy`는 실제 import를 스캔해 `go.mod`를 코드와 일치시키는, 습관적으로 돌리는 명령입니다.

## go vet / staticcheck — 정적 분석

컴파일은 되지만 의심스러운 코드를 잡습니다.

```bash
go vet ./...      # 표준 내장 — Printf 포맷 불일치, 락 복사 등
```

`go vet`은 표준 내장이고, 더 촘촘한 검사가 필요하면 **staticcheck**(사실상의 커뮤니티 표준 린터)를 추가로 씁니다. ⑤의 `-race`가 런타임 탐지라면, 이쪽은 컴파일 타임 정적 분석입니다.

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| CMake / Make (외부) | `go build` | 빌드 시스템이 언어 내장 |
| 동적 링킹 / `.so` 배포 | 순수 Go는 흔히 self-contained | cgo·플랫폼 의존성은 별도 확인 |
| `.clang-format` 팀 합의 | `gofmt` (강제) | 스타일 논쟁 자체가 없음 |
| Conan / vcpkg | `go mod` | 의존성·버전 재현이 표준 |
| clang-tidy | `go vet` / staticcheck | 정적 분석도 표준·준표준 |

## 자주 막히는 지점

- **`GOPATH` 시절 지식** — 옛 자료는 `GOPATH`에 코드를 두라고 하지만, 지금은 **모듈 방식**이 표준입니다. 아무 디렉터리에서나 `go mod init`으로 시작하세요.
- **포맷을 손으로** — gofmt가 다 하는데 수동으로 맞추려는 것. 에디터 저장 시 자동 포맷을 걸면 끝.
- **`go get`으로 도구 설치** — 근래엔 도구 설치는 `go install pkg@version`으로 분리됐습니다.

## 통과 기준

- `go build`로 실행 파일을 만들고, `go mod tidy`로 의존성을 정리할 수 있다.
- gofmt가 왜 스타일 논쟁을 없애는지, 순수 Go build와 cgo build의 배포 차이를 설명할 수 있다.

---

여기까지가 **Go를 배우는 학습 줄기 ①~⑦**입니다. 로드맵을 한 바퀴 돌았으니, 이제 [부록 — 제네릭](/posts/go/2026-07-12-go-roadmap/#부록--제네릭-go-118)이나 실전 프로젝트로 넘어가면 됩니다. C++ 습관이 튀어나올 때(상속으로 풀거나 예외를 찾을 때)는 로드맵의 대응표로 돌아와 Go식 사고로 교정하세요.

## Reference

- [Go 공식 — Managing dependencies](https://go.dev/doc/modules/managing-dependencies) — 모듈·`go mod`의 정본.
- [Go Command 문서](https://go.dev/cmd/go/) — 모든 `go` 하위 명령.
- [staticcheck](https://staticcheck.dev/) — 준표준 린터.
