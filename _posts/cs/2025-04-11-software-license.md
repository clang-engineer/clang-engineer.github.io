---
title       : "소프트웨어 라이선스 — 허가형·Copyleft를 배포 의무 축으로 비교하기"
description : "MIT·BSD·Apache-2.0·GPL·LGPL·AGPL·MPL을 이름별 암기가 아니라 배포 여부, 소스 제공 범위, 고지, 특허, 네트워크 제공이라는 공통 비교축으로 정리한다."
date        : 2025-04-11 15:36:25 +0900
updated     : 2026-09-06 10:18:00 +0900
categories  : [cs, "소프트웨어 공학"]
tags        : [software, license, opensource, compliance]
pin         : false
hidden      : false
---

오픈소스 라이선스를 `MIT는 자유롭고 GPL은 공개해야 한다` 정도로 외우면 실제 배포 판단에서 금방 막힌다. 먼저 **어떤 행위가 어떤 의무를 발생시키는지**를 축으로 나누는 편이 낫다.

```text
소프트웨어를 사용한다
      ↓
수정했는가?
      ↓
외부에 배포하는가?
      ↓
Network Service로 제공하는가?
      ↓
어떤 범위의 Source / Notice를 제공해야 하는가?
      ↓
Patent 조항이나 추가 조건이 있는가?
```

라이선스마다 정확한 의무 범위는 버전과 결합 방식에 따라 달라지므로, 이 글은 **실무에서 무엇을 먼저 확인할지 잡는 지도**로 사용한다. 최종 릴리스 판단은 실제 License Text와 조직의 법무·컴플라이언스 절차를 기준으로 한다.

## 먼저 네 가지 축으로 본다

| 비교축 | 질문 |
|---|---|
| 사용·수정 | 내부에서 사용하거나 수정하는 것만으로 의무가 생기는가 |
| 배포 | Binary/Source를 외부에 전달할 때 무엇을 제공해야 하는가 |
| Copyleft 범위 | 수정 파일, Library, 더 큰 결합 저작물 중 어디까지 같은 조건이 이어지는가 |
| 고지·특허 | License/Notice 보존, Patent Grant·Termination 같은 별도 조건이 있는가 |

여기에 AGPL처럼 **Network Interaction**을 별도 Trigger로 보는 라이선스가 있다.

## 큰 분류 — Permissive와 Copyleft

```text
Permissive
├─ MIT
├─ BSD
└─ Apache-2.0

Copyleft
├─ MPL-2.0       → File 단위 성격
├─ LGPL          → Library 단위 성격
├─ GPL           → 더 넓은 결합 저작물에 영향
└─ AGPL          → GPL 계열 + Network 사용 조항
```

이 그림은 강도를 단순 순위로 매기기 위한 것이 아니다. **Copyleft가 적용되는 경계가 어디인가**를 잡기 위한 출발점이다.

## MIT / BSD — 고지를 보존하는 단순한 허가형

MIT와 BSD 2-Clause/3-Clause는 상업적 사용·수정·재배포를 폭넓게 허용하는 Permissive License다.

일반적인 실무 포인트는:

```text
내 코드 공개 의무
→ 일반적으로 없음

재배포
→ Copyright / License Notice 보존
```

이다.

BSD는 2-Clause와 3-Clause처럼 변형이 있으므로 이름만 `BSD`라고 보고 처리하지 않고 **정확한 SPDX Identifier와 License Text**를 확인한다.

## Apache License 2.0 — 허가형 + 명시적 Patent 조항

Apache-2.0도 Permissive License지만 MIT/BSD보다 Patent와 Attribution 조건이 더 명시적이다.

```text
상업적 사용 / 수정 / 재배포
→ 허용

자체 Source 공개
→ 일반적으로 요구하지 않음

배포
→ License 조건과 기존 Attribution/Notice 요구 확인

Patent
→ Contributor Patent Grant와 관련 조항 존재
```

`NOTICE`는 무조건 새 NOTICE 파일을 만들어 아무 내용을 넣으라는 뜻이 아니다. Apache-2.0 Section 4의 조건에 따라 **받은 Work에 NOTICE가 포함돼 있다면 해당 Attribution Notice를 요구된 방식으로 보존해야 하는지**를 확인한다.

Apache Software Foundation 자체 프로젝트의 배포 정책과, 제3자가 Apache-2.0 코드를 재사용할 때의 License 의무도 같은 것으로 뭉뚱그리지 않는다.

## GPL — 배포할 때 Corresponding Source와 Copyleft 범위를 본다

GPL은 강한 Copyleft License다. 단순히 GPL 프로그램을 내부에서 실행한다고 내 소스가 자동 공개되는 것은 아니다. 핵심 Trigger 중 하나는 **Covered Work를 배포(convey)하는 상황**이다.

```text
내부 사용
→ 일반적으로 Source 배포 의무 Trigger가 아님

Covered Binary 배포
→ 해당 License 조건에 맞는 Corresponding Source 제공 경로 필요
```

가장 어려운 부분은 `내 코드가 GPL Covered Work에 어디까지 포함되는가`다. 단순히 "GPL Library를 썼다 = 저장소 전체 공개"처럼 기계적으로 판단하지 않고, License Version·결합 방식·프로그램 구조를 실제 조건과 함께 검토한다.

## AGPL — Network Interaction을 추가로 본다

AGPL은 GPL 계열의 Copyleft에 **Network를 통해 수정된 프로그램과 상호작용하는 사용자에게 Source 접근 기회를 제공하는 조항**을 더한다.

