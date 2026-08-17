# VDI·Thin Client·Zero Client

## VDI란 무엇인가

VDI(Virtual Desktop Infrastructure)는 사용자 Desktop을 중앙 Data Center나 Cloud의 VM에서 실행하고 화면·입력만 Network로 전달하는 구조다.

사용자의 단말에는 업무 Data가 적게 남고, 중앙에서 Desktop Image·Patch·권한을 관리할 수 있다. 반면 Network 지연, 중앙 Infrastructure 장애, 동시 접속 부하, GPU·Storage I/O 병목이 사용자 경험에 직접 영향을 준다.

## Thin Client

Thin Client는 제한된 Local OS와 CPU·Memory·Storage를 가진 경량 단말이다. Remote Desktop Client 외에도 Browser나 일부 Local 애플리케이션을 실행할 수 있다.

- 장점: 일반 PC보다 관리 대상과 Local Data를 줄일 수 있다.
- 단점: OS Patch와 단말 보안관리가 여전히 필요하다.

## Zero Client

Zero Client는 범용 Local OS와 저장공간을 거의 두지 않고 특정 Remote Display Protocol과 VDI 접속에 집중한 단말이다.

- 장점: 부팅과 관리가 단순하고 Local Data 유출 면적이 작다.
- 단점: 특정 VDI 환경과 Protocol 의존성이 크고, Server·Network 장애 시 작업하기 어렵다.

## Zero PC

Zero PC는 표준화된 기술 분류라기보다 제품·사업자 문맥에서 사용하는 명칭인 경우가 많다. 일반적으로 중앙의 가상 Desktop을 사용하는 단말 또는 VDI Solution을 가리킨다.

따라서 Zero PC를 별도의 Server 종류로 이해하면 안 된다. 핵심 기술은 VDI이고, Zero/Thin Client는 VDI에 접속하는 단말 선택지다.

## 일반 PC와 비교

- 일반 PC: 애플리케이션과 Data가 Local에서 실행·저장됨
- Thin Client: 일부 Local 기능을 유지하면서 중앙 Desktop 사용
- Zero Client: Local 기능을 최소화하고 중앙 Desktop에 의존

## 설계 고려사항

- Network 지연·대역폭·끊김
- Boot Storm과 로그인 집중 부하
- Desktop Image와 사용자 Profile 관리
- Storage IOPS와 GPU 요구
- 인증·MFA·단말 통제
- 중앙 장애 범위와 HA·DR
- Offline 업무 필요성
- License와 Vendor 종속

## 기억 흐름

Desktop과 Data의 단말 종속 문제
→ VDI로 실행환경을 중앙화
→ 단말의 Local 기능을 어느 정도 남길지 결정
→ 일반 PC / Thin Client / Zero Client 선택
