---
description : s
title       : 
date        : 2026-01-07 09:33:07 +0900
updated     : 2026-01-07 09:35:11 +0900
categories  : [dev, windows]
tags        : []
pin         : false
hidden      : false
---

# SSH는 되는데 git clone은 실패한다? (Windows + GitHub + BOM 이슈)

Windows에서 GitHub 다중 계정을 SSH로 설정하다 보면  
아래처럼 **이상한 상황**을 만날 수 있다.

```powershell
ssh -T github.com-clang-engineer
# ✅ 성공

git clone git@github.com-clang-engineer:clang-engineer/clang-engineer.github.io.git
# ❌ 실패
에러 메시지는 다음과 같다.

pgsql
코드 복사
/c/Users/planit/.ssh/config: line 1: Bad configuration option: \357\273\277host
문제 요약
ssh -T 는 정상 동작

git clone 만 실패

.ssh/config 첫 줄의 Host 가 문제라고 나옴

➡️ 원인은 UTF-8 BOM(Byte Order Mark) 이다.

핵심 원인: ssh와 git이 서로 다른 SSH를 사용한다
명령	실제 사용되는 SSH
ssh -T	Windows OpenSSH (ssh.exe)
git clone	Git for Windows 내장 MSYS2 SSH

에러 로그의 이 경로가 결정적인 힌트다.

bash
코드 복사
/c/Users/planit/.ssh/config
➡️ MSYS2 SSH는 UTF-8 BOM을 절대 허용하지 않는다
반면 Windows OpenSSH는 운 좋게 넘어가는 경우가 있다.

그래서 ssh는 되는데 git은 죽는 현상이 발생한다.

BOM이란?
UTF-8 BOM은 파일 맨 앞에 들어가는 보이지 않는 문자다.

nginx
코드 복사
EF BB BF
SSH는 이걸 이렇게 읽는다:

csharp
코드 복사
[BOM]Host github.com-clang-engineer
➡️ Host 앞에 정체불명의 문자가 있다고 판단하고 즉시 실패.

해결 방법 1 (정석): BOM 완전 제거 ⭐
PowerShell에서 확실하게 제거
powershell
코드 복사
$path = "$env:USERPROFILE\.ssh\config"
$content = Get-Content $path -Raw
[System.IO.File]::WriteAllText(
  $path,
  $content.TrimStart([char]0xFEFF),
  [System.Text.UTF8Encoding]::new($false)
)
확인:

powershell
코드 복사
type $env:USERPROFILE\.ssh\config
첫 줄이 바로 Host ... 로 시작해야 한다.

해결 방법 2 (우회): Git이 Windows ssh를 쓰게 강제
powershell
코드 복사
git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"
⚠️ 이 방법은 근본 해결은 아님
(Git Bash, CI, 다른 환경에서 다시 터질 수 있음)

정상적인 ~/.ssh/config 예시 (다중 계정)
sshconfig
코드 복사
Host github.com-planit-zero
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_github_planit-zero
    IdentitiesOnly yes

Host github.com-clang-engineer
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_github-clang-engineer
    IdentitiesOnly yes
clone 할 때는 반드시 별칭 사용

bash
코드 복사
git clone git@github.com-clang-engineer:clang-engineer/clang-engineer.github.io.git
왜 이 이슈가 자주 발생할까?
Windows 메모장 기본 저장 → UTF-8 BOM

.ssh/config, .bashrc, .zshrc 는 BOM 허용 ❌

ssh / git / msys2 / wsl 환경이 섞이면 재현율 100%

한 줄 요약
ssh는 되는데 git clone이 안 된다면
거의 100% .ssh/config BOM 문제다.

체크리스트
 .ssh/config UTF-8 BOM 없음

 첫 줄 Host 앞 공백 없음

 git@github.com-별칭: 형태로 clone

 IdentitiesOnly yes 설정

마무리
Windows에서 GitHub 다중 계정을 쓰는 순간
이 문제는 언젠가 반드시 한 번은 터진다.

한 번 정리해두면
앞으로는 10초 컷으로 해결 가능.

