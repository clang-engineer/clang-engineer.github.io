---
layout: page
order: 95
hidden: true
title: Resources
description: 개발 도구용 색상 테마와 폰트의 견본·특징·공식 사이트 모음
permalink: /resources/
navigation: devkit
---

<link rel="stylesheet" href="{{ '/assets/css/resource-previews.css' | relative_url }}">
<link rel="stylesheet" href="{{ site.data.resource_previews.font_stylesheet | escape }}">

<div id="resource-previews" class="resource-previews">
  <p class="rp-intro">색감과 글자 모양을 둘러보세요. 견본을 누르면 크게 보고, 특징과 공식 사이트를 확인할 수 있습니다.</p>
  <div class="rp-gallery-toolbar" data-rp-only hidden>
    <div class="rp-gallery-kinds" role="group" aria-label="견본 종류">
      <button type="button" data-rp-gallery="theme" aria-pressed="true">테마</button>
      <button type="button" data-rp-gallery="font" aria-pressed="false">폰트</button>
    </div>
  </div>
  <noscript><p>JavaScript 없이도 전체 견본과 아래 자료의 공식 링크를 볼 수 있습니다. 큰 견본과 상세 보기를 열려면 JavaScript가 필요합니다.</p></noscript>

  <section id="rp-themes" data-rp-gallery-kind="theme" aria-labelledby="rp-themes-title">
    <h2 id="rp-themes-title">테마</h2>
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
        <span class="rp-gallery-caption"><span class="rp-gallery-name">{{ theme.name | escape }}</span><span class="rp-gallery-meta">{% if theme.appearance == 'light' %}라이트{% else %}다크{% endif %}</span></span>
      </button>
      {% endfor %}
    </div>
  </section>
  <section id="rp-fonts" data-rp-gallery-kind="font" aria-labelledby="rp-fonts-title">
    <h2 id="rp-fonts-title">폰트</h2>
    <div class="rp-gallery-grid">
      {% for font in site.data.resource_previews.fonts %}
      <button type="button" class="rp-gallery-card rp-font-card" data-rp-choice-font="{{ font.id | escape }}" disabled aria-label="{{ font.name | escape }} 상세 보기" aria-haspopup="dialog" aria-controls="rp-detail">
        <span class="rp-font-paper" style="--rp-font: '{{ font.family | escape }}', 'Noto Sans KR', {% if font.group == 'code' %}monospace{% else %}sans-serif{% endif %};">
          <span class="rp-font-display">{% if font.group == 'code' %}Aa{% else %}가나다{% endif %}</span>
          <span class="rp-font-glyphs">{% if font.group == 'code' %}0O 1Il · 0123456789<br>!= !== =&gt; -&gt; {} [] (){% else %}한글 Aa · 0123456789<br>바람, 구름 그리고 햇살{% endif %}</span>
          <span class="rp-font-line">{% if font.group == 'code' %}const greeting = "Hello";<br>The quick brown fox.{% else %}코드 너머의 원리를 기록합니다.<br>새로운 생각을 여는 글자.{% endif %}</span>
        </span>
        <span class="rp-gallery-caption"><span class="rp-gallery-name">{{ font.name | escape }}</span><span class="rp-gallery-meta">{{ font.category | escape }}</span></span>
        <span class="rp-gallery-status" data-rp-font-status="{{ font.id | escape }}" data-rp-only hidden role="status"></span>
      </button>
      {% endfor %}
    </div>
  </section>

  <dialog id="rp-detail" aria-labelledby="rp-detail-title">
    <header class="rp-detail-header">
      <h2 id="rp-detail-title">견본 상세</h2>
      <form method="dialog"><button type="submit" autofocus aria-label="상세 보기 닫기">닫기</button></form>
    </header>
    <div id="rp-detail-preview"></div>
    <div class="rp-detail-info">
      <p id="rp-detail-meta"></p>
      <p id="rp-detail-description"></p>
      <p id="rp-detail-focus" hidden></p>
      <p id="rp-detail-font-status" class="rp-font-status" role="status" hidden></p>
      <div id="rp-detail-links" class="rp-detail-links"></div>
    </div>
  </dialog>

  <details class="rp-reference">
    <summary>선택 기준·공식 링크</summary>
    <h2>테마</h2>
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
    <h2>폰트</h2>
    {% assign font_groups = 'code,text' | split: ',' %}
    {% for group in font_groups %}
    <h3>{% if group == 'code' %}코드용: 비슷한 글자와 연산자 구분{% else %}한글 본문용: 획과 혼합 문장의 균형{% endif %}</h3>
    <p>{% if group == 'code' %}0과 O, 1과 I·l을 구분하고 연산자가 이어지는 모양이 편한지 보세요. 합자는 여러 문자를 한 모양으로 표시하는 기능입니다. 실제 도구에서는 합자 지원과 설정을 따로 확인하세요.{% else %}같은 문단에서 한글의 속공간, 획의 굵기 변화와 끝 모양, 영문·숫자의 어울림을 비교하세요. 코드용 폰트와의 우열이 아니라 본문의 인상을 고르는 기준입니다.{% endif %}</p>
    {% assign group_fonts = site.data.resource_previews.fonts | where: 'group', group %}
    {% for font in group_fonts %}
    <section aria-labelledby="rp-font-title-{{ font.id }}">
      <h4 id="rp-font-title-{{ font.id }}">{{ font.name | escape }}</h4>
      <p>{{ font.category | escape }} · {% if font.supports_korean %}한글 지원{% else %}한글 대체 글꼴{% endif %}{% if group == 'code' %} · {% if font.ligatures %}코드 합자 지원{% else %}코드 합자 없음{% endif %}{% endif %}</p>
      <p>{{ font.description | escape }}</p>
      <p><strong>볼 차이:</strong> {{ font.focus | escape }}</p>
      <p><a href="{{ font.url | escape }}">폰트 정보</a> · <a href="{{ font.source | escape }}">공식 특징 설명</a></p>
    </section>
    {% endfor %}
    {% endfor %}
    <p>특징은 각 폰트의 공식 자료를 기준으로 정리했습니다(2026-11 확인). 선택 기준은 견본에서 직접 확인할 부분이며, 가독성이나 생산성의 우열을 측정한 결과는 아닙니다.</p>
  </details>
  <details class="rp-about">
    <summary>미리보기 안내</summary>
    <p>대표 테마 6종과 폰트 5종을 골랐습니다. 견본을 누르면 큰 견본, 특징과 공식 링크를 볼 수 있습니다. 닫기 또는 Esc로 상세 보기를 닫으면 선택했던 카드로 돌아옵니다.</p>
    <p>실제 앱의 구문 강조와 다를 수 있으며, 선택은 이 샘플에만 적용됩니다. 블로그 설정은 바뀌지 않습니다. 실제로 사용할 앱에서도 배경·구문 강조와 글자 모양을 다시 확인하세요.</p>
    <p>테마 견본은 같은 고정폭 글꼴과 14px로 표시합니다. 폰트 견본은 같은 중립 배경에서 보통 굵기(normal 400), 큰 글자 44px와 본문 20px로 표시하며, 같은 용도의 폰트에는 같은 문장을 사용합니다. 상세 보기에서는 같은 견본을 더 큰 크기로 표시합니다. 웹폰트는 Google Fonts에서 불러옵니다. 코드용 3종은 한글을 지원하지 않아 한글에 Noto Sans KR을 사용합니다. 로딩에 실패하면 대체 글꼴로 보일 수 있습니다.</p>
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
