---
layout: page
icon: fas fa-book-open
order: 2
title: 치트시트
---

<div class="cheatsheet-intro">
  <p><strong>치트시트 허브</strong>는 도구를 바로 GitHub로 보내기 전에, 블로그 안에서 짧은 설명과 빠른 예시를 먼저 확인하는 입구입니다.</p>
  <p>기본 사용 예는 <strong>tldr</strong>, 최신·정확한 기준은 <strong>공식 문서</strong>, 반복해서 쓰는 작업 흐름은 <strong>devkit 커스텀 치트시트</strong>에서 확인합니다.</p>
</div>

<ul class="cheatsheet-principles">
  <li>빠른 예시는 도구 메뉴를 펼칠 때 tldr에서 lazy load합니다.</li>
  <li>tldr 항목이 없거나 네트워크 오류가 나도 공식 문서와 devkit 링크는 그대로 제공합니다.</li>
  <li>모든 상세 명령을 블로그에 복제하지 않고, 블로그는 탐색과 맥락을 담당합니다.</li>
</ul>

{% for group in site.data.cheatsheets.groups %}
  <section class="cheatsheet-category" aria-labelledby="cheatsheet-category-{{ forloop.index }}">
    <h2 id="cheatsheet-category-{{ forloop.index }}">{{ group.title }}</h2>

    <div class="cheatsheet-accordion">
      {% for item in group.items %}
        <details id="{{ item.slug }}" class="cheatsheet-item">
          <summary>
            <span class="cheatsheet-item__name">{{ item.name }}</span>
            <span class="cheatsheet-item__desc">{{ item.desc }}</span>
          </summary>

          <div class="cheatsheet-item__body">
            <p>{{ item.desc }}</p>

            <section class="cheatsheet-resource" aria-labelledby="{{ item.slug }}-tldr">
              <h3 id="{{ item.slug }}-tldr">tldr 빠른 예시</h3>
              {% if item.tldr %}
                <div class="tldr-box" data-tldr="{{ item.tldr }}">
                  <p class="tldr-status">메뉴를 펼치면 tldr 예시를 불러옵니다.</p>
                </div>
              {% else %}
                <div class="tldr-box tldr-box--empty">
                  <p class="tldr-status">이 항목은 단일 명령어가 아니어서 tldr를 연결하지 않았습니다.</p>
                </div>
              {% endif %}
            </section>

            <section class="cheatsheet-resource" aria-labelledby="{{ item.slug }}-official">
              <h3 id="{{ item.slug }}-official">공식 문서</h3>
              {% if item.official and item.official.size > 0 %}
                <ul>
                  {% for link in item.official %}
                    <li><a href="{{ link.url }}">{{ link.label }}</a></li>
                  {% endfor %}
                </ul>
              {% else %}
                <p class="cheatsheet-muted">이 항목은 여러 도구를 묶는 가이드라 별도 공식 문서 링크를 두지 않았습니다.</p>
              {% endif %}
            </section>

            <section class="cheatsheet-resource" aria-labelledby="{{ item.slug }}-custom">
              <h3 id="{{ item.slug }}-custom">내 커스텀 치트시트</h3>
              {% if item.custom %}
                <ul>
                  <li><a href="{{ item.custom.url }}">{{ item.custom.label }}</a></li>
                </ul>
              {% else %}
                <p class="cheatsheet-muted">아직 devkit 커스텀 치트시트가 없습니다.</p>
              {% endif %}
            </section>
          </div>
        </details>
      {% endfor %}
    </div>
  </section>
{% endfor %}

<div class="cheatsheet-note">
  <strong>구조:</strong> 이 페이지는 하나의 허브로 유지합니다. 도구별 별도 상세 페이지를 만들지 않고, <code>/cheatsheet/#git</code>처럼 해시 링크로 필요한 메뉴를 바로 열 수 있습니다.
</div>

<script>
  (function () {
    const TLDR_BASE_URL = 'https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/';
    const loaded = new Set();

    function escapeHtml(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function tldrUrl(page) {
      return TLDR_BASE_URL + page + '.md';
    }

    function renderTldr(markdown) {
      const lines = markdown.split('\n');
      const title = lines.find((line) => line.startsWith('# '));
      const description = lines.find((line) => line.startsWith('> '));
      const examples = [];

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];

        if (line.startsWith('- ')) {
          const command = lines.slice(index + 1).find((nextLine) => nextLine.startsWith('`'));

          if (command) {
            examples.push({
              text: line.replace(/^- /, '').trim(),
              command: command.replace(/^`|`$/g, '').trim()
            });
          }
        }

        if (examples.length >= 4) {
          break;
        }
      }

      if (examples.length === 0) {
        return '<p class="tldr-status">tldr 예시를 찾지 못했습니다. 공식 문서를 확인하세요.</p>';
      }

      const heading = title ? '<p class="tldr-title">' + escapeHtml(title.replace(/^# /, '')) + '</p>' : '';
      const desc = description ? '<p class="tldr-desc">' + escapeHtml(description.replace(/^> /, '')) + '</p>' : '';
      const items = examples
        .map(
          (example) =>
            '<li><p>' +
            escapeHtml(example.text) +
            '</p><pre><code>' +
            escapeHtml(example.command) +
            '</code></pre></li>'
        )
        .join('');

      return heading + desc + '<ol class="tldr-examples">' + items + '</ol>';
    }

    async function loadTldr(box) {
      const page = box.dataset.tldr;

      if (!page || loaded.has(page)) {
        return;
      }

      loaded.add(page);
      box.innerHTML = '<p class="tldr-status">tldr 예시를 불러오는 중...</p>';

      try {
        const response = await fetch(tldrUrl(page), { cache: 'force-cache' });

        if (response.status === 404) {
          box.innerHTML = '<p class="tldr-status">tldr 항목이 없습니다. 공식 문서와 내 치트시트를 참고하세요.</p>';
          return;
        }

        if (!response.ok) {
          throw new Error('tldr request failed');
        }

        box.innerHTML = renderTldr(await response.text());
      } catch (error) {
        box.innerHTML = '<p class="tldr-status">tldr를 일시적으로 불러오지 못했습니다. 공식 문서와 내 치트시트를 참고하세요.</p>';
      }
    }

    function openFromHash() {
      if (!window.location.hash) {
        return;
      }

      const target = document.querySelector(window.location.hash);

      if (target && target.tagName.toLowerCase() === 'details') {
        target.open = true;
        target.scrollIntoView({ block: 'start' });
        const box = target.querySelector('[data-tldr]');

        if (box) {
          loadTldr(box);
        }
      }
    }

    document.querySelectorAll('.cheatsheet-item').forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) {
          return;
        }

        const box = item.querySelector('[data-tldr]');

        if (box) {
          loadTldr(box);
        }
      });
    });

    window.addEventListener('hashchange', openFromHash);
    openFromHash();
  })();
</script>
