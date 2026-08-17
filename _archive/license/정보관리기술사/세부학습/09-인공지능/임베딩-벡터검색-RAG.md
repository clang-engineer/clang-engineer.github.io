# 임베딩·벡터검색·RAG

이 문서는 RAG를 단순히 `문서 → Embedding → Vector DB → LLM`으로 외우는 대신, **왜 별도의 검색용 Embedding Model이 필요한지, 긴 Chunk가 어떻게 Vector 하나가 되는지, Vector DB는 정확히 무엇을 해야 하는지**를 이해하는 데 목적이 있다.

## 1. 먼저 LLM 내부 Embedding과 검색용 Embedding을 분리하자

`Embedding`이라는 같은 단어를 쓰기 때문에 처음에는 가장 헷갈리는 부분이다.

### LLM 내부 Token Embedding

```text
사용자 문장
→ Tokenization
→ Token별 Embedding Vector
→ Transformer
→ 다음 Token 예측
```

목적은 **LLM이 문맥을 처리하고 다음 Token을 생성하기 위한 내부 표현**을 만드는 것이다.

### RAG 검색용 Embedding

```text
문서 Chunk
→ 검색용 Embedding Model
→ Chunk 전체를 대표하는 Vector
→ Vector DB 저장
```

목적은 **질문과 문서가 의미적으로 얼마나 가까운지 비교하기 위한 검색 표현**을 만드는 것이다.

따라서 RAG의 검색 Vector를 LLM 내부 Token Vector로 직접 전달하는 것이 아니다.

```text
질문
→ 검색용 Embedding
→ 관련 Chunk 검색
→ 검색된 '원문 Text'
→ LLM Context에 전달
```

이 구분을 먼저 잡아야 RAG 전체가 쉬워진다.

---

## 2. 왜 RAG가 필요한가

LLM의 Parameter에 없는 사내 문서, 최신 규정, 조직 고유의 업무 지식을 사용하려면 외부 정보를 Context로 넣어야 한다.

하지만 문서가 수십만 건인데 모든 문서를 매 요청마다 LLM Context에 넣을 수는 없다.

따라서 먼저 질문과 관련 있는 부분을 찾아야 한다.

```text
질문
→ 관련 문서 검색
→ 필요한 부분만 LLM Context에 넣음
→ LLM 답변
```

RAG(Retrieval-Augmented Generation)는 이 **검색(Retrieval) + 생성(Generation)** 구조를 결합한 방식이다.

---

## 3. RAG 사전 구축: 문서를 어떻게 저장하는가

```text
문서 수집
→ Text 추출·정제
→ Chunking
→ 검색용 Embedding
→ Chunk별 Vector 생성
→ 원문 + Vector + Metadata 저장
→ Vector Index 생성
```

여기서 `Vector만 저장한다`고 생각하면 부족하다. 실제 답변을 만들 때는 검색된 Vector 자체가 아니라 원문 Text가 필요하기 때문이다.

예를 들면 다음 정보를 함께 저장할 수 있다.

```text
chunk_id: 123
content: "국내 출장 숙박비는 1박 최대 10만원..."
embedding: [0.18, -0.72, 0.31, ...]
source: 출장규정.pdf
page: 13
부서: 인사팀
권한: 전직원
```

Vector는 **찾기 위해** 쓰고, 원문은 **LLM이 읽고 답하기 위해** 쓴다.

---

## 4. Chunking: Vector의 최종 단위는 꼭 문장인가

검색용 Vector의 단위는 정확히 `단어`나 `문장`으로 고정되어 있지 않다. RAG Pipeline에서 정한 **Chunk**가 검색 단위가 된다.

```text
100페이지 PDF
        ↓
Chunk 1
Chunk 2
Chunk 3
...
        ↓
각 Chunk마다 Vector 하나
```

Chunk는 한 문장일 수도 있고 여러 문장이나 한 문단일 수도 있다.

### Chunk가 너무 크면

하나의 Vector 안에 여러 주제가 섞인다.

```text
Chunk
├─ 출장 숙박비
├─ 교통비
├─ 휴가 규정
└─ 법인카드
```

이 전체를 Vector 하나로 대표하면 특정 질문과의 의미가 흐려질 수 있다.

### Chunk가 너무 작으면

정답에 필요한 문맥이 잘릴 수 있다.

따라서 다음을 함께 고려한다.

- 제목·문단·표·Code Block 같은 구조
- Chunk 크기
- Overlap
- 질문에 답하기 필요한 최소 문맥
- 갱신·삭제 단위
- 원문 제목·문서 ID·작성일·권한 등의 Metadata

---

## 5. 긴 Chunk가 어떻게 Vector 하나가 되는가

처음 보면 가장 이상한 부분이다. Chunk 안에 수십~수백 Token이 있는데 어떻게 숫자 배열 하나가 되는가?

검색용 Embedding Model 내부를 단순화하면 다음과 같다.

```text
긴 Chunk
→ Tokenization
→ Token별 초기 Vector
→ Transformer
→ 문맥이 반영된 Token Vector들
→ Pooling 등의 집약
→ Chunk 대표 Vector 하나
```

