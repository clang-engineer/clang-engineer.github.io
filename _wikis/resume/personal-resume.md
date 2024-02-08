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
 고민끝에 솔루션이 차후 사용자가 늘어남에 따라 확장은 필수적이지만, 서버 간에 세션 공유가 필요할 것으로 예상되었기 때문에 별도의 오버헤드없는 token(jwt)를 통한 인증 방식을 사용하고 보안 취약점은 이중 토큰(access, refresh), csrf token등의 방법을 통해 보완하였습니다.

2. 보안, 권한 관리 정책
- 백엔드: cookie 에 http-only, secure 속성을 추가하여 xss, csrf 공격을 방지하였습니다.