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


# 1. 세션 관리 정책

- 설계 과정에서 sticky, cluster, global, stateless 등의 세션관리 방식이 검토되었습니다. 이중 서버 증설 관점에서 sticky 세션은 한 서버에 과부하가 걸릴 수 있다는 단점이, cluster 세션은 모든 서버가 동일한 세션 객체를 가져야 하므로 많은 메모리를 소모하게되고 서버 개수가 증가함에 따라 동기화 과정에서 성능 저하가 크다는 단점이 있기 때문에 후보에서 제외하였습니다.
 때문에 global session(redis or memcached) 또는 stateless session(jwt token) 방식에 대한 고민을 하였습니다. global 세션 관리방식은 세션 만료 시간 데이터 갱신등을 중앙에서 관리하고 여러 서버간 공유할 수 있다는 장점이 있지만 별도의 서드파티 운영 오버헤드가 생긴다는 단점이 있었습니다. token 방식은 별도로 서버에 세션 정보를 저장할 필요가 없으므로 서버 부담이 줄고 별도 서드파티 운영 오버헤드가 발생하지 않는다는 장점이 있지만, token이 통신 과정에서 탈취될 수 있으므로 xss, csrf와 같은 보안 취약점이 발생할 수 있다는 단점이 있었습니다. 
 개발하고 있는 솔루션의 특성을 고려했을 때 차후 사용자가 늘어남에 따라 확장은 필수적이지만, 별도의 세션 통제와 같은 global 세션방식의 이점이 불필요하였고, 고객사마다 특정 사설망에서 솔루션을 운영할 수 있어야했기 때문에 별도의 서드파티 운영 오버헤드가 발생하지 않는 token 인증 방식을 선택하였습니다. 
- 구현한 최종 인증 절차는 최초 로그인시 사용자에게 1시간의 atk(access token)와 동시에 하루 또는 일주일의 rtk(refresh token)을 발급하도록 하였습니다. 사용자는 응답받은 atk, atk 발급시간, rtk를 각각 브라우저 storage(atk는 session storage, rtk는 local storage)에 저장해놓고 atk가 만료되었거나 존재하지 않을 경우에는 rtk를 사용하여 새로운 atk를 발급받고 아닐 시에는 header에 atk를 담아 요청을 보내도록 하였습니다. 
- token을 사용할 때 발생하는 보안 취약점은 이중 토큰(access, refresh), jwt 인증키 암호화등의 방법을 통해 보완 하였고 atk, rtk 전달시에 쿠키가 아닌 request header에 담아 전달함으로써 csrf에 대한 보안 취약점을 방지하였습니다.
- axios interceptor 설정을 통해 atk를 요청 header에 담는 절차와 rtk를 통한 atk갱신 절차를 공통화하였습니다.
- 후에 별도 메모리 db에 (ex> redis)에 atk, rtk 그리고 각 토큰의 만료 시간을 설정함으로써 토큰 검증 시간을 줄여 성능을 향상시킬 수 있을 것으로 예상됩니다. 