중요한 것은 이 Vector가 원문을 ZIP처럼 압축한 것이 아니라는 점이다.

> **원문을 그대로 복원하기 위한 Vector가 아니라, 검색에 필요한 의미적 특징을 고정 길이 좌표로 표현한 것이다.**

그래서 Chunk가 아무리 길어도 모델이 허용하는 입력 범위 안에서는 고정 길이 Vector 하나를 출력할 수 있다. 대신 너무 많은 의미를 한 Chunk에 넣으면 대표 Vector가 애매해질 수 있으므로 Chunking이 중요하다.

---

## 6. 문장 조합은 무한한데 모든 Vector를 미리 갖고 있는가

아니다.

Embedding Model은 가능한 모든 문장과 Vector를 미리 저장한 사전이 아니다.

> **처음 보는 Text가 들어와도 Vector를 계산하는 함수를 학습한 Model**이다.

따라서 새로운 사내 문서나 사용자가 처음 입력한 질문도 즉석에서 Vector화할 수 있다.

```text
처음 보는 질문
→ Tokenization
→ 학습된 Embedding Model
→ Query Vector 생성
```

질문이 들어올 때마다 비슷한 질문 Vector를 DB에 계속 보강해야 검색이 가능한 것도 아니다. 일반적인 RAG에서는 질문 Vector를 그 요청에서 만들어 검색에 사용하고 버려도 된다.

---

## 7. Embedding Model마다 왜 차이가 나는가

`Text를 Vector로 바꾼다`는 원리는 일반화되어 있지만 **어떤 Text들을 얼마나 가깝게 배치할지는 모델의 학습 결과**다.

예를 들어 의료 검색이라면 좋은 모델은 다음 표현을 가깝게 배치할 수 있다.

```text
"심근경색 환자의 재입원율"
"AMI 환자 재입원 비율"
"급성심근경색 30일 재입원"
```

반면 해당 도메인에 약한 모델은 `AMI`와 `심근경색`의 관계를 충분히 표현하지 못할 수 있다.

모델별 차이:

- 지원 언어와 다국어 정렬
- 전문용어·도메인 표현력
- Vector 차원
- 긴 Text 처리 길이
- 검색·분류 등 학습 목적
- Query와 Document의 관계를 학습한 방식
- 속도와 비용

따라서 사내 RAG에서는 유명한 모델 하나를 무조건 고르기보다 **실제 사내 질문과 정답 문서 Sample로 Retrieval 품질을 평가**하는 것이 중요하다.

### Embedding Model을 바꾸면 기존 Vector를 그대로 쓸 수 있는가

일반적으로 안 된다고 생각하는 것이 안전하다.

```text
Embedding Model A
→ A의 의미 좌표계

Embedding Model B
→ B의 의미 좌표계
```

질문과 문서는 같은 의미 공간에서 비교해야 하므로 Model을 교체하면 문서 전체를 새 Model로 다시 Embedding하는 것이 기본이다.

---

## 8. Embedding Model도 직접 만들거나 Fine-tuning할 수 있는가

가능하다. 다만 단계가 있다.

```text
1. 기존 Embedding Model 그대로 사용
2. 기존 Model을 우리 도메인 Data로 Fine-tuning
3. Embedding Model을 처음부터 Pre-training
```

실무 RAG에서는 보통 1부터 시작한다. 실제 검색 실패가 전문용어나 조직 고유 표현 때문에 반복될 때 2를 검토한다.

Fine-tuning 가능 여부는 LLM과 같은 원리다.

- API로만 제공되는 폐쇄형 Model: 제공사가 Fine-tuning 기능을 열어줘야 함
- Open Weight Model: Weight를 직접 학습할 수 있는 구조와 License가 허용하면 직접 Fine-tuning 가능

---

## 9. Vector DB는 단순히 Vector를 저장하는 DB가 아니다

Vector를 `float[]`처럼 저장할 수 있다는 것만으로 충분하지 않다.

RAG용 저장소는 핵심적으로 다음이 필요하다.

- Vector 거리·유사도 계산
- Query Vector와 가까운 Top-K 검색
- Vector Index
- Metadata Filter
- 원문·출처 관리
- 갱신·삭제
- 권한 분리

```text
Query Vector
        ↓
Vector DB
        ↓
가장 가까운 Vector Top-K
        ↓
해당 Chunk 원문 반환
```

### PostgreSQL도 가능한가

가능하다. `pgvector` 같은 확장을 사용하면 Vector Type, 거리 연산, Vector Index를 사용할 수 있다.

따라서 처음부터 별도 Vector DB 제품을 반드시 운영할 필요는 없다. 기존 PostgreSQL 운영 경험과 규모, 성능 요구를 고려해 선택할 수 있다.

---

## 10. Semantic Search와 일반 검색의 차이

일반 문자열 검색은 실제 문자열을 중심으로 찾는다.

```text
질문: 호텔값
문서: 숙박비

문자열 관점에서는 다름
```

Semantic Search는 의미 공간에서 비교한다.

