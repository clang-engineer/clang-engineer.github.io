---
title       : "Vim 주요 옵션 치트시트"
description : "들여쓰기·검색·표시·동작 옵션 한눈 정리와 자주 쓰는 들여쓰기 객체"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [vim, "사용·키맵"]
tags        : [vim, options, configuration]
pin         : false
hidden      : false
---

## 들여쓰기

| 옵션 | 의미 |
|---|---|
| `set autoindent` | 직전 행 들여쓰기 따라가기 |
| `set smartindent` | `{`, 키워드 보고 추가 들여쓰기 |
| `set cindent` | C/C++ 스타일 들여쓰기 |
| `set tabstop=4` | Tab 표시 너비 |
| `set shiftwidth=4` | `>`/`<` 들여쓰기 단위 |
| `set expandtab` | Tab을 space로 |

## 표시·UI

| 옵션 | 의미 |
|---|---|
| `set number` | 행 번호 |
| `set ruler` | 커서 위치 표시 |
| `set hlsearch` | 검색어 강조 |
| `set incsearch` | 점진 검색 |
| `set ignorecase` | 검색 시 대소문자 무시 |
| `set smartcase` | 대문자 포함 시만 구별 |
| `syntax on` | 구문 강조 |
| `filetype indent on` | 파일유형별 들여쓰기 |
| `colorscheme desert` | 색상 테마 |
| `set background=dark` | 어두운 배경 가정 |

## 동작

| 옵션 | 의미 |
|---|---|
| `set nocompatible` | vi 호환 모드 끔 |
| `set nobackup` | 백업 파일 안 만듦 |
| `set history=1000` | 명령·검색 히스토리 크기 |
| `set backspace=eol,start,indent` | backspace 허용 영역 |
| `set nowrapscan` | 검색이 끝/처음에서 wrap 안 함 |
| `set wrap` | 긴 행 줄바꿈 표시 |

## 들여쓰기 단축키 (객체 기반)

| 키 | 동작 |
|---|---|
| `>%` | 중괄호 블록 들여쓰기 |
| `>ib` | 소괄호 내부 들여쓰기 |
| `>ip` | 문단 들여쓰기 |
| `>at` | XML/HTML 태그 영역 들여쓰기 |
