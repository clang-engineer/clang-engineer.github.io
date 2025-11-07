---
title       : HTML 특수코드 문자표 ( HTML Entity List )
description : >-
    HTML에서 사용되는 특수 문자를 나타내는 문자열인 HTML 엔티티에 대해 기록.
date        : 2025-03-21 22:50:30 +0900
updated     : 2025-03-21 22:50:42 +0900
categories  : [dev, tools]
tags        : [html, entity, special-characters, reference]
pin         : false
hidden      : false
---

Entity Name이나 Entity Number를 사용하면 HTML, XML 등에서 특수 문자를 안전하고 일관되게 처리할 수 있으며, 문자 인코딩 문제를 피하고, 다양한 시스템 간에 호환성 있게 사용할 수 있다.

| **Character** | **Entity Name**   | **Entity Number** | **Description**               |
|---------------|-------------------|-------------------|-------------------------------|
| `&#32;`       | `&nbsp;`           | `&#160;`          | 여백 (Non-breaking space)      |
| `!`           | `&iexcl;`           | `&#161;`          | 거꾸로 느낌표 (Inverted exclamation mark) |
| `¢`           | `&cent;`            | `&#162;`          | 센트 (Cent)                   |
| `£`           | `&pound;`           | `&#163;`          | 파운드 (Pound)                |
| `¤`           | `&curren;`          | `&#164;`          | 정의되지 않은 커런시 표시 (Currency) |
| `¥`           | `&yen;`             | `&#165;`          | 엔 (Yen)                      |
| `¦`           | `&brvbar;`          | `&#166;`          | 파이프 (Broken vertical bar)  |
| `§`           | `&sect;`            | `&#167;`          | 단락기호 (Section)            |
| `©`           | `&copy;`            | `&#169;`          | 카피라이트 기호 (Copyright)  |
| `®`           | `&reg;`             | `&#174;`          | 트레이드 마크 기호 (Registered trademark) |
| `°`           | `&deg;`             | `&#176;`          | 도 단위기호 (Degree symbol)  |
| `±`           | `&plusmn;`          | `&#177;`          | 플러스 또는 마이너스 (Plus or minus) |
| `µ`           | `&micro;`           | `&#181;`          | 마이크로 단위기호 (Micro)    |
| `¼`           | `&frac14;`          | `&#188;`          | 분수 1/4 (Fraction 1/4)       |
| `½`           | `&frac12;`          | `&#189;`          | 분수 1/2 (Fraction 1/2)       |
| `¾`           | `&frac34;`          | `&#190;`          | 분수 3/4 (Fraction 3/4)       |
| `¿`           | `&iquest;`          | `&#191;`          | 거꾸로 물음표 (Inverted question mark) |
| `×`           | `&times;`           | `&#215;`          | 곱하기 부호 (Multiplication) |
| `÷`           | `&divide;`          | `&#247;`          | 나누기 부호 (Divide)          |
| `‘`           | `&lsquo;`           | `&#8216;`         | 왼쪽 작은따옴표 (Left single quotation mark) |
| `’`           | `&rsquo;`           | `&#8217;`         | 오른쪽 작은따옴표 (Right single quotation mark) |
| `‚`           | `&sbquo;`           | `&#8218;`         | 쉼표 (Single low-9 quotation mark) |
| `"`           | `&quot;`            | `&#34;`           | 큰따옴표 (Quotation mark)     |
| `#`           | `&num;`             | `&#35;`           | 샵 (Number sign)             |
| `$`           | `&dollar;`          | `&#36;`           | 달러 (Dollar sign)           |
| `%`           | `&percnt;`          | `&#37;`           | 퍼센트 (Percent sign)        |
| `&`           | `&amp;`             | `&#38;`           | 앤드 기호 (Ampersand)         |
| `'`           | `&apos;`            | `&#39;`           | 아포스트로피 (Apostrophe)    |
| `(`           | `&lpar;`            | `&#40;`           | 소괄호/왼쪽 (Opening Parenthesis) |
| `)`           | `&rpar;`            | `&#41;`           | 소괄호/오른쪽 (Closing Parenthesis) |
| `*`           | `&ast;`             | `&#42;`           | 별표 (Asterisk)              |
| `+`           | `&plus;`            | `&#43;`           | 더하기 (Plus sign)           |
| `,`           | `&comma;`           | `&#44;`           | 쉼표 (Comma)                 |
| `-`           | `&hyphen;`          | `&#45;`           | 하이픈 (Hyphen)              |
| `.`           | `&period;`          | `&#46;`           | 온점, 마침표 (Period)        |
| `/`           | `&sol;`             | `&#47;`           | 슬래시 (Slash)               |
| `0 ~ 9`       | `&num;`             | `&#48; ~ &#57;`    | 숫자 0 ~ 9 (Digit 0 - 9)     |
| `:`           | `&colon;`           | `&#58;`           | 콜론 (Colon)                 |
| `;`           | `&semi;`            | `&#59;`           | 세미콜론 (Semicolon)         |
| `<`           | `&lt;`              | `&#60;`           | 보다 작은 (Less than)        |
| `=`           | `&equals;`          | `&#61;`           | 등호 (Equals sign)           |
| `>`           | `&gt;`              | `&#62;`           | 보다 큰 (Greater than)       |
| `?`           | `&quest;`           | `&#63;`           | 물음표 (Question mark)       |
| `@`           | `&commat;`          | `&#64;`           | 앳, 골뱅이 (At sign)         |
| `A ~ Z`       | `&Atilde;`          | `&#65; ~ &#90;`    | 대문자 A ~ Z (Uppercase A-Z) |
| `[`           | `&lsqb;`            | `&#91;`           | 대괄호/왼쪽 (Opening square bracket) |
| `\`           | `&bsol;`            | `&#96;`           | 백슬래시 (Backslash)         |
| `]`           | `&rsqb;`            | `&#93;`           | 대괄호/오른쪽 (Closing square bracket) |
| `^`           | `&circ;`            | `&#94;`           | 지수 (Caret)                 |
| `_`           | `&lowbar;`          | `&#95;`           | 언더바 (Underscore)          |
| `` ` ``       | `&grave;`           | `&#96;`           | 억음부호 (Grave accent)      |
| `a ~ z`       | `&alpha;`           | `&#97; ~ &#122;`   | 소문자 a ~ z (Lowercase a-z) |
| `{`           | `&lcub;`            | `&#123;`          | 중괄호/왼쪽 (Opening curly brace) |
| `|`           | `&verbar;`          | `&#124;`          | 버티컬바, 파이프 (Vertical bar) |
| `}`           | `&rcub;`            | `&#125;`          | 중괄호/오른쪽 (Closing curly brace) |
| `~`           | `&tilde;`           | `&#126;`          | 물결표 (Tilde)               |