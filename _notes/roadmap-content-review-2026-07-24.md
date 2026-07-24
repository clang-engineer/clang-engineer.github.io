# Roadmap 연결 글 전수 리뷰 — 2026-07-24

## 범위

- roadmap 14개와 `_tabs/roadmap.md`
- roadmap이 직접 연결한 일반 글 229개
- 중복 연결된 글은 본문을 한 번 검토하고 roadmap별 역할은 각각 확인
- 직접 내부 링크, front matter, 코드 fence, 공개 정보 노출 자동 점검
- 주제별 사실 정확성, 안전성, 최신성, 학습 순서 심층 검토

단순한 일반 글의 관련 링크를 재귀적으로 roadmap 소속에 포함하지 않았다. 직접 연결된 로컬 글의 깨진 링크는 0개다.

## 판정 기준

1. **P0** — 데이터 손실, 보안·개인정보, 잘못된 결과, 컴파일·실행 실패를 직접 유발
2. **P1** — 핵심 개념이나 현재 도구 동작을 잘못 설명하여 학습 경로를 훼손
3. **P2** — 버전·출처·검증 절차·문서 경계가 약해 유지보수 위험이 큼
4. **P3** — 표현, 순서, 탐색성 개선

## 1차 수정 완료

- Vertica OR outer join을 완성 쿼리의 단순 `UNION ALL`로 바꾸던 잘못된 해법 교정
- Go 채널이 Rust처럼 소유권을 이전한다는 설명 교정
- 코루틴·클로저 상태가 반드시 힙에 산다는 설명을 저장 위치 비보장 모델로 교정
- C++ 복사 대입의 예외 발생 후 이중 해제 위험과 비가상 소멸자 UB 교정
- Go `os.Open` 오류를 버린 뒤 nil 파일을 `defer Close`하던 예제 교정
- dotfiles bootstrap의 Bash/`sh` 혼용과 `rm -rf` 자동 덮어쓰기 제거
- 공백·개행 파일명을 깨뜨리는 `find`/`ls | xargs` 일괄 변경 예제 교정
- SSH 키 경로의 quoted tilde, 잘못 닫힌 fence와 공개 이메일 예시 교정
- Neovim swap을 mtime만으로 자동 삭제해도 된다는 지침 제거
- Linux `PASS_MIN_DAYS`가 현재 비밀번호 인증을 막는다는 오진을 관련 글과 roadmap에서 교정
- 공개 예시의 조직명·프로젝트명·사용자 홈·이메일·사설 IP를 문서용 값으로 교체
- 완료된 Neovim LSP backlog 상태와 C++·tmux roadmap 갱신일 정합성 수정
- roadmap 범위에서 빠져 있던 `updated` 20건 보완

## 2차 수정 완료 — 언어 개념

- moved-from C++ 객체를 "비어 있고 사용 금지"가 아니라 valid but unspecified와 타입별 postcondition으로 구분
- pure Go와 cgo build의 배포·동적 링크 차이 명시
- Rust closure의 `move` capture와 `Fn`/`FnMut`/`FnOnce` call trait 분리
- Rust data-race 방지 보장을 safe Rust 범위로 한정하고 `Mutex`·atomic의 역할 유지
- `unsafe`를 전체 검사 해제가 아니라 제한 연산과 proof obligation의 경계로 교정
- 무시한 Rust `Result`는 기본적으로 compile error가 아니라 `must_use` warning임을 반영
- C++ reference nullability와 Go nil map·slice·interface의 연산별 동작 구분
- C++ `const`와 Rust reference를 관습 대 강제가 아닌 aliasing·interior mutability 기준으로 비교
- Go string을 임의 byte sequence로, rune을 Unicode code point로 교정하고 grapheme과 구분
- Go generic 예제의 `constraints.Ordered`를 현행 `cmp.Ordered`로 교체
- subtype polymorphism 예제를 컴파일 가능하게 만들고 vptr·itab·fat pointer를 ABI 보장이 아닌 대표 구현 모델로 표시
- Go 1.26, Rust 1.97·Edition 2024 검토 기준과 필수 context·race detector 경로를 roadmap에 반영

