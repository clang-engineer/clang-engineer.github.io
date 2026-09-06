---
title       : "Markdown 링크 문법 — 상대경로·절대경로·앵커와 Jekyll·Obsidian 호환"
description : "Markdown 링크의 기본 문법부터 상대경로·절대경로·문서 내부 앵커·이미지 링크·참조형 링크를 정리하고, 같은 Markdown을 GitHub·Obsidian·Jekyll에서 함께 사용할 때 어떤 링크 방식을 선택해야 하는지 설명한다."
date        : 2026-09-06 11:20:00 +0900
categories  : [markdown]
tags        : [markdown, link, jekyll, obsidian]
pin         : false
hidden      : false
---

Markdown 링크는 문법 자체는 단순하지만, **링크가 무엇을 기준으로 해석되는지**를 이해하지 못하면 GitHub에서는 열리고 Obsidian에서는 안 열리거나, 로컬에서는 열리는데 웹 배포 후 깨지는 일이 생긴다.

핵심은 두 가지다.

```text
무엇을 연결하는가
→ 웹 URL인가, 저장소 안의 파일인가

누가 Markdown을 읽는가
→ GitHub인가, Obsidian인가, Jekyll인가
```

이 두 질문을 먼저 구분하면 링크 문법 선택이 쉬워진다.

## 1. 가장 기본적인 링크 문법

Markdown의 일반 링크는 다음 형태다.

```markdown
[보여줄 글자](링크 대상)
```

예를 들어 외부 웹사이트를 연결하면:

```markdown
[GitHub](https://github.com/)
```

렌더링 결과에서는 `GitHub`이라는 글자에 링크가 걸린다.

링크 제목을 추가할 수도 있다.

```markdown
[GitHub](https://github.com/ "GitHub 홈페이지")
```

다만 일반적인 문서에서는 제목 속성까지 사용할 일은 많지 않다.

## 2. 외부 URL과 내부 파일 링크는 다르다

웹사이트 주소를 연결할 때는 URL을 그대로 쓰면 된다.

```markdown
[Jekyll](https://jekyllrb.com/)
```

하지만 같은 저장소 안의 다른 Markdown 파일을 연결할 때는 웹 배포 주소보다 **실제 파일 경로**를 사용할 수 있다.

```text
_posts/
├─ go/
│  ├─ 2026-07-12-go-roadmap.md
│  └─ 2026-07-12-go-concurrency-goroutine-channel.md
└─ rust/
   └─ 2026-07-12-rust-roadmap.md
```

`go-roadmap.md`에서 같은 디렉터리의 동시성 글을 연결한다면:

```markdown
[Go 동시성](2026-07-12-go-concurrency-goroutine-channel.md)
```

다른 디렉터리의 Rust 로드맵을 연결한다면:

```markdown
[Rust 로드맵](../rust/2026-07-12-rust-roadmap.md)
```

이것이 **상대경로(relative path)** 링크다.

## 3. 상대경로는 현재 문서의 위치를 기준으로 한다

상대경로에서 가장 중요한 것은 `현재 파일이 어디에 있는가`다.

```text
./
→ 현재 디렉터리

../
→ 부모 디렉터리

../../
→ 부모의 부모 디렉터리
```

예를 들어 현재 파일이:

```text
_posts/go/2026-07-12-go-roadmap.md
```

이고 대상 파일이:

```text
_posts/rust/2026-07-12-rust-roadmap.md
```

라면 먼저 `go`에서 `_posts`로 한 단계 올라간 뒤 `rust`로 들어간다.

```markdown
[Rust 로드맵](../rust/2026-07-12-rust-roadmap.md)
```

같은 디렉터리라면 `./`는 생략해도 된다.

```markdown
[동시성](./2026-07-12-go-concurrency-goroutine-channel.md)
```

```markdown
[동시성](2026-07-12-go-concurrency-goroutine-channel.md)
```

둘 다 같은 뜻이다.

## 4. 절대경로와 웹 루트 경로

