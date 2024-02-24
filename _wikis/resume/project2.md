#java #spring boot #jpa #jdbc #liquibase #junit #typescript #react #jest

# 시스템 개요
- 기존에 회사에서 태블로를 통해서 BI 관련 사업을 하고 있었고, 이 과정에서 생긴 노하우들을 바탕으로 자체 솔루션으로 구축한 시스템입니다. 데이터 마트에서 사용자가 원하는 데이터를 검색해 대시보드를 구성하고 여러 사용자간 소통하면서 인사이트를 찾는 과정을 보조하는데 주안점을 둔 솔루션입니다.

# 주요 역할
- 풀스택 개발자로서 프로젝트에 참여하였습니다. 시스템 구동을 위한 주요 도메인 모델링부터 인증 체계, 보안 체계등까지 시스템의 주요 뼈대가 되는 백엔드, 프론트엔드 로직들을 작업하였습니다.

# 주요 성과
## 세션 관리 체계 구축
- 설계 과정에서 sticky, cluster, global, stateless 등의 세션관리 방식이 검토되었습니다. 이중 서버 증설 관점에서 sticky 세션은 한 서버에 과부하가 걸릴 수 있다는 단점이, cluster 세션은 모든 서버가 동일한 세션 객체를 가져야 하므로 많은 메모리를 소모하게되고 서버 개수가 증가함에 따라 동기화 과정에서 성능 저하가 크다는 단점이 있기 때문에 후보에서 제외하였습니다.
 때문에 global session(redis or memcached) 또는 stateless session(jwt token) 방식에 대한 고민을 하였습니다. global 세션 관리방식은 세션 만료 시간등을 중앙에서 관리하고 여러 서버간 데이터를 공유할 수 있다는 장점이 있지만 별도의 서드파티 운영 오버헤드가 생긴다는 단점이 있었습니다. stateless 방식은 별도로 서버에 세션 정보를 저장할 필요가 없으므로 서버 부담이 줄고 별도 서드파티 운영 오버헤드가 발생하지 않는다는 장점이 있지만, token이 통신 과정에서 탈취됐을 때 xss, csrf와 같은 보안 취약하다는 단점이 있었습니다. 
 개발하고 있는 솔루션의 특성을 고려했을 때 차후 사용자가 늘어남에 따라 부하 분산을 위한 구조가 필요하지만, 별도의 세션 통제와 같은 global 세션방식의 이점이 불필요하였고, 고객사마다 사설망에서 솔루션을 운영할 수 있어야했기 때문에 별도의 서드파티 운영 오버헤드없이 쉽게 부하분산할 수 있는 stateless 인증 방식을 선택하였습니다. 
- 구현한 최종 인증 절차는 우선 최초 로그인시 사용자에게 1시간동안 유효한 atk(access token)와 하루 또는 일주일동안 유효한 rtk(refresh token)을 발급하도록 하였습니다. 사용자는 응답받은 atk, atk 발급시간, rtk를 각각 브라우저 storage(atk는 session storage, rtk는 local storage)에 저장해놓고 atk가 만료되었거나 존재하지 않을 경우에는 rtk를 사용하여 새로운 atk를 발급받고 아닐 시에는 header에 atk를 담아 요청을 보내도록 하였습니다. 
- token을 사용할 때 발생하는 보안 취약점은 이중 토큰(access, refresh), 인증키 암호화등의 방법을 통해 보완 하였고 atk, rtk 전달시에 쿠키가 아닌 request header에 token을 담아 전달함으로써 노출을 최소화하고 csrf에 대한 취약점을 방지하였습니다.
- axios interceptor 설정을 통해 atk를 요청 header에 담는 절차와 rtk를 통한 atk갱신 절차를 공통화하였습니다. 
- 사용자가 앱에 최초 접근시 브라우저의 storage에 저장된 atk, rtk를 사용하여 private api(ex> api/user-info)를 호출하고 정상적으로 응답을 받았을 경우에는 기본 라우터로 이동하도록 하였고, 그렇지 않을 경우에는 로그인 페이지로 이동하도록 하였습니다. 추가로 router에 대한 직접 접근을 막기 위해 라우터 가드를 사용하여 private 경로에 대한 접근을 제한하였습니다.
- 후에 별도 메모리 db에 (ex> redis)에 atk, rtk 그리고 각 토큰의 만료 시간을 설정함으로써 토큰 검증 시간을 줄여 성능을 향상시킬 수 있을 것으로 예상됩니다. 

