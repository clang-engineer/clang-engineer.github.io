---
layout  : wiki
title   : Personal resume 
summary : 
date    : 2024-01-23 08:38:09 +0900
updated : 2024-02-06 16:46:33 +0900
tags    : 
toc     : true
public  : false
parent  : [[resume/index]]
latex   : false
---
* TOC
{:toc}


1. 세션 관리 정책

- 설계 과정에서 sticky, cluster, global, stateless 등의 세션관리 방식이 검토되었습니다. 이중 서버 증설 관점에서 sticky 세션은 한 서버에 과부하가 걸릴 수 있다는 단점이, cluster 세션은 여러 서버의 자원을 소모하는 단점이 있기 때문에 후보에서 제외되었습니다.
 때문에 global session(redis or memcached) 또는 stateless session(jwt token) 방식에 대한 고민을 하였습니다. global 세션 관리방식은 세션 만료 시간 데이터 갱신등을 중앙에서 관리하고 여러 서버간 공유할 수 있다는 장점이 있지만 특정 아키텍처에 대한 의존성과 추가적인 운영 오버헤드가 생긴다는 단점이 있었습니다. token 방식은 별도로 서버에 세션 정보를 저장할 필요가 없으므로 서버 부담이 줄고 별도 third party 오버헤드가 없다는 장점이 있지만, token이 통신 과정에서 탈취될 수 있으므로 xss, csrf와 같은 보안 취약점이 줄 수 있다는 단점이 있었습니다. 
 고민끝에 솔루션이 차후 사용자가 늘어남에 따라 확장은 필수적이지만, 서버 간에 세션 공유가 불필요할 것으로 예상되었기 때문에 별도의 오버헤드없는 token(jwt)를 통한 인증 방식을 사용하고 보안 취약점은 이중 토큰(access, refresh), csrf token등의 방법을 통해 보완하였습니다.
 최종 구현한 인증 절차는 최초 로그인시 사용자에게 1시간의 access token을 발급하고 동시에 하루 또는 일주일(설정에 따라 다름)의 refresh token을 별도의 저장소(db)에 저장하도록 하였습니다. 
 사용자는 로그인시 응답받은 token을 브라우저 storage에 저장해놓고 매 요청시 axios 설정을 통해 token을 header에 담아서 전송하도록 하였습니다.
 서버에서는 전달받은 토큰의 유효성을 검사하고, access token이 만료되었을 때 refresh token을 db에서 조회해 검증하고 유효할 시 새로운 access token을 재발급하고 사용자는 재발급된 토큰 응답이 오면 브라우저 storage공간의 토큰을 갱신하도록 하였습니다. 
 후에 refresh token의 저장공간을 redis로 변경하자는등의 논의가 있었으나, 갱신 주기를 고려했을 때 오버헤드가 크지 않을 것으로 판단되었고 ecache를 사용한 별도의 cache 레이어도 있었기 때문에 별도의 변경은 없었습니다.

2. 보안, 권한 관리 정책
- api를 통제하기 위해 아래와 같이 api를 구분하고 1차로 권한을 검사하였습니다. 
1. /api/** >> 인증 필요 private api
2. /api/admin/**, /management/** >> 인증 외에 추가적인 권한이 필요한 admin api
3. /api/authenticate, /api/register, /management/health 등 >> 인증 불필요 public api

이후 인증이 필요한 api들은 SecurityConfigurerAdapter에 jwt token을 검사하는 필터를 추가하여 token에 대한 유효성을 검사하였습니다. jwt token은 access token과 refresh token으로 나누어 사용자의 권한을 검사하였습니다. access token은 사용자의 권한을 검사하고, refresh token은 access token이 만료되었을 때 새로운 access token을 발급하는 역할을 하였습니다. 이를 통해 사용자의 권한을 검사하고, 보안 취약점을 방지하였습니다.

- 기타: cookie 에 http-only, secure 속성을 추가하여 xss, csrf 공격을 방지하였습니다.