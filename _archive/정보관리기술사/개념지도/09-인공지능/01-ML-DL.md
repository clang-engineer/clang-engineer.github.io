# 인공지능 ML·DL 개념지도

이 문서는 [[00-전체|인공지능 전체 개념지도]]에서 ML(Machine Learning, 데이터에서 패턴을 학습하는 기계학습) 가지를 선택했을 때, **학습 신호를 구분하고 → 문제에 맞는 Algorithm을 선택하고 → 더 복잡한 표현은 신경망·DL(Deep Learning, 다층 신경망 기반 학습)로 확장하고 → 마지막에 평가·검증하는 흐름**으로 주변 개념을 파고들기 위한 하위 지도다.

세부 Algorithm의 내부 동작·수식·Parameter는 `../../세부학습/09-인공지능/`에서 다룬다.

---

## 1. 먼저 큰 흐름을 잡는다

```text
Data로 문제를 해결하고 싶음
        ↓
어떤 학습 신호를 사용할 수 있는가?
        ↓
지도 / 비지도 / 강화학습
        ↓
어떤 문제를 풀 것인가?
분류 · 회귀 · 군집 · 차원축소 · 순차 의사결정
        ↓
문제와 Data 특성에 맞는 Algorithm 선택
        ↓
더 복잡한 표현을 학습해야 하는가?
        ├─ 아니오 → 고전 ML
        └─ 예     → Neural Network / DL
                         ↓
                    학습·일반화
                         ↓
                    평가·검증
```

`지도학습 → 비지도학습 → 강화학습 → DL`은 발전 순서가 아니다. 위 흐름은 **학습할 때 무엇을 먼저 구분하고 어디로 파고들지 보여주는 탐색 순서**다.

## 2. Machine Learning 전체 좌표

```text
ML
│
├─ 학습 신호 기준
│   ├─ 지도학습
│   │   ├─ 분류
│   │   └─ 회귀
│   ├─ 비지도학습
│   │   ├─ 군집
│   │   └─ 차원축소
│   └─ 강화학습
│       └─ MDP(Markov Decision Process, 상태·행동·보상으로 순차 의사결정을 표현)
│           ↓
│         Q-Learning(행동가치 Q를 학습)
│           ↓
│         DQN(Deep Q-Network, Q-Learning에 신경망을 결합)
│
├─ Model / Algorithm 계열
│   ├─ 고전 ML
│   └─ Neural Network / DL
│
└─ 평가·검증
    ├─ Train / Validation / Test
    ├─ Cross Validation
    └─ 평가 지표
```

학습 방식과 Algorithm 계열은 같은 분류축이 아니다. 예를 들어 지도학습 문제를 Logistic Regression, SVM(Support Vector Machine, 분류 경계를 최대화하는 학습 기법), Decision Tree, Neural Network 등 여러 방법으로 풀 수 있다.

---

## 3. 학습 방식: 어떤 Feedback을 가지고 있는가

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

강화학습 주변에는 HMM(Hidden Markov Model, 관측되지 않는 상태의 전이를 확률적으로 모델링)·MCTS(Monte Carlo Tree Search, 시뮬레이션으로 유망한 탐색 경로를 찾는 방법) 같은 순차·탐색 관련 꼭지가 있지만 `MDP → Q-Learning → DQN`의 직접 하위 단계로 보지는 않는다.

---

## 4. 지도학습: 정답이 있으면 예측 문제로 내려간다

```text
입력 + 정답이 있음
        ↓
지도학습
        ↓
무엇을 예측하는가?
├─ 범주       → 분류
└─ 연속된 값  → 회귀
```

분류와 회귀가 정해지면 문제와 Data 특성에 맞는 Algorithm을 비교한다.

```text
지도학습
├─ 분류
│   ├─ Logistic Regression
│   ├─ KNN(K-Nearest Neighbors, 가까운 이웃을 이용해 예측)
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

## 5. Algorithm을 이해하면 주변 원리로 확장한다

Algorithm을 개별 이름으로만 외우지 않고 **그 Algorithm이 무엇을 이용해 판단하는지**를 따라 주변 개념으로 확장한다.

### 거리·유사도를 이용한다

```text
가까운 Data를 이용해 판단하거나 묶음
        ↓
거리 / 유사도
├─ Euclidean Distance
├─ Mahalanobis Distance
├─ Hamming Distance
└─ Jaccard Similarity
        ↓
활용 Algorithm
├─ KNN
└─ Clustering 등
```

거리·유사도 자체와 이를 사용하는 Algorithm을 같은 계층으로 보지 않는다.

### Tree 하나의 한계를 여러 Model로 보완한다

```text
Decision Tree
        ↓
해석은 쉽지만 과적합 가능
        ↓
여러 Model을 결합
        ↓
