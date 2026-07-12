---
title       : "심링크 dotfiles → chezmoi 이관 중 겪은 함정들"
description : "심링크/bootstrap dotfiles를 chezmoi로 옮길 때 만난 SSH·부트스트랩·run 스크립트·jenv 함정 모음."
date        : 2026-07-08 10:00:00 +0900
updated     : 2026-07-08 10:00:00 +0900
categories  : [shell]
tags        : [dotfiles, chezmoi, ssh, git, migration, bootstrap]
pin         : false
hidden      : false
---

심링크/bootstrap 방식 dotfiles를 chezmoi로 옮길 때 만난 비자명한 함정 모음.

## 1. 증상과 원인의 거리 — "checkout OK, pull만 실패"
로컬 동작(checkout)은 되는데 pull만 실패 = **로컬 OK, remote 통신만 실패** → 인증/네트워크 계층으로 범위 확정. remote host가 `github.com`이 아니라 `github.com-myuser`(ssh 별칭)면 `~/.ssh/config` 부재를 바로 의심.

```sh
git remote -v          # host가 별칭인지 확인
ssh -T git@github.com-myuser   # 별칭 인증 테스트 → "Could not resolve hostname" = config 부재
```

## 2. `~/.ssh`가 repo로 심링크된 함정
stow/bootstrap 유물 환경에선 `~/.ssh` 자체가 dotfiles repo 안으로 심링크돼 있을 수 있다. 그러면 "~/.ssh에 파일을 쓴다"가 실제론 **repo 안에 쓰는 것** (개인키가 repo에 물리 저장됨).

```sh
ls -ld ~/.ssh; readlink ~/.ssh   # 홈 경로 다루기 전 실파일 vs repo 심링크부터 확인
```
승격(심링크 → 실디렉토리)은 복사 말고 **atomic mv**로 키 보존:
```sh
rm ~/.ssh                        # 심링크만 제거 (-r 아님 → 실디렉토리면 에러로 안전정지)
mv /path/to/repo/ssh ~/.ssh      # 실디렉토리를 repo 밖으로 통째 이동
```

## 3. chezmoi 부트스트랩 닭-달걀
인증 config(ssh host별칭)를 **제공하는** private secrets repo를 **그 ssh 별칭으로 클론**하면 fresh 머신에서 데드락(설정이 있어야 클론, 클론해야 설정 생김). → secrets repo는 **HTTPS + token**으로 클론해 순환을 끊는다.

{% raw %}
```toml
# .chezmoiexternal.toml.tmpl — ssh 별칭 대신 token URL
url = "https://x-access-token:{{ env "GITHUB_TOKEN" }}@github.com/{{ env "SECRETS_REPO" }}.git"
```
{% endraw %}

## 4. git "이동됨" ≠ 디스크 "이동됨"
`git mv`/커밋으로 추적을 옮겨도, `~/.ssh` 심링크가 옛 폴더를 계속 물고 있으면 **디스크엔 파일이 남는다**. 마이그레이션 검증은 git 로그만이 아니라 **실제 심링크/파일 배치**까지.

## 5. chezmoi가 "활성화 안 됨"을 감지
파일을 chezmoi 소스로 옮겨놓고 `init/apply`를 안 하면, **옛 심링크가 깨진 채 방치**되고 새 설정은 배포 안 된 반쪽 상태가 된다.

```sh
chezmoi managed | wc -l     # 0 이면 아무것도 관리 안 함 = 미활성화
chezmoi source-path         # 비어있으면 소스 미연결
```
소스가 repo **하위 디렉토리**면 `.chezmoiroot`(내용=서브디렉명) + `~/.config/chezmoi/chezmoi.toml`의 `sourceDir`로 연결.

