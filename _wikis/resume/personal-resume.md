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

# 1. 개발 환경 구성

## 1.1. backend
- spring boot를 사용하여 개발하였고 생산성 향상을 위해 java대신 kotlin을 사용하였습니다.
- 유연한 환경 구성을 위해 xml기반의 maven이 아닌 groovy, kotlin등의 동적 스크립트 언어를 지원하는 gradle을 사용하였습니다.
- 개발, 운영 환경 설정을 분리하여 각각 환경의 특성에 맞게 설정을 관리하였습니다. (ex> profile_dev.gradle, profile_prod.gradle)
- 개발 환경에서 database를 h2 local db로 설정하여 network나 별도 외부 상황에 영향을 받지 않도록 하였습니다.
- liquibase를 사용하여 데이터베이스 형상과 이력을 관리하였습니다.

## 1.2. frontend
- react를 사용하여 개발하였고 생산성 향상을 위해 javascript대신 typescript를 사용하였습니다.
- 의존성 관리와 빌드를 위해 npm, webpack을 사용하였습니다.
- 개발, 운영 환경 설정을 분리하여 각각 환경의 특성에 맞게 설정을 관리하였습니다. (ex> webpack.common.js, webpack.dev.js, webpack.prod.js)
- scss를 사용하여 css를 전처리하였고, postcss를 사용하여 css를 후처리하였습니다. (autoprefixer 사용하여 브라우저 호환성을 향상시켰습니다.)
- 운영환경에서는 runtimeChunk제거를 통해 서버로의 http 요청 수를 줄이고 압축, 난독화를 통해 파일 크기를 줄여 성능을 향상시켰습니다.
- 초기 개발 단계에 도메인 모델을 우선적으로 구축하고 이에 대응하는 임시 json api 서버를 구축하여 프론트엔드 개발이 백엔드 개발과 병행될 수 있도록 하였습니다.


# 2. 세션 관리 정책

- 설계 과정에서 sticky, cluster, global, stateless 등의 세션관리 방식이 검토되었습니다. 이중 서버 증설 관점에서 sticky 세션은 한 서버에 과부하가 걸릴 수 있다는 단점이, cluster 세션은 모든 서버가 동일한 세션 객체를 가져야 하므로 많은 메모리를 소모하게되고 서버 개수가 증가함에 따라 동기화 과정에서 성능 저하가 크다는 단점이 있기 때문에 후보에서 제외하였습니다.
 때문에 global session(redis or memcached) 또는 stateless session(jwt token) 방식에 대한 고민을 하였습니다. global 세션 관리방식은 세션 만료 시간등을 중앙에서 관리하고 여러 서버간 데이터를 공유할 수 있다는 장점이 있지만 별도의 서드파티 운영 오버헤드가 생긴다는 단점이 있었습니다. stateless 방식은 별도로 서버에 세션 정보를 저장할 필요가 없으므로 서버 부담이 줄고 별도 서드파티 운영 오버헤드가 발생하지 않는다는 장점이 있지만, token이 통신 과정에서 탈취됐을 때 xss, csrf와 같은 보안 취약하다는 단점이 있었습니다. 
 개발하고 있는 솔루션의 특성을 고려했을 때 차후 사용자가 늘어남에 따라 부하 분산을 위한 구조가 필요하지만, 별도의 세션 통제와 같은 global 세션방식의 이점이 불필요하였고, 고객사마다 사설망에서 솔루션을 운영할 수 있어야했기 때문에 별도의 서드파티 운영 오버헤드없이 쉽게 부하분산할 수 있는 stateless 인증 방식을 선택하였습니다. 
