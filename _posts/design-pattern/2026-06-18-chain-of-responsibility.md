---
title       : Chain of Responsibility Pattern
description : "요청을 처리할 수 있는 핸들러들을 사슬로 연결해 차례로 시도하는 패턴. HTTP 미들웨어, 결재 흐름의 본체."
date        : 2026-06-18 22:50:42 +0900
updated     : 2026-06-18 22:50:42 +0900
categories  : [design-pattern, "행위"]
tags        : [behavioral-pattern]
pin         : false
hidden      : false
---

## 한 줄 요약
요청 하나에 대해 여러 핸들러가 차례로 "내가 처리할까? 아니면 다음에게 넘길까?"를 결정하는 사슬을 만든다. HTTP 미들웨어가 가장 친숙한 예.

## 어떤 문제를 푸는가

웹 요청 하나에 인증·로깅·캐시·핸들러 적용 등 여러 단계를 거치고 싶다. 단순하게 짜면 거대한 if/else가 된다.

```cpp
void handleRequest(Request& req) {
    log("요청: " + req.url);

    if (!authenticate(req)) {
        respond(401);
        return;
    }

    auto cached = cache.get(req.url);
    if (cached) {
        respond(200, *cached);
        return;
    }

    auto result = process(req);
    cache.put(req.url, result);
    respond(200, result);
}
```

문제:
- 흐름의 모든 단계가 한 함수에 묶여 있다. 한 단계 끄고 싶어도 코드를 직접 손대야 한다.
- 단계 순서를 바꾸거나, 어떤 요청은 캐시를 건너뛰게 하려면 분기가 더 늘어난다.
- 새 단계(레이트 리밋, CORS) 추가 시 매번 이 함수를 수정한다 (OCP 위반).

## 패턴 적용 후

각 단계를 핸들러 객체로 분리하고, 사슬로 연결한다. 각 핸들러는 자기 일만 하고 다음 핸들러에 넘긴다.

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>

struct Request {
    std::string url;
    std::string token;
};

class Handler {
protected:
    std::unique_ptr<Handler> next;
public:
    void setNext(std::unique_ptr<Handler> h) { next = std::move(h); }
    virtual void handle(Request& req) {
        if (next) next->handle(req);
    }
    virtual ~Handler() = default;
};

class LogHandler : public Handler {
public:
    void handle(Request& req) override {
        std::cout << "[LOG] " << req.url << "\n";
        Handler::handle(req); // 다음으로
    }
};

class AuthHandler : public Handler {
public:
    void handle(Request& req) override {
        if (req.token.empty()) {
            std::cout << "[AUTH] 401 거부\n";
            return; // 체인 종료
        }
        std::cout << "[AUTH] 통과\n";
        Handler::handle(req);
    }
};

class CacheHandler : public Handler {
    std::unordered_map<std::string, std::string> store;
public:
    void handle(Request& req) override {
        auto it = store.find(req.url);
        if (it != store.end()) {
            std::cout << "[CACHE] HIT → " << it->second << "\n";
            return;
        }
        std::cout << "[CACHE] MISS\n";
        Handler::handle(req);
        store[req.url] = "응답_for_" + req.url;
    }
};

class BusinessHandler : public Handler {
public:
    void handle(Request& req) override {
        std::cout << "[BIZ] " << req.url << " 처리\n";
    }
};

int main() {
    // 체인 조립: Log → Auth → Cache → Biz
    auto log = std::make_unique<LogHandler>();
    auto auth = std::make_unique<AuthHandler>();
    auto cache = std::make_unique<CacheHandler>();
    auto biz = std::make_unique<BusinessHandler>();

    cache->setNext(std::move(biz));
    auth->setNext(std::move(cache));
    log->setNext(std::move(auth));

    Request r1{"/users", "valid-token"};
    log->handle(r1);

    std::cout << "---\n";
    Request r2{"/users", "valid-token"};
    log->handle(r2); // 두 번째 요청은 캐시 HIT
}
```

달라진 점:
- 각 단계가 독립 클래스. 다른 사슬에서 재사용 가능.
- 사슬 구성을 런타임에 바꿀 수 있다. 테스트에서는 인증 핸들러 빼고 조립한다든지.
- 새 단계 추가 = 새 클래스 + 체인에 끼우기. 기존 핸들러 무손상.

## 구조

```
Client ──▶ Handler1 ──next──▶ Handler2 ──next──▶ Handler3 ──next──▶ null
              │                  │                  │
              └ 처리하거나 ────  넘기거나 ────  종료
```

- **Handler**: `handle()` + 다음 핸들러 참조
- **ConcreteHandler**: 실제 처리·전달 결정
- **Client**: 체인의 첫 핸들러에 요청을 던짐

핵심: 클라이언트는 누가 처리할지 모른다. 체인이 알아서 흘러간다.

## 통과 변형 vs 가로채기 변형

| | 통과형 (모두 거침) | 가로채기형 (찾으면 종료) |
|---|---|---|
| 동작 | 모든 핸들러가 차례로 처리 | 처리 가능한 첫 핸들러에서 종료 |
| 예 | HTTP 미들웨어, 로깅 | 예외 핸들러, 결재 라인 |
| 다음 호출 | 항상 `next.handle()` | 처리 못 할 때만 `next.handle()` |

위 예제는 인증 실패 시 종료(가로채기) + 정상 흐름에서 모두 거침(통과)을 섞은 형태. 실무 체인은 보통 이런 혼합형.

## 실전 사례

- **Express.js / Koa 미들웨어**: `app.use(middleware)`로 사슬을 쌓는 가장 정통의 CoR.
- **Spring Security `FilterChain`**: 인증·인가·CORS·CSRF가 사슬로 연결.
- **Java Servlet `Filter`**: `doFilter`에서 `chain.doFilter()`로 다음 호출.
- **결재 라인**: 사원 → 팀장 → 부장 → 임원. 금액에 따라 처리할 결재자가 다름.
- **예외 핸들러 / catch 블록**: 거의 같은 발상이지만 언어 차원으로 흡수됨.
- **로그 레벨 필터**: DEBUG/INFO/WARN/ERROR 단계의 어펜더 체인.

## Decorator와의 차이

비슷한 "위임 체인" 구조라 헷갈리기 쉽다.

| | Chain of Responsibility | Decorator |
|---|---|---|
| 의도 | 누가 처리할지 결정 | 기능을 추가 |
| 처리 책임 | 보통 **하나의** 핸들러가 종착점 | 모두가 동등하게 기여 |
| 흐름 종료 | 가능 (처리한 시점에 끝) | 보통 끝까지 감 |
| 인터페이스 | 핸들러가 핸들러를 참조 | Component를 Component로 감쌈 |

> 결과를 누적 처리하면 Decorator 색이 짙고, 도중 종료가 자연스러우면 CoR.

## 안티패턴 / 주의

- **사슬 길이가 폭주**: 핸들러가 30개 넘는 체인은 디버깅 지옥. 의미 단위로 그룹핑.
- **순서 의존성**: Cache가 Auth 앞에 오면 인증 안 한 응답이 캐싱된다. 체인 순서는 명세화·테스트가 필요.
- **null 종착이 실수**: 마지막 핸들러가 처리 안 하고 끝나는 케이스가 의도된 건지 버그인지 명확히. 종착 핸들러를 항상 둬서 명시.
- **다음 핸들러를 까먹고 안 호출**: 통과형 핸들러에서 `next.handle()`을 빠뜨리면 뒤가 죽는다. 베이스 클래스에 default forwarding을 두는 게 안전.

{% include design-pattern-series.html current="chain-of-responsibility" %}
