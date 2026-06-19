---
title       : Tableau Trust Ticket 발급받기
description : tableau 연동시 ticket 발급 관련 정보 정리
date        : 2025-01-01 00:00:00 +0900
updated     : 2026-06-19 18:09:37 +0900
categories  : [tableau]
tags        : [sso, iframe, embed]
pin         : false
hidden      : false
---

외부 웹 애플리케이션에 Tableau 뷰를 `iframe`으로 내장할 때, 사용자가 Tableau Server에 다시 로그인하지 않게 하려면 **Trusted Ticket**을 쓴다. 내장 서버가 사용자 이름으로 Tableau에 티켓을 요청하면, Tableau가 일회용 티켓을 발급하고, 그 티켓을 뷰 URL에 붙여 SSO처럼 동작시키는 방식이다. 이 글은 신뢰 IP 등록부터 티켓 발급 테스트, 실패 시 로그 확인까지의 절차를 정리한다.

## 1. 신뢰할 수 있는 IP 추가
- ticket 발급을 위해선 태블로 서버의 접근 허용 ip 목록에 태블로 서버를 내장할 서버 ip가 등록되어있어야 합니다.
- 신뢰할 수 있는 ip 등록은 **tsm -> 구성 -> 사용자 ID 및 엑세스 -> 신뢰할 수 있는 인증** 에서 할 수 있습니다.

## 2. 티켓 발급

### 발급 테스트용 요청 페이지 (HTML)
- 아래의 코드를 로컬 pc에 생성 후 username, client ip, server ip를 변경한 후에 정상적으로 티켓 발급이 이루어지는지 우선적으로 확인할 수 있습니다. 

```html
<html>
<head>
<title>Trusted Ticket Requester</title>
<script type="text/javascript">
  function submitForm(){
    document.getElementById('form1').action =
    document.getElementById('server').value + "/trusted";
  }
</script>
<style type="text/css">
  .style1 {width: 100%;}
  .style2 {width: 429px;}
  #server {width: 254px;}
</style>
</head>
<body>
<h3>Trusted Ticketer</h3>
<form method="POST" id="form1" onSubmit="submitForm()">
  <table class="style1">
    <tr>
      <td class="style2">Username</td>
      <td><input type="text" name="username" value="" /></td>
    </tr>
    <tr>
      <td class="style2">Server</td>
      <td><input type="text" id="server" name="server" value="https://" /></td>
    </tr>
    <tr>
      <td class="style2">Client IP (optional)</td>
      <td><input type="text" id="client_ip" name="client_ip" value="" /></td>
    </tr>
    <tr>
      <td class="style2">Site (leave blank for Default site; otherwise enter the site name)</td>
      <td><input type="text" id="target_site" name="target_site" value="" /></td>
    </tr>
    <tr>
      <td class="style2"><input type="submit" name="submittable" value="Get Ticket" /></td>
      <td>&#160;</td>
    </tr>
  </table>
</form>
<h4>Be sure to add your IP as a Trusted IP address to the server</h4>
</body>
</html>
```

### curl을 이용한 티켓 발급

`/trusted` 엔드포인트는 위 HTML 폼과 동일하게 **폼 인코딩(`application/x-www-form-urlencoded`)** 으로 받는다. JSON 바디가 아니라 `username`(필요 시 `client_ip`)을 폼 파라미터로 보낸다.

```sh
curl -k -X POST \
  --data-urlencode "username=admin" \
  --data-urlencode "client_ip=xx.xx.xx.xx" \
  https://xx.xx.xx.xx/trusted
```

성공하면 티켓 문자열이, 실패하면 `-1`이 응답된다.

## 3. 티켓 발급 실패 시 로그 확인

### 로그 level 변경
- 정상적인 티켓 발급이 이루어지지 않을 경우 원인 파악을 위한 로그 확인이 필요합니다.
- 이를 위해 기본 로그 level을 info(기본)에서 debug로 변경합니다.

```sh
tsm configuration set -k vizqlserver.trustedticket.log_level -v debug
tsm pending-changes apply
```

* 변경 후 정상적용을 위해 **서버 재부팅** 이 반드시 필요합니다.

### 로그 파일 위치

```txt
//window
ProgramData\Tableau\Tableau Server\data\tabsvc\logs\vizqlserver\vizql-*.log

//linux
/var/opt/tableau/tablea_server/data/tabsvc/logs/vizqlserver/vizqlserver_node*-*.log.*
```

> 참조
- [https://help.tableau.com/current/server/ko-kr/logs_loc.htm](https://help.tableau.com/current/server/ko-kr/logs_loc.htm)
- [https://help.tableau.com/current/server/ko-kr/trusted_auth.htm](https://help.tableau.com/current/server/ko-kr/trusted_auth.htm)