따라서 SaaS라고 해서 모든 AGPL Dependency가 무조건 같은 결과를 만든다고 단순화하기보다:

```text
어떤 AGPL Program인가?
수정했는가?
사용자가 Network로 그 Program과 상호작용하는가?
어떤 Source 제공 의무가 적용되는가?
```

를 실제 License Text 기준으로 확인한다.

## LGPL — Library 경계를 중심으로 본다

LGPL은 Library를 다른 프로그램과 결합해 사용하는 경우 GPL보다 유연하게 설계된 Copyleft License다.

핵심은 "상위 Application은 항상 비공개 가능" 같은 한 문장이 아니라:

- LGPL Library 자체를 수정했는가
- 어떤 방식으로 결합·배포하는가
- 사용자가 LGPL Library를 교체·재링크할 수 있도록 어떤 조건을 만족해야 하는가
- 사용하는 LGPL Version이 무엇인가

를 확인하는 것이다.

따라서 Static/Dynamic Linking만으로 모든 결론을 자동화하지 않는다.

## MPL 2.0 — File-level Copyleft

MPL 2.0은 흔히 **File-level Copyleft**로 설명된다. MPL Covered Code를 수정한 파일과, 별도의 파일로 작성된 더 큰 Work를 구분하기 상대적으로 쉽다.

```text
MPL Covered File 수정
→ 그 Covered File에 MPL 의무 적용

별도 File과 Larger Work 구성
→ 다른 License와 결합 가능한 범위 존재
```

그래서 Proprietary Code와 Open Source Code를 같은 제품 안에서 함께 다뤄야 할 때 GPL과는 다른 경계를 제공한다. 다만 실제 Covered Software와 Larger Work 정의는 MPL 2.0 본문을 기준으로 확인한다.

## 빠른 비교

| License | 계열 | 자체 Source 공개 | Copyleft 경계에서 먼저 볼 것 | Patent 조항 |
|---|---|---|---|---|
| MIT | Permissive | 일반적으로 없음 | Copyright/License Notice | 별도 명시적 Grant 없음 |
| BSD 2/3-Clause | Permissive | 일반적으로 없음 | Copyright/License Notice, Variant | 별도 명시적 Grant 없음 |
| Apache-2.0 | Permissive | 일반적으로 없음 | License + 기존 NOTICE/Attribution 조건 | 명시적 조항 있음 |
| MPL-2.0 | Weak Copyleft | Covered File 중심 | 수정된 Covered File / Larger Work | 명시적 조항 있음 |
| LGPL | Weak Copyleft | Library와 수정 범위 중심 | Library 결합·교체·재링크 조건 | Version별 확인 |
| GPL | Strong Copyleft | Covered Work 배포 시 Source 조건 | 어떤 Work가 Covered 되는지 | Version별 조항 확인 |
| AGPL | Strong Copyleft | GPL 계열 + Network 조항 | Network Interaction과 수정 Program | Version별 조항 확인 |

이 표는 법적 결론표가 아니라 **어디를 읽어야 하는지 찾는 Index**다.

## 실무에서는 Dependency보다 배포 Artifact를 본다

개발자가 `package.json`, `pom.xml`, `requirements.txt`만 보고 License를 끝내기 어렵다. 실제 Product에는 Transitive Dependency와 bundled asset이 들어간다.

```text
Source Dependency
      ↓
Build
      ↓
실제 Distribution Artifact
      ↓
포함된 Component / License / Notice
```

따라서 Release 단계에서는 SBOM이나 Dependency License Report로 실제 포함 Component를 확인하고, 필요한 License Text와 Attribution을 배포 Artifact에 반영하는 절차가 필요하다.

## 판단 순서

새 Dependency를 넣거나 제품을 배포할 때는 다음 순서가 실용적이다.

```text
1. 정확한 License + Version 확인
2. 내부 사용인가, 외부 배포인가 확인
3. 수정 여부와 결합 방식을 확인
4. Copyleft가 적용되는 범위를 확인
5. Source 제공·License·Notice 의무 확인
6. Patent / Trademark 등 별도 조건 확인
7. 실제 배포 Artifact와 SBOM으로 재검증
8. 애매하면 법무·컴플라이언스 검토
```

## 정리

소프트웨어 License를 이름별 특징으로 외우기보다 **Trigger와 Boundary**로 본다.

```text
무슨 License인가
      ↓
무슨 행위를 하는가
      ↓
어떤 범위가 Covered 되는가
      ↓
무엇을 함께 제공해야 하는가
```

특히 `오픈소스 사용 = 내 코드 공개`, `Apache = NOTICE 무조건 작성`, `LGPL = Dynamic Linking이면 항상 끝` 같은 단정은 피한다. **License 의무는 사용한 이름 하나가 아니라 Version, 행위, 결합 구조, 배포 방식의 조합에서 결정된다.**

## 참고

- [GNU Licenses FAQ](https://www.gnu.org/licenses/gpl-faq.html)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [Apache Licensing FAQ](https://www.apache.org/foundation/license-faq)
- [MPL 2.0](https://www.mozilla.org/MPL/2.0/)
- [MPL 2.0 FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)
- [OSI Licenses](https://opensource.org/licenses/)

> 이 글은 일반적인 기술·컴플라이언스 관점의 정리이며 법률 자문이 아니다. 실제 제품 배포와 License Compatibility 판단은 해당 License 원문과 조직의 법무·컴플라이언스 절차를 기준으로 검토한다.
