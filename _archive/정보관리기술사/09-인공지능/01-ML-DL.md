# 인공지능 ML·DL 개념지도

이 문서는 [인공지능 전체 개념지도](00-전체.md)에서 ML(Machine Learning)·DL(Deep Learning) 가지를 선택했을 때, **학습 신호 → 문제 유형 → Algorithm 선택 → Neural Network / DL → 평가·검증**의 관계를 더 촘촘히 보는 하위 지도다.

세부 Algorithm의 수식·내부 동작·Parameter는 세부학습으로 내린다.

## 1. ML · DL 전체 좌표

~~~text
Data로 문제를 해결
        ↓
어떤 학습 신호가 있는가?
├─ 입력 + 정답      → Supervised Learning
├─ 정답 없는 Data   → Unsupervised Learning
└─ 행동 결과의 보상 → Reinforcement Learning
        ↓
무슨 문제를 풀 것인가?
├─ Classification / Regression
├─ Clustering / Dimensionality Reduction / Association
└─ Sequential Decision
        ↓
문제와 Data 특성에 맞는 Model / Algorithm 선택
        ↓
표현 학습이 더 필요한가?
├─ Classical ML
└─ Neural Network / DL
        ↓
Evaluation / Generalization
~~~

`Supervised → Unsupervised → Reinforcement → DL`은 발전 순서가 아니다. 학습 신호와 Model 계열은 서로 다른 분류축이다.

## 2. 학습 신호에 따른 세 가지 패러다임

~~~text
Machine Learning
├─ Supervised
│   ├─ Classification
│   └─ Regression
│
├─ Unsupervised
│   ├─ Clustering
│   ├─ Dimensionality Reduction
│   └─ Association Rule
│
└─ Reinforcement Learning
    └─ MDP → Q-Learning → DQN
~~~

대표 인출 좌표:

- Supervised: Logistic Regression, KNN, Decision Tree, SVM, Ensemble
- Unsupervised: K-Means, DBSCAN, PCA, ICA, Apriori
- Reinforcement: MDP, Q-Learning, DQN

이 이름들은 하나의 발전 사슬이 아니라 **각 문제군에서 비교·선택하는 대표 Algorithm**이다.

## 3. Algorithm은 판단 원리와 함께 묶어 본다

Algorithm 이름을 따로 외우지 않고 **무엇을 이용해 판단하는가**를 기준으로 주변 개념을 연결한다.

~~~text
거리 · 유사도
├─ Euclidean / Mahalanobis
├─ Hamming / Jaccard
└─ → KNN / Clustering

Tree
└─ Decision Tree
    ↓ 과적합 완화
   Ensemble
   ├─ Bagging → Random Forest
   └─ Boosting

관계 발견
└─ Association Rule
    └─ Apriori
       ├─ Support
       ├─ Confidence
       └─ Lift
~~~

## 4. Neural Network는 학습 흐름을 먼저 잡는다

~~~text
Input
  ↓
Neural Network
  ↓
Forward Propagation
  ↓
Prediction
  ↓
Loss
  ↓
Backpropagation
  ↓
Gradient Descent / Optimizer
  ↓
Weight Update
  └──────── 반복
~~~

학습 과정의 대표 판단 축:

~~~text
Training
├─ Activation / Loss
├─ Learning Rate / Optimizer
├─ Overfitting ↔ Generalization
└─ Regularization / Dropout
~~~

Perceptron·Activation Function·Backpropagation·Gradient Descent는 신경망 학습 흐름 안에서 위치를 잡고, 세부 계산은 아래로 내린다.

## 5. DL Architecture는 Data 관계에 따라 갈라진다

~~~text
어떤 관계를 주로 다루는가?
├─ 일반적인 다층 표현 → MLP / DNN
├─ 공간적 특징       → CNN
├─ 순서 · 시계열     → RNN → LSTM / GRU
└─ 요소 간 관계      → Attention → Transformer
~~~

CNN·RNN·Transformer는 단순한 세대 순서가 아니라 **Data 구조와 처리 방식에 따른 Architecture 선택지**다.

→ [CNN · RNN · Transformer 등 대표 DL 구조](딥러닝-대표구조-CNN-RNN-Transformer-GAN.md)  
CNN·RNN·Transformer가 각각 어떤 관계를 잘 표현하는지와 구조적 차이를 더 깊게 본다.

Transformer는 Foundation Model·LLM으로 이어지는 연결점이다.

→ 생성형 AI·LLM 개념지도  
Transformer 이후 Foundation Model·LLM이 어디에 위치하고, 생성형 AI 활용 기술로 어떻게 이어지는지 본다.

## 6. Model을 만들었으면 평가 · 검증한다

~~~text
Data
├─ Train
├─ Validation
└─ Test
      ↓
Generalization 확인
~~~

대표 평가 좌표:

~~~text
Evaluation
├─ Cross Validation / K-Fold
├─ Confusion Matrix
│   ├─ Accuracy
│   ├─ Precision
│   ├─ Recall
│   └─ F1
├─ Overfitting / Data Leakage
└─ Data Quality
~~~

Accuracy·Precision·Recall·F1은 발전 순서가 아니라 오류 비용에 따라 선택하는 동급 지표다.

→ [AI 평가 · Golden Set · Red Teaming](99-AI-평가-Golden-Set과-Red-Teaming.md)  
기본 ML 평가에서 더 나아가 AI Application의 반복 검증과 실패 경계 탐색으로 확장한다.

## 7. 학습 경로

~~~text
1. 학습 신호 구분
   Supervised / Unsupervised / Reinforcement
        ↓
2. 문제 유형과 대표 Algorithm 비교
        ↓
3. 판단 원리 연결
   거리·유사도 / Tree·Ensemble / Association
        ↓
4. Neural Network 학습 흐름
        ↓
5. DL Architecture 선택
   CNN / RNN / Transformer
        ↓
6. 평가 · 검증
        ↓
7. Transformer에서 Foundation Model · LLM로 Zoom-in
~~~

이 순서는 기술의 역사적 발전 순서가 아니라 **큰 그림을 잃지 않고 필요한 세부학습으로 내려가기 위한 탐색 경로**다.
