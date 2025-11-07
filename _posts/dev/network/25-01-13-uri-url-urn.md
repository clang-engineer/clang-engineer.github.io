---
title       : URI, URL, URN
description : >-
    URI, URL, URN에 대해 정리합니다.
date        : 2025-01-13 16:55:20 +0900
updated     : 2025-01-25 16:58:25 +0900
categories  : [dev, network]
tags        : [uri, url, urn, web-standards]
pin         : false
hidden      : false
---

## URI (Uniform Resource Identifier)
- URI는 인터넷에 있는 자원을 나타내는 유일한 주소입니다.
- URI는 URL과 URN으로 나누어집니다.

## URL (Uniform Resource Locator)
- URI의 하위 개념으로, 특정 프로토콜(ex> http, ftp, mailto)을 사용하여 리소스를 어디서 찾을 수 있는지를 나타냅니다.
- 리소스의 "위치"를 나타냅니다.
- URL와 URI의 차이점은 URL은 URI의 일종이지만, URI는 URL이 아닐 수도 있다는 것입니다.

## URN (Uniform Resource Name)
- URI의 하위 개념으로, 리소스의 위치에 상관없이 리소스의 이름을 나타냅니다.
- 리소스의 "이름"을 나타냅니다.
- URL과 달리 자원의 위치나 접근 방법을 제공하지 않고, 특정 네임스페이스 내에서 유일한 이름을 제공합니다.
- URN은 리소스의 위치가 변경되어도 유효합니다. (리소스의 이름이 변경되지 않는 한 항상 유효합니다.)
- 포맷 - <urn:namespace:specific-string> (ex> urn:isbn:0451450523)


> fhir 의료데이터 교환 표준에서 자원 식별자로 URN을 사용하는 것을 보고, URI, URL, URN에 대해 다시 한번 정리해보았습니다. 
[link](https://www.hl7.org/fhir/)