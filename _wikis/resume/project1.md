#kotlin #spring boot #jpa #liquibase #junit #typescript #react #jest

# 시스템 개요
- 병원별로 배치를 통한 1차 데이터 마트 구성, 의무기록사의 정제를 통한 2차 마트 구성(원본과 실시간 데이터 비교), 실무자가 환자 상태를 지속해서 추적하면서 데이터 입력 등 다방향으로 데이터를 기록하는 시스템입니다. 후에 이 데이터들에 대한 대시보드를 제공하고, 데이터에 기반을 둔 별도 예측 모델 구축을 통해 환자에 대한 추가적인 인사이트를 제공합니다. 

# 인력 구성
- 서버 4명, 클라이언트 3명, 기획 2명, DBA 2명, 데이터 사이언티스트 2명 등으로 TF팀이 구성되어 개발을 진행하였습니다.

# 주요 역할 
- 개발 PL 로서 시스템의 전체적인 구조 및 설계를 진행하였습니다. 
- 풀스택 개발자로서 서버, 클라이언트 작업을 병행 하였습니다. 
- 공동 작업을 위한 환경 구성, 핵심 도메인, 인증, 보안 체계 등 시스템의 주요 뼈대가 되는 부분들 주도하여 설계 및 개발하였습니다.

# 주요 성과
## 개발 환경 구성
1. backend
- spring boot를 사용하여 개발하였고 생산성 향상을 위해 java대신 kotlin을 사용하였습니다.
- 유연한 환경 구성을 위해 xml기반의 maven이 아닌 groovy, kotlin등의 동적 스크립트 언어를 지원하는 gradle을 사용하였습니다.
- 개발, 운영 환경 설정을 분리하여 각각 환경의 특성에 맞게 설정을 관리하였습니다. (ex> build.gradle, profile_dev.gradle, profile_prod.gradle)
- 개발 환경에서 database를 h2로 설정하여 network나 별도 외부 상황에 영향을 받지 않도록 하였습니다.
- liquibase를 사용하여 데이터베이스 형상과 이력을 관리하였습니다.

2. frontend
- react를 사용하여 개발하였고 생산성 향상을 위해 javascript대신 typescript를 사용하였습니다.
- 의존성 관리와 빌드를 위해 npm, webpack을 사용하였습니다.
- 개발, 운영 환경 설정을 분리하여 각각 환경의 특성에 맞게 설정을 관리하였습니다. (ex> webpack.common.js, webpack.dev.js, webpack.prod.js)
- scss를 사용하여 css를 전처리하였고, postcss를 사용하여 css를 후처리하였습니다. (autoprefixer 사용하여 브라우저 호환성을 향상했습니다.)
- 운영환경에서는 runtimeChunk제거를 통해 서버로의 http 요청 수를 줄이고 압축, 난독화를 통해 파일 크기를 줄여 성능을 향상했습니다.
- 초기 개발 단계에 도메인 모델을 우선으로 구축하고 이에 대응하는 임시 json api 서버를 구축하여 프론트엔드 개발이 백엔드 개발과 병행될 수 있도록 하였습니다.

>> autoprefixer: webpack -> postcss-loader 설정으로 추가
>> runtimeChunk: webpack -> optimization 설정으로 추가하여 http 요청수를 줄임. runtimeChunk를 제거하면(false) 런타임 정보가 메인 번들에 포함되게 됨)



## 코드 품질 관리 및 테스트 정책  
- editorconfig를 사용하여 에디터간 일관된 코드 스타일을 유지하도록 하였습니다. .editorconfig를 프로젝트 루트에 추가하고 줄 바꿈 문자, 인코딩, 줄 끝 공백, 들여쓰기 타입, 들여쓰기 크기 등의 문서 입력 기본 설정을 제어하였습니다.

>> 줄바꿈 문자: LF (vs CRLF) - crlf는 윈도우에서만 사용되는 문자로, git에서는 LF로만 관리하도록 설정. 바이트 코드 차이로 인한 문제를 방지.
>> trim_trailing_whitespace: true - 끝 공백 제거
>> insert_final_newline: true - 마지막 줄에 빈 줄 추가
>> indent_style: space - 탭 대신 스페이스 사용
>> indent_size: 2 - 들여쓰기 크기 2로 설정

1. backend
- junit을 사용하여 테스트 코드를 작성하고 jacoco를 사용하여 코드 커버리지를 검사하였습니다. sonarqube에 jacoco 리포트를 연동하여 코드 커버리지, 코드 품질을 개발자들이 쉽게 확인할 수 있도록 하였습니다.
- 단위 테스트와 통합 테스트를 분리하여 작성하였습니다. 이를 통해 테스트의 목적을 명확히 하고 테스트의 속도와 안정성을 높였습니다.
- 통합 테스트 실행시 testcontainers 모듈을 사용하였습니다. 이를 통해 운영환경과 동일한 환경에서 배포 전에 테스트를 진행할 수 있도록 하였습니다.
- ktlint를 사용하여 컴파일 시 코드 스타일을 사전에 검사하였습니다. compileKotlin 태스크의 의존성 task로 ktlintFormat을 추가하여 compile 전에는 코드 스타일을 자동으로 포매팅하였습니다.

