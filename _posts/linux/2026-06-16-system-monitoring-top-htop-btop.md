---
title       : "실시간 시스템 모니터링: top, htop, btop, glances 비교"
description : "CPU·메모리·프로세스를 실시간으로 보는 TUI 도구 4종 — 어떤 상황에 무엇을 쓰나"
date        : 2026-06-16 15:00:00 +0900
updated     : 2026-06-16 15:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [monitoring, top, htop, btop]
pin         : false
hidden      : false
---

서버가 갑자기 느려질 때 가장 먼저 치는 명령은 보통 `top`입니다. 하지만 `htop`, `btop`, `glances` 같은 후속 도구들이 훨씬 보기 좋고 조작도 편합니다. 이 글은 네 가지 실시간 모니터링 TUI 도구의 역할과 차이를 정리합니다.

---

## `top` — 어디에나 있는 기본

```bash
top
```

- 거의 모든 유닉스에 기본 설치 (POSIX 표준은 아니지만 사실상 어디나)
- CPU·메모리·프로세스 목록을 1–3초 주기로 갱신
- 키 조작: `P`(CPU 정렬), `M`(메모리 정렬), `k`(PID로 kill), `1`(코어별 CPU 보기), `q`(종료)

**리눅스 `top` vs macOS `top`은 다른 프로그램입니다.** 리눅스는 procps의 `top`, macOS는 Darwin 전용 구현. 키 조작·옵션이 달라서 macOS에서 `htop`을 더 자주 깔게 됩니다.

```bash
top -o %CPU             # macOS: CPU 정렬
top -o %MEM             # macOS: 메모리 정렬
top -d 1                # 리눅스: 1초 갱신
top -p 1234,5678        # 특정 PID만
top -u zero             # 특정 유저
```

장점: **무조건 깔려 있음**. 새 서버 SSH 들어가서 일단 치고 보는 용도.
단점: 컬럼 정렬·필터·트리뷰가 불편. UI가 빈약.

---

## `htop` — 거의 모든 면에서 `top`보다 낫다

```bash
htop
```

- **컬러**, **마우스 클릭** 지원, **트리 뷰** (`F5`)
- 키 조작이 직관적: `F6` 정렬, `F9` kill, `F4` 검색, `/` 필터, `F3` find, `F2` 설정
- `t`: 트리뷰 토글
- `H`: 사용자 스레드 숨김/표시
- `K`: 커널 스레드 숨김/표시

**대중성:** 매우 주류. Linux 배포판 기본 저장소, macOS는 `brew install htop`. 거의 모든 서버에 깔려 있거나 깔기 쉬움.

**설치:**

```bash
# macOS
brew install htop

# Debian/Ubuntu
sudo apt install htop

# RHEL/Rocky
sudo dnf install htop
```

`htop` 한 번 익혀두면 `top`으로 돌아갈 일이 거의 없습니다. **서버 들어가면 가장 먼저 까는 것 1순위**.

---

## `btop` — 보기 가장 예쁜 모던 도구

```bash
btop
```

- C++ 재작성으로 빠르고 가벼움 (이전 `bashtop` → `bpytop` → `btop` 진화)
- 미니멀하면서 정보 밀도 높은 UI
- 마우스 휠 스크롤, 차트 그래프, 네트워크·디스크 그래프 동시 표시
- 키 조작: `m` 메인 박스 토글, `g` 그래프 토글, `+`/`-` 속도 조정

**대중성:** 최근 몇 년간 빠르게 확산. AUR/Homebrew/apt 모두 있음.

**htop과의 차이:**

| 기준 | htop | btop |
|---|---|---|
| 설치 용이성 | 어디서나 패키지 | 비교적 신생, 일부 구버전 배포판엔 없음 |
| UI 정보 밀도 | 단순·기능 위주 | 차트·네트워크·디스크 통합 |
| 시각적 만족도 | 평이 | 매우 높음 |
| 리소스 사용 | 낮음 | 약간 더 높음 (그래프 렌더링) |

서버에는 `htop`, 개인 머신·데모용에는 `btop`을 자주 씁니다.

---

## `glances` — 한 화면에 시스템 전체

```bash
glances
```

- Python 기반. **CPU·메모리·디스크 I/O·네트워크·센서·프로세스를 한 화면에** 통합
- 웹 모드(`glances -w`)로 브라우저 접속 가능
- REST API 모드(`glances -w --export json`)도 지원
- 도커 컨테이너 통계, IPMI 센서까지 한 화면

**대중성:** 모니터링 마니아 사이에선 인기. 다만 Python 의존성 때문에 가벼운 서버엔 안 깔리는 편.

```bash
pip install glances
# 또는
brew install glances
sudo apt install glances
```

"한 명령으로 시스템 전체 그림"이 필요할 때 강력. 운영용 대시보드 대용으로 쓰는 경우도.

---

## 비교 요약

| 도구 | 설치 | 가벼움 | UI | 추천 상황 |
|---|---|---|---|---|
| `top` | 기본 내장 | 매우 가벼움 | 평이 | 익숙하지 않은 시스템에 SSH 들어간 직후 |
| `htop` | 어디서나 패키지 | 가벼움 | 좋음 | **서버 상시 모니터링** |
| `btop` | 비교적 신규 | 보통 | 가장 예쁨 | 개인 머신, 차트가 필요할 때 |
| `glances` | Python 필요 | 약간 무거움 | 정보 밀도 최고 | 디스크·네트워크·컨테이너까지 한눈에 |

**결론:**
- **서버 1대만 본다 → `htop`** (지금까지도, 앞으로도 첫 선택)
- **개인 워크스테이션 → `btop`** (시각적 만족도)
- **서버 운영자 통합 모니터링 → `glances`** (또는 Prometheus·Grafana 같은 본격 도구)
- **`top`은 fallback** — 다른 게 안 깔린 환경에서만

---

## 같이 알아두면 좋은 비실시간 도구

- `ps aux --sort=-%mem | head` — 한 번만 찍어보는 스냅샷
- `pidstat 1` — 프로세스별 CPU/메모리/IO 시계열 (sysstat)
- `vmstat 1` — 시스템 전체 메모리·스왑·CPU 시계열
- `iostat -xz 1` — 디스크 I/O 상세
- `iotop` / `nethogs` — 프로세스별 I/O / 네트워크 사용량

문제 추적 시 `htop`으로 범인 PID를 좁히고, 위 도구들로 차원별 시계열을 확인하는 흐름이 일반적입니다.

관련 글: [프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill](/posts/linux/2026-06-16-process-find-and-kill/) — 모니터링으로 찾은 PID를 어떻게 다룰지.
