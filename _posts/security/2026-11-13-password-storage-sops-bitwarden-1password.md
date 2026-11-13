---
title       : "비밀번호는 어디에 보관할까? SOPS+age, Bitwarden, 1Password"
description : "개인 접속정보, Git 설정, 실행 중 사용하는 비밀값의 보관 방식을 비교하고, 기기 분실과 키 유출에 대비한다."
date        : 2026-11-13 12:00:00 +0900
updated     : 2026-11-13 12:00:00 +0900
categories  : [security, "개념·비교"]
tags        : [password-manager, sops, age, bitwarden, 1password, recovery, guide]
pin         : false
hidden      : false
---

암호화한 비밀번호 파일을 Git에 보관하면 PC를 바꿔도 파일은 다시 받을 수 있다. 하지만 복호화에 필요한 키가 이전 PC에만 있었다면 파일을 받아도 내용을 읽지 못한다. **파일의 백업과 파일을 여는 수단의 백업은 별개**이기 때문이다.

## 누가 무엇을 꺼내 쓰는가

비밀번호를 사람이 찾아 입력하는지, 배포할 설정을 Git에서 가져오는지, 애플리케이션이 실행 중에 조회하는지부터 정하면 선택지가 좁아진다. 그다음에는 **비밀값이 어디에 있고, 누가 어떤 권한으로 열며, 장애 시 무엇을 복구해야 하는지**를 본다.

| 용도 | 도구 | 저장 위치와 접근 방식 | 운영 부담 |
|---|---|---|---|
| 사람이 웹·서버 접속정보를 조회 | Bitwarden, 1Password | 암호화된 보관함을 동기화하고 앱에서 잠금 해제 | 기기 등록, 계정·2단계 인증 복구 |
| 배포 설정을 Git으로 버전 관리 | SOPS + age | Git의 암호화 파일을 age 개인키로 열어 사용 | 키 백업, 기기 추가·폐기, 평문 노출 관리 |
| Git 설정의 복호화 권한을 중앙에서 관리 | SOPS + AWS KMS 또는 Vault Transit | 파일은 Git에 두고 서비스 API로 파일의 데이터 키를 복호화 | 정책·인증·감사 관리, 서비스 연결과 가용성 |
| 애플리케이션이 실행 중 비밀값을 조회 | AWS Secrets Manager, Vault KV | 서비스에 저장한 비밀값을 권한 있는 워크로드가 API로 조회 | 실행 환경 인증, 권한 범위, 조회 실패와 갱신 처리 |

### KMS, Vault Transit, Vault KV의 차이

AWS KMS(Key Management Service)는 암호화 키와 그 키를 사용하는 권한을 관리한다. SOPS와 함께 쓰면 SOPS가 파일의 값을 암호화하고, KMS가 그 파일을 여는 데이터 키를 보호한다. 개인키를 기기마다 배포하는 대신 AWS 자격 증명과 키 정책으로 복호화 권한을 관리할 수 있다. 운영 중에는 자격 증명 만료, 키 비활성화·삭제, 서비스 접근 실패도 복호화에 영향을 준다. [AWS KMS 키 문서](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)

