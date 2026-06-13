---
title       : "fork 없이 복사로 시작한 Jekyll Chirpy 블로그 upstream 동기화"
description : "테마를 fork하지 않고 starter 복사 방식으로 운영해온 블로그에 upstream theme의 누적 패치를 안전하게 머지하는 절차"
date        : 2026-06-12 20:30:00 +0900
updated     : 2026-06-12 20:30:00 +0900
categories  : [opensource, jekyll]
tags        : [jekyll, chirpy, git, merge, oss]
pin         : false
hidden      : false
---

> 같은 패턴은 jekyll 외 정적 사이트 템플릿(Hugo, Astro starter 등)을 fork 없이 복사해 쓰는 모든 프로젝트에 적용된다.

## 배경

Chirpy 테마를 starter 레포 fork 대신 **파일 복사**로 시작한 프로젝트가 있다. 이력(잔디·커밋 그래프)을 내 계정에 깔끔하게 남기려는 목적이었다. 그런데 시간이 지나며 부작용이 생긴다.

- upstream에 누적된 버그 픽스가 자동으로 흘러들어오지 않음
- 내 `package.json`은 v7.4.1, upstream은 v7.5.0+ — 마이너 1단계 뒤처짐
- 오타·식별자 리네임·breaking change(MathJax 3→4 등)가 한 번에 몰림

이 글은 이 상태에서 **충돌을 줄이며 upstream 차이를 따라잡는 절차**다.

## 1. 갭 측정

먼저 얼마나 뒤처졌는지 본다. upstream을 remote로 추가만 하면 된다(fetch만 하지 origin을 안 건드림).

```bash
git remote add upstream https://github.com/cotes2020/jekyll-theme-chirpy.git
git fetch upstream --tags
```

차이 측정:

```bash
git log --oneline HEAD..upstream/master | wc -l   # upstream에만 있는 커밋 수
git log --oneline upstream/master..HEAD | wc -l   # 내 레포에만 있는 커밋 수
```

내 경우 27 vs 11929였다. 11929는 거의 다 내 블로그 글이라 무의미하고, **27개만 따라잡으면 된다**.

## 2. 위험 파일 식별

테마 파일이 양쪽에서 동시에 바뀐 경우 머지 충돌이 생긴다. 양쪽에서 변경된 파일의 교집합을 미리 본다.

```bash
git diff --name-only HEAD..upstream/master | sort > /tmp/upstream_changed.txt
git diff --name-only upstream/master..HEAD -- _includes _layouts _sass _javascript > /tmp/local_changed.txt
comm -12 /tmp/upstream_changed.txt /tmp/local_changed.txt
```

교집합이 30개여도 막상 머지하면 대부분 auto-merge로 흡수된다. 진짜 충돌은 **같은 라인을 양쪽이 건드린 경우**만 남는다.

## 3. 안전망 — 백업 브랜치 + sync 브랜치

main을 직접 건드리지 않는다. 두 단계 안전망을 깐다.

```bash
git branch backup/pre-upstream-sync-$(git rev-parse --short HEAD) HEAD
git checkout -b sync/upstream-v7.5.0
```

뭔가 잘못돼도 `backup/...` 브랜치로 돌아가면 끝이다.

## 4. 머지 — `--no-commit`으로 멈춤

자동 커밋을 막아서, 결과를 한 번 검수한 뒤 커밋한다.

```bash
git merge upstream/master --no-ff --no-commit
```

내 경우 충돌 6건이 떴다.

```text
UU README.md
UU _config.yml
UU _sass/pages/_archives.scss
DU _posts/2019-08-08-text-and-typography.md
DU _posts/2019-08-08-write-a-new-post.md
DU _posts/2019-08-09-getting-started.md
```

각 충돌 코드는 의미가 있다:

- **UU**: 양쪽이 같은 라인을 수정 → 수동 머지
- **DU**: 내 쪽이 삭제, upstream이 수정 → 의도적 삭제면 `git rm`로 확정
- **AU/UA**: 한쪽이 추가, 다른 쪽이 수정 → 케이스 바이 케이스

## 5. 충돌 해결 패턴

### 5-1. 완전히 내 파일 — `--ours` 한 방

`README.md`처럼 upstream 버전을 안 보고 내 것만 유지할 파일.

```bash
git checkout --ours README.md
git add README.md
```

### 5-2. 같은 라인을 양쪽이 건드린 경우 — 의미 분석

`_sass/pages/_archives.scss`는 다음과 같았다.

```scss
<<<<<<< HEAD
  a,
  .event-title {
    /* post title in Archvies */
=======
  a {
    /* post title in Archives */
>>>>>>> upstream/master
```

분석:
- 내 변경: `.event-title` 셀렉터 추가 (실제 기능)
- upstream 변경: 주석 오타 `Archvies → Archives` 수정 (단순 코멘트)

