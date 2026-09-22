---
layout: page
icon: fas fa-sitemap
order: 3
title: Command Map
---

<link rel="stylesheet" href="{{ '/cmdtreemap/app.css' | relative_url }}">

<p>CLI 도구가 어떤 문제를 해결하며 서로 어떤 대안·보완 관계에 있는지 탐색한다.</p>

<div id="cmdtreemap-root"></div>

<script>window.CMDTREEMAP_BASE = "{{ '/cmdtreemap/' | relative_url }}";</script>
<script type="module" src="{{ '/cmdtreemap/app.js' | relative_url }}"></script>
