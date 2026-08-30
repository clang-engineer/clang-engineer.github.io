# 인공지능 ML·DL 개념지도

이 문서는 `09-인공지능.md`에서 Machine Learning 가지를 선택했을 때, **학습 방식 → 고전 ML → 신경망·Deep Learning → 평가**의 주변 개념을 파고들기 위한 하위 지도다.

세부 Algorithm의 내부 동작·수식·Parameter는 `../세부학습/09-인공지능/`에서 다룬다.

---

## 1. Machine Learning 전체 좌표

```text
Machine Learning
│
├─ 학습 신호 기준
│   ├─ 지도학습
│   │   ├─ 분류
│   │   └─ 회귀
│   ├─ 비지도학습
│   │   ├─ 군집
│   │   └─ 차원축소
│   └─ 강화학습
│       └─ MDP → Q-Learning → DQN
│
├─ Model / Algorithm 계열
│   ├─ 고전 ML
│   └─ Neural Network / Deep Learning
│
└─ 평가·검증
    ├─ Train / Validation / Test
    ├─ Cross Validation
    └─ 평가 지표
```

학습 방식과 Algorithm 계열은 같은 분류축이 아니다. 예를 들어 지도학습 문제를 Logistic Regression, SVM, Decision Tree, Neural Network 등 여러 방법으로 풀 수 있다.

---

## 2. 학습 방식: 어떤 Feedback을 가지고 있는가

```text
문제를 해결해야 함
 ↓
무엇을 이용할 수 있는가?
├─ 입력 + 정답
│   └─ 지도학습
│       ├─ 분류
│       └─ 회귀
├─ 정답 없는 Data
│   └─ 비지도학습
│       ├─ 군집
│       └─ 차원축소
└─ 행동 결과의 보상
    └─ 강화학습
        ↓
       MDP
        ↓
    Q-Learning
        ↓
       DQN
```

`지도 → 비지도 → 강화`는 발전 순서가 아니라 학습 신호에 따른 병렬 패러다임이다.

강화학습 주변에는 HMM·MCTS 같은 순차·탐색 관련 꼭지가 있지만 `MDP → Q-Learning → DQN`의 직접 하위 단계로 보지는 않는다.

---

## 3. 지도학습: 분류와 회귀에서 주변 Algorithm을 찾는다

```text
지도학습
├─ 분류
│   ├─ Logistic Regression
│   ├─ KNN
│   ├─ Decision Tree
│   │   └─ Ensemble
│   │       ├─ Bagging
│   │       │   └─ Random Forest
│   │       └─ Boosting
│   ├─ SVM
│   ├─ Bayesian 계열
│   └─ Neural Network
│
└─ 회귀
    ├─ 회귀분석
    └─ Neural Network 등
```

분류 Algorithm은 하나의 발전 사슬이 아니라 같은 문제를 서로 다른 가정과 방식으로 푸는 비교 대상이다.

상관분석은 예측 Model 자체라기보다 변수 관계를 확인하는 통계적 분석 꼭지로 회귀와 인접한다.

---

## 4. 거리·유사도 기반 꼭지

```text
거리 / 유사도
├─ Euclidean Distance
├─ Mahalanobis Distance
├─ Hamming Distance
└─ Jaccard Similarity
     ↓
거리·유사도를 활용하는 주변 기법
├─ KNN
└─ Clustering 등
```

거리·유사도 자체와 이를 사용하는 Algorithm을 같은 계층으로 보지 않는다.

---

## 5. Tree와 Ensemble

```text
Decision Tree
│
├─ 단일 Tree
│   └─ 해석은 쉽지만 과적합 가능
│
└─ 여러 Model을 결합
    └─ Ensemble
        ├─ Bagging
        │   └─ Random Forest
        └─ Boosting
```

Tree를 공부하면 `과적합`, `Ensemble`, `Bagging`, `Boosting`, `Random Forest`를 주변 꼭지로 함께 본다.

---

## 6. 비지도학습

```text
비지도학습
├─ 군집
│   ├─ K-Means
│   └─ DBSCAN
│
└─ 차원축소 / 특징 추출
    ├─ PCA
    └─ ICA
```

```text
군집
├─ K-Means  → 중심점 기반
└─ DBSCAN   → 밀도 기반

차원축소
├─ PCA      → 주성분
└─ ICA      → 독립 성분
```

이들은 같은 목적 안에서 비교하며 파고드는 인접 개념이다.

---

## 7. Pattern·관계 발견

```text
Data에서 함께 나타나는 관계 발견
 ↓
Association Rule
 ↓
Apriori
├─ Support
├─ Confidence
└─ Lift
```

연관규칙은 분류·회귀와 다른 문제를 다루는 별도 학습 꼭지다.

---

## 8. Neural Network와 Deep Learning

```text
Neural Network
 ↓
Perceptron / Activation Function
 ↓
MLP / DNN
 ↓
Forward Propagation
 ↓
Loss
 ↓
Backpropagation
 ↓
Gradient Descent / Optimizer
 ↓
Weight 갱신
```

학습 과정에서 함께 파는 꼭지:

```text
Training
├─ Activation Function
├─ Loss Function
├─ Learning Rate
├─ Optimizer
├─ Overfitting
│   ├─ Regularization
│   └─ Dropout
└─ Generalization
```

---

## 9. Deep Learning Architecture

```text
Deep Learning
├─ 일반적인 다층 표현
│   └─ MLP / DNN
│
├─ 공간적 특징
│   └─ CNN
│
├─ 순서·시계열
│   └─ RNN
│       └─ 장기 의존성 문제
│           └─ LSTM / GRU
│
└─ 요소 사이 관계를 직접 다룸
    └─ Attention
        └─ Transformer
```

CNN·RNN·Transformer는 단순한 발전 순서가 아니다. Data 구조와 처리 방식에 따라 연결해서 본다.

Transformer는 생성형 AI·LLM 쪽으로 이어지는 중요한 연결점이다.

→ `09-인공지능-생성형AI-LLM.md`

상세: `../세부학습/09-인공지능/딥러닝-대표구조-CNN-RNN-Transformer-GAN.md`

---

## 10. 평가와 검증

```text
Data
 ↓
Train / Validation / Test
 ↓
Training
 ↓
Validation
│   └─ Cross Validation / K-Fold
 ↓
Test
```

분류 평가:

```text
Confusion Matrix
├─ Accuracy
├─ Precision
├─ Recall
└─ F1
```

평가에서 주변으로 파는 꼭지:

```text
Evaluation
├─ Overfitting / Generalization
├─ Bias
├─ Data Leakage
└─ Data 품질
```

Accuracy·Precision·Recall·F1은 발전 순서가 아니라 오류 비용에 따라 선택·비교하는 동급 지표다.

---

## 11. 다른 분류축과의 연결

```text
[학습 방식]
지도 / 비지도 / 강화

[Algorithm / Architecture]
회귀 / KNN / Tree / SVM / Neural Network ...

[평가]
Train·Validation·Test / Metrics

[응용]
추천 / NLP / Vision / 예측 ...
```

한 개념을 공부할 때 먼저 어느 축에 있는지를 확인하고, 같은 축의 비교 대상과 다른 축에서 연결되는 개념을 구분한다.
