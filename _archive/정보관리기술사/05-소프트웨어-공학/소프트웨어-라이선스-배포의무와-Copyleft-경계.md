# 소프트웨어 라이선스 — 배포 의무와 Copyleft 경계

> 연결: [[../../개념지도/05-소프트웨어-공학/00-소프트웨어-공학-개념지도|소프트웨어 공학 개념지도]]

소프트웨어 라이선스는 이름을 외우기보다 **어떤 행위가 어떤 의무를 발생시키고, 그 의무가 어디까지 퍼지는지**로 이해한다.

## 1. 먼저 판단 질문을 고정한다

```text
정확한 License와 Version은 무엇인가?
        ↓
내부 사용인가, 외부 배포인가?
        ↓
원본을 수정했는가?
        ↓
다른 코드와 어떤 방식으로 결합했는가?
        ↓
어느 범위가 Covered Work인가?
        ↓
Source·License·Notice 제공 의무는 무엇인가?
        ↓
Patent·Trademark 등 별도 조건이 있는가?
```

AGPL처럼 Network Interaction 자체가 추가 Trigger가 되는 License도 있으므로 `배포 여부`만으로 모든 License를 판단하지 않는다.

## 2. Permissive와 Copyleft

```text
Permissive
├─ MIT
├─ BSD
└─ Apache-2.0

Copyleft
├─ MPL-2.0   → File 단위 성격
├─ LGPL      → Library 경계 중심
├─ GPL       → 더 넓은 Covered Work
└─ AGPL      → GPL 계열 + Network Interaction
```

이 그림은 단순 강도 순위가 아니라 **의무가 전파되는 경계**를 잡기 위한 것이다.

## 3. Permissive License

### MIT / BSD

상업적 사용·수정·재배포를 폭넓게 허용한다. 일반적으로 자체 Source 공개 의무보다 Copyright·License Notice 보존을 먼저 확인한다.

BSD는 2-Clause, 3-Clause 등 Variant가 있으므로 `BSD`라는 이름만 보고 처리하지 않고 정확한 SPDX Identifier와 원문을 확인한다.

### Apache License 2.0

Permissive 계열이지만 Patent 조항과 Attribution 조건이 더 명시적이다.

```text
사용·수정·재배포
→ 허용

자체 Source 공개
→ 일반적으로 요구하지 않음

배포
→ License·Notice 조건 확인

Patent
→ Contributor Patent Grant와 Termination 조항 확인
```

`NOTICE`는 항상 새 파일을 만들어 아무 내용을 넣으라는 뜻이 아니다. 받은 Work에 NOTICE가 있다면 해당 Attribution을 License가 요구하는 방식으로 보존하는지 확인한다.

## 4. Copyleft License

### GPL

내부에서 실행한다는 사실만으로 곧바로 Source 공개 의무가 생기는 것은 아니다. 대표 Trigger는 Covered Work를 외부에 배포(Convey)하는 상황이다.

```text
Covered Binary 배포
        ↓
Corresponding Source 제공 조건 확인
        ↓
어디까지 Covered Work인지 결합 구조 검토
```

`GPL Library 사용 = 저장소 전체 공개`처럼 기계적으로 판단하지 않는다. Version, 결합 방식, 프로그램 구조를 실제 License Text와 함께 본다.

### AGPL

GPL 계열의 Copyleft에 Network Interaction에 관한 Source 제공 조건을 추가한다.

```text
AGPL Program인가?
→ 수정했는가?
→ 사용자가 Network로 그 Program과 상호작용하는가?
→ 어떤 Source 접근 의무가 적용되는가?
```

`SaaS이면 무조건 전부 공개`처럼 단순화하지 않는다.

### LGPL

Library와 이를 사용하는 Application 사이의 경계를 중심으로 본다.

- LGPL Library 자체를 수정했는가
- 어떤 방식으로 결합·배포하는가
- 사용자가 Library를 교체·재링크할 수 있는 조건을 충족하는가
- 사용하는 LGPL Version이 무엇인가

Static/Dynamic Linking 하나만으로 결론을 자동화하지 않는다.

### MPL 2.0

흔히 File-level Copyleft로 설명한다.

```text
MPL Covered File 수정
→ 해당 Covered File에 MPL 의무

별도 File로 Larger Work 구성
→ 다른 License와 결합 가능한 범위 존재
```

실제 Covered Software와 Larger Work 정의는 MPL 원문을 기준으로 확인한다.

## 5. 비교축

| License | 계열 | 먼저 볼 경계 | 대표 추가 조건 |
|---|---|---|---|
| MIT | Permissive | Notice 보존 | 단순 |
| BSD | Permissive | 정확한 Variant·Notice | 조항별 차이 |
| Apache-2.0 | Permissive | License·NOTICE | 명시적 Patent 조항 |
| MPL-2.0 | Weak Copyleft | Covered File | File-level 경계 |
| LGPL | Weak Copyleft | Library 결합·재링크 | Version별 확인 |
| GPL | Strong Copyleft | Covered Work 배포 | Corresponding Source |
| AGPL | Strong Copyleft | Covered Work + Network Interaction | Network Source 제공 조건 |

이 표는 법적 결론표가 아니라 **어느 조항을 읽어야 하는지 찾는 학습 지도**다.

## 6. 실무에서는 Dependency 목록보다 배포 Artifact를 본다

```text
Source Dependency
        ↓
Build
        ↓
Distribution Artifact
        ↓
실제로 포함된 Component·License·Notice
```

직접 Dependency만 보지 않고 Transitive Dependency, bundled asset까지 확인한다. Release 단계에서는 SBOM이나 License Report를 통해 실제 배포물의 구성요소를 확인하고 필요한 License Text와 Attribution을 반영한다.

## 7. 기술사 관점의 핵심

OSS License는 단순 법률 용어 암기가 아니라 **소프트웨어 공급망과 배포 위험을 통제하는 외부 제약**으로 본다.

```text
Dependency 선택
        ↓
License·Version 식별
        ↓
사용·수정·배포·Network 제공 방식 확인
        ↓
Copyleft / Notice / Patent 의무 판단
        ↓
SBOM·배포 Artifact로 재검증
        ↓
Release Gate / Compliance
```

## 8. 기억·인출

```text
License 판단 = 이름이 아니라 Trigger + Boundary

Trigger
→ 사용 / 수정 / 배포 / Network Interaction

Boundary
→ File / Library / Covered Work

Obligation
→ Source / License / Notice / Patent
```

> `오픈소스 사용 = 내 코드 공개`, `Apache = NOTICE 무조건 작성`, `LGPL = Dynamic Linking이면 끝` 같은 단정을 피한다. 실제 의무는 License Version, 행위, 결합 구조, 배포 방식의 조합에서 결정된다.

> 이 문서는 기술·컴플라이언스 관점의 학습 정리이며 법률 자문이 아니다. 실제 배포 판단은 적용 License 원문과 조직의 법무·컴플라이언스 절차를 따른다.
