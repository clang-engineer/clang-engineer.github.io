# 학습 가이드

## 권장 흐름

`복잡도와 알고리즘 분석 → 배열·연결리스트 → 스택·큐 → 정렬·탐색 → 해시 → 트리 → 그래프 → 대표 설계 전략`

## 학습 깊이

- **핵심**: 시간·공간 복잡도, 기본 자료구조, 대표 정렬과 탐색, 해시, 트리, 그래프 순회와 최소 신장 트리
- **연결**: 재귀, 균형 트리, 압축과 문자열 알고리즘, 분할정복·탐욕법·동적 계획법·백트래킹의 개념과 선택 기준. DB 인덱스, OS, AI에서 어떻게 쓰이는지 연결한다.
- **조회**: 반복되는 삽입·삭제 추적, C 코드 문법, 다른 권의 OS·DB·AI 주제는 대표 문제만 풀거나 해당 권에서 확인한다.

## 회독 종료 기준

- 입력 규모와 연산 특성에 따라 자료구조와 알고리즘을 선택하고 복잡도로 근거를 설명할 수 있다.
- 정렬, 탐색, 트리, 그래프의 대표 동작을 손으로 한 번 추적할 수 있다.
- 모든 코드 구현보다 원리, 복잡도, 장단점, 적용처를 비교할 수 있으면 멈춘다.

# 목차
PART 1. 자료구조(Data Structure)와 알고리즘(Algorithm)
1. 자료구조(Data Structure)
2. 자료구조(Data Structure)의 형태, 구성, 단위
3. 알고리즘(Algorithm)의 정의, 조건, 접근 방법, 분석 방법
4. 알고리즘 실행시간을 추정하는데 사용되는 Big-Oh(O) 표기법
5. 알고리즘의 평가방법인 Time Complexity(시간 복잡도)와 Space Complexity(공간 복잡도)
6. 10진수 53를 2진수로 변환하고 2진수 110101을 10진수로 변환
7. 10진수 0.6875를 2진수로 변환하고 그 결과를 다시 10진수로 표현
8. 2진수를 음수로 표현하는 방법 3가지 이상 나열
9. 알고리즘 표현 방법과 반복문인 for, while, do~while문을 사용하여 1에서 100까지 덧셈하는 code 예제와 순서도
10. 아래 3개 A,B,C 알고리즘 사용시 n에 대한 전체 연산수를 구하시오
11. 프로그램 언어에서 함수간 매개변수 전달기법인 Call-by-value, Call-by-reference, Call-by-name에 대해 실제 Code 예제를 보이시오.
12. C언어를 사용하여 정수를 이진수로 변환하는 프로그램을 작성하시오.
가정: C언어에서 이진수의 출력은 문자열, 이진수는 32bit를 초과하지 않음
13. 자료 구조에서 아래 Pointer 자료의 Memory Allocation (할당)를 표현하고 설명하시오.

PART 2. 재귀함수(Recursion Function)
14. “Factorial n”을 구하는 재귀호출 알고리즘
15. 다음 재귀호출(Recursive Call) Code에 수행 동작을 설명하시오.
16. 피보나치 수열(Fibonacci Sequence)에 대해 설명하고 아래 Code에 대한 실행 결과를 기술하시오.
17. 아래 피보나치(Fibonacci) 함수 Code에 대해 실행 과정을 설명하고 실행 결과를 기술하시오.
18. 아래 하노이 타워(The Tower of Hanoi) 문제를 아래 조건에 적절하게 기술하시오.
조건 1) 하나의 막대에 쌓여 있는 원반을 다른 하나의 원반에 그대로 옮기시오.
이때 한 번에 하나씩만 옮길 수 있고 옮기는 과정에서 작은 원반의 위에
큰 원반이 올려져서는 안됨.
조건 2) 실행 과정을 설명하고 Coding 하시오.