## 3차 수정 완료 — 디자인 패턴

- Prototype의 `Object.create`를 clone이 아닌 prototype chain 생성으로 교정
- Observer·Proxy의 missing include와 Mediator·Flyweight의 미완성 타입·생성자를 보완
- Builder Director의 사용하지 않는 URL 인자를 제거
- Chain of Responsibility cache가 downstream의 실제 반환값만 저장하도록 response 흐름 추가
- Factory의 switch 기반 Simple Factory 자기모순 교정
- Strategy/State를 선택 주체가 아닌 policy와 lifecycle state라는 의도로 구분
- Command/Memento를 역연산 대 snapshot의 양자택일이 아닌 요청과 상태 캡슐화로 구분
- 디자인 패턴 roadmap의 필수 선행 오해, OCP 만능 설명과 근거 없는 빈도 순위를 완화

## 4차 수정 완료 — Neovim·LazyVim

- kickstart.nvim master의 Neovim 0.12 `vim.pack`, blink.cmp, 현행 업데이트 API 반영
- LazyVim core와 picker·completion·explorer 선택 extra를 구분하고 Trouble 현행 키·mode 반영
- lazy.nvim `dependencies`의 `LazySpec[]` 타입, `name`/`main`, 필드별 spec merge 규칙 교정
- Neovim 0.11+ LSP를 mason 설치, nvim-lspconfig 설정 자료, `vim.lsp.config`/`enable` 실행 엔진으로 재구성
- Vim/Neovim 실행 경로에서 Vimscript AST, 모든 호출의 `nvim_*` 경유, Vim 외부 연동 부재 오해 교정
- `vim.uv` fast event와 `vim.system`/`jobstart` callback을 분리하고 `text=true`를 CRLF 정규화로 교정
- exrc의 Neovim 0.11 current-directory와 0.12+ parent search 경계, `stdpath("state")` trust 위치 반영
- nvim-treesitter 직접 checkout·lockfile 수동 수정, Copilot 조직 정책 monkey patch, Dadbod stderr 전체 폐기·URL 비밀번호 예시 제거
- Kotlin LSP 복사 결과와 실행 경로, Windows lazygit spec·지원 config field, plenary.nvim archive 오보 교정

## P1 잔여 작업

### AI·macOS

- `2025-10-24-claude-code-slash-commands.md` — `$0` 기준 인자, shell injection 문법, `/tasks` 반영
- `2026-03-12-claude-code-memory.md` — `CLAUDE.local.md`를 명시적으로 gitignore하도록 교정
- `2025-10-23-mcp.md` — 현재 stable spec과 draft를 분리
- `2026-07-03-claude-api-basics.md` — 현재 모델과 기간 한정 가격을 기준일과 함께 갱신
- `2025-10-31-productivity-launchers.md`, `2026-07-03-alttab-window-switcher.md` — macOS Spotlight, Raycast Free/Pro, AltTab Free/Pro 기능표 갱신
- `2026-06-07-aerospace-secure-input-hotkey-blocked.md` — 현재 메뉴 경로와 보안 trade-off 반영
- `2022-02-05-new-mac-initial-setup.md` — 패키지 설치 경로와 source 경로 불일치, moving installer 실행 지침 교정
- `2026-06-07-homebrew-cleanup-java-symlink-broken.md` — Cellar 버전 하드코딩 대신 `brew --prefix` 사용
- `2026-07-03-aerospace-workspace-overlay.md` — Lua local 함수 선언 순서와 URL encoding 교정
- `2026-07-03-aerospace-hammerspoon-window-reflow.md` — 지원하는 AeroSpace config schema를 명시하거나 TOML parser 사용

### DB·Linux

