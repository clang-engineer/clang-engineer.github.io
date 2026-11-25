---
layout: page
icon: fas fa-satellite-dish
order: 3
title: Radar
navigation: radar
page_class: radar-page
---

현재 공부 중인 기술 바깥의 흐름을 놓치지 않기 위한 **기술 탐색 창구**다.

여기서는 깊게 공부하지 않는다. 새로운 기술·도구·개발 흐름을 발견하고, 반복해서 눈에 들어오는 대상이 생기면 그때 Roadmap이나 별도 글로 Zoom-in한다.

<style>
.tech-radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: .65rem;
  margin: .8rem 0 1.8rem;
}
.tech-radar-card {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  min-width: 0;
  padding: .85rem .95rem;
  border: 1px solid var(--main-border-color, #dce0e5);
  border-radius: .65rem;
  background: var(--card-bg, transparent);
  color: var(--text-color, inherit) !important;
  text-decoration: none !important;
  transition: border-color .15s ease, background-color .15s ease;
}
.tech-radar-card:hover, .tech-radar-card:focus-visible {
  border-color: var(--link-color, #448aff);
  background: var(--main-bg, transparent);
  text-decoration: none !important;
}
.tech-radar-card:focus-visible {
  outline: 2px solid var(--link-color, #448aff);
  outline-offset: 2px;
}
.tech-radar-card .tech-radar-logo {
  display: block;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: .4rem;
  background-color: #fff;
  background-size: 22px 22px;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid var(--main-border-color, #dce0e5);
}
.tech-radar-card > div { min-width: 0; }
.tech-radar-card strong {
  display: block;
  margin: 0 0 .15rem;
  font-size: .92rem;
  line-height: 1.4;
  font-weight: 650;
}
.tech-radar-card span:not(.tech-radar-logo) {
  display: block;
  color: var(--text-muted-color, #747b86);
  font-size: .78rem;
  line-height: 1.45;
}
@media (max-width: 600px) {
  .tech-radar-grid { grid-template-columns: 1fr; gap: .5rem; }
  .tech-radar-card { padding: .75rem .85rem; }
}
@media (prefers-reduced-motion: reduce) {
  .tech-radar-card { transition: none; }
}
</style>

## Global

<div class="tech-radar-grid">
  <a class="tech-radar-card" href="https://github.com/trending" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://github.com/favicon.ico');" aria-hidden="true"></span>
    <div><strong>GitHub Trending</strong><span>새로 뜨는 오픈소스 프로젝트와 개발 도구 발견</span></div>
  </a>

  <a class="tech-radar-card" href="https://news.ycombinator.com/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://news.ycombinator.com/favicon.ico');" aria-hidden="true"></span>
    <div><strong>Hacker News</strong><span>개발자 커뮤니티의 기술 뉴스와 논쟁 확인</span></div>
  </a>

  <a class="tech-radar-card" href="https://lobste.rs/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://lobste.rs/favicon.ico');" aria-hidden="true"></span>
    <div><strong>Lobsters</strong><span>시스템·언어·오픈소스 중심의 밀도 높은 기술 글</span></div>
  </a>
</div>

## Korea

<div class="tech-radar-grid">
  <a class="tech-radar-card" href="https://news.hada.io/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://news.hada.io/favicon.ico');" aria-hidden="true"></span>
    <div><strong>GeekNews</strong><span>개발·오픈소스·신기술을 빠르게 발견하는 국내 커뮤니티</span></div>
  </a>

  <a class="tech-radar-card" href="https://devday.kr/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://devday.kr/favicon.ico');" aria-hidden="true"></span>
    <div><strong>DevDay</strong><span>국내외 기술 블로그를 한곳에서 보는 통합 큐레이션</span></div>
  </a>

  <a class="tech-radar-card" href="https://d2.naver.com/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://d2.naver.com/favicon.ico');" aria-hidden="true"></span>
    <div><strong>NAVER D2</strong><span>Frontend·Backend·AI 등 실제 엔지니어링 사례</span></div>
  </a>

  <a class="tech-radar-card" href="https://toss.tech/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://toss.tech/favicon.ico');" aria-hidden="true"></span>
    <div><strong>Toss Tech</strong><span>제품·서버·데이터·AI를 아우르는 실무 기술 글</span></div>
  </a>

  <a class="tech-radar-card" href="https://techblog.woowahan.com/" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://techblog.woowahan.com/favicon.ico');" aria-hidden="true"></span>
    <div><strong>우아한형제들 기술블로그</strong><span>서비스 아키텍처와 운영 문제 해결 사례</span></div>
  </a>

  <a class="tech-radar-card" href="https://medium.com/daangn" target="_blank" rel="noopener noreferrer">
    <span class="tech-radar-logo" style="background-image: url('https://medium.com/favicon.ico');" aria-hidden="true"></span>
    <div><strong>당근 테크</strong><span>Engineering·AI/ML·Data 분야의 실제 적용 경험</span></div>
  </a>
</div>

> **사용 원칙:** 여기서 발견한 기술을 바로 공부 목록에 넣지 않는다. 여러 경로에서 반복해서 보이거나 현재 문제와 연결될 때만 다음 탐색 대상으로 올린다.
