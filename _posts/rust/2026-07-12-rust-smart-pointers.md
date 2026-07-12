---
title       : 소유권 심화 ⑧ 스마트 포인터 — Box·Rc·RefCell
description : "②의 소유권 규칙이 너무 빡빡할 때 푸는 도구. C++ 스마트 포인터와 거의 1:1이라 C++ 배경이 크게 유리한 구간이다. 힙 할당 Box(unique_ptr), 참조 카운트 공유 Rc/Arc(shared_ptr), 빌림 검사를 런타임으로 미루는 Rust 특유의 내부 가변성 RefCell/Cell, 순환 참조를 끊는 Weak까지. Rc<RefCell<T>> 관용구가 왜 나오는지 정리한다."
date        : 2026-07-12 11:40:00 +0900
updated     : 2026-07-12 11:40:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **⑧ 소유권 심화** 단계입니다. 앞 글: [⑦ 반복자·클로저](/posts/rust/2026-07-12-rust-iterator-closure/)

②의 "소유자는 하나, 가변 참조는 동시에 하나" 규칙이 때로 너무 빡빡합니다 — 값을 힙에 두거나, 여러 곳이 공유하거나, 공유하면서 수정해야 할 때. 그걸 푸는 도구가 스마트 포인터입니다. **C++ 스마트 포인터와 거의 1:1로 대응**해서 C++ 배경이 가장 크게 유리한 구간입니다.

## Box — 힙 할당 (unique_ptr)

`Box<T>`는 값을 **힙에 두는** 가장 단순한 스마트 포인터입니다. `unique_ptr`처럼 유일 소유이고, 스코프를 벗어나면 자동 해제됩니다.

```rust
let b = Box::new(5);        // 5를 힙에 두고 b가 유일 소유
println!("{}", *b);        // 역참조

// 재귀 타입에 필수 — 크기를 컴파일 타임에 정하려면 간접 참조가 필요
enum List { Cons(i32, Box<List>), Nil }
```

주 용도는 두 가지 — **큰 값을 스택 대신 힙에**, 그리고 **재귀 타입**(크기가 무한이 되지 않게 `Box`로 간접 참조). ⑥의 `Box<dyn Trait>`도 이것입니다.

## Rc / Arc — 참조 카운트 공유 (shared_ptr)

한 값을 **여러 소유자가 나눠 가져야** 할 때. `Rc<T>`는 참조 카운트를 세다 0이 되면 해제합니다 — `shared_ptr`와 같습니다.

```rust
use std::rc::Rc;
let a = Rc::new(vec![1, 2, 3]);
let b = Rc::clone(&a);        // 카운트 2 — 데이터 복제가 아니라 카운트만 증가
println!("{}", Rc::strong_count(&a));   // 2
```

`Rc::clone`은 데이터를 복제하지 않고 **카운트만 올립니다**(값싼 연산). `Rc`는 **단일 스레드용**이고, 스레드 간 공유는 원자적 카운트 버전인 **`Arc`**(Atomically Reference Counted)를 씁니다(⑨). "스레드를 넘으면 `Arc`"로 기억하면 됩니다.

## RefCell·Cell — 내부 가변성 (Rust 특유)

**C++에 직접 대응이 없는 Rust 고유 개념입니다.** ②의 빌림 규칙은 컴파일 타임에 검사되는데, `RefCell<T>`는 그 검사를 **런타임으로 미룹니다**. 겉은 불변(`&`)인데 속을 바꿀 수 있어 "내부 가변성(interior mutability)"이라 부릅니다.

```rust
use std::cell::RefCell;
let c = RefCell::new(5);
*c.borrow_mut() += 10;         // 불변처럼 들고 있지만 내부를 수정
println!("{}", c.borrow());    // 15
```

`borrow()`/`borrow_mut()`가 런타임에 빌림 규칙을 검사합니다 — 어기면 컴파일 에러가 아니라 **런타임 패닉**(`already borrowed`). 컴파일러가 정적으로 증명 못 하지만 개발자는 안전을 아는 경우에 씁니다. `Cell<T>`는 값을 통째로 넣고 빼는 더 가벼운 버전입니다.

## Rc\<RefCell\<T\>\> — 공유 + 가변 관용구

두 도구를 합치면 **여러 곳이 공유하면서 수정**할 수 있습니다. 그래프·트리처럼 노드를 여럿이 가리키며 고쳐야 하는 자료구조의 Rust 관용구입니다.

```rust
use std::rc::Rc;
use std::cell::RefCell;

let shared = Rc::new(RefCell::new(vec![1, 2, 3]));
let clone = Rc::clone(&shared);
clone.borrow_mut().push(4);              // 공유된 데이터를 수정
println!("{:?}", shared.borrow());       // [1, 2, 3, 4]
```

`Rc`(공유) + `RefCell`(가변)의 조합이라고 읽으면 됩니다. ②의 규칙을 정공법으로 못 풀 때의 탈출구입니다.

## Weak — 순환 참조 끊기 (weak_ptr)

`Rc`끼리 서로를 가리키면 카운트가 영원히 0이 안 되어 **메모리 누수**가 납니다(shared_ptr 순환과 동일). 한쪽을 소유하지 않는 `Weak<T>`로 두어 끊습니다 — 부모→자식은 `Rc`, 자식→부모는 `Weak`.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| `unique_ptr` | `Box` | 유일 소유, 힙 할당 |
| `shared_ptr` | `Rc` / `Arc` | 참조 카운트. `Arc`는 스레드 안전 |
| `weak_ptr` | `Weak` | 순환 참조 끊기 |
| `mutable` (const 안 가변) | `RefCell` / `Cell` | 내부 가변성. **런타임** 빌림 검사 |
| 수동 순환 관리 | `Rc<RefCell<T>>` + `Weak` | 관용구로 정형화 |

## 자주 막히는 지점

- **`RefCell` 런타임 패닉** — `borrow_mut()`가 겹치면(이미 빌린 상태에서 또 가변 빌림) 컴파일이 아니라 **실행 중에** 패닉. 컴파일러의 정적 보장을 런타임으로 미룬 대가입니다.
- **`Rc`를 스레드에 넘김** — `Rc`는 스레드 안전이 아니라 컴파일 에러. 스레드 간이면 `Arc`.
- **`Rc::clone` 오해** — 깊은 복사가 아니라 카운트 증가입니다. `a.clone()`보다 `Rc::clone(&a)`로 써서 "카운트만 는다"를 명시하는 게 관례.
- **스마트 포인터 남용** — 대부분의 코드는 그냥 소유·빌림으로 충분합니다. `Rc<RefCell<T>>`가 자주 나오면 설계를 다시 볼 신호일 때가 많습니다.

## 통과 기준

- `Box`·`Rc`/`Arc`·`RefCell`을 각각 언제 쓰는지 구분할 수 있다.
- 내부 가변성(`RefCell`)이 왜 필요하고, 그 대가(런타임 검사)가 무엇인지 설명할 수 있다.
- `Rc<RefCell<T>>` 관용구가 어떤 문제(공유+가변)를 푸는지 안다.

다음은 [⑨ thread·Send/Sync·async](/posts/rust/2026-07-12-rust-concurrency/)입니다. 소유권 시스템이 데이터 레이스를 컴파일 타임에 막는 "fearless concurrency"로 들어갑니다.

## Reference

- [The Rust Book Ch.15](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) — 스마트 포인터의 정본.
- [The Rust Book Ch.15.6 — Reference Cycles](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html) — `Weak`으로 순환 끊기.
- [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/) — 소유권·참조 카운트·GC의 위치.
