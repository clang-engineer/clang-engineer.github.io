# 학습 가이드

## 권장 흐름

`AI·ML·DL 관계와 윤리 → 학습 유형과 데이터 준비 → 공통 평가 → 지도·비지도·강화학습 알고리즘 → 신경망과 딥러닝 → 활용·운영·통제`

## 학습 깊이

- **핵심**: AI/ML/DL 관계, 지도·비지도·강화학습, 회귀·분류·군집, 과적합과 검증, 신경망·역전파, 평가 지표, 윤리와 XAI
- **연결**: NLP, 추천, 시계열, AI 보안과 데이터 품질, 배포 후 모니터링·드리프트·재학습의 운영 피드백. 알고리즘·DB·클라우드와 연결한다.
- **조회**: 특정 프로젝트와 도구, 반복 알고리즘 문제, 모델별 세부 수식은 기출이나 비교가 필요할 때 확인한다.

## 회독 종료 기준

- 문제와 데이터 특성에 맞는 학습 유형, 모델, 평가 지표를 선택하고 학습 절차를 설명할 수 있다.
- 데이터 편향, 과적합, 설명가능성, 보안·윤리 위험과 대응책을 함께 제시할 수 있다.
- 모델 수식의 완전한 유도보다 입력·학습·평가·운영의 전체 흐름이 보이면 멈춘다.

# 목차
PART 1. 인공지능(人工知能, Artificial Intelligence)의 개요

1. 인공지능(Artificial Intelligence)의 역사
2. 인공지능
3. 약 인공지능(Weak AI), 강 인공지능(Strong AI), 초 인공지능(Super AI)
4. 인공지능(AI)의 특이점(Singularity)
5. 아실로마(Asilomar) AI(인공지능) 원칙
6. 규칙기반모델
7. 추천엔진(Recommendation Engine)
8. 전문가시스템(Expert System)
9. 정규표현식과 유한 오토마타
10. 유한 오토마타(Finite Automata)
11. 튜링테스트(Turing Test)
12. 에이전트(Agent) - 1교시형 답안
13. 에이전트(Agent) - 2교시형 답안
14. 킬 스위치(Kill Switch)
15. 트롤리 딜레마(Trolley Dilemma)
16. 인공지능(AI) 윤리의 개념, 주요 사례, 고려사항 및 추진 방향
17. 이용자 중심의 지능정보사회를 위한 원칙

PART 2. 인공지능 알고리즘(Algorithm)

18. 유전자 알고리즘(Genetic Algorithm)
19. 그리디 알고리즘(Greedy Algorithm)
20. 상관분석(Correlation Analysis)
21. 회귀분석(Regression Analysis)
22. 로지스틱 회귀분석(Logistic Regression Analysis)
23. 군집분석(Cluster Analysis) - 1교시형 답안
24. 군집분석(Cluster Analysis) - 2교시형 답안
25. 계층적 군집분석(Hierarchical Clustering)
26. 자카드(Jaccard)계수
27. 해밍거리(Hamming Distance)
28. 유클리디안 거리(Euclidean Distance)
29. 유클리디안 거리(Euclidean Distance)를 계산하시오.
30. 마할라노비스 거리(Mahalanobis Distance)를 계산하시오.
31. Apriori(연관규칙) 알고리즘
32. 지지도(Support), 신뢰도(Confidence), 향상도(Lift)
33. 사례1(TV 구입시 DVD 구입), 사례2(우유 구입시 주스 구입)에 대해 연관규칙(지지도, 신뢰도, 향상도)을 제시하시오.
34. 앙상블학습(Ensemble Learning)
35. 머신러닝(Machine Learning)에 활용, 앙상블(Ensemble) 기법
36. Bagging과 Boosting 비교
37. 랜덤 포레스트(Random Forest)
38. 의사결정트리(Decision Tree)
39. K-NN(K-Nearest Neighbor)
40. 시계열 분석
41. 시계열 분석(ARIMA)
42. SVM(Support Vector Machine)- 1교시형 답안
43. SVM(Support Vector Machine)- 2교시형 답안
44. 베이즈(Bayes)정리
45. 크기와 모양이 같은 공이 상자 A에는 검은 공 2개와 흰공 2개, 상자 B에는 검은공 1개와 흰공 2개가 들어 있다. 두 상자 A, B 중 임의로 선택한 하나의 상자에서 공을 1개 꺼냈더니 검은공이 나왔을 때, 그 상자에 남은 공이 모두 흰공일 확률은? (베이즈(Bayes)정리를 활용하시오)
46. K-Means
47. DBSCAN(Density-Based Spatial Clustering of Applications with Noise)
48. 차원축소(Dimensionality Reduction)
49. 특징추출(Feature Extraction)
50. 주성분 분석, PCA(Principal Component Analysis)
51. 독립성분분석, ICA(Independent Component Analysis)
52. 마르코프 결정 프로세스(Markov Decision Process, MDP)
53. 은닉 마르코프 모델(HMM-Hidden Markov Model)
54. 몬테카를로 트리 탐색(MCTS)
55. Q-Learning
56. Tokenization(토근화), N-gram
57. Word2Vec
58. Word2Vec학습모델, CBOW(Continuous Bag Of Words), Skip-gram

