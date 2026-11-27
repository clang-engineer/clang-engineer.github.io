---
layout: page
order: 95
hidden: true
title: 테마
description: 개발 도구용 색상 테마의 견본·특징·공식 사이트 모음
permalink: /resources/
navigation: devkit
---

<link rel="stylesheet" href="{{ '/assets/css/resource-previews.css' | relative_url }}">

<div id="resource-previews" class="resource-previews">
  <p class="rp-intro">색감을 둘러보세요. 견본을 누르면 크게 보고, 특징과 공식 사이트를 확인할 수 있습니다.</p>
  <noscript><p>JavaScript 없이도 견본과 아래 자료의 공식 링크를 볼 수 있습니다. 큰 견본과 상세 보기를 열려면 JavaScript가 필요합니다.</p></noscript>

  <section id="rp-themes" aria-label="테마 견본">
    <div class="rp-gallery-grid">
      {% for theme in site.data.resource_previews.themes %}
      <button type="button" class="rp-gallery-card rp-theme-card" data-rp-choice-theme="{{ theme.id | escape }}" disabled aria-label="{{ theme.name | escape }} 상세 보기" aria-haspopup="dialog" aria-controls="rp-detail">
        <span class="rp-gallery-editor" style="{% for color in theme.palette %}--rp-{{ color[0] }}: {{ color[1] }};{% endfor %}">
          <span class="rp-editor-header"><span class="rp-editor-dots" aria-hidden="true"><span></span><span></span><span></span></span><span>preview.js · 견본</span></span>
          <code class="rp-gallery-code"><span class="rp-token-comment">// Find your everyday colors.</span>
<span class="rp-token-keyword">const</span> message = <span class="rp-token-string">'Hello, world!'</span>;
<span class="rp-token-keyword">function</span> <span class="rp-token-function">preview</span>(size = <span class="rp-token-number">16</span>) {
  <span class="rp-token-keyword">return</span> { message, size };
}
<span class="rp-token-function">preview</span>(<span class="rp-token-number">16</span>);</code>
          <span class="rp-gallery-swatches" aria-label="배경·글자·대표 강조색">
            <span style="background: {{ theme.palette.background }}" title="배경 {{ theme.palette.background }}"></span>
            <span style="background: {{ theme.palette.foreground }}" title="글자 {{ theme.palette.foreground }}"></span>
            <span style="background: {{ theme.palette.red }}" title="빨강 {{ theme.palette.red }}"></span>
            <span style="background: {{ theme.palette.green }}" title="초록 {{ theme.palette.green }}"></span>
            <span style="background: {{ theme.palette.blue }}" title="파랑 {{ theme.palette.blue }}"></span>
          </span>
        </span>
        <span class="rp-gallery-caption"><span class="rp-gallery-identity">{% assign family = site.data.resource_previews.theme_families | where: 'id', theme.family | first %}{% if family.icon %}<img class="rp-theme-icon" src="{{ family.icon | escape }}" alt="" width="28" height="28" loading="lazy" referrerpolicy="no-referrer">{% endif %}<span class="rp-gallery-name">{{ theme.name | escape }}</span></span><span class="rp-gallery-meta">{% if theme.appearance == 'light' %}라이트{% else %}다크{% endif %}</span></span>
      </button>
      {% endfor %}
    </div>
  </section>

  {% include resource-preview-detail.html %}
  <details class="rp-reference">
    <summary>선택 기준·공식 링크</summary>
    <p>같은 코드와 글꼴로 색감을 비교합니다. 계열별 배경·강조색과 라이트·다크 변형을 살펴보세요.</p>
    {% for family in site.data.resource_previews.theme_families %}
    <section aria-labelledby="rp-family-{{ family.id }}">
      <h3 id="rp-family-{{ family.id }}">{{ family.name | escape }}</h3>
      <p>{{ family.description | escape }} <a href="{{ family.url | escape }}">공식 지원 도구</a></p>
      <ul>
        {% assign variants = site.data.resource_previews.themes | where: 'family', family.id %}
        {% for theme in variants %}
        <li>{{ theme.name | escape }} — {{ theme.variant | escape }} · {% if theme.appearance == 'light' %}라이트{% else %}다크{% endif %}: <a href="{{ theme.url | escape }}">공식 테마</a> · <a href="{{ theme.source | escape }}">팔레트 출처</a></li>
        {% endfor %}
      </ul>
    </section>
    {% endfor %}
  </details>
  <details class="rp-about">
    <summary>미리보기 안내</summary>
    <p>대표 테마 6종을 골랐습니다. 견본을 누르면 큰 견본, 특징과 공식 링크를 볼 수 있습니다. 닫기 또는 Esc로 상세 보기를 닫으면 선택했던 카드로 돌아옵니다.</p>
    <p>실제 앱의 구문 강조와 다를 수 있으며, 선택은 이 샘플에만 적용됩니다. 블로그 설정은 바뀌지 않습니다. 실제로 사용할 앱에서도 배경·구문 강조를 다시 확인하세요.</p>
    <p>테마 견본은 같은 고정폭 글꼴과 14px로 표시합니다. 상세 보기에서는 같은 견본을 더 큰 크기로 표시합니다.</p>
  </details>
  <details id="rp-more" class="rp-more">
    <summary>더 찾기·만들기</summary>
    <p>하나의 테마를 여러 도구에 적용하는 대신, 다양한 색상 조합을 둘러보거나 직접 고를 때 유용합니다.</p>
    <ul>
      <li><a href="https://gogh.website/">Gogh</a>: 여러 터미널용 컬러 테마를 탐색하고 적용할 수 있습니다.</li>
      <li><a href="https://themer.dev/">themer</a>: 색상 조합을 선택·조정해 에디터·터미널·다른 앱용 테마와 배경화면을 생성할 수 있습니다.</li>
    </ul>
    <p>지원 도구와 설치 방법은 바뀔 수 있으므로 적용 전 공식 페이지에서 확인합니다.</p>
  </details>
</div>
<script id="rp-data" type="application/json">{{ site.data.resource_previews | jsonify }}</script>
<script defer src="{{ '/assets/js/resource-previews.js' | relative_url }}"></script>