다음과 같은 링크도 자주 보인다.

```markdown
[Go 로드맵](/posts/go/2026-07-12-go-roadmap/)
```

앞의 `/`는 현재 Markdown 파일의 위치가 아니라 **웹사이트의 루트**를 기준으로 한다.

```text
/posts/go/...
→ 배포된 웹사이트의 URL 구조
```

Jekyll 블로그에서는 편리하다. 하지만 이 경로는 저장소 안의 실제 Markdown 파일 경로가 아니다.

```text
웹 URL
/posts/go/2026-07-12-go-roadmap/

실제 소스
_posts/go/2026-07-12-go-roadmap.md
```

따라서 웹에서는 잘 열려도 Obsidian은 `/posts/...`를 Vault 안의 Markdown 파일로 찾지 못할 수 있다.

## 5. 웹과 Obsidian을 함께 쓴다면 상대경로가 유리하다

같은 Markdown 파일을 다음 세 곳에서 모두 읽는다고 하자.

```text
Markdown Source
├─ GitHub
├─ Obsidian
└─ Jekyll Blog
```

이 경우 소스 링크를 실제 파일 관계로 작성하면 GitHub와 Obsidian이 자연스럽게 이해한다.

```markdown
[Go 동시성](../go/2026-07-12-go-concurrency-goroutine-channel.md)
```

문제는 Jekyll이다. Jekyll의 최종 페이지 주소가 원본 `.md` 경로와 다를 수 있기 때문이다.

예를 들어 소스는:

```text
_posts/go/2026-07-12-go-roadmap.md
```

이지만 웹에서는:

```text
/posts/go/2026-07-12-go-roadmap/
```

처럼 렌더링할 수 있다.

이 차이를 처리하는 방법 중 하나가 `jekyll-relative-links`다.

```ruby
# Gemfile
gem "jekyll-relative-links"
```

```yaml
# _config.yml
plugins:
  - jekyll-relative-links

relative_links:
  enabled: true
  collections: true
```

이렇게 하면 Markdown 소스에서는 실제 `.md` 상대경로를 사용하고, Jekyll 빌드에서는 대상 문서의 최종 URL로 변환할 수 있다.

```text
Source
[Go 동시성](../go/2026-07-12-go-concurrency-goroutine-channel.md)

Obsidian / GitHub
→ 실제 Markdown 파일로 이동

Jekyll
→ 해당 Post의 permalink로 변환
```

즉 **링크의 Source of Truth를 웹 URL이 아니라 Markdown 파일 관계에 둘 수 있다.**

## 6. Obsidian Wiki Link와 Markdown 링크

Obsidian에서는 다음 문법도 사용할 수 있다.

```text
[[문서 이름]]
```

표시 이름을 바꾸려면:

```text
[[문서 이름|보여줄 이름]]
```

Obsidian 안에서는 편하고 파일 이동 추적도 강력하다. 하지만 이것은 일반 Markdown 링크 문법이 아니다.

기본 Jekyll/Kramdown은 다음을 자동으로 웹 링크로 바꾸지 않는다.

```text
[[Go 동시성]]
```

따라서 **Obsidian 전용 Knowledge Base**라면 Wiki Link가 편하지만, **Jekyll과 Obsidian이 같은 Markdown을 공유한다면 일반 Markdown 상대링크가 호환성이 높다.**

```text
Obsidian 전용 문서
→ [[Wiki Link]] 사용 가능

Jekyll + Obsidian 공용 문서
→ [제목](relative/path.md) 권장
```

## 7. 문서 내부 위치로 이동하는 앵커 링크

같은 문서의 특정 Heading으로 이동하려면 `#`을 사용한다.

```markdown
[상대경로 설명으로 이동](#3-상대경로는-현재-문서의-위치를-기준으로-한다)
```

다른 Markdown 파일의 Heading을 직접 가리킬 수도 있다.

```markdown
[동시성 섹션](../go/2026-07-12-go-roadmap.md#5단계--동시성)
```