PART 3. 심층 신경망 상세

59. 일반적인 프로그램 방식과 Machine Learning(기계학습) 프로그래밍 방식
60. AI(Artificial Intelligence), ML(Machine Learning), DL(Deep Learning)
61. 기계학습(Machine Learning)
62. 지도학습(Supervised Learning)
63. 비지도(비감독)(Unsupervised Learning)학습
64. 강화학습(Reinforcement Learning)
65. 딥러닝(Deep Learning)
66. MCP(McCulloch-Pitts)뉴런(Neuron)
67. 헵 규칙(Hebb Rule)
68. 퍼셉트론(Perceptron)
69. 아달라인(ADALINE, Adaptive Linear Neuron)
70. 활성화 함수(Activation Function) - 1
71. 활성화 함수(Activation Function) - 2
72. 신경망 학습 - FFNN(Feed Forward Neural Network)
73. 딥러닝(Deep Learning)의 파라미터(Parameter)와 하이터파라미터 (Hyperparameter)를 비교하고 하이퍼파라미터의 튜닝방법을 설명하시오
74. 역전파법(Back-Propagation)
75. 기울기 소실 문제(Vanishing Gradient Problem)
76. 경사하강법(Gradient Descent)
77. 과적합(Overfitting)과 부적합(Underfitting), 적합(Bestfitting)
78. 과적합(Overfitting)과 부적합(Underfitting) 해결방안
79. Dropout
80. ANN(Artificial Neural Network)
81. DNN(Deep Neural Network)
82. CNN(Convolutional Neural Network)
83. RNN(Recurrent Neural Network)
84. LSTM(Long Short-Term Memory)
85. GRU(Gated Recurrent Unit)
86. RBM(Restricted Boltzmann Machine)
87. DBN(Deep Belief Network)
88. DQN(Deep Q-Network)
89. GAN(Generative Adversarial Networks) [ GAN의 이해 ]
90. DL4J(Deep Learning 4J)
91. 혼동행렬(Confusion Matrix)
92. Machine Learning(기계학습)의 평가방법-Accuracy(정확도), Recall(재현율), Precision(정밀도)
93. F1 Score

PART 4. 인공지능 활용

94. 음성인식기술, ASR(Automatic Speech Recognition), NLU(Natural Language Understanding)
TTS(Text to Speech)
95. 음성인식(Voice Recognition)
96. 챗봇(ChatBot)
97. 가상개인비서(Virtual Personal Assistant)
98. 패턴인식(Pattern Recognition)
99. 머신러닝 파이프라인(Machine Learning Pipeline)
100. 자연어 처리
101. 엑소브레인(Exobrain)
102. 엑소브레인(Exobrain)과 Deepview 기술요소
103. 딥뷰(Deepview)
104. SNA(Social Network Analysis)
105. 텐서플로(Tensorflow)
106. 파이썬(Python)의 특징 및 자료형(Data Type)
107. 패션 의류용 이미지를 분류하는 다층 신경망을 들려고 한다. 의류용 이미지는 바지, 치마, 셔츠 등 10가지 유형의 흑백 이미지(32*32 pixels)로 구성되어 있고, 학습에 투입할 이미지 데이터는 검증 및 테스트용 데이터를 제외하고 총 48,000장이다. 입력층, 은닉층, 출력층의 완전연결(fully connected) 3계층으로 구성되어 있고 은닉층의 뉴런개수는 100개일 때, 다음에 대하여 설명하시오
가. 신경망 구성도
나. 입력층의 입력개수, 출력층의 뉴런 개수, 학습할 가중치와 절편의 총 개수
다. 원핫인코딩(One-Hot Encoding)과 소프트맥스(Softmax)함수

PART 5. 기출 및 예상 토픽

108.GPU(Graphic Processing Unit)와 CPU(Central Processing Unit)의 차이점
109. 머신러닝 모델은 학습과 함께 검증 및 평가 과정이 필요하다
가. 교차검증(k-fold Cross Validation)기법에 대해 설명하시오
나. 머신러닝 모델의 평가방법에 대하여 설명하시오
110. 머신러닝 보안 취약점에 대해 설명하시오.
가. 머신러닝 학습과정에서의 적대적 공격 4가지
나. 각각 적대적 공격의 방어 기법
111. 데이터 어노테이션(Data Annotation)
112. AIaaS(AI as a Service)와 도입시 고려사항
113. 전이 학습(Transfer Learning)
114. Pre-Crime
115. 인공신경망의 오류 역전파(Backpropagation) 알고리즘
116. 머신러닝(Machine learning)의 학습방법은 크게 3가지[지도학습(Supervised Learning), 비지도 학습(Unsupervised Learning), 강화학습(Reinforcement Learning)]로 분류한다. 인공지능소프트웨어 개발 프로세스를 V 모델 기준으로 도식화하고 관련기술의 최신동향 및 안전취약점을 설명하시오
117. 인공지능 개발과정에서 중점적으로 점검할 항목
118. 인공지능 데이터 품질 요구사항
119. 몬테카를로(Monte Carlo) 트리(Tree) 탐색(MCTS)
120. 디지털 카르텔(Digital Cartel)
121. XAI(eXplainable AI)
122. 인공지능(AI) 데이터 평가를 위한 고려사항