- 구현한 최종 인증 절차는 우선 최초 로그인시 사용자에게 1시간동안 유효한 atk(access token)와 하루 또는 일주일동안 유효한 rtk(refresh token)을 발급하도록 하였습니다. 사용자는 응답받은 atk, atk 발급시간, rtk를 각각 브라우저 storage(atk는 session storage, rtk는 local storage)에 저장해놓고 atk가 만료되었거나 존재하지 않을 경우에는 rtk를 사용하여 새로운 atk를 발급받고 아닐 시에는 header에 atk를 담아 요청을 보내도록 하였습니다. 
- token을 사용할 때 발생하는 보안 취약점은 이중 토큰(access, refresh), 인증키 암호화등의 방법을 통해 보완 하였고 atk, rtk 전달시에 쿠키가 아닌 request header에 token을 담아 전달함으로써 노출을 최소화하고 csrf에 대한 취약점을 방지하였습니다.
- axios interceptor 설정을 통해 atk를 요청 header에 담는 절차와 rtk를 통한 atk갱신 절차를 공통화하였습니다. 
- 사용가가 앱에 최초 접근시 브라우저의 storage에 저장된 atk, rtk를 사용하여 private api(ex> api/user-info)를 호출하고 정상적으로 응답을 받았을 경우에는 기본 라우터로 이동하도록 하였고, 그렇지 않을 경우에는 로그인 페이지로 이동하도록 하였습니다. 추가로 router에 대한 직접 접근을 막기 위해 라우터 가드를 사용하여 private 경로에 대한 접근을 제한하였습니다.
- 후에 별도 메모리 db에 (ex> redis)에 atk, rtk 그리고 각 토큰의 만료 시간을 설정함으로써 토큰 검증 시간을 줄여 성능을 향상시킬 수 있을 것으로 예상됩니다. 


