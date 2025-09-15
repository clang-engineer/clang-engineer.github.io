---
title       : Learn Vimscript the Hard Way 주요 내용
description : 
date        : 2024-11-01 14:20:44 +0900
updated     : 2024-11-01 14:21:05 +0900
categories  : true
tags        : 
pin         : false
hidden      : false
---

# 1. Echoing Messages
- :echo : 화면에 메시지 출력
- :echom : 화면에 메시지 출력
- :messages : 저장된 메시지 확인
- :echo vs :echom : :echo는 화면에 메시지를 출력하고, :echom은 메시지를 출력하고, 메시지를 저장한다. 저장된 메시지는 :messages 명령어로 확인할 수 있다.

# 2. Setting Options
- :set number : 줄 번호 표시
- :set nonumber : 줄 번호 숨김
- :set number! : 줄 번호 표시/숨김 토글
- :set number? : 줄 번호 표시 여부 확인
- :set numberwidth=10 : 줄 번호 너비 설정
- :set number numberwidth=10 : 줄 번호 표시 및 너비 설정

# 3. Basic Mapping
- :map - x : - 키를 누르면 x를 입력한 것과 같은 효과
- :map - dd : - 키를 누르면 dd를 입력한 것과 같은 효과
- :map \<space\> viw : 스페이스바를 누르면 단어를 선택한 것과 같은 효과
- :map \<c-d\> dd : Ctrl + d 키를 누르면 dd를 입력한 것과 같은 효과

# 4. Modal Mapping
- :nmap \ dd : normal 모드에서 \ 키를 누르면 dd를 입력한 것과 같은 효과
- :vmap \ U : visual 모드에서 \ 키를 누르면 U를 입력한 것과 같은 효과
- :imap \<c-d\> dd : insert 모드에서 Ctrl + d 키를 누르면 dd를 입력한 것과 같은 효과
- :imap \<c-d\> \<esc\>ddi : insert 모드에서 Ctrl + d 키를 누르면 \<esc\>ddi를 입력한 것과 같은 효과

# 5. String Mapping
- map이 재귀적으로 동작하는 것을 방지하기 위해 noremap을 사용한다.
- map, nmap, vmap, imap에 각각 대응하는 noremap, nnoremap, vnoremap, inoremap이 있다대
- 매핑을 할때는 항상 기본 map대신 noremap을 사용하면 된다.
- 아래는 \를 눌러도 별도 매핑한 dd가 실행되지 않고, 현재 커서가 있는 줄의 문자를 삭제하는 x의 기능을 수행한다.
```vim
:nmap x dd
:nnoremap \ x
```

# 6. Leaders
- 리더키를 사용하여 기존 매핑과 충돌을 방지할 수 있다.
- :let mapleader = "-" : 리더키를 -로 설정
- :nnoremap \<leader\>d dd : 리더키 + d를 누르면 dd를 입력한 것과 같은 효과
- :let maplocalleader = "\\\\" : 특정 파일에서만 사용할 리더키를 설정 (vimscript에서 \는 이스케이프 문자이므로 \\\\로 설정)

7. Editing Your Vimrc
8. Abbreviations
9. More Mappings
10. Training Your Fingers
11. Buffer-Local Options and Mappings
12. Autocommands
13. Buffer-Local Abbreviations
14. Autocommand Groups
15. Operator-Pending Mappings
16. More Operator-Peding Mappings
17. Status Lines
18. Responsible Coding
19. Variables 
20. Variable Scoping
21. Conditional
22. Comparisons
23. Functions
24. Function Arguments
25. Numbers
26. Strings
27. String Functions
28. Execute
29. Normal
30. Execute Normal!
31. Basic Regular Expressions
32. Case Study: Grep Operator, Part One
33. Case Study: Grep Operator, Part Two
34. Case Study: Grep Operator, Part Three
35. Lists
36. Looping
37. Dictionaries
38. Toggling
39. Functional Programming
40. Paths
41. Creating a Full Plugin
42. Plugin Layout in the Dark Ages
43. A New Hope: Plugin Layout with Pathogen
44. Detecting Filetypes
45. Baic Syntx Highlighting
46. Advanced Syntax Highlighting
47. Even More Advanced Syntax Highlighting
48. Basic Folding
49. Advanced Folding
50. Section Movement Theory
51. Potion Section Movement
52. External Commands
53. Autoloading
54. Documentation
55. Distribution


> [Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/)를 읽고 정리한 내용입니다.
