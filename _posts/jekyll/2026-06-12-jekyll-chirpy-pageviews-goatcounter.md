---
title       : "Jekyll Chirpy 테마에 포스트 조회수 위젯 붙이기 — 왜 GoatCounter 외엔 선택지가 없나"
description : "Google Analytics를 깔아도 포스트 사이드바에 조회수가 안 뜨는 이유, 그리고 Chirpy가 pageviews 위젯을 GoatCounter만 공식 지원하는 구조적 배경"
date        : 2026-06-12 22:30:00 +0900
updated     : 2026-09-05 21:45:00 +0900
categories  : [jekyll, "Chirpy"]
tags        : [jekyll, chirpy, analytics, goatcounter, troubleshooting]
redirect_from:
  - /posts/etc/2026-06-12-jekyll-chirpy-pageviews-goatcounter/
pin         : false
hidden      : false
---

> 같은 패턴은 분석 수집과 표시 위젯을 분리해서 다루는 모든 정적 사이트 테마에 적용된다.

## 배경

Chirpy 테마로 블로그를 운영하면서 Google Analytics(GA4) ID를 `_config.yml`에 박아두면, 누가 어떤 글을 봤는지 GA 대시보드에서 확인할 수 있다. 그런데 **포스트 페이지 자체엔 조회수 숫자가 안 뜬다.** 사이드바 "Trending Tags" 위쪽 자리, 다른 Chirpy 블로그에선 종종 보이는 그 숫자가 내 블로그엔 없다.

처음엔 GA가 잘못 붙은 줄 알았다. 확인해보면 GA는 멀쩡히 동작 중이다. 문제는 **분석 수집과 표시 위젯이 서로 다른 설정**이라는 점이다.

## 1. Chirpy의 두 갈래 — `analytics` ≠ `pageviews`

`_config.yml`을 보면 비슷해 보이는 두 블록이 있다.

```yaml
analytics:
  google:
    id: "G-XXXXXXXXXX"
  goatcounter:
    id:
  umami:
    id:
  matomo:
    id:
  cloudflare:
    id:
  fathom:
    id:

pageviews:
  provider:  # now only supports 'goatcounter'
```

역할이 다르다.

- **`analytics`** — *수집*. 방문자 데이터를 외부 서비스에 보내는 스크립트를 페이지에 삽입한다. 결과는 그 서비스의 **외부 대시보드**에서 본다.
- **`pageviews`** — *표시*. 포스트 페이지 사이드바의 `#pageviews` 엘리먼트에 숫자를 채워넣는다.

GA만 설정하면 첫 번째는 동작하지만 두 번째는 빈칸. 그래서 사이드바에 숫자가 안 뜬다.

## 2. 왜 GoatCounter만 지원되나

Chirpy 레포의 위젯 구현을 보면 답이 나온다.

```bash
$ ls _includes/pageviews/
goatcounter.html
```

폴더에 파일이 하나뿐이다. 다른 provider용 템플릿이 아예 없다. `_config.yml`의 주석에도 "now only supports 'goatcounter'"라고 박혀있다.

`goatcounter.html` 내용은 단순하다.

{% raw %}
```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const pv = document.getElementById('pageviews');
    if (pv !== null) {
      const uri = location.pathname.replace(/\/$/, '');
      const url = `https://{{ site.analytics.goatcounter.id }}.goatcounter.com/counter/${encodeURIComponent(uri)}.json`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          pv.innerText = new Intl.NumberFormat().format(data.count.replace(/\D/g, ''));
        })
        .catch(() => { pv.innerText = '1'; });
    }
  });
</script>
```
{% endraw %}

핵심은 **클라이언트에서 직접 카운터 JSON을 가져올 수 있는 공개 엔드포인트**가 필요하다는 점이다. GoatCounter는 `/counter/{path}.json`을 인증 없이 노출한다. 반면 GA·Plausible·Umami는 페이지별 조회수를 가져오려면 API 키 + 서버 측 요청이 필요하다 — 정적 사이트의 브라우저에서 직접 부르기에 부적합하다.

그래서 "조회수를 글마다 띄운다"는 좁은 목표에 한해서는 **GoatCounter가 사실상 유일한 정공법**이다.

## 3. 도구 인기 현실 체크

GoatCounter가 좋다는 얘기를 하려는 게 아니다. 솔직히 비주류다.

| 도구 | 위치 | 비고 |
|---|---|---|
| Google Analytics | 사실상 표준 | 무료, 쿠키·개인정보 이슈 |
| Plausible | 프라이버시 분석 인기 1위 | 22k★, 유료($9/월~) or 셀프호스팅 |
| Umami | 프라이버시 분석 인기 2위 | 27k★, 셀프호스팅 무료 |
| Matomo | 엔터프라이즈 GA 대안 원조 | 셀프호스팅 위주 |
| Cloudflare Web Analytics | Cloudflare 사용 시 무료 | 페이지별 조회수 노출 API 없음 |
| GoatCounter | niche, 1인 운영 | 무료(비상업), Chirpy 위젯 호환 유일 |

요점은 **Chirpy 사용자가 위젯 때문에 어쩔 수 없이 GoatCounter를 쓰게 된다**는 구조다. 일반 웹 분석 시장의 인기와는 별개다.

## 4. 설정 (실제 절차)

GoatCounter 가입은 1분이면 끝난다.

1. <https://www.goatcounter.com/signup> 접속
2. **Code** 입력 — 이게 서브도메인이자 ID다 (예: `myblog` → `myblog.goatcounter.com`)
3. **Site domain** — 블로그 도메인 (예: `username.github.io`)
4. 이메일·비밀번호로 가입

그다음 `_config.yml` 두 줄만 채우면 끝이다.

```yaml
analytics:
  goatcounter:
    id: myblog       # 가입 시 정한 Code