## 보안, 권한 관리 정책
- api 접근을 통제하기 위해 아래와 같이 api를 구분하고 1차로 권한을 검사하였습니다. 
1. /api/authenticate, /api/register, /management/health 등 >> 인증이 불필요한 public api
2. 1. 이외에 /api/** >> 인증 필요 private api
3. /api/admin/**, /management/** >> 인증 외에 추가적인 권한이 필요한 admin api

- private api들에 대해 접근할 경우 인증 절차를 거친 후에는 2차로 spring security 모듈의 PreAuthorize 어노테이션을 사용하여 메소드 호출 전에 권한을 추가로 검사하였습니다.
- CSP(Content-Security-Policy) 헤더를 설정하여 script, style, img, font등의 자원별로 허용할 출처를 제한하였습니다. 기본적으로 self로 설정하여 동일 출처에서만 자원을 사용할 수 있도록 하였고, script-src는 self, unsafe-inline, unsafe-eval을 허용, style-src는 self, unsafe-inline을 허용하도록 하였습니다. 이런 설정들을 통해 xss 공격을 방지하였습니다.
- Permission-Policy 헤더를 설정하여 사용할 수 있는 기능을 제한하였습니다. (ex> 제한: camera, geolocation, gyroscope, magnetometer, microphone, midi, payment, sync-xhr. 허용: fullscreen(self))
- Referrer-Policy 헤더를 설정하여 불필요한 출처 정보 노출을 방지하였습니다. 제한은 strict-origin-when-cross-origin으로 설정하여 tls를 통해 전송되는 동일 출처 요청에 대해서만 referrer를 전송하도록 하였습니다.
- 사용자가 로그인시 브라우저 메모리 공간(redux store)에 권한 정보를 설정하고, 이에 따라 router 경로를 제한하였습니다. 이때 중첩 라우터와 라우터 가드를 사용해 api와 마찬가지로 public, private, admin등으로 구분하여 경로 설정을 구분하고 관리하였습니다.

## 예외 처리 정책
1. backend
-  @ControllerAdvice, @ExceptionHandler를 사용하여 예외처리를 공통화하였고 에러 응답 코드와 미리 정의된 i18n key를 사용하여 메시지를 관리하도록 하였습니다.

2. frontend
- error와 alert 메시지를 관리하는 middleware를 추가하여 에러처리를 공통화하였습니다. 에러 응답시 에러 코드와 미리 정의된 i18n key를 사용하여 메시지를 관리하도록 하였습니다.

## 로깅 정책
1. backend
- logback 설정을 통해서 개발과 운영환경에서의 로그 출력을 통제하고 debug, info등 로깅 level을 구분하여 개발시 로그 확인을 원할히하고 운영환경에서 필요한 출력 로그를 최소화하여 성능을 향상시키도록 설정하였습니다. 
- @Profile과 @Aspect를 사용하여 dev 환경에서 로그를 상세하게 확인할 수 있도록 별도의 설정을 추가하였습니다. @AfterThrowing을 사용하여 예외 발생시 로그를 기록하고 @Around를 사용하여 메서드 호출 전후에 로그를 출력하도록 하였습니다.

2. frontend
- dev환경에서 빌드할 경우 source map을 생성하도록 설정하여 개발환경에서 디버깅을 용이하게 하였습니다.
- store 설정에 logger middleware를 추가하여 개발환경에서 type, payload, meta, error등의 상태 변화를 쉽게 확인할 수 있도록 하였습니다.