PART 3. 배열(Array)과 연결 리스트(Linked List)
19. Array(배열)에 대해 설명하고 장단점
20. 다음 3차원 배열 값에 대한 배열의 각각의 요소 값과 Memory에 할당되는 방법에 대해 기술하시오(행(Row) 우선의 경우를 고려하여 작성하시오).
21. 배열(Array) List와 연결 List의 차이점
22. 선형 List(Linear List)에서 처리할 수 있는 연산에 대해 7가지 이상 나열
23. Linked List의 구성과 비순차적인 메모리 구성에 따른 삽입과 삭제
24. 다음과 같이 구조체 자료형 인 _node를 선언하고 이를 이용하여 연결리스트(Linked List)를 만들었다. 다음 소스를 보고 물음에 답하시오(단, 시작함수는 _tmain()).
25. 이중(Double) 연결 리스트(Linked List)에서 삽입과 삭제
26. 인접 다중 리스트(Adjacency Multi List)에 대해 설명하고 아래 Graph 에 대해 인접 리스트로 표현하시오.

PART 4. 스택(Stack)과 큐(Queue)
27. 스택(Stack)에서 사용되는 용어와 연산
28. 아래 Stack 구조를 Linked List(연결리스트)형태로 표현하고 D값을 삭제한 연결리스트와 E값을 삽입한 연결리스트를 도식화 하시오(Stack크기는 5로 가정한다).
29. Stack의 크기 n=5인 스택에서 노드 A,B,C,D를 Push하고 D,C,B를 POP한 후 다시 노드 E,F를 Push 하는 과정(TOP는 Stack Pointer임)
30. Stack의 활용예 5가지 이상과 2개의 상세예제 그리고 stack overflow 발생방지방법 2가지
31. Queue에 대해 설명하고 Queue를 표현하기 위한 조건과 큐의 삽입과 삭제에 대해 Coding하여 설명하시오.
32. 원형 큐(Circular Queue)에서 Enqueue와 Dequeue, Empty와 Full 상태
33. 우선순위 큐(Priority Queue)를 구현하는 방법으로 배열, 연결 List, 힙(Heap)을 이용하는 방법이 있다. 각각 설명하시오.
34. 데크(Deque : Double Ended Queue)의 삽입과 삭제 과정

PART 5. 정렬(Sorting)
35. 다음은 C언어로 작성된 버블 정렬(Bubble Sort) 알고리즘 프로그램 일부이다. 프로그램을 완성하시오.
36. 아래 Code는 Bubble Sort에서 Flag를 사용하는 경우와 사용하지 않는 경우를 각각 Coding 하고자 한다. 가.항목과 나.항목의 Code를 완성하고 차이점을 기술하시오.
37. Bubble Sort에서 이미 정렬된 값은 더 이상 비교할 필요가 없다. 이 점을 고려하여 Bubble Sort의 예제를 들어 Coding 하시오(설명도 추가하시오).
38. 다음 Key값에 대한 Bubble Sort 과정을 설명하고 버블 정렬 성능 평가를 Big-oh(O)로 표기하시오.
39. 아래 Key값에 대해 선택 정렬 (Selection Sort) 과정을 설명하고 Coding 예제를 기술하시오.
40. 아래 Key값에 대해 삽입 정렬 (Insertion Sort) 과정을 설명하고 Code 예제를 기술하시오.
41. Insertion Sort (삽입 정렬)에 대해 실행 효율적인 측면을 설명하고 초기 자료 : 2, 4, 3, 5, 1 값에 실행 과정을 기술하시오.
42. 다음 값을 삽입 정렬 (Insert Sorting) 과정을 설명하시오.
43. 다음 각각의 Data를 선택 정렬과 머지 정렬(Merge)의 과정을 설명하시오.
44. 아래 Record 값을 버킷(Bucket)을 사용하여 기수정렬(Radix Sort)을 수행하는 과정을 기술하시오(n=15).
45. 아래 Record 값을 Queue를 사용하여 기수정렬(Radix Sort)을 수행하는 과정을 기술하시오.(n=15)
46. 12개의 Record Key 값= (121, 212, 004, 120, 215, 309, 518, 202, 415, 345, 107, 333)로 구성된 파일을 기수정렬(Radix) (LSD 우선방식적용)로 정렬하는 과정을 보이시오.
47. 아래 2개의 배열 값에서 2-원 합병 정렬 (2-Way Merge Sort)으로 정렬하는 과정을 설명하시오.
48. 아래 Key 값을 이용하여 Shell Sort 과정을 설명하시오(이때 매개변수는 6,4,3,2,1을 적용하시오).
49. 병합 정렬 (Merge Sort)의 방법에 대해 추상화하여 설명하시오. Key값은 다음과 같다. Key=(8, 2, 3, 7, 1, 5, 4, 6)
50. 다음 16개의 정렬되지 않는 초기 자료가 배열 a 에 입력되어 있을 때 단계별로 오름차순으로 정렬되는 과정을 (기수정렬-Radix Sort)방법 사용) 기술하시오.
51. Quick Sorting 알고리즘을 설명하고, 다음 Data를 Quick Sorting 알고리즘을 정렬하는 과정을 설명하시오. Data는 15, 22, 13, 27, 12, 10, 20, 25.
52. 아래 정렬되지 않은 데이터가 9개 있을 때 외부정렬(External Sort) 방식인 다단계 병합방식으로 정렬되는 과정을 기술하시오.
53. 아래 정렬되지 않은 데이터 8개에 대해 균형병합정렬(Balanced Merge Sort)과정을 기술하시오.
54. 아래 이진트리를 힙(Heap)구조로 변형하시오.
55. 아래 이진트리는 이미 Heap 구조로 변형된 상태(초기상태)이다. Heap sort의 과정을 상세히 설명하시오.
56. 다음 Heap 구조에서 3를 추가하여 Heap 구조를 재정렬하고 Root Node 제거시의 과정을 기술하시오(최소 힙 - Minimum Heap을 사용하시오).
57 내부 정렬(Sort)알고리즘의 종류를 나열하고 비교횟수와 소요공간(기억공간), 특징을 나열하시오.