- `2026-07-03-postgresql-pitr-backup.md` — 운영 data directory 직접 삭제 대신 격리 복구·검증·cutover 절차로 전환
- `2024-10-16-postgresql-change-mount-path.md` — package unit 직접 수정 제거, systemd override와 SELinux context 추가
- `2025-01-14-offline-runtime-enviroment.md` — `--alldeps`, offline DNF repo, 서명·checksum 검증 추가
- `2026-07-11-ssh-server-access-hardening.md` — keyboard-interactive와 SELinux SSH port 설정 보완
- `2026-07-11-user-account-management.md` — `usermod -L`을 전체 로그인 차단이 아닌 password lock으로 교정
- `2026-07-11-firewalld-ufw-basics.md` — source rule 추가 뒤 broad SSH service 제거 절차 보완
- `2025-10-17-liquibase.md` — `loadData`와 무관한 필수 `dropDefaultValue` 제거
- `2025-01-14-postgresql-pgdump.md` — `-n`/`-t` 반복 사용과 parallel dump/restore 지원 범위 교정
- `2026-07-03-query-optimizer-explain.md` — rollback이 sequence·외부 효과까지 되돌린다는 인상을 제거
- `2026-07-03-table-partitioning.md` — DROP lock과 `DETACH PARTITION CONCURRENTLY` 검토 추가
- `2026-06-07-kibana-saved-objects-lens-alerting.md` — 평문 HTTP·CLI 비밀번호 예시를 HTTPS와 제한된 credential 방식으로 전환

### Shell·dotfiles·tmux·키보드

- `2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md` — `set-clipboard external`/`on` 의미 교정
- `2026-07-03-tmux-auto-attach-new-session-every-time.md` — 동일 이름 세션이 매번 늘어난다는 불가능한 증상 교정
- `2026-07-08-dotfiles-bare-git-yadm.md` — 비이식적 `\s`와 중첩 경로를 깨뜨리는 backup pipeline 교정
- `2026-07-03-zmk-keymap-editor-build-flash.md` — board별 artifact와 split central/peripheral flash 조건 구분
- `2026-07-12-oh-my-tmux.md` — clipboard 구현과 update key를 현행 upstream 기준으로 교정
- `2021-11-30-tmux-config.md` — stock key 설명을 지정 tmux 버전의 `list-keys` 기준으로 재검증
- `2025-11-17-tmux-tpm.md`, `2026-07-11-tmux-plugins-beyond-essentials.md` — canonical 기본 plugin 목록과 선택 목록의 책임 분리

## P2 공통 작업

- 빠르게 변하는 글에 검증 버전·commit·기준일 추가
- 수치·인기·"주류" 주장을 출처가 있는 측정값과 작성자 판단으로 분리
- 파괴적 명령 앞에 dry-run, backup, 격리 환경, 성공 검증 추가
- 사실 중심 tutorial에는 공식 문서·specification을 우선 출처로 추가
- troubleshooting 글에 증상, 원인, 수정, 검증, 적용 버전의 최소 구조 적용
- 외부 링크는 CI commit gate가 아니라 주기 실행으로 검사

## 사람 판단이 필요한 메타데이터

다음 11개는 filename 날짜와 front matter `date`가 다르다. permalink 변경 가능성이 있으므로 자동으로 이름을 바꾸지 않는다.

- C++ cpplint/clang-format
- Design Pattern Observer, Command
- Linux Debian/Red Hat, logrotate
- Neovim Learn Vimscript the Hard Way
- Shell 일괄 변경, bashrc/profile, 바이너리 복사, SSH broken pipe
- macOS Docker operation not permitted

원래 공개일과 URL 보존 정책을 확인한 뒤 front matter만 맞출지, redirect를 둔 채 파일명을 바꿀지 결정한다.

## 완료 조건

- P1 항목을 주제별 batch로 수정하고 각 batch마다 공식 문서 재검증
- roadmap 설명과 글의 실제 책임을 동기화
- Jekyll production build와 내부 HTML link 검사 통과
- 공개 예시 anonymization scan 통과
- 남은 P2/P3는 각 파일의 `updated`를 바꿀 때 함께 해소