```text
"출장 가면 호텔값 얼마까지 나와?"
        ↓ Query Embedding

"국내 출장 숙박비는 1박 최대 10만원"
        ↓ Document Embedding

두 Vector가 가까움
```

즉 Vector Search의 핵심은 **질문과 의미가 비슷한 문서를 찾는 것**이다.

실제 시스템에서는 정확한 프로젝트 코드나 상품명처럼 Keyword가 중요한 경우도 있으므로 Keyword/BM25와 Vector Search를 결합한 Hybrid Search도 많이 사용한다.

---

## 11. HNSW와 IVF: 왜 Vector 전용 Index가 필요한가

Vector가 100만 개 있다고 하자. 가장 정확한 방법은 Query Vector와 100만 개를 모두 비교하는 것이다.

```text
Query
→ Vector 1 비교
→ Vector 2 비교
→ ...
→ Vector 1,000,000 비교
→ Top-K
```

정확하지만 데이터가 커지면 비싸다. 그래서 ANN(Approximate Nearest Neighbor) 검색을 사용한다.

### HNSW

Vector 사이에 Graph 형태의 길을 만들어 놓고 가까운 방향으로 이동하며 탐색한다.

```text
Query → Graph 탐색 → 점점 가까운 Node → 후보
```

- Graph 기반 ANN
- 일반적으로 높은 Recall과 빠른 검색
- Memory 사용량과 Index 구축 비용이 큰 편

### IVF

Vector 공간을 여러 Cluster로 나눈다.

```text
전체 Vector 공간
→ Cluster A / B / C / D / ...

Query
→ 가까운 Cluster 선택
→ 선택한 Cluster 내부만 검색
```

- 군집 기반 ANN
- 검색할 Cluster 수를 조절해 속도와 Recall Trade-off 조절
- pgvector에서는 IVFFlat을 볼 수 있음

Approximate라고 부르는 이유는 전체 Vector를 모두 확인하지 않으므로 실제 가장 가까운 결과를 일부 놓칠 가능성이 있기 때문이다.

---

## 12. Re-ranking: Vector Search 결과가 곧 최종 순위는 아니다

Embedding Vector Search는 수많은 문서 중 후보를 빠르게 좁히는 데 좋다. 하지만 순위가 항상 완벽하지는 않다.

```text
100만 Chunk
→ Vector Search
→ Top 20 후보
→ Re-ranker가 질문과 후보를 더 정밀하게 비교
→ Top 5
→ LLM Context
```

즉 역할을 나누면 다음과 같다.

- Embedding Search: 빠르게 넓은 후보를 찾는다.
- Re-ranking: 후보 수가 줄어든 뒤 더 비싼 계산으로 정밀하게 순위를 다시 매긴다.

LLM이 아무리 좋아도 정답 Chunk가 Retrieval 단계에서 빠지면 제대로 답하기 어렵다. 그래서 RAG에서는 생성 Model뿐 아니라 **Retrieval 품질 자체가 핵심 병목**이 될 수 있다.

---

## 13. RAG와 Fine-tuning

둘은 대체 관계가 아니다.

### RAG

```text
외부 지식
→ 검색
→ Context에 제공
→ Weight 변경 없음
```

자주 바뀌는 사내 규정, 최신 자료, 출처가 필요한 지식에 적합하다.

### Fine-tuning

```text
기존 Model
+ 학습 Data
→ Training
→ Parameter 변화
```

특정 답변 형식, Task 수행 패턴, 도메인 행동을 모델 자체에 조정하려 할 때 검토한다.

---

## 14. 실제 RAG 품질은 Embedding Model 하나로 결정되지 않는다

검색 품질에는 여러 요소가 함께 영향을 준다.

```text
Chunking
+ Embedding Model
+ Metadata
+ Vector Index
+ Hybrid Search
+ Query Rewrite
+ Re-ranking
+ 권한 Filter
```

특히 사내 RAG에서는 다음 운영 요소도 중요하다.

- 원문 변경 시 재Chunking·재Embedding
- 삭제 문서와 권한 회수 반영
- 검색 결과에 사용자 접근권한 적용
- 답변과 출처 연결
- Retrieval Recall·Precision 평가
- 근거가 없을 때 답변 제한
- 개인정보·기밀정보 전달 범위
- Prompt Injection과 오염 문서 대응

---

## 15. 기억 흐름

```text
[사전 구축]
문서
→ Chunking
→ 검색용 Embedding Model
→ Chunk별 Vector
→ Vector DB + 원문 + Metadata
→ HNSW / IVF 등의 Index

[질문]
사용자 질문
→ 같은 검색용 Embedding Model
→ Query Vector
→ Vector Search
→ 필요 시 Hybrid Search / Filter
→ 후보
→ Re-ranking
→ 관련 Chunk
→ 질문 + Chunk를 LLM Context에 전달
→ LLM 답변
```

한 문장으로 정리하면 다음과 같다.

> **RAG는 모델을 다시 학습시키는 기술이 아니라, 질문과 관련된 외부 지식을 검색해 LLM이 지금 참고할 Context로 공급하는 구조다.**