PART 6. 탐색(Search)
58. 검색(Search)의 정의와 용어, 그리고 검색 방법을 분류
59. 순차 검색(Sequential Search)의 정의와 알고리즘 표현 그리고 Average Search Length(평균검색 길이)를 설명하시오.
60. 이진 검색(Binary Search)과정을 Flow Chart로 표현하시오.
61. Binary Search(이진검색)에 대해 설명하고 아래 Record에서 ‘25’ Key 값을 검색하는 과정을 설명하시오.
62. 다음은 17개의 Record로 구성된 파일이다. 키 M을 트리 형태로 표현하고 검색하는 과정을 기술하시오.
63. 다음은 17개의 Record로 구성된 파일이다. Key M을 이진 검색(Binary Search)방법으로 찾으시오.
64. 다음 Record에서 Key 값 57을 찾는 과정을 이진탐색(Binary Search)법으로 설명하시오(알고리즘도 작성하시오).
65. 보간 검색(Interpolation Search)에 대해 설명하고 아래 Record에서 보간 검색법을 이용하여 Key값 55를 검색하는 과정을 설명하시오.
66. 블록 검색(Block Search)에 대해 설명하고 다음 16개 Record로 구성된 파일을 블록으로 저장한 형태이다. Key 64를 검색하는 과정을 설명하시오(블록당 Record는 4개).
67. 다음 12개의 Record를 가진 파일에서 Key 28을 가진 Record를 피보나치 검색(Fibonacci Search)과정을 기술하시오.
68. 이진 검색 트리(Binary Search Tree)의 각 Node의 Key값 특징을 설명하고 아래 이진 검색 트리 구성에서 ⑪ Key값을 검색하는 과정에 대해 Flow Chart 형태로 기술하시오.
69. TLB, SNS, RTE, SAN, FIFO, ROI, HASH의 데이터에서 해싱(Hashing)을 이용하여 ROI와 ERP를 검색하라(아래 EBCDIC Code의 Table을 활용하여 Hashing 함수를 구하고 버킷수는 10개이고 한 개의 버킷에는 2개의 Data를 저장할 수 있음).
70. Hashing(해싱) 충돌과 해결방법에 대해 설명하시오.
71. 검색알고리즘(Search Algorithm)의 평균 검색길이, 검색수행시간, 기억공간, 특징을 5가지 이상 나열하고 비교하시오.

