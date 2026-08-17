# VDI·Thin Client·Zero Client

## 이 문서에서 되짚을 질문

- VDI는 서버 가상화와 같은 말인가?
- Thin Client와 Zero Client는 가상 Desktop 자체인가, 접속 단말인가?
- Zero PC는 Server인가, PC인가, VDI 제품명인가?

## VDI란 무엇인가

VDI(Virtual Desktop Infrastructure)는 사용자 Desktop을 중앙 Data Center나 Cloud의 VM에서 실행하고 화면·입력만 Network로 전달하는 구조다.

사용자의 단말에는 업무 Data가 적게 남고, 중앙에서 Desktop Image·Patch·권한을 관리할 수 있다. 반면 Network 지연, 중앙 Infrastructure 장애, 동시 접속 부하, GPU·Storage I/O 병목이 사용자 경험에 직접 영향을 준다.

사용자가 보는 Windows 화면이 단말에서 실행되는 것처럼 보여도 실제 애플리케이션 실행과 Data 처리는 중앙 VM에서 일어난다. 단말은 키보드·마우스 입력을 보내고 바뀐 화면을 받아 표시한다. 따라서 VDI는 단순 원격 파일 저장이 아니라 **Desktop 실행 위치를 중앙으로 옮기는 구조**다.

서버 가상화는 VDI를 구현하는 기반이 될 수 있지만 목적이 다르다. 서버 가상화는 서버 업무를 통합하고, VDI는 사용자별 Desktop을 제공한다.

## Thin Client

Thin Client는 제한된 Local OS와 CPU·Memory·Storage를 가진 경량 단말이다. Remote Desktop Client 외에도 Browser나 일부 Local 애플리케이션을 실행할 수 있다.

- 장점: 일반 PC보다 관리 대상과 Local Data를 줄일 수 있다.
- 단점: OS Patch와 단말 보안관리가 여전히 필요하다.

Thin은 “아무것도 없다”가 아니라 일반 PC보다 Local 기능이 줄었다는 뜻이다. 경량 OS가 있기 때문에 접속 프로그램 외의 Browser나 보조 프로그램을 실행할 수 있지만, 그만큼 단말 자체의 관리도 남는다.

## Zero Client

Zero Client는 범용 Local OS와 저장공간을 거의 두지 않고 특정 Remote Display Protocol과 VDI 접속에 집중한 단말이다.

- 장점: 부팅과 관리가 단순하고 Local Data 유출 면적이 작다.
- 단점: 특정 VDI 환경과 Protocol 의존성이 크고, Server·Network 장애 시 작업하기 어렵다.

Zero는 Local 컴퓨팅 기능을 최대한 없앴다는 뜻이지, CPU나 Firmware가 물리적으로 전혀 없다는 뜻은 아니다. 부팅과 원격 접속에 필요한 최소 기능은 있어야 한다. Thin과 Zero의 경계는 제품마다 다르므로 이름보다 Local OS·저장공간·독립 실행 기능을 확인해야 한다.

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
