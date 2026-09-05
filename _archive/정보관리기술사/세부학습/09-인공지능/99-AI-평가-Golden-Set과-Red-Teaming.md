# AI 평가: Golden Set과 Red Teaming

AI 시스템은 단순히 `답을 생성할 수 있는가`만으로 평가하기 어렵다. **정상적인 요구에서 원하는 품질을 내는지**와 **의도적으로 공격하거나 경계를 찔렀을 때도 안전한지**를 서로 다른 관점에서 확인해야 한다.

이때 Golden Set과 AI Red Teaming은 함께 보면 역할 차이가 잘 드러난다.

```text
AI 평가·검증
├─ 정상 동작 품질 확인
│   └─ Golden Set 기반 Evaluation
│
└─ 취약점·실패 경계 탐색
    └─ AI Red Teaming
```

---

## 1. Golden Set

Golden Set은 **기대 결과 또는 Ground Truth가 사람의 검토 등을 통해 신뢰할 수 있게 정의된 기준 평가 데이터 묶음**이다.

```text
입력 / 질문
+
기대 결과 / Ground Truth
+
필요하면 정답 근거·관련 문서·평가 기준
        ↓
     Golden Set
        ↓
Model / AI System 실행
        ↓
실제 결과와 기대 결과 비교
        ↓
성능 평가
```

`Golden Set`, `Gold Set`, `Golden Dataset` 등의 표현이 실무에서 사용된다. 문서에서는 용어를 하나로 정해 일관되게 사용하는 것이 좋다.

### Ground Truth와의 관계

```text
Ground Truth
= 개별 Sample에서 기준으로 삼는 정답·참값

Golden Set
= 그러한 기준 Sample들을 평가 목적으로 구성한 Dataset
```

둘을 완전히 동일한 용어로 보지 않는다.

---

## 2. Golden Set은 일반 Test Set과 무엇이 다른가

Test Set은 Model 성능을 평가하기 위해 Training에서 분리한 데이터라는 의미가 중심이다.

Golden Set이라는 표현은 보통 **정답과 평가 기준의 신뢰성이 충분히 검토된 기준 Dataset**이라는 성격을 강조할 때 사용한다.

```text
Training Set  → Model 학습
Validation Set → 학습 중 선택·조정
Test Set      → 최종 성능 평가

Golden Set
→ "이 입력에서는 이것을 기대한다"는
   신뢰 가능한 기준 사례 집합이라는 역할을 강조
```

Golden Set이 항상 별도의 네 번째 Dataset이어야 하는 것은 아니다. 프로젝트에 따라 Test Set 일부를 엄격하게 검증하여 Golden Set으로 관리할 수도 있다.

---

## 3. LLM과 RAG에서의 Golden Set

LLM 평가는 정답 문자열이 하나로 고정되지 않는 경우가 많다. 따라서 단순한 `질문 → 정답 문자열`보다 평가 목적에 맞는 기준을 함께 둘 수 있다.

```text
LLM Golden Set
질문
├─ 기대 답변 / 핵심 포함 내용
├─ 허용·금지 기준
└─ 평가 Rubric
```

RAG에서는 검색과 생성 단계를 분리해서 볼 수 있다.

```text
질문
├─ 관련 정답 문서 / Chunk
└─ 기대 답변
        ↓
Golden Set
        ↓
├─ Retrieval 평가
│   └─ 정답 문서를 제대로 찾았는가?
└─ Generation 평가
    └─ 찾은 근거를 이용해 적절히 답했는가?
```

따라서 RAG의 Golden Set에는 `질문 + 관련 문서 + 기대 답변`을 함께 관리하는 구성이 유용하다.

---

## 4. AI Red Teaming

AI Red Teaming은 **공격자·악의적 사용자·예외 상황의 관점에서 AI 시스템의 취약점과 실패 경계를 의도적으로 탐색하는 평가 활동**이다.

정상적인 질문만 평가하면 실제 운영에서 발생할 수 있는 공격적 입력과 예상 밖의 조합을 놓칠 수 있다.

```text
정상 평가
"원하는 일을 잘하는가?"

        +

Red Teaming
"깨뜨리려고 해도 안전하게 동작하는가?"
```

대표적인 탐색 대상은 다음과 같다.

```text
AI Red Teaming
├─ Jailbreak
├─ Prompt Injection
├─ 민감정보 노출 유도
├─ 유해한 출력 유도
├─ 권한·Tool 오용 유도
├─ 정책 우회
└─ 예상하지 못한 실패 Mode 탐색
```

Agent나 RAG 시스템에서는 Model 자체뿐 아니라 Retrieval, Tool, 권한, 외부 System 연결까지 공격 표면이 넓어질 수 있다.

---

## 5. 보안 Red Team과 AI Red Teaming의 관계

전통적인 Red Team은 공격자의 관점에서 조직·System의 보안 취약점을 찾는다.

AI Red Teaming은 이 사고방식을 AI System에 확장한 것으로 이해할 수 있다.

```text
전통적 Red Team
→ Network · Application · 계정 · 권한 등 공격

AI Red Teaming
→ Prompt · Model 행동 · RAG · Agent · Tool · 권한 등 공격
```

AI Red Teaming이 전통적인 Penetration Test를 완전히 대체하는 것은 아니다. AI가 포함된 System이라면 기존 보안 평가와 AI 특유의 행동 평가가 함께 필요할 수 있다.

---

## 6. Golden Set과 Red Teaming의 관계

둘은 대체 관계가 아니다.

```text
Golden Set
→ 알려진 정상·대표 사례를 반복 평가
→ 회귀(Regression)와 품질 비교에 강함

Red Teaming
→ 아직 모르는 실패 사례를 적극 탐색
→ 취약점과 경계 발견에 강함
```

둘은 다음과 같이 연결할 수 있다.

```text
Red Teaming
 ↓
새로운 실패 사례 발견
 ↓
원인 분석·개선
 ↓
재발하면 안 되는 중요 사례 선별
 ↓
Golden Set / Regression 평가 사례에 편입
 ↓
향후 Model·Prompt·RAG 변경 시 반복 검증
```

즉 **Red Teaming은 새로운 실패를 발견하고, Golden Set은 중요한 실패가 다시 발생하지 않는지 지속적으로 확인하는 관계**로 연결할 수 있다.

---

## 7. 기억·인출

```text
Golden Set
= "정답지를 들고 정상 품질을 반복 확인"

Red Teaming
= "일부러 깨뜨려 보며 모르는 약점을 발견"
```

둘을 한 문장으로 연결하면 다음과 같다.

> **Golden Set은 알려진 기대 동작을 기준으로 평가하고, Red Teaming은 알려지지 않은 취약점과 실패 경계를 공격적으로 탐색한다.**