Ensemble
├─ Bagging
│   └─ Random Forest
└─ Boosting
```

Tree를 공부하면 `과적합`, `Ensemble`, `Bagging`, `Boosting`, `Random Forest`를 주변 꼭지로 함께 본다.

---

## 6. 정답이 없으면 Data 구조를 찾는다

```text
정답이 없음
        ↓
비지도학습
        ↓
Data에서 무엇을 찾을 것인가?
├─ 비슷한 것끼리 묶음
│   └─ 군집
│       ├─ K-Means  → 중심점 기반
│       └─ DBSCAN(Density-Based Spatial Clustering of Applications with Noise,
│                 밀도 기반 군집화)
│
└─ 중요한 표현만 남김
    └─ 차원축소 / 특징 추출
        ├─ PCA(Principal Component Analysis, 분산이 큰 주성분으로 차원축소)
        └─ ICA(Independent Component Analysis, 독립 성분을 분리)
```

이들은 같은 목적 안에서 비교하며 파고드는 인접 개념이다.

별도로 Data에서 함께 나타나는 관계를 찾는 문제도 있다.

```text
함께 나타나는 Pattern을 찾고 싶음
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

## 7. 더 복잡한 표현이 필요하면 Neural Network로 확장한다

고전 ML과 Neural Network는 무조건적인 발전 단계가 아니다. 다만 Data에서 더 복잡한 비선형 표현을 학습해야 할 때 Neural Network·DL이 중요한 선택지가 된다.

```text
입력 Data
        ↓
Neural Network
        ↓
Perceptron / Activation Function
        ↓
MLP(Multi-Layer Perceptron, 다층 완전연결 신경망)
        ↓
Forward Propagation
        ↓
예측 결과와 정답의 차이
        ↓
Loss
        ↓
Backpropagation
        ↓
Gradient Descent / Optimizer
        ↓
Weight 갱신
        └──── 반복
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

## 8. Data 구조에 맞춰 Deep Learning Architecture가 갈라진다

신경망을 깊게 만들었다고 모든 문제에 같은 Architecture를 쓰는 것은 아니다.

```text
어떤 Data 관계를 주로 다루는가?
│
├─ 일반적인 다층 표현
│   └─ MLP / DNN(Deep Neural Network, 여러 층으로 구성한 신경망)
│
├─ 공간적 특징
│   └─ CNN(Convolutional Neural Network, 공간적 특징 추출에 강한 신경망)
│
├─ 순서·시계열
│   └─ RNN(Recurrent Neural Network, 순서 정보를 반복 구조로 처리하는 신경망)
│       ↓ 긴 의존성 학습이 어려움
│      LSTM(Long Short-Term Memory, 장기 의존성을 보완한 RNN)
│      / GRU(Gated Recurrent Unit, Gate 구조를 단순화한 RNN)
│
└─ 요소 사이 관계를 직접 다룸
    └─ Attention
        └─ Transformer
```

CNN·RNN·Transformer는 단순한 발전 순서가 아니다. Data 구조와 처리 방식에 따라 연결해서 본다.

Transformer는 생성형 AI·LLM 쪽으로 이어지는 중요한 연결점이다.

→ [[02-생성형AI-LLM|생성형 AI·LLM 개념지도]]

세부학습: [[딥러닝-대표구조-CNN-RNN-Transformer-GAN|CNN·RNN·Transformer 등 대표 DL 구조]]

---

## 9. 학습했으면 평가하고 일반화 여부를 확인한다

Model을 만들었다고 학습이 끝나는 것이 아니다. 보지 않은 Data에서도 잘 동작하는지 확인해야 한다.

```text
Data
 ↓
Train
 ↓
Model 학습
 ↓
Validation
├─ Hyperparameter 조정
└─ Cross Validation / K-Fold
 ↓
최종 Test
 ↓
새 Data에 일반화되는가?
```

분류 평가에서는 오류의 종류에 따라 지표를 선택한다.

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

## 10. 전체 기억 흐름

```text
Data로 문제 해결
        ↓
학습 신호 확인
├─ 정답       → 지도학습 → 분류 / 회귀
├─ 정답 없음  → 비지도학습 → 군집 / 차원축소
└─ 보상       → 강화학습 → MDP / Q-Learning / DQN
        ↓
문제·Data 특성에 맞는 Algorithm 선택
        ↓
Algorithm 주변 원리 이해
거리·유사도 / Tree·Ensemble / 관계 발견 ...
        ↓
복잡한 표현 학습이 필요하면 Neural Network / DL
        ↓
Data 구조에 맞는 Architecture 선택
CNN / RNN / Transformer ...
        ↓
학습 결과 평가·검증
        ↓
Transformer에서 Foundation Model·LLM 가지로 확장 가능
```

이 흐름은 모든 ML 기술의 역사적 발전 순서가 아니다. **처음 학습할 때 큰 그림을 잃지 않고 주변 개념을 넓혀 가기 위한 탐색 스토리라인**이다.
