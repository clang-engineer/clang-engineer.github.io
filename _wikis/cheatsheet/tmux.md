---
layout  : wiki
title   : tmux 단축키 Cheatsheet
summary : Prefix(Ctrl-b)를 기준으로 자주 쓰는 tmux 키 바인딩을 한눈에 정리
date    : 2026-02-06 10:05:00 +0900
updated : 2026-02-06 10:05:00 +0900
tags    : tmux cheatsheet terminal
toc     : true
public  : true
parent  : [[cheatsheet/index]]
latex   : false
---
* TOC
{:toc}

## Prefix
- `Prefix`는 기본적으로 `Ctrl-b`를 의미합니다. 아래 표에서 `Prefix + …`는 `Ctrl-b`를 누른 뒤 이어서 입력하는 조합입니다.

## Session & Client 관리
| Key | 설명 |
| --- | --- |
| `Prefix + $` | 현재 세션 이름 변경 |
| `Prefix + s` | 세션 목록에서 선택 |
| `Prefix + d` | 현재 클라이언트 분리(detach) |
| `Prefix + D` | 연결된 클라이언트 목록에서 대상 선택 후 분리 |
| `Prefix + (` | 이전 클라이언트로 전환 |
| `Prefix + )` | 다음 클라이언트로 전환 |
| `Prefix + L` | 마지막에 사용한 클라이언트로 이동 |
| `Prefix + t` | 화면 중앙에 시계 표시 |
| `Prefix + ~` | 최근 메시지(log) 확인 |
| `Prefix + C-z` | tmux 클라이언트를 일시 중지(suspend) |

## Window 관리
| Key | 설명 |
| --- | --- |
| `Prefix + c` | 새 창 생성 |
| `Prefix + &` | 현재 창 종료 |
| `Prefix + ,` | 현재 창 이름 변경 |
| `Prefix + .` | 창 순서를 이동 |
| `Prefix + f` | 창/패인을 이름으로 검색 |
| `Prefix + i` | 창 정보 표시 |
| `Prefix + l` | 직전에 사용한 창으로 전환 |
| `Prefix + n` | 다음 창으로 이동 |
| `Prefix + p` | 이전 창으로 이동 |
| `Prefix + 0…9` | 해당 번호 창으로 바로 이동 |
| `Prefix + ' (quote)` | 창 인덱스를 직접 입력해 선택 |
| `Prefix + w` | 창 목록에서 선택 |
| `Prefix + <` | 창 메뉴 표시 |
| `Prefix + M-n` | 알림이 있는 다음 창으로 이동 |
| `Prefix + M-p` | 알림이 있는 이전 창으로 이동 |

## Pane 분할·이동·레이아웃
| Key | 설명 |
| --- | --- |
| `Prefix + "` | 창을 수직 방향으로 분할 |
| `Prefix + %` | 창을 수평 방향으로 분할 |
| `Prefix + !` | 현재 패인을 새 창으로 분리 |
| `Prefix + x` | 활성 패인 종료 |
| `Prefix + z` | 활성 패인 확대/복귀(zoom) |
| `Prefix + o` | 다음 패인으로 포커스 이동 |
| `Prefix + ;` | 직전에 사용한 패인으로 포커스 이동 |
| `Prefix + Up/Down/Left/Right` | 해당 방향의 패인 선택 |
| `Prefix + q` | 패인 번호 잠시 표시 |
| `Prefix + m` | 현재 패인 마크 토글 |
| `Prefix + M` | 설정된 마크 전체 해제 |
| `Prefix + {` | 활성 패인을 위쪽 패인과 교환 |
| `Prefix + }` | 활성 패인을 아래쪽 패인과 교환 |
| `Prefix + >` | 패인 메뉴 표시 |
| `Prefix + Space` | 다음 레이아웃으로 순환 |
| `Prefix + E` | 모든 패인을 균등하게 정렬 |
| `Prefix + M-1` | even-horizontal 레이아웃 |
| `Prefix + M-2` | even-vertical 레이아웃 |
| `Prefix + M-3` | main-horizontal 레이아웃 |
| `Prefix + M-4` | main-vertical 레이아웃 |
| `Prefix + M-5` | tiled 레이아웃 |
| `Prefix + M-6` | main-horizontal-mirrored 레이아웃 |
| `Prefix + M-7` | main-vertical-mirrored 레이아웃 |
| `Prefix + C-o` | 패인을 순방향으로 회전 |
| `Prefix + M-o` | 패인을 역방향으로 회전 |

## 패인 크기 조절
| Key | 설명 |
| --- | --- |
| `Prefix + C-Up` | 활성 패인을 위로 확장 |
| `Prefix + C-Down` | 활성 패인을 아래로 확장 |
| `Prefix + C-Left` | 활성 패인을 왼쪽으로 확장 |
| `Prefix + C-Right` | 활성 패인을 오른쪽으로 확장 |
| `Prefix + M-Up` | 활성 패인을 위로 5칸 확장 |
| `Prefix + M-Down` | 활성 패인을 아래로 5칸 확장 |
| `Prefix + M-Left` | 활성 패인을 왼쪽으로 5칸 확장 |
| `Prefix + M-Right` | 활성 패인을 오른쪽으로 5칸 확장 |

## 복사·붙여넣기 & 버퍼
| Key | 설명 |
| --- | --- |
| `Prefix + [` | 복사 모드 진입 |
| `Prefix + ]` | 가장 최근 버퍼 붙여넣기 |
| `Prefix + PPage` | 복사 모드로 진입하며 화면을 위로 스크롤 |
| `Prefix + #` | 모든 붙여넣기 버퍼 나열 |
| `Prefix + =` | 버퍼 목록에서 선택하여 붙여넣기 |
| `Prefix + -` | 가장 최근 버퍼 삭제 |
| `Prefix + ~` | 최근 메시지 확인(버퍼 관련 log) |

## 뷰 & 스크롤 제어
| Key | 설명 |
| --- | --- |
| `Prefix + DC` | 커서를 따라가도록 가시 영역을 재설정 |
| `Prefix + S-Up/Down/Left/Right` | 가시 영역을 해당 방향으로 스크롤 |

## 탐색·도움말·기타
| Key | 설명 |
| --- | --- |
| `Prefix + :` | tmux 명령 프롬프트 열기 |
| `Prefix + /` | 특정 키 바인딩 설명 보기 |
| `Prefix + ?` | 모든 키 바인딩 목록 보기 |
| `Prefix + C` | 현재 클라이언트 옵션 사용자 정의(choose-tree) |
| `Prefix + r` | 현재 클라이언트를 리프레시(redraw) |
| `Prefix + C-b` | Prefix 키 자체를 전송(중첩 세션에서 유용) |

위 표만 기억하고 있으면 tmux 세션·창·패인 작업 대부분을 키보드로 처리할 수 있습니다. 필요한 작업을 빠르게 검색해 활용하세요.