다만 Heading에서 실제 Anchor ID를 만드는 규칙은 Markdown Renderer마다 약간 다를 수 있다.

특히 다음 요소는 주의한다.

```text
공백
한글
특수문자
중복 Heading
```

문서 간 링크의 안정성이 중요하다면 Heading을 지나치게 자주 바꾸지 않는 편이 좋다.

## 8. 참조형 링크

긴 URL이 본문을 방해할 때는 참조형 링크를 사용할 수 있다.

```markdown
[Jekyll 공식 사이트][jekyll]
[Obsidian 공식 사이트][obsidian]

[jekyll]: https://jekyllrb.com/
[obsidian]: https://obsidian.md/
```

본문에서 URL을 분리할 수 있다는 장점이 있다.

같은 링크가 여러 번 등장하는 긴 문서에서는 유용하지만, 한두 번만 쓰는 링크까지 모두 참조형으로 만들 필요는 없다.

## 9. URL에 공백이나 특수문자가 있다면

외부 URL에는 공백이 그대로 들어갈 수 없다. 일반적으로 URL Encoding이 필요하다.

```text
공백
→ %20
```

하지만 내부 Markdown 파일 링크는 Renderer가 공백을 처리하는 방식이 다를 수 있어, 파일명 자체를 단순하게 유지하는 편이 안전하다.

```text
권장
markdown-link-syntax.md

가능하면 피함
Markdown Link Syntax 최종 수정본.md
```

파일명 안정성은 링크 안정성과 직접 연결된다.

## 10. 이미지도 링크 문법의 변형이다

이미지 문법은 일반 링크 앞에 `!`를 붙인다.

```markdown
![대체 텍스트](../assets/example.png)
```

비교하면:

```markdown
[문서](target.md)
![이미지](image.png)
```

구조는 거의 같다.

이미지를 클릭했을 때 다른 페이지로 이동시키려면 링크 안에 이미지를 넣는다.

```markdown
[![대체 텍스트](image.png)](target.md)
```

## 11. 어떤 링크를 선택할까

```text
외부 사이트
→ https://... 절대 URL

같은 저장소의 Markdown
→ 상대경로 .md 링크

같은 문서의 Heading
→ #anchor

Obsidian 전용 Knowledge
→ [[Wiki Link]] 사용 가능

Jekyll + Obsidian 공용 Markdown
→ 상대경로 Markdown 링크
```

가장 중요한 것은 문법을 하나 외우는 것이 아니라 **링크가 어느 공간의 주소인지 구분하는 것**이다.

```text
웹 공간의 주소
→ URL

파일 시스템 / 저장소의 주소
→ Relative Path

문서 내부의 주소
→ Anchor

Obsidian Graph의 주소
→ Wiki Link
```

같은 글을 여러 도구에서 사용한다면 가장 특정 도구에 종속되지 않는 표현을 Source로 두고, 배포 계층에서 필요한 변환을 맡기는 편이 관리하기 쉽다.

## 정리

Markdown 기본 링크는 단순하다.

```markdown
[텍스트](대상)
```

하지만 실제 문서 시스템에서는 `대상`을 어떻게 쓰느냐가 더 중요하다.

```text
웹 전용 문서
→ 공개 URL을 직접 사용해도 됨

GitHub + Obsidian + Jekyll 공용 문서
→ 실제 .md 상대경로를 Source로 사용
→ Jekyll에서 permalink로 변환

Obsidian 전용 Knowledge
→ Wiki Link도 좋은 선택
```

결국 링크도 문서 구조의 일부다. **어디에서 읽힐 문서인지 먼저 정하고, 그 환경들이 공통으로 이해할 수 있는 주소 체계를 선택한다.**

## Reference

- [CommonMark — Links](https://spec.commonmark.org/)
- [Jekyll](https://jekyllrb.com/)
- [jekyll-relative-links](https://github.com/benbalter/jekyll-relative-links)
- [Obsidian — Internal links](https://help.obsidian.md/links)
