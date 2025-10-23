---
title       : Lazygit: A Terminal UI for Git
description : 
date        : 2025-10-23 15:29:55 +0900
updated     : 2025-10-23 15:31:08 +0900
categories  : [dev, tools]
tags        : [git, lazygit, terminal, tui, guide]
pin         : false
hidden      : false
---

## 🧭 LazyGit 가이드

### 📌 개요

**LazyGit**은 터미널에서 빠르게 Git 작업을 수행할 수 있도록 도와주는 TUI(Terminal User Interface) 도구입니다.
CLI 명령어를 직접 입력하지 않고도 커밋, 브랜치, 병합, 리베이스 등 대부분의 Git 작업을 단축키로 처리할 수 있습니다.

> 🔗 공식 저장소: [https://github.com/jesseduffield/lazygit](https://github.com/jesseduffield/lazygit)

---

### ⚙️ 설치

#### macOS / Linux

```bash
brew install lazygit
```

#### Windows (Scoop)

```powershell
scoop install lazygit
```

#### 또는 Go로 직접 설치

```bash
go install github.com/jesseduffield/lazygit@latest
```

---

### 🚀 실행

```bash
lazygit
```

> 현재 디렉터리가 Git 리포지토리여야 합니다.
> 실행 시 자동으로 `.git`을 탐지하여 인터페이스를 표시합니다.

---

### 🪟 인터페이스 구성

| 영역                   | 설명                  |
| -------------------- | ------------------- |
| **Files (왼쪽 위)**     | 변경된 파일 목록 / 스테이징    |
| **Branches (왼쪽 아래)** | 현재 브랜치 및 로컬/리모트 브랜치 |
| **Commits (오른쪽 위)**  | 커밋 로그 및 diff 확인     |
| **Stash (오른쪽 아래)**   | 스태시 목록              |

---

### ⌨️ 주요 단축키

#### 🔹 전역

| 동작     | 키         |
| ------ | --------- |
| 도움말 보기 | `?`       |
| 패널 이동  | `←` / `→` |
| 새로고침   | `r`       |
| 종료     | `q`       |

#### 🔹 Files 패널

| 동작              | 키         |
| --------------- | --------- |
| 폴더 열기 / 닫기      | `→` / `←` |
| 모든 폴더 열기        | `=`       |
| 모든 폴더 닫기        | `-`       |
| 파일 스테이징 / 언스테이징 | `Space`   |
| 파일 diff 보기      | `Enter`   |
| 변경 버리기          | `d`       |

#### 🔹 Commits 패널

| 동작         | 키       |
| ---------- | ------- |
| 커밋 상세 보기   | `Enter` |
| 커밋 메시지 복사  | `c`     |
| 이전 커밋으로 리셋 | `x`     |
| 체리픽        | `p`     |

#### 🔹 Branches 패널

| 동작           | 키       |
| ------------ | ------- |
| 브랜치 체크아웃     | `Enter` |
| 새 브랜치 생성     | `n`     |
| 브랜치 삭제       | `d`     |
| 병합(Merge)    | `m`     |
| 리베이스(Rebase) | `r`     |

---

### 🌳 폴더 트리 조작

| 동작    | 키   |
| ----- | --- |
| 폴더 열기 | `→` |
| 폴더 닫기 | `←` |
| 전체 열기 | `=` |
| 전체 닫기 | `-` |

> `Files` 패널에서만 동작.
> Git 트리 상태를 빠르게 정리하거나 특정 디렉터리만 집중할 때 유용합니다.

---

### ⚙️ 설정 (`~/.config/lazygit/config.yml`)

```yaml
gui:
  showFileTree: true        # 파일 트리 보기
  expandFocusedSidePanel: true
  nerdFontsVersion: "3"     # 아이콘 폰트 버전
git:
  paging:
    colorArg: always
    pager: delta --dark --paging=never
```

> 설정 파일은 YAML 형식이며, 변경 후 `lazygit` 재시작이 필요합니다.

---

### 🧩 자주 쓰는 기능

| 기능          | 설명                                |
| ----------- | --------------------------------- |
| Commit      | 변경사항을 스테이징 후 `c` 키로 커밋            |
| Push / Pull | `P` → 메뉴에서 선택                     |
| Merge       | 브랜치 패널에서 `m`                      |
| Rebase      | 브랜치 패널에서 `r`                      |
| Stash       | `s` → `a` (add stash) / `p` (pop) |

---

### 💡 팁

* `?` 로 언제든 키맵 확인 가능
* `Ctrl+c` 대신 `q` 로 종료
* `=` / `-` 으로 트리 정리
* Git hook 에러나 충돌 시 LazyGit에서 직접 Resolve 가능

---

### 🧱 트러블슈팅

| 문제             | 해결                               |
| -------------- | -------------------------------- |
| LazyGit 실행 안 됨 | Git 리포지토리 내부에서 실행해야 함            |
| 한글 깨짐          | 터미널 폰트를 NerdFont 또는 UTF-8 폰트로 변경 |
| diff 색상 이상     | `config.yml`에서 pager 설정 확인       |

---

### 🏁 결론

`LazyGit`은 명령어 대신 키보드 중심의 워크플로우를 제공하여 Git 작업 속도를 비약적으로 높여줍니다.
특히 CLI 환경에서 Git GUI의 직관성을 누릴 수 있어, Vim / Neovim 사용자와 궁합이 좋습니다.