PART 7. 산술식 표현과 트리(Tree)
72. 다음 산술식 X= A+(B+C/D)*E-F를 이진 트리 형태로 표현하고 전위(Prefix)표기법과 후위 (Postfix)표기법에 따라 stack에 저장되는 형태를 기술하시오(우선순위는 ( ), *, /, +, - 순).
73. 다음 산술식을 우선순위 연산자를 고려하여 계산하시오(A는 3, B=4, C=5, D=2, E=3, F=2, G는 6이다).
74. 산술식 X= A+(B+C/D)*E-F를 후위 (Postfix)로 표기하고 이때 후위 표기 산술식의 Stack 연산 과정을 기술하시오(우선순위는 (), *, /, +, - 순임).
75. 다음 수식을 Tree 형태 (수식 트리=Expression Tree)로 표현하여 계산하시오.(우선순위는 *,+,-순)
76. Tree에서 사용되는 용어 10개 이상에 대해 설명하시오.
77. 이진트리(Binary Tree)의 유형에 대해 설명하고 이진트리의 순회(Traversal) 방법 4가지의 예를 드시오.
78. 아래 이진트리의 운행(Traversal) 방법 4가지를 적용하여 결과를 기술하시오.
79. 다음 이진 트리에서 전위순회(Preorder Traversal) 실행 과정을 상세히 기술하시오.
80. 스레드 이진 트리 (Thread Binary Tree)의 표현 방식을 설명하고 아래 이진트리를 전위, 중위, 후위 운행법에 의해 각각 표기하시오.
81. 다음 이진(Binary) Tree를 Thread Binary Tree의 전위 운행(Pre-order Traversal)시의 메모리에 실제 저장되는 값으로 표현하시오.
82. 다음 이진(Binary) Tree를 Thread Binary Tree의 중위 운행(In-Order Traversal)시의 메모리에 실제 저장되는 값으로 표현하시오.
83. 다음 이진(Binary) Tree를 Thread Binary Tree의 후위 운행(Post-Order Traversal)시의 메모리에 실제 저장되는 값으로 표현하시오.
84. Thread Binary Tree(쓰레드 이진트리)를 정의하고 노드구조와 아래 제시된 쓰레드 이진트리가 메모리(Memory) 내에 어떻게 표현되는지 기술하시오(중위 운행시).
85. 다음의 Node 구조를 이용하여 아래 이진트리(Binary Tree)를 Linked List 방법으로 표현하고 기억 장소에 저장되는 트리 상태를 표현하시오(기억 장소 번지는 0번지부터 시작).
86. Thread Binary Tree에 대해 설명하고 아래 이진 트리를 Thread Binary Tree로 표현하시오.
87. 이진 탐색 트리(Binary search Tree)의 Data 삽입과 삭제과정에 대해 설명하시오.
88. AVL Tree를 설명하고 AVL 트리(Tree)의 불균형을 초래하는 4가지 Type( LL, LR, RL, RR)에 대해 예를 들어 나열하고 Node 값이 30, 20, 10, 50, 40순으로 입력될 때 AVL Tree에 삽입되는 과정을 기술하시오.
89. AVL Tree에서 LR Type의 Rotation 방법과 RL Type의 Rotation 방법에 대해 설명하고 Pseudo-Code(의사코드)로 표현하시오.
90. 아래 이진트리에서 Node 값을 45, 5, 2, 10, 7, 11, 8, 14 순으로 AVL Tree에 삽입하는 과정을 기술하시오.
91. Key 값(8, 9, 10, 2, 1, 5, 3, 6, 4, 7, 11, 12)을 순서대로 삽입하면서 AVL Tree를 구축하시오.
92. 다음 이진트리에서 각각의 Key (20과 5)를 삭제 시 AVL Tree로 재구성하시오.
93. 다음 이진트리에서 Key 값 5를 삭제 시 AVL Tree로 재구성하시오.
94. 2-3 Tree에 대해 설명하고 아래 2-3 Tree에서 39, 38, 37 Key 값을 삽입하는 과정을 기술하시오.
95. 2-3 Tree에 Key 36값을 삽입하는 과정을 기술하시오.
96. 2-3 Tree의 경우 Root Node까지 경로가 꽉 찬 경우 Root 위쪽으로 높이가 1 증가된다. 아래 2-3 Tree에서 Root 위쪽으로 1만큼 증가되는 과정을 기술하시오(32 Key 삽입 과정시 1 증가됨, Key 32를 삽입하시오).
97. 다음 2-3 Tree에서 Key 값 10, 5, 20이 삭제되는 과정을 기술하시오.
98. 다음 2-3 Tree에서 Key 값 40이 삭제되는 과정을 기술하시오.
99. 2-3-4 Tree에 대해 설명하고 아래 2-3-4 Tree에서 Key 21를 삽입할 때 2-3-4 Tree의 재구성 방법에 대해 기술하시오.
100. 다음 2-3-4 Tree Key 값 50, 65, 60, 90, 40 순으로 삭제될 때 2-3-4 Tree의 재구성 방법에 대해 설명하시오(2-3 Tree와 2-3-4 Tree를 비교 설명하시오).
101. 2-3-4 Tree Key 삽입 시 4 -Node 제거(분리) 방법에 대해 설명하시오.
102. Red-Black Tree에 대해 설명하고 사용 이유, Node의 구조, 2-3-4 Tree를 Red-Black Tree로 표현하는 방법과 Key 값 10,20,30,40,50,60 삽입과정을 2-3-4 Tree 형태와 비교하여 설명하시오.
103. m-원 탐색 Tree의 특성을 설명하시오.
104. B-Tree에 대해 설명하고 주어진 B-Tree에서 Key 값 22, 41, 59, 57를 삽입하는 과정을 설명하시오.
105. B* - Tree에 대해 설명하고 Key 값 분리되는 과정을 설명하시오.
1) 차수가 5인 B*-Tree
2) 차수가 5인 B*-Tree
106. B+ - Tree에 대해 설명하시오.
107. 다음 B-Tree에서 Key 값 58, 7, 60, 20, 15 순으로 삭제 시 Flow와 실제 동작에 대해 상세히 기술하시오.
108. 다음 B-Tree에서 Key값 22, 41, 59, 57, 54를 삽입하는 Flow와 실제 동작에 대해 상세히 기술하시오.
109. 아래 차수가 5인 B*-Tree에서 재분배 키 값 24의 삽입 과정을 보이시오.
110. B+-Tree에서 키 값 15, 69, 110, 90, 20, 120, 40, 125순으로 삽입 시 삽입과정을 기술하시오.
111. T-Tree의 Search 과정에 대해 설명하시오.
112. B-tree, B+-tree, B*-tree, T-tree의 개념을 설명하고 비교하시오.