→ **둘 다 살린다**. 내 셀렉터 유지 + upstream 오타 수정 채택.

```scss
  a,
  .event-title {
    /* post title in Archives */
```

이게 충돌 해결의 핵심이다. `--ours`/`--theirs` 자동 선택 말고 **각 변경의 의도를 분리해서 합친다**.

### 5-3. DU — 이미 의도적으로 지운 파일

Chirpy starter의 데모 글을 내가 일찍이 지웠는데 upstream이 그 글을 손봤다. 그대로 지운 상태 유지.

```bash
git rm _posts/2019-08-08-text-and-typography.md
git rm _posts/2019-08-08-write-a-new-post.md
git rm _posts/2019-08-09-getting-started.md
```

## 6. 마커 잔존물 검증

수동 편집 후엔 반드시 매크로로 잔존 마커를 훑는다.

```bash
grep -rn "<<<<<<<\|>>>>>>>" . \
  --include="*.md" --include="*.yml" --include="*.html" \
  --include="*.scss" --include="*.js" \
  2>/dev/null | grep -v "node_modules\|_site\|.jekyll-cache"
```

## 7. 식별자 리네임 안전성 확인

upstream에 `refactor: correct typos in comments and identifiers` 같은 커밋이 있으면 내 코드가 옛 이름을 호출하다 깨질 수 있다. Chirpy의 경우 `loadTooptip → loadTooltip`, `updateImages → swapImages` 등이 있었다.

```bash
grep -rn "loadTooptip\|updateImages" . \
  --include="*.js" --include="*.html" \
  2>/dev/null | grep -v "node_modules\|_site\|assets/js/dist"
```

호출처가 없으면 안전. 있으면 머지 후 손으로 바꿔야 한다.

## 8. 커밋 — husky/commitlint 함정 주의

`git commit -m "..."`을 했는데 커밋이 **둘로 갈라지는** 현상을 봤다. commitlint가 머지 메시지를 한 번 통과시키고, 나머지 변경(working tree에 있던 미커밋 작업)이 두 번째 커밋으로 따라붙는 흐름으로 보인다.

이 함정을 피하는 가장 안전한 길:

```bash
# 머지 시작 전에 작업 중인 WIP가 있는지 먼저 정리
git stash push -u -m "wip before merge"

# 머지
git merge upstream/master --no-ff --no-commit
# (충돌 해결...)
git commit -m "chore: sync upstream theme to vX.Y.Z"

# WIP 복원
git stash pop
```

만약 이미 갈라졌다면 `git reset --mixed <머지커밋>`으로 머지 커밋 뒤로 HEAD를 옮긴 뒤 `git commit --amend`로 메시지를 정정하면 된다. `--mixed`는 working tree를 건드리지 않으니 WIP는 그대로 남는다.

머지 커밋 부모가 2개인지 검증:

```bash
git log -1 --format="%H parents: %P"
# ae1e0c499... parents: a6f07db8... ceb2a414...
```

부모가 1개면 그냥 squash 커밋이고, upstream 이력이 풀로 연결되지 않아 다음 동기화 때 같은 27 커밋이 또 충돌로 보인다.

## 9. main 반영

검증 끝나면 main을 fast-forward.

```bash
git checkout main
git merge --ff-only sync/upstream-v7.5.0
```

`--ff-only`로 잠가두면 의도치 않은 추가 머지 커밋이 생기지 않는다. ff가 안 되면(즉 main에 sync 이후 커밋이 또 있다면) 멈춰서 다시 검토.

## 10. 빌드 검증

마지막으로 로컬에서 실제 빌드.

```bash
bundle exec jekyll serve
# 또는
bash tools/run.sh
```

런타임 에러는 보통 두 곳에서 난다:

- **upstream 의존성 변경**: Gemfile, package.json bump 후 `bundle install`/`npm install` 누락
- **submodule 미초기화**: `.gitmodules`엔 있는데 init 안 한 상태로 빌드 (예: `assets/lib` chirpy-static-assets) — CDN 쓰면 무관

## 정리 — 다음 동기화를 쉽게 만드는 습관

이번 경험을 반복 가능하게 만들려면:

1. **`upstream` remote는 영구 추가** — 다음번엔 `git fetch upstream`만 하면 됨
2. **머지 커밋으로 머지** — squash 머지 금지. 이력이 끊기면 다음 동기화에서 같은 충돌이 다시 보임
3. **내 커스터마이징은 그릇을 분리** — 가능한 한 upstream 파일에 직접 손대지 말고 `_sass/`/`_includes/` 같은 곳에 override 파일을 따로 둠. 충돌 면적이 줄어듦
4. **작업 시작 전 working tree 비우기** — WIP가 머지 흐름에 휘말리는 함정 차단

오래 묵힐수록 비용이 커진다. 분기에 한 번 정도 짧게 따라잡는 게 가장 싸다.