# 3. 보안, 권한 관리 정책
- api 접근을 통제하기 위해 아래와 같이 api를 구분하고 1차로 권한을 검사하였습니다. 
1. /api/authenticate, /api/register, /management/health 등 >> 인증이 불필요한 public api
2. 1. 이외에 /api/** >> 인증 필요 private api
3. /api/admin/**, /management/** >> 인증 외에 추가적인 권한이 필요한 admin api

- private api들에 대해 접근할 경우 인증 절차를 거친 후에는 2차로 spring security 모듈의 PreAuthorize 어노테이션을 사용하여 메소드 호출 전에 권한을 추가로 검사하였습니다.
- CSP(Content-Security-Policy) 헤더를 설정하여 script, style, img, font등의 자원별로 허용할 출처를 제한하였습니다. 기본적으로 self로 설정하여 동일 출처에서만 자원을 사용할 수 있도록 하였고, script-src는 self, unsafe-inline, unsafe-eval을 허용, style-src는 self, unsafe-inline을 허용하도록 하였습니다. 이런 설정들을 통해 xss 공격을 방지하였습니다.
- Permission-Policy 헤더를 설정하여 사용할 수 있는 기능을 제한하였습니다. (ex> 제한: camera, geolocation, gyroscope, magnetometer, microphone, midi, payment, sync-xhr. 허용: fullscreen(self))
- Referrer-Policy 헤더를 설정하여 불필요한 출처 정보 노출을 방지하였습니다. 제한은 strict-origin-when-cross-origin으로 설정하여 tls를 통해 전송되는 동일 출처 요청에 대해서만 referrer를 전송하도록 하였습니다.
- 사용자가 로그인시 브라우저 메모리 공간(redux store)에 권한 정보를 설정하고, 이에 따라 router 경로를 제한하였습니다. 이때 중첩 라우터와 라우터 가드를 사용해 api와 마찬가지로 public, private, admin등으로 구분하여 경로 설정을 구분하고 관리하였습니다.


# 4. 코드 품질 관리 및 테스트 정책  
- editorconfig를 사용하여 에디터간 일관된 코드 스타일을 유지하도록 하였습니다. .editorconfig를 프로젝트 루트에 추가하고 줄바꿈 문자, 인코딩, 줄 끝 공백, 들여쓰기 타입, 들여쓰기 크기 등의 문서 입력 기본 설정을 제어하였습니다.

## 4.1. backend
- junit을 사용하여 테스트 코드를 작성하고 jacoco를 사용하여 코드 커버리지를 검사하였습니다. sonarqube에 jacoco 리포트를 연동하여 코드 커버리지, 코드 품질을 개발자들이 쉽게 확인할 수 있도록 하였습니다.
- 단위 테스트와 통합 테스트를 분리하여 작성하였습니다. 이를 통해 테스트의 목적을 명확히 하고 테스트의 속도와 안정성을 높였습니다.
- 통합 테스트 실행시 testcontainers를 사용하여 별도의 테스트용 데이터베이스를 생성하고 테스트를 진행하였습니다. 이를 통해 테스트 환경을 독립적으로 구성하고 운영환경과 동일한 db 환경에서 배포 전에 테스트를 진행하였습니다.
- ktlint를 사용하여 컴파일시 코드 스타일을 사전에 검사하였습니다.  compileKotlin 태스크의 의존성 task로 ktlintFormat을 추가하여 compile 전에는 코드 스타일을 자동으로 포맷팅하였습니다.

## 4.2. frontend
- jest를 사용하여 테스트 코드를 작성하였고 sonarqube에 jest 리포트를 연동하여 코드 커버리지, 코드 품질을 개발자들이 쉽게 확인할 수 있도록 하였습니다.
- 개발시 eslint을 사용하여 지속적으로 코드 품질을 검사하였고, prettier를 사용하여 코드 스타일을 통일하였습니다.
- webpack plugin으로 EslintPlugin을 사용하여 빌드시 코드 품질을 검사하였습니다.
- husky와 lint-staged를 사용하여 커밋 전에 prettier로 코드 포맷팅을 자동화하였습니다. (git pre-commit hook)


# 5. 성능 향상 정책
- WebMvcConfigurer 설정을 오버라이딩하여 정적 자원에 대한 응답시 Cache-Control 헤더 설정을 통해 브라우저가 캐싱 자원을 사용할 수 있도록 하였습니다. 또한, 서버 재배포 후에 이전 자원들에 대한 브라우저 캐싱을 방지하기 위해 webpack 빌드시 파일명에 해시값을 추가하여 캐싱을 방지하였습니다.
- hibernate 1차 캐시(영속성 매니저)에 더해 2차 캐시를 사용하여 성능을 향상시켰습니다. 엔티티별로 성격에 따라 READ_ONLY, NONSTRICT_READ_WRITE, READ_WRITE, TRANSACTIONAL등의 캐시 전략을 사용하여 갱신 과정에서 발생하는 오버헤드를 줄였습니다. 분산 환경에서는 redis를 사용하여 2차 캐시를 구성하였습니다.
- 별도의 spring cache 설정을 통해 메서드 호출 결과를 캐싱하였습니다. 이를 통해 데이터베이스 쿼리를 최소화하고 성능을 향상시켰습니다.


# 6. JPA 성능 최적화 정책
JPA를 보다 효과적으로 사용하기 위해 아래와 같은 정책을 수립하였습니다.

- 다대일 관계가 필요한 경우 서로 다른 생명주기의 개체 간에는 참조를 사용하고, 같은 생명주기 내 개체 간에는 값 타입을 사용하도록 하였습니다. (many to one과 element collection을 구분하여 사용)
- 개체 간 참조시 복잡도를 낮추기 위해 one to many를 지양하고, 되도록 many to one을 사용하여 개체 간 참조하도록 하였습니다.
- 다대다 관계가 필요한 경우 다른 생명주기의 객체 간에는 중간 엔티티를 추가하여 다대일 관계로 풀어내도록 하고, 하나의 엔티티가 관계 형성의 완전한 주체가 되는 경우만 many to many를 예외적으로 허용하여 개체 간 복잡도를 낮췄습니다.
- 한 개체에 속성이 많아 복잡도가 높아지는 경우 @Embeddable을 사용하여 별도 값 타입을 분리하였습니다.
- N+1 문제를 방지하기 위해 FetchType.LAZY를 관계의 기본으로 하고, fetch join이 필요한 경우 @EntityGraph 설정에 연관 엔티티를 직접 명시 하였습니다.
- query dsl보다는 jpa criteria를 사용하여 쿼리를 작성하도록 하였습니다. 이를 통해 별도의 서드파티 의존성을 줄이고, jpa의 표준화된 쿼리 작성 방식을 사용하도록 하였습니다.
- 엔티티의 변경 이력을 관리하기 위해 @EnableJpaAuditing, @MappedSuperclass, @EntityListeners 사용하여 audit 정보를 엔티티들이 공통으로 관리할 수 있도록 하였습니다.


# 7. 예외 처리 정책
- backend는 @ControllerAdvice, @ExceptionHandler를 사용하여 예외처리를 공통화하였고 에러 응답 코드와 미리 정의된 i18n key를 사용하여 메시지를 관리하도록 하였습니다.
- frontend는 error와 alert 메시지를 관리하는 middleware를 추가하여 에러처리를 공통화하였습니다. 에러 응답시 에러 코드와 미리 정의된 i18n key를 사용하여 메시지를 관리하도록 하였습니다.


# 8. 로깅 정책
- backend는 logback 설정을 통해서 개발과 운영환경에서의 로그 출력을 통제하고 debug, info등 로깅 level을 구분하여 개발시 로그 확인을 원할히하고 운영환경에서 필요한 출력 로그를 최소화하여 성능을 향상시키도록 설정하였습니다. 분산환경에서 로그를 통합 관리하기 위해 별도의 로그 서버를 구축하고 logstash를 사용하여 로그를 수집하도록 하였습니다. logback의 LogstashTcpSocketAppender를 사용하여 운영환경에서는 logstash agent를 사용하여 kibana로 로그를 수집하도록 하였습니다.
- backend는 @Profile과 @Aspect를 사용하여 dev 환경에서 로그를 상세하게 확인할 수 있도록 별도의 설정을 추가하였습니다. @AfterThrowing을 사용하여 예외 발생시 로그를 기록하고 @Around를 사용하여 메서드 호출 전후에 로그를 출력하도록 하였습니다.
- frontend는 dev환경에서 빌드할 경우 source map을 사용하여 디버깅을 용이하게 하였습니다.


## 9. 기타
- 기존 프로젝트들에서 lombok을 사용하여 객체의 getter, setter, equals, hashcode, toString등을 자동화하였지만, kotlin data class 사용으로 인해 lombok의 효용성이 줄었다고 판단하여 
의존성을 제거하였습니다. 대신 객체 변환과정에서 코드 중복을 줄이기 위해 mapstruct를 사용하였고 dto와 entity간의 변환을 자동화하였습니다.
- frontend에서 전송하는 요청은 전송전에 formik을 사용하여 검증하였습니다. backend에서 전달받는 사용자의 모든 요청은 DTO를 통해 전달받도록 하였고, 요청은 @Valid를 사용하여 재검증하였습니다.
<!-- - database 장애 또는 네트워크 문제등으로 인한 업무 비효율을 개선하기 위해 개발 환경과 운영 환경에서의 profile을 구분하여 개발 환경에서는 h2 local file db 또는 실제 운영 환경과 동일한 docker instance를 사용할 수 있도록 환경을 구성하였습니다. 서버 배포 전에는 SqlTestContainer를 사용하여 postresql 환경을 구성하고 테스트를 진행하여 실제 운영 환경과 동일한 환경에서 통합 테스트를 진행하였습니다. -->
- redux toolkit의 createSlice를 사용하여 action과 reducer를 통합하여 관리하였고, immer를 사용하여 불변성을 유지하도록 하였습니다. 이 과정에서 createSlice가 지원하는 extraReducers와 createAsyncThunk를 사용하여 비동기 액션을 보다 효율적으로 관리하였습니다. builder에서는 addCase, addMatcher를 구분하여 createAsyncThunk의 pending, fulfilled, rejected에 따라 상태를 관리하였습니다.
- swagger를 사용하여 api 문서를 자동화하였고, api 문서를 통해 개발자들이 api를 쉽게 확인할 수 있도록 하였습니다. 이를 통해 api 문서를 통해 개발자들이 api를 쉽게 확인할 수 있도록 하였습니다.


## 10. 암호화  정책 
- 매우 민감한 고과 정보를 다루는 솔루션의 특성상 암호화 정책을 강화하였습니다. 단방향, 양방향, 해싱등의 방법을 사용하여 암호화를 적용하였습니다.
단방향 암호화는 복호화가 불필요한 패스워드, 토큰, 키 등에 사용하였고, 양방향 암호화는 복호화가 필요한 개인정보, 고과정보 등에 사용하였습니다. 해싱은 고과정보에 대한 무결성을 보장하기 위해 사용하였습니다.
- 양방향 암호화 방식 선택 과정에서 어플리케이션 레벨에서 암호화를 적용할지, 데이터베이스 레벨에서 암호화를 적용할지 고민하였습니다. 어플리케이션 레벨에서 암호화를 적용할 경우 보안 정책을 유연하게 변경할 수 있는 장점이 있지만, 데이터베이스 레벨에서 암호화를 적용할 경우 별도의 추가적인 작업이 불필요한 장점이 있었습니다. 
반면 어플리케이션 레벨에서 암호화활 경우 앱의 성능이 저하될 수 있고, 데이터베이스 레벨에서 암호화를 적용할 경우 데이터베이스의 성능이 저하될 수 있었습니다.
결국 어플리케이션 레벨에서 암호화를 적용하였고, 별도의 암호화 키를 사용하여 암호화를 적용하였습니다. 이를 통해 암호화 키가 노출되었을 때의 보안 취약점을 방지하였습니다.
- 단방향 암호화는 bcrypt를 사용하여 패스워드를 암호화하였고, 양방향 암호화는 jasypt를 사용하여 개인정보, 고과정보를 암호화하였습니다. 해싱은 sha256을 사용하여 고과정보에 대한 무결성을 보장하였습니다.
- 단방향 암호화를 위한 알고리즘으로 md5, sha256, bcrypt등의 방식이 검토되었습니다. 안전성 측면에서 취약한 md5는 제외되었습니다. 개별 salt를 사용하여 보안 강도가 높은 bcrypt를 패스워드 암호화에 사용하였습니다. 무결성 보장만을 위한 해싱에는 sha256을 사용하였습니다.
- 양방향 암호화를 위한 알고리즘으로 aes, des, rsa등의 방식이 검토되었습니다. 
필요한 부분이 대칭키 암호화였기 때문에 rsa는 제외되었습니다. 안전성 측면에서 취약한 des는 제외되었습니다. 별도의 키를 사용하여 보안 강도가 높은 aes를 사용하여 개인정보, 고과정보를 암호화하였습니다.


# EsLint

- 일관성 있는 코드 컨벤션 유지를 위해 사용 (코드 구현 방식을 통일)
- .eslintrc.json을 프로젝트 루트에 추가하면 코드 품질을 검사할 수 있다.
- .eslintignore를 프로젝트 루트에 추가하면 검사에서 제외할 파일을 설정할 수 있다.:

# Prettier

- 코드 포맷팅을 위해 사용 (코드 스타일을 통일)
- .prettierrc를 프로젝트 루트에 추가하면 코드 포맷팅을 설정할 수 있다.
- .prettierignore를 프로젝트 루트에 추가하면 포맷팅에서 제외할 파일을 설정할 수 있다.

# .npmrc

- npm 패키지 설치 시 사용할 레지스트리를 설정할 수 있다.
- legacy-peer-deps = true: npm 7에서 peerDependencies를 설치할 때 오류가 발생하는 경우 사용
- registry = https://registry.npmjs.org: npm 패키지를 설치할 레지스트리를 설정
- @fortawesome:registry=https://npm.fontawesome.com/: fontawesome 패키지를 설치할 레지스트리를 설정
- //npm.fontawesome.com/:\_authToken=YOUR
- //npm.fontawesome.com/:\_authToken=YOUR: fontawesome 패키지를 설치할 때 사용할 인증 토큰을 설정
- @fortawesome:registry=https://npm.fontawesome.com/: fontawesome 패키지를 설치할 레지스트리를 설정

# husky & lint-staged

- git commit 시 코드 품질을 검사하고 코드 포맷팅을 적용할 수 있다.
- husky: git hook을 설정할 수 있다.
- lint-staged: git에 staged된 파일을 대상으로 코드 품질을 검사하고 코드 포맷팅을 적용할 수 있다.
- commit전에 prettier로 코드 포맷팅을 적용하고 eslint로 코드 품질을 검사한다. 
- .huskyrc를 프로젝트 루트에 추가하면 git hook을 설정할 수 있다.
- .lintstagedrc.js 파일을 프로젝트 루트에 추가하면 lint-staged 설정을 할 수 있다.


# postcss.config.js
- postcss를 사용하여 css를 전처리할 수 있다.
- autoprefixer: 브라우저 호환성을 위해 사용 - 지원할 브라우저 버전을 설정하면 해당 버전에 맞게 css를 전처리한다.
