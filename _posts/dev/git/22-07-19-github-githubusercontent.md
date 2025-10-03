---
title       : Github 파일 다운로드 가이드
description : >-
date        : 2021-12-08 09:00:45 +0900
updated     : 2025-10-03 12:25:09 +0900
categories  : [dev, git]
tags        : [git, github, api, download]
pin         : false
hidden      : false
---

# GitHub 파일 다운로드 가이드

GitHub에서는 **GitHub REST API**를 제공하며, 이를 이용하면 GitHub에 올라와 있는 파일들을 원격 저장소처럼 접근할 수 있습니다.  

공식 문서 가이드: [Get repository content](https://docs.github.com/en/rest/repos/contents#get-repository-content)

---

## 1. REST API 예시

다음은 특정 파일 정보를 가져왔을 때의 JSON 예시입니다.

```json
{
  "type": "file",
  "encoding": "base64",
  "size": 5362,
  "name": "README.md",
  "path": "README.md",
  "content": "encoded content ...",
  "sha": "3d21ec53a331a6f037a91c368710b99387d012c1",
  "url": "https://api.github.com/repos/octokit/octokit.rb/contents/README.md",
  "git_url": "https://api.github.com/repos/octokit/octokit.rb/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1",
  "html_url": "https://github.com/octokit/octokit.rb/blob/master/README.md",
  "download_url": "https://raw.githubusercontent.com/octokit/octokit.rb/master/README.md",
  "_links": {
    "git": "https://api.github.com/repos/octokit/octokit.rb/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1",
    "self": "https://api.github.com/repos/octokit/octokit.rb/contents/README.md",
    "html": "https://github.com/octokit/octokit.rb/blob/master/README.md"
  }
}
````

> ⚡ `"download_url"` 필드
> `"https://raw.githubusercontent.com/octokit/octokit.rb/master/README.md"`
> 이 URL을 통해 해당 파일을 직접 다운로드할 수 있습니다.

---

## 2. 다운로드 URL 구조

```text
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}
```

* `{owner}` : GitHub 소유자 ID
* `{repo}` : Repository 이름
* `{branch}` : Branch 이름 (예: `master` 또는 `main`)
* `{file_path}` : 다운로드할 파일 경로

---

## 3. 파일 다운로드 예시

```sh
$ curl -O https://raw.githubusercontent.com/octokit/octokit.rb/master/README.md
```

* `curl -O` : 지정 URL 파일을 현재 디렉토리에 다운로드
* 다운로드 후, 파일 이름은 URL 마지막 경로 이름(`README.md`)으로 저장됨

---

### 🔹 참고

* GitHub REST API를 통해 파일 정보를 가져올 때 `download_url` 필드가 있으면, 별도의 인증 없이 바로 파일 다운로드 가능
* API 호출을 통해 여러 파일을 자동으로 가져오는 스크립트 작성 가능

```

