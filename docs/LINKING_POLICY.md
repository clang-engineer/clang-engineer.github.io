# 링크 작성 공통 원칙

이 저장소의 Markdown은 하나의 환경에서만 소비되지 않는다.

```text
_posts/**
├─ Jekyll / Chirpy 웹사이트
├─ Obsidian
└─ GitHub

_archive/정보관리기술사/**
└─ Obsidian 중심 Knowledge Base
```

따라서 링크 문법은 **어디에서 읽는 문서인가**를 기준으로 선택한다.

## 1. 기본 원칙

### Blog (`_posts/**`)

Blog 문서는 Jekyll 웹사이트와 Obsidian에서 같은 Markdown 원본을 함께 사용한다.

따라서 내부 문서 링크는 **실제 `.md` 파일을 가리키는 Markdown 상대경로**를 기본으로 한다.

```markdown
[Go 동시성](../go/2026-07-12-go-concurrency-goroutine-channel.md)
```

이 형식을 쓰는 이유는 다음과 같다.

```text
Obsidian
→ 실제 Markdown 파일로 이동

GitHub
→ 저장소의 실제 Markdown 파일로 이동

Jekyll
→ jekyll-relative-links가 대상 문서의 permalink로 변환
```

Blog 내부 문서 링크에서 다음 형식은 원칙적으로 사용하지 않는다.

```markdown
[문서](/posts/go/2026-07-12-go-concurrency-goroutine-channel/)
```

`/posts/...`는 Jekyll의 배포 URL에는 적합하지만 Obsidian에서는 저장소 파일 링크로 동작하지 않는다.

Obsidian 전용 Wiki Link도 Blog에서는 사용하지 않는다.

```markdown
[[2026-07-12-go-concurrency-goroutine-channel]]
```

현재 Jekyll/Kramdown은 Wiki Link를 기본적으로 웹 링크로 변환하지 않는다.

## 2. Jekyll 설정

Blog에서 `.md` 상대경로를 사용하려면 Jekyll 빌드에서 `jekyll-relative-links`를 명시적으로 사용한다.

이 저장소는 GitHub Pages의 기본 빌드가 아니라 GitHub Actions에서 직접 다음 명령을 실행한다.

```text
bundle exec jekyll b
```

따라서 GitHub Pages 환경에 우연히 포함된 Plugin에 기대지 않고 `Gemfile`과 `_config.yml`에 의존성을 명시한다.

```ruby
gem "jekyll-relative-links"
```

```yaml
plugins:
  - jekyll-redirect-from
  - jekyll-relative-links

relative_links:
  enabled: true
  collections: true
```

`_posts`는 Jekyll의 Posts collection이므로 `collections: true`를 사용한다.

## 3. 상대경로 작성 기준

링크 경로는 **현재 Markdown 파일의 실제 위치**에서 대상 Markdown 파일까지 계산한다.

같은 디렉터리라면:

```markdown
[다음 글](2026-07-12-next-topic.md)
```

상위 디렉터리의 다른 영역이라면:

```markdown
[Go 동시성](../go/2026-07-12-go-concurrency-goroutine-channel.md)
```

경로에는 Jekyll permalink가 아니라 실제 저장소 파일명을 쓴다.

```text
좋음
../rust/2026-07-12-rust-concurrency.md

피함
/posts/rust/2026-07-12-rust-concurrency/
```

## 4. Anchor 링크

같은 문서 내부 Heading으로 이동할 때는 일반 Markdown Anchor를 사용한다.

```markdown
[동시성으로 이동](#동시성)
```

다른 Markdown 문서의 Heading을 가리켜야 한다면 파일 상대경로 뒤에 Anchor를 붙인다.

```markdown
[동시성 단계](../go/2026-07-12-go-roadmap.md#동시성)
```

Heading Anchor는 렌더러에 따라 생성 규칙 차이가 있을 수 있으므로, 문서 전체를 가리키는 링크로 충분하면 특정 Heading Anchor에 과도하게 의존하지 않는다.

## 5. 외부 링크

외부 웹사이트는 일반적인 절대 URL을 사용한다.

```markdown
[The Rust Book](https://doc.rust-lang.org/book/)
```