pageviews:
  provider: goatcounter
```

커밋·푸시 후 GitHub Pages가 재배포되면 본인이 사이트를 한 번 열어보는 순간부터 카운트가 시작된다. 단, GoatCounter는 같은 방문자 24시간 내 중복은 기본적으로 제외하므로 새로고침 반복으로 숫자가 안 늘어난다고 당황할 필요 없다.

## 5. 트러블슈팅 — 조회수가 항상 `1`로 뜰 때

위젯을 붙였는데 모든 글이 `1`로만 보이고, 정작 GoatCounter 대시보드엔 방문 기록이 멀쩡히 쌓여 있다면 — **기록은 되는데 표시만 막힌** 상태다.

원인은 §2 위젯 코드의 마지막 줄에 있다.

```js
.catch(() => { pv.innerText = '1'; });
```

위젯은 `/counter/{path}.json`을 브라우저에서 직접 부르는데, 이 공개 엔드포인트가 막혀 있으면 fetch가 실패하고 `.catch`가 `1`을 박는다. 즉 **여기서 `1`은 "조회수 1"이 아니라 "못 불러왔다"는 fallback 값**이다.

GoatCounter는 이 공개 카운터를 **기본적으로 꺼둔다**(공개 노출은 소유자가 명시적으로 켜야 하는 보안 기본값). 꺼져 있으면 엔드포인트가 403을 돌려준다.

```
$ curl -s "https://<id>.goatcounter.com/counter//.json"
error 403: Need to enable the 'allow using the visitor counter' setting
```

**해결:**

1. GoatCounter 로그인 → **Settings → Site settings**
2. **"Allow using the visitor counter"** 체크 → Save
3. 확인:
   ```
   $ curl -s "https://<id>.goatcounter.com/counter//.json"
   {"count_unique":"17", "count":"17"}
   ```

JSON으로 숫자가 나오면 끝 — 사이트 글을 강력 새로고침하면 실제 조회수가 뜬다.

> **함정**: 가입 직후 **이메일이 미인증 상태면** 이 설정이 비활성이거나 켜도 안 먹을 수 있다. 인증 메일 링크부터 처리할 것. 그리고 이건 repo·배포와 무관한 GoatCounter 계정 설정이라 **재배포로는 절대 안 고쳐진다.**

## 6. GA를 빼야 할까?

뺄 필요 없다. **GoatCounter와 GA는 공존 가능**하고 역할이 다르다.

- GA — 유입 채널, 검색어(GSC 연계), 인구통계, 행동 흐름 등 풍부한 분석. 대시보드 중심.
- GoatCounter — 글마다 사이드바에 숫자 표시. 본인과 독자가 즉시 보이는 신호.

대신 GA가 마음에 안 들거나 EU 규제 등 이유로 빼고 싶으면 GoatCounter 하나로도 기본 분석은 충분하다 — 페이지뷰·리퍼러·국가별 통계까지 자체 대시보드에서 제공한다.

## 7. 곁다리 — Search Console은 별도 인증

조회수에 관심이 있으면 보통 "검색에서 어떻게 보이는지"도 궁금해진다. 이건 Google Search Console(GSC) 영역인데 GA와 **별개 인증**이 필요하다.

`_config.yml`에 보이는 항목:

```yaml
webmaster_verifications:
  google: # fill in your Google verification code
```

이건 GSC가 지원하는 5가지 인증 방법 중 **HTML 메타태그 방식**을 위한 슬롯이다. 채우면 `jekyll-seo-tag`가 모든 페이지에 다음 태그를 자동 삽입한다.

```html
<meta name="google-site-verification" content="입력한_값">
```

다른 인증 방법:

1. HTML 파일 업로드
2. **HTML 메타태그** ← 위 슬롯
3. **Google Analytics** — GA가 이미 박혀있으면 자동 인증
4. Google Tag Manager
5. DNS TXT 레코드

GA를 이미 깔아둔 상태에서 GSC 등록 시 "Google Analytics" 방법을 고르면 메타태그 슬롯은 비워둬도 된다. 단, 추후 GA를 빼면 인증까지 풀리는 위험이 있으니 **백업으로 메타태그도 같이 걸어두는 방어적 패턴**도 무난하다.

## 정리

- Chirpy에서 "포스트별 조회수 표시"는 분석 수집과 별개 개념이다 (`pageviews.provider` ≠ `analytics.*`)
- 위젯은 `_includes/pageviews/goatcounter.html` 하나만 존재 — **GoatCounter가 유일한 공식 선택지**
- 기술적 이유는 클라이언트에서 직접 부를 수 있는 공개 카운터 API의 유무
- 다른 도구로 위젯을 만들고 싶다면 직접 템플릿을 작성·유지보수해야 한다
- GA와는 공존 가능, 역할 분담이 다름
- GSC 인증은 또 별개 — 5가지 방법 중 골라 쓰면 되고, GA 인증 방법이 가장 무난
