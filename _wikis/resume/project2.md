#java #spring boot #jpa #jdbc #liquibase #junit #typescript #react #jest

# 시스템 개요
- 기존에 회사에서 태블로를 통해서 BI 관련 사업을 하고 있었고, 이 과정에서 생긴 노하우들을 바탕으로 자체 솔루션으로 구축한 시스템입니다. 데이터 마트에서 사용자가 원하는 데이터를 검색해 대시보드를 구성하고 여러 사용자 간 소통하면서 인사이트를 찾는 과정을 보조하는데 주안점을 둔 솔루션입니다.

# 인력 구성
- 서버 5명, 클라이언트 3명, 디자인 및 퍼블리싱 2명, 기획 1명, DBA 3명등으로 TF팀이 구성되어 개발을 진행하였습니다.

# 주요 역할
- 개발 PL 로서 시스템의 전체적인 구조 및 설계를 진행하였습니다. 
- 풀스택 개발자로서 서버, 클라이언트 작업을 병행하였습니다.
- 핵심 도메인, 인증, 보안 체계 등 시스템의 주요 뼈대가 되는 부분들 주도하여 설계 및 개발하였습니다.

# 주요 성과
## 세션 관리 체계 구축
- 설계 과정에서 sticky, cluster, global, stateless 등의 세션 관리 방식이 검토되었습니다. 이중 서버 증설 관점에서 sticky 세션은 한 서버에 과부하가 걸릴 수 있다는 단점이, cluster 세션은 모든 서버가 동일한 세션 객체를 가져야 하므로 많은 메모리를 소모하게 되고 서버 개수가 증가함에 따라 동기화 과정에서 성능 저하가 크다는 단점이 있기 때문에 후보에서 제외하였습니다.
 때문에 global session(redis or memcached) 또는 stateless session(jwt token) 방식에 대해 고민을 하였습니다. global 세션 관리방식은 세션 만료 시간 등을 중앙에서 관리하고 여러 서버 간 데이터를 공유할 수 있다는 장점이 있지만, 별도의 서드파티 운영 오버헤드가 생긴다는 단점이 있었습니다. stateless 방식은 별도로 서버에 세션 정보를 저장할 필요가 없으므로 서버 부담이 줄고 별도 서드파티 운영 오버헤드가 발생하지 않는다는 장점이 있지만, token이 통신 과정에서 탈취됐을 때 xss, csrf와 같은 보안 취약하다는 단점이 있었습니다. 
 개발하고 있는 솔루션의 특성을 고려했을 때 차후 사용자가 늘어남에 따라 부하 분산을 위한 구조가 필요하지만, 별도의 세션 통제와 같은 global 세션방식의 이점이 불필요하였고, 고객사마다 사설망에서 솔루션을 운영할 수 있어야 했기 때문에 별도의 서드파티 운영 오버헤드 없이 쉽게 부하 분산할 수 있는 stateless 인증 방식을 선택하였습니다. 
- 인증 절차
1. 최초 로그인시 1시간 동안 유효한 atk(access token)과 하루 또는 일주일 동안 유효한 rtk( token)을 발급하고 rtk는 세션 ID와 함께 별도 저장소(db)에 저장.
2. 클라이언트는 발급받은 atk를 브라우저 메모리에 저장하고, 요청 시 마다 atk를 헤더에 담아 전달. (axios interceptor 설정)
3. spring security 설정에 별도의 filter를 추가하여 요청 시 마다 atk를 검증하고, 만료되거나 유효하지 않으면 rtk에 대한 검증 절차를 거친 후 새로운 atk를 발급.
4. 사용자는 응답에 따라 새로운 atk가 발급되었을 때 이를 받아 기존 atk를 갱신. (axios interceptor 설정)
5. 4.에서 401에러가 발생하면 로그인 페이지로 이동.
- 사용자가 앱에 최초 접근 시 atk를 사용하여 private api(ex> api/user-info)를 호출하고 정상적으로 응답을 받았을 때 기본 라우터로 이동하도록 하였고, 그렇지 않을 때에는 로그인 페이지로 이동하도록 하였습니다. 추가로 router에 대한 직접 접근을 막기 위해 라우터 가드를 사용하여 private 경로에 대한 접근을 제한하였습니다.

## 보안, 권한 관리 정책
- api 접근을 통제하기 위해 아래와 같이 api를 구분하고 1차로 권한을 검사하였습니다. 
1. /api/authenticate, /api/register, /management/health 등 >> 인증이 불필요한 public api
2. 1. 이외에 /api/** >> 인증 필요 private api
3. /api/admin/**, /management/** >> 인증 외에 추가적인 권한이 필요한 admin api

- private api들에 대해 접근할 경우 인증 절차를 거친 후에는 2차로 spring security 모듈의 PreAuthorize 어노테이션을 사용하여 메소드 호출 전에 권한을 추가로 검사하였습니다.
- CSP(Content-Security-Policy) 헤더를 설정하여 script, style, img, font등의 자원별로 허용할 출처를 제한하였습니다. 기본적으로 self로 설정하여 동일 출처에서만 자원을 사용할 수 있도록 하였고, script-src는 self, unsafe-inline, unsafe-eval을 허용, style-src는 self, unsafe-inline을 허용하도록 하였습니다. 이런 설정들을 통해 xss 공격을 방지하였습니다.
- Permission-Policy 헤더를 설정하여 사용할 수 있는 기능을 제한하였습니다. (ex> 제한: camera, geolocation, gyroscope, magnetometer, microphone, midi, payment, sync-xhr. 허용: fullscreen(self))
- Referrer-Policy 헤더를 설정하여 불필요한 출처 정보 노출을 방지하였습니다. 제한은 strict-origin-when-cross-origin으로 설정하여 tls를 통해 전송되는 동일 출처 요청에 대해서만 referrer를 전송하도록 하였습니다.
- 사용자가 로그인 시 브라우저 메모리 공간(redux store)에 권한 정보를 설정하고, 이에 따라 router 경로를 제한하였습니다. 이때 중첩 라우터와 라우터 가드를 사용해 api와 마찬가지로 public, private, admin등으로 구분하여 경로 설정을 구분하고 관리하였습니다.

## 예외 처리 정책
1. backend
-  @ControllerAdvice, @ExceptionHandler를 사용하여 예외처리를 공통화하였고 에러 응답 코드와 미리 정의된 i18n key를 사용하여 메시지를 관리하도록 하였습니다.

2. frontend
- error와 alert 메시지를 관리하는 middleware를 추가하여 에러처리를 공통화하였습니다. 에러 응답 시 에러 코드와 미리 정의된 i18n key를 사용하여 메시지를 관리하도록 하였습니다.

## 로깅 정책
1. backend
- logback 설정을 통해서 개발과 운영환경에서의 로그 출력을 통제하고 debug, info 등 로깅 level을 구분하여 개발 시 로그 확인을 원활히 하고 운영환경에서 필요한 출력 로그를 최소화하여 성능을 향상하도록 설정하였습니다. 
- @Profile과 @Aspect를 사용하여 dev 환경에서 로그를 상세하게 확인할 수 있도록 별도의 설정을 추가하였습니다. @AfterThrowing을 사용하여 예외 발생 시 로그를 기록하고 @Around를 사용하여 메서드 호출 전후에 로그를 출력하도록 하였습니다.

2. frontend
- dev환경에서 빌드할 경우 source map을 생성하도록 설정하여 개발환경에서 디버깅을 용이하게 하였습니다.
- store 설정에 logger middleware를 추가하여 개발환경에서 type, payload, meta, error 등의 상태 변화를 쉽게 확인할 수 있도록 하였습니다.