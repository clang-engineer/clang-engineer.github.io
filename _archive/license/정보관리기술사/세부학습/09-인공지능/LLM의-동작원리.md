# LLM의 동작 원리

## 전체 흐름

LLM(Large Language Model)은 긴 문장을 통째로 저장했다가 꺼내는 시스템이 아니다. 입력을 Token으로 나누고 각 Token을 Vector로 바꾼 뒤, Transformer가 문맥 관계를 계산해 다음 Token의 확률을 예측한다.

문장 입력
→ Tokenization
→ Token Embedding과 위치정보
→ Transformer Layer 반복
→ 다음 Token 확률분포
→ 하나의 Token 선택
→ 선택한 Token을 입력 뒤에 붙여 다시 계산
→ 종료 조건까지 반복

## Tokenization

Tokenizer는 Text를 모델이 처리하는 Token ID의 열로 바꾼다. Token은 글자·단어·부분단어와 정확히 일치하지 않을 수 있다. 모델마다 Vocabulary와 Tokenizer가 다르므로 같은 문장도 Token 수가 달라질 수 있다.

형태소 분석기처럼 언어 문법을 완전히 이해한 뒤 자르는 것은 아니다. 학습 Data에서 자주 나타나는 문자열 조각을 효율적으로 표현하도록 Vocabulary를 구성한다.

## Embedding

각 Token ID는 고차원 Vector로 변환된다. 이 Vector는 학습 과정에서 조정되며, 비슷한 문맥에서 사용되는 Token들이 관련된 위치를 갖게 된다.

LLM 내부의 Token Embedding과 RAG 검색에 사용하는 Embedding Model은 목적이 다르다.

- LLM Token Embedding: 다음 Token 예측을 위한 내부 표현
- 검색 Embedding: 문서와 질문의 의미 유사도를 비교하기 위한 출력 Vector

두 모델이 반드시 같을 필요는 없다.

## Transformer와 Attention

Self-Attention은 현재 Token이 문장의 다른 Token을 얼마나 참고할지 계산한다. 각 Token 표현에서 Query·Key·Value를 만들고 Query와 Key의 유사도로 가중치를 구해 Value를 섞는다.

Multi-Head Attention은 여러 관점의 관계를 병렬로 학습한다. 어떤 Head는 문법 관계, 다른 Head는 장거리 문맥이나 개체 관계에 반응할 수 있다.

Transformer Layer에는 Attention뿐 아니라 Feed-Forward Network, Residual Connection, Normalization 등이 포함된다. Layer를 반복하면서 문맥이 반영된 표현이 만들어진다.

## 답변 생성

모델은 한 번에 전체 답을 완성하지 않는다.

1. 현재 입력으로 다음 Token 확률 계산
2. Decoding 정책에 따라 Token 선택
3. 선택한 Token을 입력에 추가
4. 다음 Token을 다시 계산

Temperature, Top-k, Top-p는 확률분포에서 Token을 선택하는 다양성에 영향을 준다. 출력 Token이 길수록 반복 추론이 계속되므로 연산량과 응답시간이 증가한다.

KV Cache는 이전 Token의 Attention 계산 일부를 저장해 매 생성 단계의 중복 계산을 줄인다. 그래도 새 Token마다 Transformer 추론은 필요하다.

## Context Window

Context Window는 한 번의 요청에서 모델이 참고할 수 있는 Token 범위다. System Prompt, 사용자 입력, 대화 기록, RAG 문서, 도구 결과, 생성 중인 출력이 모두 이 범위를 사용한다.

Context가 길다고 모든 정보를 똑같이 잘 활용하는 것은 아니다. 중요 정보의 위치, 중복, Noise, Retrieval 품질이 결과에 영향을 준다.

## 학습과 추론

### Pre-training

대규모 Text에서 다음 Token 예측을 반복하며 언어 패턴과 지식을 학습한다. 정답 Label을 사람이 문장마다 붙이지 않아도 원문에서 다음 Token을 학습 목표로 만들 수 있으므로 Self-Supervised Learning이라고 한다.

### Fine-tuning과 정렬

특정 Task·도메인 Data로 모델 행동을 조정한다. SFT는 입력과 원하는 출력 쌍으로 지도학습하고, LoRA 같은 PEFT는 전체 Parameter 대신 일부 저차원 Parameter를 학습해 비용을 줄인다.

### Inference

학습된 Parameter는 고정한 채 입력에 대한 다음 Token을 반복 계산한다. Prompt와 RAG는 Parameter를 바꾸지 않고 입력 Context를 바꾸는 방법이다.

## 기억 흐름

Token → Embedding → Transformer·Attention → 다음 Token 확률 → 반복 생성

LLM은 다음 Token 예측 모델이고, Chat·도구 사용·RAG·Agent는 이 모델을 목적에 맞게 감싼 응용 구조다.
