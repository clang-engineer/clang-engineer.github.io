---
title: Cheat Sheets
icon: fas fa-terminal
order: 5
---

> 명령어가 생각 안 날 때 **빠르게 찾아보는 레퍼런스 카드**입니다.

<div class="cheatsheet-intro">
  <p><strong>사용법:</strong> 아래 도구 카드를 클릭하면 해당 명령어 목록으로 이동합니다. 각 포스트는 표 형식으로 정리되어 있어 빠른 스캔이 가능합니다.</p>
  <p class="cheatsheet-tip">💡 브라우저 검색(<kbd>Ctrl+F</kbd> / <kbd>Cmd+F</kbd>)으로 명령어를 바로 찾을 수 있습니다.</p>
</div>

{% assign cheat_posts = site.categories.cheatsheet | sort: 'tool_name' %}

{% if cheat_posts and cheat_posts.size > 0 %}
<div class="cheatsheet-grid cheatsheet-grid--tools">
  {% for post in cheat_posts %}
  <a class="cheatsheet-card cheatsheet-card--tool" href="{{ post.url | relative_url }}">
    <div class="cheatsheet-tool-icon">
      {% if post.tool_icon %}
      <i class="{{ post.tool_icon }}"></i>
      {% else %}
      <i class="fas fa-book"></i>
      {% endif %}
    </div>
    <header>
      <h2>{{ post.tool_name | default: post.title }}</h2>
      <p class="cheatsheet-summary">{{ post.summary }}</p>
    </header>
    {% if post.quick_commands %}
    <ul class="cheatsheet-quick-preview">
      {% for cmd in post.quick_commands limit:3 %}
      <li><code>{{ cmd }}</code></li>
      {% endfor %}
    </ul>
    {% endif %}
  </a>
  {% endfor %}
</div>
{% else %}
<div class="cheatsheet-empty">
  아직 등록된 치트 시트가 없습니다. <code>_posts/cheatsheet/</code> 폴더에 포스트를 추가하고 <code>categories: [cheatsheet]</code> 속성을 지정해보세요.
</div>
{% endif %}

<div class="cheatsheet-note">
  💡 <strong>Tip:</strong> 각 포스트 내에서 <kbd>Ctrl+F</kbd> (또는 <kbd>Cmd+F</kbd>)로 원하는 명령어를 빠르게 검색할 수 있습니다.
</div>
