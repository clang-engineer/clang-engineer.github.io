---
layout: page
icon: fas fa-satellite-dish
order: 2
title: Radar
---

현재 공부 중인 기술 바깥의 흐름을 놓치지 않기 위한 **기술 탐색 창구**다.

여기서는 깊게 공부하지 않는다. 새로운 기술·도구·개발 흐름을 발견하고, 반복해서 눈에 들어오는 대상이 생기면 그때 Roadmap이나 별도 글로 Zoom-in한다.

<style>
.tech-radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0 2rem;
}

.tech-radar-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 96px;
  padding: 1rem;
  border: 1px solid var(--main-border-color);
  border-radius: 0.75rem;
  background: var(--card-bg);
  color: var(--text-color) !important;
  text-decoration: none !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tech-radar-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow);
}

.tech-radar-card img {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 0.5rem;
  object-fit: contain;
  background: #fff;
}

.tech-radar-card strong {
  display: block;
  margin-bottom: 0.2rem;
}

.tech-radar-card span {
  display: block;
  color: var(--text-muted-color);
  font-size: 0.88rem;
  line-height: 1.35;
}
</style>

## Global

<div class="tech-radar-grid">
  <a class="tech-radar-card" href="https://github.com/trending" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/favicon.ico" alt="" loading="lazy">
    <div><strong>GitHub Trending</strong><span>새로 뜨는 오픈소스 프로젝트와 개발 도구 발견</span></div>
  </a>

  <a class="tech-radar-card" href="https://news.ycombinator.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://news.ycombinator.com/favicon.ico" alt="" loading="lazy">
    <div><strong>Hacker News</strong><span>개발자 커뮤니티의 기술 뉴스와 논쟁 확인</span></div>
  </a>

  <a class="tech-radar-card" href="https://lobste.rs/" target="_blank" rel="noopener noreferrer">
    <img src="https://lobste.rs/favicon.ico" alt="" loading="lazy">
    <div><strong>Lobsters</strong><span>시스템·언어·오픈소스 중심의 밀도 높은 기술 글</span></div>
  </a>
</div>

## Korea

<div class="tech-radar-grid">
  <a class="tech-radar-card" href="https://news.hada.io/" target="_blank" rel="noopener noreferrer">
    <img src="https://news.hada.io/favicon.ico" alt="" loading="lazy">
    <div><strong>GeekNews</strong><span>개발·오픈소스·신기술을 빠르게 발견하는 국내 커뮤니티</span></div>
  </a>

  <a class="tech-radar-card" href="https://devday.kr/" target="_blank" rel="noopener noreferrer">
    <img src="https://devday.kr/favicon.ico" alt="" loading="lazy">
    <div><strong>DevDay</strong><span>국내외 기술 블로그를 한곳에서 보는 통합 큐레이션</span></div>
  </a>

  <a class="tech-radar-card" href="https://d2.naver.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://d2.naver.com/favicon.ico" alt="" loading="lazy">
    <div><strong>NAVER D2</strong><span>Frontend·Backend·AI 등 실제 엔지니어링 사례</span></div>
  </a>

  <a class="tech-radar-card" href="https://toss.tech/" target="_blank" rel="noopener noreferrer">
    <img src="https://toss.tech/favicon.ico" alt="" loading="lazy">
    <div><strong>Toss Tech</strong><span>제품·서버·데이터·AI를 아우르는 실무 기술 글</span></div>
  </a>

  <a class="tech-radar-card" href="https://techblog.woowahan.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://techblog.woowahan.com/favicon.ico" alt="" loading="lazy">
    <div><strong>우아한형제들 기술블로그</strong><span>서비스 아키텍처와 운영 문제 해결 사례</span></div>
  </a>

  <a class="tech-radar-card" href="https://medium.com/daangn" target="_blank" rel="noopener noreferrer">
    <img src="https://medium.com/favicon.ico" alt="" loading="lazy">
    <div><strong>당근 테크</strong><span>Engineering·AI/ML·Data 분야의 실제 적용 경험</span></div>
  </a>
</div>

> **사용 원칙:** 여기서 발견한 기술을 바로 공부 목록에 넣지 않는다. 여러 경로에서 반복해서 보이거나 현재 문제와 연결될 때만 다음 탐색 대상으로 올린다.