## 6. `run_before` 스크립트가 파일 배포를 막는다
chezmoi 실행 순서 = **before 스크립트 → 파일 → after 스크립트**. 무거운 설치(`brew bundle`, 특히 대형 cask)를 `run_*_before`에 두면 dotfile 배포가 그 뒤로 밀린다.
- 개선: 파일명 프리픽스만 `before`→`after`로(target 이름 불변이라 다른 참조 안 깨짐).
- 급할 땐 파일만 먼저: `chezmoi apply --exclude=scripts` (무거운 설치는 나중에).

## 7. 깨진 `~/.gitconfig` → git 신원 fallback garbage
`~/.gitconfig`가 깨진 심링크면 git이 전역 신원을 못 읽고 **`user@hostname`을 자동 생성**해 커밋 author에 박는다(예: `zero@zeros-Mac-mini.local`). 진짜 신원은 히스토리에서 복구:

```sh
git config --get user.email                    # 빈값 = 신원 없음
git log --format='%an <%ae>' | sort | uniq -c | sort -rn   # 최다 사용 신원 = 진짜 값
```
→ `~/.gitconfig.local`(include 대상)에 실제 name/email 채워 해결.

## 유용 명령 요약
```sh
chezmoi status               # A=추가 M=수정 R=스크립트실행 (apply 전 미리보기)
chezmoi --source <dir> diff  # 소스 미연결 상태에서도 read-only 미리보기
chezmoi apply --exclude=scripts   # 파일만, 스크립트/설치 제외
```

## 8. chezmoi는 원인이 아니라 "방아쇠"일 수 있다 — 잠복 파손을 드러냄
`./gradlew`가 `jenv: version '17' is not installed`로 죽었는데, 범인은 두 겹이었다. `jenv`(Java + env, rbenv/pyenv 계열 — 디렉토리별 `.java-version`으로 JDK 전환)가 이관 후 셸에서 활성화되면서 **이미 썩어 있던 심링크**를 하드 에러로 노출한 것.

- **잠복 파손(chezmoi 무관):** `jenv add`가 만든 심링크가 `Cellar/openjdk@17/17.0.17`처럼 **패치 버전이 박힌 경로**를 가리킴 → `brew upgrade`가 패치를 올리고 `brew cleanup`이 옛 폴더를 지우면 전부 dangling.
- **방아쇠(chezmoi):** pre-chezmoi `dot_zshrc`엔 `jenv init`이 없어 shim이 없었음 → 깨진 링크가 **무증상**. chezmoi가 `eval "$(jenv init -)"` + export 플러그인을 넣자 `java`가 shim으로 가로채짐 → `.java-version`을 못 맞추면 명령 실행 전에 하드 에러.

**교훈:** "이관 후 갑자기 안 됨"에서 방아쇠(chezmoi)만 보고 롤백하면 링크는 여전히 썩은 채다. `readlink` + `[ -e ]`로 dangling부터 확인.
```sh
which java   # shim이면 → jenv이 가로채는 중 (무증상/유증상 갈림)
for d in ~/.jenv/versions/*; do [ -e "$d" ] || echo "DANGLING: $d -> $(readlink "$d")"; done
```

## 9. jenv × Homebrew 구조적 함정 — 버전 박제 경로
Cellar 경로엔 패치 버전이 박혀 있어 업그레이드마다 바뀐다. 해법은 brew가 자동 갱신하는 **버전 없는 opt 심링크**를 등록하는 것.
```sh
# ✗ jenv add /opt/homebrew/Cellar/openjdk@17/17.0.17/...   # 패치 오르면 깨짐
# ✓ opt 경로 = brew가 업그레이드마다 갱신 → 안 깨짐
jenv add /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```
재발 방지는 라이브 셸이 아니라 **provisioning 스크립트**에 담아야 한다. Brewfile이 `openjdk@N`을 깔아도 `jenv add`를 안 하면 새 머신에선 jenv이 켜진 채 등록 버전 0개 → 동일 파손. `run_once`에 opt 경로 `jenv add` 루프를 넣어 닫는다.