# 2. 보안, 권한 관리 정책
- api 접근을 통제하기 위해 아래와 같이 api를 구분하고 1차로 권한을 검사하였습니다. 
1. /api/authenticate, /api/register, /management/health 등 >> 인증이 불필요한 public api
2. 1. 이외에 /api/** >> 인증 필요 private api
3. /api/admin/**, /management/** >> 인증 외에 추가적인 권한이 필요한 admin api

- private api들에 대해 접근할 경우 인증 절차를 거친 후에는 2차로 spring security 모듈의 PreAuthorize 어노테이션을 사용하여 사용자 api 접근 권한을 제한하였습니다.
- Content-Security-Policy 헤더를 설정하여 script, style, img, font등 시스템에서 사용할 수 있는 리소스의 유형과 출처를 제한하였습니다. 이를 통해 xss 공격을 방지하였습니다.
- Permission-Policy 헤더를 설정하여 불필요한 웹 기능을 제한하였습니다. (camera, geolocation, midi, microphone등)
- Referrer-Policy 헤더를 설정하여 정보 보호를 강화하였습니다. strict-origin-when-cross-origin으로 설정하여 tls를 통해 전송되는 동일 출처 요청에 대해서만 referrer를 전송하도록 하였습니다.
- front-end 에서는 사용자가 앱에 최초 접근시 중앙 저장소(redux store)에 사용자의 권한 정보를 설정하고, 권한에 따라 router 접근을 제한하였습니다. 중첩 라우터와 라우터 가드를 사용해 api와 마찬가지로 public, private, admin등으로 router path를 구분하여 사용자의 접근을 제한하였습니다.

# 3. 개발 환경 구성
개발환경을 구성하기 위해 아래와 같은 정책을 수립하였습니다.

## 3.1. backend
- spring boot를 사용하여 개발하였고 생산성 향상을 위해 kotlin을 사용하였습니다.
- 보다 유연한 의존성 관리와 빌드를 위해 xml기반의 maven이 아닌 groovy, kotlin등의 동적 스크립트 언어를 지원하는 gradle을 사용하였습니다.
- 개발환경과 운영환경을 각각 분리하기 위해 gradle 설정을 분리하여 사용하였습니다. (ex> build.gradle, build-dev.gradle, build-prod.gradle) 
- 작업자가 개발 과정에서 database 접속 문제로 인한 시간 낭비를 줄이기 위해 dev환경에서는 h2 file db를 각자의 로컬 pc에서 사용하도록 하였고, 실제 운영환경에서는 postgresql을 사용하도록 하였습니다. 
서버 배포 전에는 docker-compose를 사용하여 실제 운영환경과 동일한 환경에서 테스트를 진행하였습니다.
- @ControllerAdvice, @ExceptionHandler를 사용하여 예외처리를 공통화하였고 에러 응답 코드와 미리 정의된 i18n key를 사용하여 에러 메시지를 관리하도록 하였습니다.
- slf4j와 @Aspect를 사용하여 로깅 포인트를 설정하였고, 프로파일별로 logging 설정을 구분하여 개발자들의 디버깅을 용이하게 하고 운영환경 로그를 최소화하여 성능을 향상시키도록 설정하였습니다.  
- mapstruct를 사용하여 dto와 entity간의 변환을 자동화하였습니다.
- kotlin data class를 사용하여 객체의 getter, setter, equals, hashcode, toString등을 자동화하였습니다.
- 사용자의 모든 요청은 DTO를 통해 전달되도록 하였고, DTO를 통해 전달된 요청은 @Valid를 사용하여 검증하도록 하였습니다. 
- 사용자의 모든 응답은 DTO를 통해 전달되도록 하였습니다다.

## 3.2. frontend
- react를 사용하여 개발하였고 생산성 향상을 위해 typescript를 사용하였습니다.
- 의존성 관리와 빌드를 위한 도구로 각각 npm, webpack을 사용하였습니다.
- 개발환경과 운영환경을 분리하기 위해 webpack설정을 분리하여 사용하였습니다. (ex> webpack.common.js, webpack.dev.js, webpack.prod.js)
- dev환경에서 빌드할 경우 source map을 사용하여 디버깅을 용이하게 하였고, prod환경에서 빌드할 경우 난독화, 압축, 캐싱등의 최적화 설정을 추가하여 성능을 향상시켰습니다.
- store 전역 설정에 error와 alert 메시지를 관리하는 middleware를 추가하여 에러처리를 공통화하였고, 에러 응답 코드와 미리 정의된 i18n key를 사용하여 에러 메시지를 관리하도록 하였습니다.
- redux middleware를 사용하여 action과 reducer를 통해 비동기 처리를 관리하였고, redux-thunk를 사용하여 비동기 처리를 관리하도록 하였습니다.
- redux toolkit의 createSlice를 사용하여 action과 reducer를 통합하여 관리하였고, immer를 사용하여 불변성을 유지하도록 하였습니다.

# 4. 코딩 컨벤션 정책
## 4.1. backend
- checkstyle을 사용하여 코드 스타일을 통일하였습니다. google kotlin code style을 기본으로 하고, 필요에 따라 커스텀하여 사용하였습니다. 
- 코드의 가독성을 높이기 위해 코드 포맷터를 사용하여 코드 스타일을 통일하였습니다. (backend: ktlint, frontend: prettier)
- junit을 사용하여 테스트 코드를 작성하고 jacoco를 사용하여 코드 커버리지를 검사하였습니다. sonarqube에 jacoco 리포트를 연동하여 코드 커버리지, 코드 품질을 개발자들이 쉽게 확인할 수 있도록 하였습니다개
- 코드의 품질을 높이기 위해 정적 분석 도구를 사용하여 코드 품질을 검사하였습니다. (backend: sonarqube, frontend: eslint)
- 코드의 품질을 높이기 위해 코드 리뷰를 통해 코드 품질을 검사하였습니다. (backend: github pull request, frontend: gitlab merge request)
- 코드의 품질을 높이기 위해 테스트 코드를 작성하여 코드 품질을 검사하였습니다. (backend: junit, frontend: jest)

## 4.2. frontend
- eslint를 사용하여 코드 스타일을 통일하였습니다. eslint-config-airbnb를 기본으로 하고, 필요에 따라 커스텀하여 사용하였습니다. eslint-plugin-prettier를 사용하여 코드 포맷터를 사용하여 코드 스타일을 통일하였습니다.
- prettier를 사용하여 코드 스타일을 통일하였습니다. 코드 포맷터를 사용하여 코드 스타일을 통일하였습니다.
- jest를 사용하여 테스트 코드를 작성하였습니다. sonarqube에 jest 리포트를 연동하여 코드 커버리지, 코드 품질을 개발자들이 쉽게 확인할 수 있도록 하였습니다

# 4. JPA 성능 최적화 정책
JPA를 보다 효과적으로 사용하기 위해 아래와 같은 정책을 수립하였습니다.

- 다대일 관계가 필요한 경우 서로 다른 생명주기의 개체 간에는 참조를 사용하고, 같은 생명주기 내 개체 간에는 값 타입을 사용하도록 하였습니다. (many to one과 element collection을 구분하여 사용)
- 개체 간 참조시 복잡도를 낮추기 위해 one to many를 지양하고, 되도록 many to one을 사용하여 개체 간 참조하도록 하였습니다.
- 다대다 관계가 필요한 경우 다른 생명주기의 객체 간에는 중간 엔티티를 추가하여 다대일 관계로 풀어내도록 하고, many to many는 
- N+1 문제를 방지하기 위해 FetchType.LAZY 설정을 관계의 기본으로 하고, fetch join이 필요한 경우 @EntityGraph 설정에 연관된 엔티티 정보를 직접 명시 하였습니다.
- embeddable을 사용하여 엔티티의 복잡성을 줄이고, 엔티티의 생명주기를 관리하도록 하였습니다.
- query dsl보다는 jpa criteria를 사용하여 쿼리를 작성하도록 하였습니다. 이를 통해 별도의 라이브러리 의존성을 줄이고, jpa의 표준화된 쿼리 작성 방식을 사용하도록 하였습니다.
- 엔티티의 변경 이력을 관리하기 위해 @MappedSuperclass, @EntityListeners, @EntityListeners를 사용하여 audit 정보를 엔티티 별로 추가하고 이를 공통화하도록 하였습니다.

# 5. 성능 향상 정책
- hibernate 1차 캐시를 사용하여 성능을 향상시켰습니다. 1차 캐시를 사용하여 같은 트랜잭션 내에서 같은 엔티티를 조회할 경우 1차 캐시에서 조회하여 성능을 향상시켰습니다.
- hibernate 2차 캐시를 사용하여 성능을 향상시켰습니다. 2차 캐시를 사용하여 같은 엔티티를 여러 트랜잭션에서 조회할 경우 2차 캐시에서 조회하여 성능을 향상시켰습니다.
