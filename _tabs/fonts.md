---
layout: page
order: 96
hidden: true
title: 폰트
description: 개발 도구용 폰트의 견본·특징·공식 사이트 모음
permalink: /fonts/
navigation: devkit
---

<link rel="stylesheet" href="{{ '/assets/css/resource-previews.css' | relative_url }}">
<link rel="stylesheet" href="{{ site.data.resource_previews.font_stylesheet | escape }}">

<div id="resource-previews" class="resource-previews">
  <p class="rp-intro">글자 모양을 둘러보세요. 견본을 누르면 크게 보고, 특징과 공식 사이트를 확인할 수 있습니다.</p>
  <noscript><p>JavaScript 없이도 견본과 아래 자료의 공식 링크를 볼 수 있습니다. 큰 견본과 상세 보기를 열려면 JavaScript가 필요합니다.</p></noscript>

  <section id="rp-fonts" aria-label="폰트 견본">
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

  {% include resource-preview-detail.html %}
  <details class="rp-reference">
    <summary>선택 기준·공식 링크</summary>
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
    <p>폰트 5종을 골랐습니다. 견본을 누르면 큰 견본, 특징과 공식 링크를 볼 수 있습니다. 닫기 또는 Esc로 상세 보기를 닫으면 선택했던 카드로 돌아옵니다.</p>
    <p>선택은 이 샘플에만 적용됩니다. 블로그 설정은 바뀌지 않습니다. 실제로 사용할 앱에서도 글자 모양을 다시 확인하세요.</p>
    <p>폰트 견본은 같은 중립 배경에서 보통 굵기(normal 400), 큰 글자 44px와 본문 20px로 표시하며, 같은 용도의 폰트에는 같은 문장을 사용합니다. 상세 보기에서는 같은 견본을 더 큰 크기로 표시합니다. 웹폰트는 Google Fonts에서 불러옵니다. 코드용 3종은 한글을 지원하지 않아 한글에 Noto Sans KR을 사용합니다. 로딩에 실패하면 대체 글꼴로 보일 수 있습니다.</p>
  </details>
</div>
<script id="rp-data" type="application/json">{{ site.data.resource_previews | jsonify }}</script>
<script defer src="{{ '/assets/js/resource-previews.js' | relative_url }}"></script>
