---
title       : "VHS로 재생성 가능한 Neovim 플러그인 데모 만들기"
description : "손 녹화 대신 최소 Neovim 설정과 VHS tape로 플러그인의 결과 화면을 재현하고 마지막 프레임까지 확인한 경험"
date        : 2026-11-16 12:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [neovim, vhs, demo, gif, open-source, guide]
pin         : false
hidden      : false
---

[Neovim 플러그인을 발행](../open-source/2026-06-17-jvm-env-nvim-retrospective.md)한 뒤 README에 GIF를 넣으려니 한 가지 문제가 있었다. 손으로 녹화한 화면은 설정이나 타이밍이 달라질 때마다 다시 찍어야 하고, 개인 설정·경로가 화면에 섞이기 쉽다. 그래서 **데모의 입력을 코드로 남기는 VHS tape**와 플러그인만 로드하는 최소 Neovim 설정을 분리했다. GIF 자체보다 다시 만들어 볼 수 있는 조건이 중요했다.

## 먼저 ‘결과 화면’을 고른다

데모가 보여 줄 것은 설정 파일의 코드가 아니라 사용자가 얻게 되는 결과다. 내 사례에서는 `:checkhealth`가 설치된 JDK를 찾아 상태를 보여 주는 장면을 택했다. 화면이 실제 환경에 의존한다면 데모도 그 환경을 준비해야 한다. 성공 화면을 기대한다고 가짜 OK 출력을 합성하면 플러그인 데모가 아니라 모형이 된다.

최소 설정은 공개 저장소 루트에서 실행한다고 가정한다. 실제 플러그인 모듈명과 옵션으로 바꾸되, 컴퓨터의 홈 디렉토리·사용자 이름·사내 경로·토큰이 출력에 나타나지 않게 한다.

```lua
-- demo/init.lua
vim.opt.runtimepath:prepend(vim.fn.getcwd())
vim.o.termguicolors = true
vim.o.swapfile = false
require("my-plugin").setup({})
```

이때 저장소 루트가 현재 작업 디렉토리여야 한다. `:checkhealth my-plugin`에 필요한 도구나 외부 환경이 실제로 없으면 건강 검사 결과도 달라진다. README에는 이 전제를 함께 적어야 ‘결정론적 녹화’와 ‘모든 컴퓨터에서 같은 결과’라는 서로 다른 주장을 혼동하지 않는다.

## Tape는 짧게, 결과는 오래

다음 예시는 빈 Neovim을 켜고 health 결과를 보여 주는 구조다. VHS의 `Set Theme`는 **터미널 색상 팔레트** 설정이지 Neovim의 `:colorscheme` 설정이 아니다.

```text
Output demo/demo.gif
Require nvim
Set Shell zsh
Set FontSize 16
Set Width 1280
Set Height 800
Set Theme "Catppuccin Mocha"

Hide
Type "nvim -u demo/init.lua"
Enter
Sleep 2s
Show
Type ":checkhealth my-plugin"
Enter
Sleep 4s
```

`Hide`/`Show`는 시작 과정을 감추고 마지막 `Sleep`은 결과를 읽을 시간을 준다. 데모를 찍으려고 `nvim -u demo/init.lua demo/init.lua`처럼 설정 파일을 버퍼로 열었다가 swap 오류가 화면을 덮은 적이 있다. 코드 설명은 README에 두고, GIF에서는 결과 화면만 보여 주는 편이 목적에도 맞았다. 상태를 바꾸는 명령을 데모에 넣는다면 녹화 후 생성 파일을 확인하고 별도 데모로 분리한다.

[VHS 공식 문서](https://github.com/charmbracelet/vhs#vhs-command-reference)는 `Output`·`Require`·`Set`·`Type`·`Sleep`·`Hide`·`Show` 문법과 `ttyd`·`ffmpeg` 의존성을 명시한다. `brew install vhs`로 설치할 수 있으나 실행 전에 이 의존 도구가 PATH에 있는지 확인한다.

## 첫 프레임을 보고 실패로 판단하지 않는다

```sh
vhs demo/demo.tape
ffmpeg -y -sseof -1 -i demo/demo.gif -update 1 -frames:v 1 /tmp/demo-last-frame.png
```

이미지 미리보기가 애니메이션의 **첫 프레임만** 표시하면 시작 화면만 보이고 건강 검사 결과가 없는 것처럼 느껴질 수 있다. 마지막 프레임을 따로 뽑고, GIF 자체도 처음부터 끝까지 재생해 결과가 충분히 오래 노출되는지 살핀다. 단순히 GIF 파일이 생성되었다는 사실은 시연 성공의 증거가 아니다.

한 번은 VHS가 내부 `ttyd`에 연결하지 못해 브라우저 navigation 오류를 냈다. 이 환경에서는 샌드박스의 로컬 포트 바인딩 제한이 원인이었다. 동일한 메시지가 언제나 같은 원인이라는 뜻은 아니므로, `ttyd`가 실행되고 localhost에 바인딩할 수 있는지부터 살핀다. 브라우저 자동화나 네트워크 전체를 고치려 들기 전에 캡처 파이프라인의 **로컬 서버 경계**를 확인하는 것이 빠르다.

마지막으로 GIF와 `.tape`, 최소 설정을 함께 관리하고 README에서 결과 섹션 바로 옆에 이미지를 둔다. 공개하기 전 모든 프레임의 개인 경로·환경변수·프로젝트 이름을 다시 확인한다. 이 방식의 이점은 비디오가 화려하다는 데 있지 않다. 플러그인 동작이 바뀌었을 때 **같은 조건으로 다시 찍어 비교할 수 있다**는 데 있다.