HashiCorp Vault는 여러 엔진을 제공한다. **Transit**은 이름이 붙은 키로 암호화·복호화 요청을 처리한다. SOPS는 이 API로 데이터 키를 보호하고 결과를 파일에 보관한다. **KV(Key/Value)**는 경로에 비밀값 자체를 저장하고 조회하는 엔진이다. KV v2는 버전을 관리한다. 직접 Vault를 운영한다면 인증·정책과 함께 서버 가용성, 백업·복구, 업데이트도 맡는다. [Vault Transit API](https://developer.hashicorp.com/vault/api-docs/secret/transit) · [Vault KV](https://developer.hashicorp.com/vault/docs/secrets/kv) · [SOPS의 Transit 연동](https://github.com/getsops/sops/blob/main/hcvault/keysource.go)

AWS Secrets Manager는 데이터베이스 비밀번호나 API 토큰 자체를 저장한다. 애플리케이션은 실행 환경에 부여된 권한으로 값을 읽는다. 지원되는 방식으로 교체를 설정하면 서비스의 자격 증명 갱신도 자동화할 수 있으며, 애플리케이션은 이전 값을 캐시했을 때 다시 읽는 방법을 갖춰야 한다. Secrets Manager는 저장된 비밀값을 보호하는 데 AWS KMS를 사용한다. [AWS Secrets Manager 소개](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html) · [Secrets Manager의 KMS 사용](https://docs.aws.amazon.com/secretsmanager/latest/userguide/security-encryption.html)

## 개인 접속정보를 새 PC에서 열려면

| 선택지 | 새 PC에서 필요한 것 | 사전 복구 준비 |
|---|---|---|
| SOPS+age | 암호화 파일과 age 개인키 또는 다른 복호화 권한 | 개인키 백업 또는 다른 recipient |
| Bitwarden | 계정 이메일·마스터 비밀번호와 해당하는 추가 인증 수단 | 2단계 인증 복구 코드 또는 새 기기 확인에 필요한 이메일 접근 |
| 1Password | 계정 비밀번호와 Secret Key, 설정한 2단계 인증 수단 | Emergency Kit, 미리 생성한 복구 코드 |

세 방식 모두 **사전에 준비하지 않은 복구 수단을 분실 후에 만들어 낼 수는 없다**. 다른 점은 무엇을 따로 보관해야 하는지, 새 기기에서 비밀번호를 꺼내는 과정이 얼마나 간단한지다.

## Bitwarden: 무료로 시작하는 비밀번호 관리자

Bitwarden은 보관함을 계정으로 동기화한다. PC가 바뀌어도 계정에 로그인해 항목을 찾을 수 있고, 기본적인 개인용 비밀번호 관리는 무료로 시작할 수 있다. **한 PC의 로컬 키 파일에만 의존하지 않는 것**이 급할 때 조회하려는 용도에서 장점이다.

하지만 동기화가 곧 무조건적인 복구는 아니다. 일반 개인 계정에서 마스터 비밀번호를 잊으면 Bitwarden 지원팀을 통해 보관함을 되찾을 수 없다. 미리 설정한 긴급 접근 등은 별도의 복구 경로다. 2단계 인증을 켰다면 그 **복구 코드는 인증 수단을 잃었을 때 쓰는 것**이지, 잊어버린 마스터 비밀번호를 되찾는 코드가 아니다. 마스터 비밀번호와 복구 코드를 보관함 안에만 두지 말고, PC 밖의 안전한 곳에 복구 계획을 마련해야 한다.

Bitwarden 클라우드에서 마스터 비밀번호로 로그인하고 2단계 인증을 설정하지 않았다면 새 기기에서 이메일 확인을 요구할 수 있다. 이메일 비밀번호를 보관함에 넣었다면 이메일에도 독립적으로 접속할 수 있는지 확인한다. [Bitwarden 새 기기 로그인 보호](https://bitwarden.com/help/new-device-verification/)

## 1Password: Secret Key와 복구 코드를 함께 생각하기

1Password 역시 계정으로 여러 기기에서 비밀번호를 조회하는 유료 관리자다. 새 기기에서 로그인할 때 필요한 **Secret Key**는 계정 비밀번호와 다른 값이다. 1Password의 Emergency Kit에는 Secret Key 등 로그인 정보가 담기므로, 이를 이전 PC 안에만 두면 PC 교체 때 곤란해질 수 있다.

개인·가족 계정에서는 **미리 생성한 복구 코드**와 계정 이메일 접근 권한으로 계정 비밀번호와 Secret Key를 새로 설정할 수 있다. 복구 코드가 자동으로 모든 계정에 준비되어 있다고 가정해서는 안 된다. 또 복구 절차 후에도 기존 2단계 인증 설정은 유지되므로, 해당 인증 수단의 백업도 따로 확인해야 한다. 가족·팀 계정의 관리자 복구와 개인 계정의 복구 코드는 다른 경로다.

## SOPS+age: Git에 넣을 설정 파일이라면

일반적인 SOPS YAML 설정에서는 값이 암호화되고 필드 이름과 구조는 남는다. SOPS는 파일별 대칭 데이터 키로 값을 암호화하고, age는 공개 recipient를 사용해 그 데이터 키를 보호한다. 해당 개인키가 있는 기기는 인터넷 연결 없이 데이터 키를 복호화할 수 있다. Git에 SOPS 파일을 올려두면 암호화된 파일은 다시 내려받을 수 있지만, **age 개인키까지 Git에 넣어서는 안 된다**. 개인키는 별도로 백업하거나 다른 복호화 권한을 미리 마련해야 한다.

이 방식은 배포 설정, 환경별 설정값처럼 **파일의 형태로 버전을 관리할 대상**에 적합하다. 반면 서버 비밀번호를 급히 찾아 수동 입력하려는 사람에게는 복호화 도구, 개인키, 파일 경로를 모두 챙겨야 해서 번거롭다. SSH 설정 역시 SOPS 파일을 자동으로 읽거나 비밀번호를 채워 주지 않는다.

개인키를 잃었다고 **서버의 실제 비밀번호가 무효가 되는 것은 아니다**. 읽을 방법을 잃은 것과 로그인 자격 증명이 변경된 것은 별개다. SOPS의 구성·명령·키 교체 절차는 [Devkit SOPS 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/sops.md)에 정리했다.

### 개인키 백업과 다중 기기 운영

- **키 보관.** 저장소에는 공개 recipient를 두고 개인키는 접근 권한을 제한한 로컬 파일로 관리한다. 디스크 암호화는 전원이 꺼진 분실 기기의 위험을 줄인다. 편집기 임시 파일·스왑, 터미널 출력, CI 로그에 복호화 값이 남는 경로도 확인한다.
- **복구.** 암호화한 오프라인 매체에 개인키를 백업하거나 별도의 복구용 recipient를 미리 추가한다. 비밀번호 관리자에 키를 백업한다면 새 기기에서 그 관리자와 Git에 먼저 로그인할 수 있어야 한다. 복구 수단을 그 키로 열어야 하는 SOPS 파일 안에만 두면 순환 의존성이 생긴다. 기존 PC가 없다고 가정하고 새 환경에서 테스트용 암호화 파일을 열어 본다.
- **기기 추가.** 같은 키를 복사하면 설정은 단순하지만 유출 시 모든 복사본을 함께 교체해야 한다. 기기마다 키를 만들면 분실 기기의 recipient만 골라 제거할 수 있다. 기존 복호화 권한으로 새 공개키를 대상 파일에 반영하고, 새 기기에서 개인키로 복호화가 되는지 확인한다. 기본 구성에서는 등록된 개인키 중 하나만 있어도 열 수 있으므로 기기별 키와 복구 키가 늘면 보호할 지점도 늘어난다.
- **기기 폐기와 키 유출.** 기존 파일의 recipient 목록을 갱신하는 작업, SOPS 데이터 키를 교체하는 작업, 서버 비밀번호·토큰을 교체하는 작업은 각각 별개다. 유출이 의심되면 남은 복호화 경로를 확인하고, 유출 키를 제외한 구성으로 데이터 키를 교체한다. 공격자가 과거 Git 이력을 이미 복제했을 수 있으므로 노출 가능성이 있는 실제 비밀번호와 토큰도 서비스에서 폐기·교체한다.

### GitHub 비공개 저장소가 보호하는 범위

| 상황 | 위험과 대응 |
|---|---|
| GitHub 계정·토큰 탈취 또는 저장소 복제 | 비공개 설정은 저장소를 읽을 수 있는 계정을 제한한다. 암호화 파일과 복호화 키를 분리하면 저장소만 유출됐을 때 암호화된 값은 보호된다. 파일명과 평문 필드 이름, 암호화에서 제외한 값은 노출될 수 있다. |
| 잠금 해제된 기기 또는 복호화 가능한 CI 침해 | 공격자는 해당 환경의 권한으로 평문에 접근할 수 있다. 개인 보관함과 배포용 비밀을 분리하고 자동화에는 필요한 파일과 권한만 부여한다. |
| 평문 또는 개인키를 실수로 커밋 | 파일을 지운 새 커밋을 올려도 이전 커밋과 다른 복제본에 남을 수 있다. 해당 자격 증명을 먼저 폐기·교체하고 필요한 이력 정리를 진행한다. |

[GitHub의 민감 정보 제거 안내](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) · [SOPS 보안 모델](https://getsops.io/docs/security/)

## 어떻게 고를까

- **사람이 다른 기기에서 비밀번호를 찾아 입력**한다면 비밀번호 관리자를 고른다. 비용 없이 시작하려면 Bitwarden, 유료 구독과 Secret Key 관리가 사용 방식에 맞으면 1Password가 후보가 된다. 실제 쓰는 PC·휴대폰에서 검색과 자동 완성, 공유가 필요한 항목, 새 기기 복구 절차를 기준으로 고른다. [Bitwarden 요금제](https://bitwarden.com/pricing/) · [1Password 개인·가족 요금제](https://1password.com/personal-family-security)
- **애플리케이션 설정 파일을 암호화해 Git으로 관리**한다면 SOPS+age를 쓴다. 이때 파일뿐 아니라 복호화 권한의 백업도 설계한다.
- **여러 실행 환경에서 중앙 조회나 교체가 필요**하다면 AWS에서는 Secrets Manager, Vault를 운영하는 환경에서는 KV를 검토한다. 파일의 Git 이력도 필요하면 SOPS를 유지하면서 KMS 또는 Transit으로 복호화 권한을 관리할 수 있다.
- **SSH 접속 자체**라면 가능할 때 비밀번호 대신 SSH 키 인증을 사용한다. SSH 키도 분실에 대비한 백업 또는 재등록 절차가 필요하다.

이미 읽을 수 없는 SOPS 파일이 있다면 바로 삭제하지 말자. 이전 키나 다른 복호화 수단을 나중에 찾을 수 있다. 끝내 복구할 수 없다면 필요한 계정의 비밀번호를 **서비스에서 재설정**해 새 보관함에 등록한다. 새 age 키를 만들거나 비밀번호 관리자를 설치하는 것만으로 과거 암호문이 열리지는 않는다.

개인 접속정보의 보관 방식을 정했다면, 기존 PC 없이 보관함이나 파일을 열어 보는 것으로 마무리한다. 이때 막히는 지점이 다음에 백업할 인증 수단이다.

## 참고 자료

- [Bitwarden: 마스터 비밀번호를 잊었을 때](https://bitwarden.com/help/forgot-master-password/), [2단계 인증에 접근할 수 없을 때](https://bitwarden.com/help/lost-two-step-device/)
- [1Password: Emergency Kit](https://support.1password.com/emergency-kit/), [복구 코드 생성과 사용](https://support.1password.com/recovery-codes/)
- [SOPS 공식 문서](https://getsops.io/docs/), [Devkit SOPS 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/sops.md)