GitHub의 다른 Repository나 외부 Project도 절대 URL을 사용한다.

```markdown
[devkit](https://github.com/clang-engineer/devkit)
```

## 6. 기술사 Knowledge (`_archive/정보관리기술사/**`)

정보관리기술사 영역은 현재 **Obsidian 중심 Knowledge Base**다.

따라서 내부 Knowledge 탐색에서는 Wiki Link를 사용할 수 있다.

```markdown
[[02-동시성-자원공유|동시성과 자원 공유]]
```

또는 위치 관계가 중요하면 상대 경로를 포함한 Wiki Link를 사용한다.

```markdown
[[../../개념지도/02-운영체제/02-동시성-자원공유|동시성과 자원 공유]]
```

기술사 Knowledge는 현재 Jekyll의 공개 Collection이 아니므로 Blog와 같은 링크 제약을 억지로 적용하지 않는다.

즉 링크 정책은 다음처럼 구분한다.

```text
_posts/**
→ Markdown 상대경로
→ Jekyll + Obsidian + GitHub 공용

_archive/정보관리기술사/**
→ Obsidian Wiki Link 허용
→ Knowledge 탐색성 우선
```

## 7. Blog와 Knowledge 사이의 경계

Blog에서 기술사 Knowledge로 일반 개념이 이동하더라도 Blog 글이 Knowledge 파일의 로컬 경로를 직접 공개 링크처럼 사용하지 않는다.

현재 `_archive/정보관리기술사/**`는 Jekyll 공개 대상이 아니기 때문이다.

Blog에서 이미 공개된 URL을 유지해야 하는 경우에는 다음 중 하나를 선택한다.

1. 기존 Blog URL을 `hidden` Bridge Page로 유지한다.
2. Blog 글 안에서 필요한 최소 설명을 자체적으로 완결한다.
3. 기술사 Knowledge가 향후 별도 웹 Knowledge Base로 공개되면 그 공개 URL로 연결한다.

**웹에서 열리지 않는 `_archive` 파일 경로를 공개 링크처럼 노출하지 않는다.**

## 8. 파일 이동과 링크 안정성

상대경로 링크의 가장 큰 단점은 파일 이동에 영향을 받는다는 점이다.

따라서 다음을 함께 지킨다.

```text
1. _posts의 디렉터리 구조를 이유 없이 자주 바꾸지 않는다.
2. 이미 연결된 파일명은 가능한 한 안정적으로 유지한다.
3. 파일을 이동하면 참조 링크를 함께 검색·수정한다.
4. Jekyll build + html-proofer로 웹 링크를 검증한다.
```

Obsidian에서 파일을 이동할 때 자동 링크 갱신 기능을 사용하더라도 Git 변경사항을 확인한다.

## 9. Redirect는 별도 문제다

Markdown 문서 간 링크와 이미 공개된 웹 URL의 호환성은 다른 문제다.

파일 구조나 permalink를 바꿔 기존 공개 URL을 보존해야 할 때는 `redirect_from`을 사용한다.

```yaml
redirect_from:
  - /old/path/
```

즉:

```text
Markdown 상대링크
→ 현재 문서 사이의 연결

redirect_from
→ 과거 공개 URL 호환성
```

두 역할을 섞지 않는다.

## 10. 새 문서 작성 시 체크

새 Blog 글을 작성하거나 기존 글을 수정할 때 다음을 확인한다.

```text
[ ] Blog 내부 문서 링크가 실제 .md 상대경로인가?
[ ] /posts/... Jekyll 전용 내부 링크를 새로 만들지 않았는가?
[ ] Blog에서 [[Wiki Link]]를 사용하지 않았는가?
[ ] 외부 사이트는 절대 URL인가?
[ ] Knowledge 내부 Wiki Link의 대상이 실제 존재하는가?
[ ] 파일 이동 시 참조 링크도 함께 수정했는가?
[ ] Jekyll build와 html-proofer가 통과하는가?
```

## 한 줄 원칙

> **Blog는 실제 Markdown 파일 관계를 Source of Truth로 삼아 상대경로로 연결하고, Jekyll이 이를 웹 permalink로 변환한다. 기술사 Knowledge는 Obsidian 탐색을 우선해 Wiki Link를 사용할 수 있다.**
