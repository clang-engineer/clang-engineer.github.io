---
title       : Spring Boot 배너 샘플
description : "resources/banner.txt 한 장으로 시작 화면을 바꾼다. AnsiColor 변수를 활용한 부처 ASCII 아트와 nyan-cat 컬러 배너 두 가지 샘플."
date        : 2021-12-08 09:00:45 +0900
updated     : 2026-06-19 09:01:11 +0900
categories  : [spring-boot, "설정·아키텍처"]
tags        : [banner, ansi-color]
pin         : false
hidden      : false
---

Spring Boot는 애플리케이션이 뜰 때 `src/main/resources/banner.txt` 파일이 있으면 기본 스프링 로고 대신 그 내용을 시작 배너로 출력한다. 별도 설정 없이 파일 이름·위치만 맞으면 자동으로 인식한다.

배너 텍스트 안에서는 몇 가지 플레이스홀더를 쓸 수 있다.

| 플레이스홀더 | 출력 |
|---|---|
| `${AnsiColor.BRIGHT_YELLOW}` 등 | 이후 텍스트 색상 지정 (ANSI 색) |
| `${spring-boot.version}` | 실행 중인 Spring Boot 버전 |
| `${application.version}` | `MANIFEST.MF`의 애플리케이션 버전 |

> 배너를 끄려면 `application.yml`에 `spring.main.banner-mode: off`를 주거나, 파일 경로를 바꾸려면 `spring.banner.location`을 지정한다.

아래는 바로 붙여 쓸 수 있는 두 가지 샘플이다.

## Spring Boot 부처 배너

`src/main/resources/banner.txt`에 아래 텍스트를 저장하면 된다.

```txt
${AnsiColor.BRIGHT_YELLOW}
////////////////////////////////////////////////////////////////////
//                          _ooOoo_                               //
//                         o8888888o                              //
//                         88" . "88                              //
//                         (| ^_^ |)                              //
//                         O\  =  /O                              //
//                      ____/`---'\____                           //
//                    .'  \\|     |//  `.                         //
//                   /  \\|||  :  |||//  \                        //
//                  /  _||||| -:- |||||-  \                       //
//                  |   | \\\  -  /// |   |                       //
//                  | \_|  ''\---/''  |   |                       //
//                  \  .-\__  `-`  ___/-. /                       //
//                ___`. .'  /--.--\  `. . ___                     //
//              ."" '<  `.___\_<|>_/___.'  >'"".                  //
//            | | :  `- \`.;`\ _ /`;.`/ - ` : | |                 //
//            \  \ `-.   \_ __\ /__ _/   .-` /  /                 //
//      ========`-.____`-.___\_____/___.-`____.-'========         //
//                           `=---='                              //
//      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^        //
//Buddha's blessings will never be shut down and there will never be BUG//
////////////////////////////////////////////////////////////////////
${AnsiColor.BRIGHT_BLUE}:: Sample's Application 🤓  :: Running Spring Boot ${spring-boot.version} ::
```

## Spring Boot nyan-cat 배너
```txt
${AnsiColor.BRIGHT_BLUE}████████████████████████████████████████████████████████████████████████████████
${AnsiColor.BRIGHT_BLUE}████████████████████████████████████████████████████████████████████████████████
${AnsiColor.RED}██████████████████${AnsiColor.BRIGHT_BLUE}████████████████${AnsiColor.BLACK}██████████████████████████████${AnsiColor.BRIGHT_BLUE}████████████████
${AnsiColor.RED}████████████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████████████████████████████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██████████████
${AnsiColor.BRIGHT_RED}████${AnsiColor.RED}██████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.MAGENTA}██████████████████████${AnsiColor.WHITE}██████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████████████
${AnsiColor.BRIGHT_RED}██████████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.MAGENTA}████████████████${AnsiColor.BLACK}████${AnsiColor.MAGENTA}██████${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██${AnsiColor.BLACK}████${AnsiColor.BRIGHT_BLUE}██████
${AnsiColor.BRIGHT_RED}██████████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.MAGENTA}██████${AnsiColor.WHITE}██${AnsiColor.BLACK}████${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████
${AnsiColor.BRIGHT_YELLOW}██████████████████${AnsiColor.BRIGHT_RED}████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.MAGENTA}██████${AnsiColor.WHITE}██${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████
${AnsiColor.BRIGHT_YELLOW}██████████████████████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_YELLOW}██████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BLACK}████████${AnsiColor.WHITE}████████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████
${AnsiColor.BRIGHT_YELLOW}████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.BLACK}██${AnsiColor.BRIGHT_YELLOW}████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████████████████████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████
${AnsiColor.BRIGHT_GREEN}██████████████████${AnsiColor.BRIGHT_YELLOW}██${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.BLACK}████████${AnsiColor.WHITE}██${AnsiColor.MAGENTA}██████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████████████████████████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██
${AnsiColor.BRIGHT_GREEN}██████████████████████${AnsiColor.WHITE}████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}██████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BRIGHT_YELLOW}██${AnsiColor.WHITE}██████████${AnsiColor.BRIGHT_YELLOW}██${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██
${AnsiColor.BRIGHT_GREEN}██████████████████████${AnsiColor.BLACK}████${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}██████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.BLACK}████${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██
${AnsiColor.BLUE}██████████████████${AnsiColor.BRIGHT_GREEN}████████${AnsiColor.BLACK}██████${AnsiColor.WHITE}██${AnsiColor.MAGENTA}██████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.MAGENTA}████${AnsiColor.WHITE}████████████████${AnsiColor.MAGENTA}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██
${AnsiColor.BLUE}██████████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.MAGENTA}██████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BLACK}████████████${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████
${AnsiColor.BRIGHT_BLUE}██████████████████${AnsiColor.BLUE}████${AnsiColor.BLUE}██████${AnsiColor.BLACK}████${AnsiColor.WHITE}██████${AnsiColor.MAGENTA}██████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████████████████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██████
${AnsiColor.BRIGHT_BLUE}██████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██${AnsiColor.BLACK}████${AnsiColor.WHITE}████████████████████${AnsiColor.BLACK}██████████████████${AnsiColor.BRIGHT_BLUE}████████
${AnsiColor.BRIGHT_BLUE}████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}██████${AnsiColor.BLACK}████████████████████████████████${AnsiColor.WHITE}██${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████████████
${AnsiColor.BRIGHT_BLUE}████████████████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}██${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.BRIGHT_BLUE}████████████${AnsiColor.BLACK}██${AnsiColor.WHITE}████${AnsiColor.BLACK}████${AnsiColor.WHITE}████${AnsiColor.BLACK}██${AnsiColor.BRIGHT_BLUE}████████████
${AnsiColor.BRIGHT_BLUE}████████████████████████${AnsiColor.BLACK}██████${AnsiColor.BRIGHT_BLUE}████${AnsiColor.BLACK}██████${AnsiColor.BRIGHT_BLUE}████████████${AnsiColor.BLACK}██████${AnsiColor.BRIGHT_BLUE}████${AnsiColor.BLACK}██████${AnsiColor.BRIGHT_BLUE}████████████
████████████████████████████████████████████████████████████████████████████████
${AnsiColor.BRIGHT_BLUE}:: Meow :: Running Spring Boot ${spring-boot.version} :: \ö/${AnsiColor.BLACK}
```

> nyan cat 출처 : [link](https://github.com/azqazq195/nyan-cat-banner/blob/main/spring-boot-4tw-web/src/main/resources/banner.txt)