PART 8. 그래프(Graph)
113. Graph의 용어에 대해 7가지 이상 설명하시오.
114. Graph는 정점과 연결선의 집합으로 표시된다. G=(V,E). 즉 유관한 사물(Object) 또는 개념(Concept)끼리 서로 연결한 것이 그래프이다. 일상 생활속에서 Graph로 나열이 가능한 항목들을 정점과 간선(연결선)으로 구분해 보시오.
115. Graph의 정의를 설명하고 Graph의 종류에 대해 10개 이상 도식하여 간략히 기술하시오.
116. 다음 비 방향성 그래프와 방향성 Graph에서 인접행렬과 인접 리스트로 표현하시오.
117. 아래 방향 그래프에 대해 아래 질문에 대해 기술하시오.
　　1) 각 정점에 대하여 진입차수와 진출차수를 구하시오.
　　2) 인접 행렬을 표현하시오.
　　3) 인접 리스트를 표현하시오.
118. 아래 그래프(Graph)에서 깊이 우선 검색(DFS: Depth - First Search)으로 운행(Traversal)시 방문 순서와 stack의 동작과정을 기술하시오.
119. 아래 그래프(Graph)에서 넓이 우선 검색(BFS: Breadth - First Search) 으로 운행 (Traversal)시 방문 순서와 Queue의 동작 과정을 기술하시오(비방향성 Graph).
120. 다음 그래프(Graph)를 이용하여 최적 경로를 찾는데 이용되는 최소 신장 트리(Minimal Spanning Tree)알고리즘에 대하여 설명하시오.
121. 다음과 같이 7개 신도시의 도로 공사를 최소의 비용으로 설계할 때, 다음 물음에 답하시오. 단, 노드는 도시 이름을 나타내고 간선은 공사 비용이다.
1) MST(Minimal Spanning Tree)의 개념에 대해 설명하시오.
2) 위 그래프의 비용 인접 리스트를 도식화하시오.
3) Prim’s 알고리즘을 이용해서 MST 를 구하는 절차를 보이시오, 단 시작노드는 A이다.
4) Kruskal’s 알고리즘을 이용해서 MST를 구하는 절차를 보이시오.
122. 다음 Graph 에서 Sollin 알고리즘을 적용하여 최소 비용 신장 트리(Minimum Cost Spanning Tree)를 작성하시오.
123. 다음 Graph에서 최소 비용 신장 트리로 표시하시오.
1) Kruskal’s Algorithm 적용
2) Prim’s Algorithm 적용
3) Sollin’s Algorithm 적용
위의 각 알고리즘 적용시 수행 과정 및 결과를 보이시오.
124. 다음 Graph에서 Kruskal 알고리즘을 적용하여 최소 비용 신장 트리를 작성하시오(오름차순을 적용하시오).
125. 다음 Graph에서 Prim알고리즘을 적용하여 최소 비용 신장트리(Minimum-Cost Spanning Tree)를 작성하시오.
126. 다음 Graph에서 Kruskal 알고리즘을 적용하여 최대 비용 신장 트리를 작성하시오(내림차순을 적용하시오).

