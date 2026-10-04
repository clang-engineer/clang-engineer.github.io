---
layout: page
icon: fas fa-compass
order: 5
title: Browse
---

글을 **분류·키워드·시간순**으로 다시 찾는 보조 탐색 페이지다. 학습 순서를 따라가려면 [로드맵]({{ '/roadmap/' | relative_url }}), 새로운 기술 흐름을 발견하려면 [Radar]({{ '/radar/' | relative_url }})에서 시작한다.

## Categories

<div class="browse-cloud">
{% assign sorted_categories = site.categories | sort %}
{% for category in sorted_categories %}
  {% assign category_name = category[0] %}
  <a class="browse-chip" href="{{ '/categories/' | append: category_name | slugify | append: '/' | relative_url }}">
    <span>{{ category_name }}</span>
    <small>{{ category[1].size }}</small>
  </a>
{% endfor %}
</div>

## Tags

<div class="browse-cloud">
{% assign sorted_tags = site.tags | sort %}
{% for tag in sorted_tags %}
  {% assign tag_name = tag[0] %}
  <a class="browse-chip" href="{{ '/tags/' | append: tag_name | slugify | append: '/' | relative_url }}">
    <span>{{ tag_name }}</span>
    <small>{{ tag[1].size }}</small>
  </a>
{% endfor %}
</div>

## Archives

{% assign current_year = "" %}
{% for post in site.posts %}
  {% assign post_year = post.date | date: "%Y" %}
  {% if post_year != current_year %}
    {% unless forloop.first %}</ul>{% endunless %}
    <h3>{{ post_year }}</h3>
    <ul class="browse-archive">
    {% assign current_year = post_year %}
  {% endif %}
      <li>
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%m-%d" }}</time>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </li>
  {% if forloop.last %}</ul>{% endif %}
{% endfor %}

<style>
.browse-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 1rem 0 2rem;
}

.browse-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--main-border-color);
  border-radius: 999px;
  color: var(--text-color) !important;
  text-decoration: none !important;
  background: var(--card-bg);
}

.browse-chip:hover {
  box-shadow: var(--card-shadow);
}

.browse-chip small {
  color: var(--text-muted-color);
}

.browse-archive {
  list-style: none;
  padding-left: 0;
}

.browse-archive li {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  gap: 0.75rem;
  margin: 0.45rem 0;
}

.browse-archive time {
  color: var(--text-muted-color);
  font-variant-numeric: tabular-nums;
}
</style>