2. frontend
- jest를 사용하여 테스트 코드를 작성하였고 sonarqube에 jest 리포트를 연동하여 코드 커버리지, 코드 품질을 개발자들이 쉽게 확인할 수 있도록 하였습니다.
- 개발시 eslint을 사용하여 지속해서 코드 품질을 검사하였고, prettier를 사용하여 코드 스타일을 통일하였습니다.
- webpack plugin으로 EslintPlugin을 사용하여 빌드시 코드 품질을 검사하였습니다.
- husky와 lint-staged를 사용하여 커밋 전에 prettier로 코드 포매팅을 자동화하였습니다. (git pre-commit hook)

## 성능 향상 정책
- WebMvcConfigurer 설정을 오버라이딩하여 정적 자원에 대한 응답 시 Cache-Control 헤더 설정을 통해 브라우저가 캐싱 자원을 사용할 수 있도록 하였습니다. max-age를 매우 긴 시간(ex> 3년)으로 설정하여 브라우저 캐싱을 최대한 활용하도록 하였습니다. 추가로 public 설정을 통해 프록시 등의 중간 캐시 서버가 존재하는 경우 이를 통해 캐싱할 수 있도록 하였습니다.
- 서버 재배포 후에 이전 정적 자원들이 브라우저에 의해 캐싱 되는 것을 방지하기 위해 webpack 빌드시 파일명에 해시값을 추가하였습니다.
- hibernate 1차 캐시(영속성 매니저)에 더해 2차 캐시를 사용하여 성능을 향상했습니다. 엔티티별로 성격에 따라 READ_ONLY, NONSTRICT_READ_WRITE, READ_WRITE, TRANSACTIONAL등의 캐시 전략을 구분하여 동시성 유지 과정에서 발생하는 오버헤드를 줄였습니다.
- @EnableCaching을 사용하여 스프링 어플리케이션 내의 캐시를 활성화였고, @Cacheable을 사용하여 필요에 한 경우 메서드 호출 결과들을 캐싱하였습니다. 이를 통해 디스크 I/O를 줄이고 성능을 향상했습니다.
- 분산 환경에서는 hibernate 2차 캐시와 스프링 캐시를 redis를 사용하여 구성하였습니다. 이를 통해 서버간 데이터 공유를 통해 성능을 향상했습니다.

## JPA 성능 최적화 정책
JPA를 보다 효과적으로 사용하기 위해 아래와 같은 정책을 수립하였습니다.

- 다대일 관계가 필요한 경우 서로 다른 생명주기의 개체 간에는 참조를 사용하고, 같은 생명주기 내 개체 간에는 값 타입을 사용하도록 하였습니다. (many to one과 element collection을 구분하여 사용)
- 개체 간 참조 시 복잡도를 낮추기 위해 one to many를 지양하고, 되도록 many to one을 사용하여 개체 간 참조하도록 하였습니다.
- 한 개체에 속성이 많아 복잡도가 높아지는 경우 @Embeddable을 사용하여 별도 값 타입을 분리하였습니다.
- 다대다 관계가 필요한 경우 다른 생명주기의 객체 간에는 중간 엔티티를 추가하여 다대일 관계로 풀어내도록 하고, 하나의 엔티티가 관계 형성의 완전한 주체가 되는 경우만 many to many를 예외적으로 허용하여 개체 간 복잡도를 낮췄습니다.
- @OneToMany, @ManyToMany, @ElementCollection을 사용할 때 N+1 문제를 방지하기 위해  fetch join이 필요한 경우 각 쿼리에 @EntityGraph를 사용하여 명시적으로 fetch join을 사용하도록 하였습니다. (FetchType.EAGER를 사용하지 않은 이유는 모든 쿼리에 대해 fetch join을 사용하면 성능이 저하될 수 있기 때문입니다.)
- 동적 쿼리를 작성하기 위해 QueryDSL 환경을 구축하는 대신 JPA Specification을 사용하여 동적 쿼리를 작성하였습니다. 이를 통해 별도의 서드파티 의존성을 줄이고, JPA의 표준화된 쿼리 작성 방식을 사용하도록 하였습니다.
- 엔티티의 변경 이력을 관리하기 위해 @EnableJpaAuditing, @MappedSuperclass, @EntityListeners 사용하여 audit 정보를 엔티티들이 공통으로 관리할 수 있도록 하였습니다.