PART 9. 기타 알고리즘
127. 압축기술에 대해 설명하시오.
128. MPEG 7 에 대해 설명하시오.
129. Data 압축(Compression)의 장단점에 대해 설명하시오.
130. 주어진 ASCII Code 범위 내에서 하나의 문자를 입력 받아 숫자, 대문자, 소문자를 구별하는 순서도(Flow Chart)와 Pseudo Code를 작성하시오.
131. 1~100까지 홀수와 짝수 합을 각각 구하여 출력하는 순서도(Flow Chart)와 Pseudo Code를 작성하시오.
132. Process들이나 Thread들의 상호배제 구현을 위한 Dekker 알고리즘을 추상화하여 설명하고 Pseudo-Code 로 설명하시오.
133. Process들이나 Thread들의 상호배제 구현을 위한 Peterson 알고리즘을 추상화하여 설명하고 Pseudo-Code 로 설명하시오.
134. 프로그램 병행성에 대해 설명하고 아래와 같이 두 개의 프로세스(Process) p1과 p2가 병행 실행되는 경우 모든 가능한 인터리빙(Interleaving)을 보이시오.
135. DMA(Direct Memory Access)동작을 Flow chart 형태로 작성하시오.
136. 반가산기 회로를 Verilog HDL(Hardware Description Language)으로 모델링(Modeling)하시오.
137. (1) Two Phase Locking에 대해 설명하고 이 Protocol의 장점과 단점에 대해 설명하시오.
　　(2) 다음 각 트랜잭션에 대해 Two phase Locking을 적용한 결과를 보이시오.
138. UNIX 시스템 호출을 이용한 다음 프로그램을 보고 질문에 답하시오(수행권한은 Root임).
139. 다음 Schedule은 직렬 불가능(Non-serialization)하다. 원하는 값과 실제 수행 값을 표기하고, 문제점과 직렬화 하기 위한 방안은 무엇인지 설명하시오(R은 Read, W는 Write를 의미) (A=100, B=100).
140. 아래 주어진 프로그램이 수행하는 기능에 대해 설명하고 동작 Flowchart화 하시오. 버퍼크기(Buffer Size)가 성능(Performance)에 미치는 영향에 대해 설명하시오.
141. 기계 학습(Machine Learning)알고리즘의 종류에 대해 설명하시오.
142. 인공지능 분야에 활용되는 에이전트(Agent)에 대해 설명하시오.
143. 에이전트(Agent) 기술

PART 10. 부록. 알고리즘 Source Code
※ Visual Studio 환경에서 정상적으로 실행된 Source Code입니다.
PART 1. 1) Binary 변환, 2) Callbyname, 3) Callbyreference, 4) Callbyvalue
PART 2. 5) FactorialN, 6) FibonacciCode, 7) FibonacciSequence, 8) TheTowerOfHanoi
PART 3. 9) LinkedListOrderedInsertDelete, 10) LinkedListOrderedInsertDeletePrint
PART 4. 11) QueueInsertDelete, 12) stackPushPop
PART 5. 13) Bubble_Flag, 14) Bubble_noFlag, 15) BubbleSort, 16) InsertSort, 17) QuickSort, 18) SelectionSort
PART 6. 19) BinarySearch, 20) InterpolationSearch, 21) SequentialSearch
PART 7. 22) Tree 순회(Traversal)
