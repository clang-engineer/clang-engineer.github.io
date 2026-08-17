# 임베딩·벡터검색·RAG

## RAG가 필요한 이유

LLM의 Parameter에 없는 사내 문서나 최신 자료를 답변에 사용하려면 외부 지식을 입력 Context로 제공해야 한다. 모든 문서를 매번 넣을 수 없으므로 질문과 관련된 부분만 검색한다.

RAG(Retrieval-Augmented Generation)는 검색과 생성을 결합한다.

문서 수집
→ 정제·Chunking
→ Embedding
→ Vector DB 저장
→ 질문 Embedding
→ 유사 문서 검색
→ 필요 시 Re-ranking
→ 관련 문서를 Prompt에 포함
→ LLM이 근거를 이용해 답변

## 검색용 Embedding

Embedding Model은 Text를 의미 비교가 가능한 고정 길이 Vector로 바꾼다. 질문과 문서 Vector가 가까우면 의미가 비슷하다고 판단한다.

모델마다 다음 차이가 있다.

- 지원 언어와 다국어 정렬
- Vector 차원
- 긴 문서 처리 길이
- 검색·분류 등 학습 목적
- 도메인 용어 표현력
- 속도·비용
- Query와 Document를 같은 방식 또는 다른 방식으로 Encoding하는지

따라서 Vector화가 일반화된 기술이어도 모델 선택은 검색 품질에 큰 영향을 준다.

## Chunking

문서를 너무 크게 나누면 관련 없는 내용이 함께 들어가고, 너무 작게 나누면 문맥이 끊긴다.

고려할 요소:

- 제목·문단·표·Code Block 같은 구조
- Chunk 크기와 Overlap
- 원문 제목·문서 ID·작성일·권한 등 Metadata
- 질문에 답하기 필요한 최소 문맥
- 갱신·삭제 단위

Chunk에는 Vector뿐 아니라 원문 Text와 출처 Metadata도 함께 보관해야 LLM에 전달하고 출처를 표시할 수 있다.

## Vector DB

Vector DB는 Embedding Vector와 Metadata를 저장하고 근접 이웃 검색을 제공한다. 별도 제품을 사용할 수도 있고 PostgreSQL에 pgvector 같은 확장을 붙일 수도 있다.

핵심 기능:

- Vector 거리 계산
- Metadata Filter
- Index
- 원문·출처 관리
- 갱신·삭제
- 권한 분리

HNSW는 Graph를 따라 가까운 Vector를 빠르게 탐색한다. 검색 품질과 속도가 좋지만 Memory와 Index 생성 비용이 크다.

IVF는 Vector 공간을 여러 Cluster로 나누고 Query와 가까운 Cluster만 탐색한다. 검색할 Cluster 수를 조절해 속도와 Recall을 바꾼다.

정확한 전수검색보다 빠른 대신 일부 가까운 결과를 놓칠 수 있으므로 Approximate Nearest Neighbor 검색이라고 한다.

## 검색 품질 개선

Vector 유사도만으로 최종 문서를 정하지 않을 수 있다.

- Keyword·BM25와 Vector 검색을 결합한 Hybrid Search
- 문서 종류·부서·작성일·권한 Metadata Filter
- 더 정교한 Model로 후보 순위를 다시 매기는 Re-ranking
- Query Expansion·Rewrite
- 중복 Chunk 제거
- 출처 다양성 조절

검색용 Embedding과 Re-ranking 품질이 낮으면 LLM이 좋은 모델이어도 근거가 틀린 답을 만들 수 있다.

## RAG와 Fine-tuning

- RAG: 외부 지식을 그때그때 검색해 Context로 제공
- Fine-tuning: 모델의 Parameter와 행동 양식을 조정

자주 바뀌는 사내 규정·문서·근거 제시에는 RAG가 적합하다. 특정 답변 형식·문체·Task 수행 방식을 반복 학습하려면 Fine-tuning을 검토한다. 둘은 대체 관계가 아니라 함께 사용할 수 있다.

## 운영 고려사항

- 원문 변경 시 재Chunking·재Embedding
- 삭제 문서와 권한 회수 반영
- 검색 결과에 접근권한 적용
- 답변과 출처 연결
- Retrieval Recall·Precision 평가
- 근거 없음 판단과 답변 제한
- 개인정보·기밀정보의 Model 전달 범위
- Prompt Injection과 오염 문서 대응

## 기억 흐름

문서를 Vector로 저장
→ 질문과 의미가 가까운 Chunk 검색
→ 후보를 Filter·Re-ranking
→ 근거와 함께 LLM에 전달
→ 답변·출처·검색 품질을 평가
