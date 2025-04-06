---
title       : Algorithm
description : >-
date        : 2025-02-22 00:00:00 +0900
updated     : 2025-03-02 23:09:59 +0900
categories  : [license, 정보관리기술사]
tags        : [algorithm]
pin         : false
hidden      : true
---

## PART1. 자료구조(Data Structure)와 알고리즘(Algorithm)
### 1. 자료구조(Data Structure)
정의
> 기억 장치 내에 Data(자료)를 어떻게 표현할지, 표현된 자료를 효율적으로 저장하는지, 자료들 간의 관계는 어떠한지를 파악하여 여러 작업을 수행하기 위한 알고리즘을 연구하는 이론
> 자료의 표현 및 자료를 저장하기 위한 논리적인 구조와 그것과 관련된 연산

분류
> 자료구조는 크게 선형 자료구조와 비선형 자료구조로 나눌 수 있다. 선형 자료구조는 배열, 연결 리스트, 스택, 큐 등이 있으며, 비선형 자료구조는 트리, 그래프 등이 있다.

목적
>
- 효율성: 자료를 효율적으로 저장하고 검색하기 위해
- 추상화: 복잡한 데이터를 단순화하여 다루기 위해
- 재사용성: 이미 구현된 자료구조를 재사용하여 개발 시간을 단축하기 위해

### 2. 자료구조(Data Structure)의 구성, 형태, 단위

구성
> 자료구조는 자료와 정보로 구성된다. <br>
- 자료: 관찰이나 측정을 통하여 수집된 사실이나 수치
- 정보: 문제를 해길하는데 필요한 사실

형태
> 
- 단순구조: 정수, 실수, 문자, 문자열 등
- 선형구조: 배열, 연결 리스트, 스택, 큐, 데크 등
- 비선형구조: 트리, 그래프 등
- 파일구조: 순차파일, 색인파일, 해시파일 등

단위
> 
- Bit: 0 과 1로 정보표현, 정보의 최소단위
- Byte: 8개 Bit, 문자를 표현하기 위한 최소단위
- Word: Byte의 모임. Word(2byte), Fullword(4byte), Doubleword(8byte) 등
- Field: 자료처리의 최소단위, DB에서 Attibute와 상응
- Record: 하나 이상의 Field 모임, DB에서 Tuple과 상응. 논리적 처리 기본단위, 보조기억장치의 입출력 단위, 물리적으로는 Block에 해당.
- File: Record의 모임. 순차/색인/직접파일구조 
- Database: File의 집합. DB는 Data 모델에 따라 계층, 망, 관계형 구조

### 3. 알고리즘(Algorithm)의 정의, 조건, 접근 방법, 분석 방법
정의
> 주어진 문제를 해결하기 위한 방법을 추상화하여 일련의 단계적 절차를 논리적으로 기술해 놓은 명세서

조건
>
- 입력: 입력 자료가 1개 이상
- 출력: 결과 자료가 1개 이상
- 명확성: 각 단계가 모호하지 않고 명확해야 함
- 유한성: 알고리즘의 수행이 유한한 단계에서 종료되어야 함
- 유효성: 모든 명령은 실행 가능한 연산일 것

접근방법
> 
- 무작위 알고리즘(Randomized): 난수를 사용하여 문제를 해결하는 방법 (ex. 암호학, Quick 정렬, 양자 컴퓨터 알고리즘)
- 분할 정복 알고리즘(Divide & Conquer): 작은 문제로 분할하여 문제 해결하는 방법 (분할->정복->결합, ex. 병합정렬, 고속 푸리에 변환 문제)
- 동적 프로그래밍(Dynamic Programming): 분할정복기법과 같이 부분문제의 해를 결합해 최적화 문제를 해결 (ex. Matix 곱셈, Matrix Chain)
- 탐욕 알고리즘 (Greedy): 매순간 가장 좋아보이는 값을 선택하여 문제를 해결하는 방법 (ex. 허프만 코딩 기법, 배낭문제)
- 근사 알고리즘(Approximation): 최적의 해를 구하는 대신에 충분히 좋은, 유사한 해를 구하는 방법 (ex. 외판원 문제)

분석방법
>
- 공간 복잡도: 메모리 사용 최소
- 시간 복잡도: 
  + Worst Case: 최악의 경우
  + Best Case: 최선의 경우
  + Average Case: 평균적인 경우
- 성능 표기법:
  + Big-O: 상위 한계
  + Big-Omega: 하위 한계
  + Big-Theta: 상하위 한계

### 4. 알고리즘 실행시간을 추정하는데 사용되는 Big-O 표기법
> 알고리즘을 수행하는데 걸리는 시간을 수학적으로 표현한 것. 알고리즘의 성능을 분석하는데 사용됨.
> 알고리즘을 실제로 실행시키지 않고 실행시간을 추정해보기 위해 시간복잡도를 사용하여 실행시간을 추정하는 점근적 표기법

### 5. 알고리즘의 평가방법인 Time Complexity(시간 복잡도)와 Space Complexity(공간 복잡도)
시간 복잡도
> 알고리즘이 수행되는 시간의 양을 측정하는 방법. 입력 크기 n에 대한 함수로 표현됨.

공간 복잡도
> 알고리즘이 수행되는 동안 필요한 메모리의 양을 측정하는 방법. 입력 크기 n에 대한 함수로 표현됨.

### 6. 10진수와 2진수 변환 방법
10진수 53을 2진수로 변환
>
1. 53을 2로 나눈다.
2. 나눈 결과의 정수 부분을 기록하고 나머지를 남긴다.
3. 나머지가 0이 될 때까지 반복한다.
4. 나머지를 역순으로 나열하여 2진수로 표현한다.
```txt
53 / 2 = 26 -> 1
26 / 2 = 13 -> 0
13 / 2 = 6 -> 1
6 / 2 = 3 -> 0
3 / 2 = 1 -> 1
1 / 2 = 0 -> 1
결: 10진수 53은 2진수로 110101이다.
```

2진수를 110101을 10진수로 변환
>
1. 2진수 110101을 각 자리수에 2의 거듭제곱을 곱하여 더한다.
2. 각 자리수의 값을 더하여 10진수로 표현한다.
```txt
1 * 2^5 + 1 * 2^4 + 0 * 2^3 + 1 * 2^2 + 0 * 2^1 + 1 * 2^0
= 32 + 16 + 0 + 4 + 0 + 1 = 53 
결: 2진수 110101은 10진수로 53이다.
```

### 7. 10진수 소수와 2진수 소수 변환 방법
10진수 0.6875를 2진수로 변환
>
1. 0.6875를 2로 곱한다.
2. 정수 부분을 기록하고 소수 부분을 남긴다.
3. 소수 부분이 0이 될 때까지 반복한다.
4. 정수 부분을 역순으로 나열하여 2진수로 표현한다.
```txt
0.6875 * 2 = 1.375 -> 1
0.375 * 2 = 0.75 -> 0
0.75 * 2 = 1.5 -> 1
0.5 * 2 = 1.0 -> 1
결: 2진수 0.1011로 표현된다.
```

2진수 0.1011을 10진수로 변환
>
1. 2진수 0.1011을 각 자리수에 2의 거듭제곱을 곱하여 더한다.
2. 각 자리수의 값을 더하여 10진수로 표현한다.
```txt
0.1 * 2^-1 + 0.0 * 2^-2 + 1.1 * 2^-3 + 1.1 * 2^-4
= 0.5 + 0 + 0.125 + 0.0625 = 0.6875
결: 2진수 0.1011은 10진수로 0.6875이다.
```

### 8. 2진수를 음수로 표현하는 방법 3가지 이상 나열
>
1. 부호비트
- 최상위 비트를 부호 비트로 사용하여 양수와 음수를 구분하는 방법
- 구현이 간단하지만 연산이 복잡함. 0이 2개 존재
- ex: +9 = 00001001, -9 = 10001001
2. 1의 보수
- 모든 비트를 반전시켜 음수를 표현하는 방법
- 덧셈과 뺄셈이 복잡하지만 구현이 간단함. 0이 2개 존재
- ex: +9 = 00001001, -9 = 11110110
3. 2의 보수
- 1의 보수에 1을 더하여 음수를 표현하는 방법
- 덧셈과 뺄셈이 간단하고 0이 하나만 존재함
- ex: +9 = 00001001, -9 = 11110111

### 9. 알고리즘 표현 방법과 반복문인 for, while, do-while문을 사용하여 1에서 100까지 덧셈하는 code 예제와 순서도

>
for문
```cpp
int sum = 0;
for (int i = 1; i <= 100; i++) {
    sum += i;
}
```
while문
```cpp
int sum = 0;
int i = 1;
while (i <= 100) {
    sum += i;
    i++;
}
```
do-while문
```cpp
int sum = 0;
int i = 1;
do {
    sum += i;
    i++;
} while (i <= 100);
```





### 10. 아래 3개 A,B,C 알고리즘 사용시 n에 대한 전체 연산수를 구하시오.

### 11. 프로그램 언어에서 함수간 매개변수 전달기법인 Call-by-value, Call-by-reference, Call-by-name에 대해 실제 Code 예제를 보이시오.

> 
- Call by value: 실제 인자의 값을 복사하여 전달하는 방법
```cpp
#include <stdio.h>
void add(int a, int b) {
    a += 1;
    b += 1;
    printf("Inside function: a = %d, b = %d\n", a, b);
}
int main() {
    int x = 5, y = 10;
    add(x, y);
    printf("Outside function: x = %d, y = %d\n", x, y);
    return 0;
}
```
- Call by reference: 실제 인자의 주소를 전달하는 방법
```cpp
#include <stdio.h>
void add(int *a, int *b) {
    *a += 1;
    *b += 1;
    printf("Inside function: a = %d, b = %d\n", *a, *b);
}
int main() {
    int x = 5, y = 10;
    add(&x, &y);
    printf("Outside function: x = %d, y = %d\n", x, y);
    return 0;
}
```
- Call by name: 실제 인자를 전역변수(Extern)로 선언하여 전달하는 방법
```cpp
#include <stdio.h>
int a, b;
void add() {
    a += 1;
    b += 1;
    printf("Inside function: a = %d, b = %d\n", a, b);
}
int main() {
    a = 5;
    b = 10;
    add();
    printf("Outside function: a = %d, b = %d\n", a, b);
    return 0;
}
```

### 12. C언어를 사용하여 정수를 이진수로 변환하는 프로그램을 작성하시오.
(* 2진수를 문자열로 변환하여 출력, 2진수는 32bit를 초과하지 않음)
>
```cpp
#include <stdio.h>
int main() {
    int i,j;
    char A[32];
//
    scanf("%d", &i);
//
    for (j = 31; j >= 0; j--) {
        A[j] = (i % 2) + '0';
        i = i / 2;
    }
//
    for (j = 0; j < 32; j++) {
        printf("%c", A[j]);
    }
    printf("\n");
}
```

### 13. 자료 구조에서 아래 Pointer 자료의 Memory Allocation(할당)을 표현하고 설명하시오.
(a가 100번지에 저장되어 있을 때)
```cpp
int a, b;
int *ptr;
a = 15;
ptr = &a;
b = *ptr;
```
>
|  단계 | 설명 |
|-------|------------------|
| 1 | Integer(정수형) 변수 a, b 선언 |
| 2 | 포인터 변수 ptr 선언 |
| 3 | 변수 a에 15 할당 |
| 4 | ptr에 a의 주소값(100번지) 할당 |
| 5 | ptr을 통해 a의 값을 읽어 b에 할당 |

--

## PART2. 재귀함수(Recursive Function) 
### 14. "Factorial n"을 구하는 재귀호출 알고리즘 작성
>
```cpp
#include <stdio.h>
int factorial(int n) {
    if (n == 0 || n == 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}
int main() {
    int n;
    printf("Enter a number: ");
    scanf("%d", &n);
    printf("Factorial of %d is %d\n", n, factorial(n));
    return 0;
}
```

### 15. 다음 재귀호출 Code에 수행 동작을 설명하시오.
문제 14에서 Factorial(3)에 대한 실행 과정 설명
>
| 단계 | 설명 | return |
|-------|------------------|--------|
| 1 | factorial(3) 호출 | 3 * factorial(2) |
| 2 | factorial(2) 호출 | 2 * factorial(1) |
| 3 | factorial(1) 호출 | 1 |
| 4 | factorial(1) 종료 | 1 |
| 5 | factorial(2) 종료 | 2 * 1 = 2 |
| 6 | factorial(3) 종료 | 3 * 2 = 6 |

### 16. 피보나치 수열(Fibonacci Sequence)에 대해 설명
> 
- 수열의 n번째 값 = 수열 n-1번째 값 + 수열 n-2번째 값
- 앞의 두개 더해서 현재의 수를 만들어가는 수열
```txt
fib(0) = 0
fib(1) = 1
fib(n) = fib(n-1) + fib(n-2)
```

### 17. 피보나치 실행순서 과정을 Tree로 표현하시오.
Fibonacci(6) 호출
> 
```txt
Fibonacci(6)
├── Fibonacci(5)
│   ├── Fibonacci(4)
│   │   ├── Fibonacci(3)
│   │   │   ├── Fibonacci(2)
│   │   │   │   ├── Fibonacci(1)
│   │   │   │   └── Fibonacci(0)
│   │   │   └── Fibonacci(1)
│   │   └── Fibonacci(2)
│   │       ├── Fibonacci(1)
│   │       └── Fibonacci(0)
│   └── Fibonacci(3)
│       ├── Fibonacci(2)
│       │   ├── Fibonacci(1)
│       │   └── Fibonacci(0)
│       └── Fibonacci(1)
└── Fibonacci(4)
    ├── Fibonacci(3)
    │   ├── Fibonacci(2)
    │   │   ├── Fibonacci(1)
    │   │   └── Fibonacci(0)
    │   └── Fibonacci(1)
    └── Fibonacci(2)
        ├── Fibonacci(1)
        └── Fibonacci(0)
```

### 18. 하노이 타워 문제
>
```cpp
#include <stdio.h>
//
int main(void) {
    HanoiTowerMove(3, 'A', 'B', 'C');
    return 0;
}
//
void HanoiTowerMove(int n, char from, char by, char to) {
        HanoiTowerMove(n - 1, from, to, by);
        HanoiTowerMove(n - 1, by, from, to);
}
```

--

## PART3. 배열(Array)과 연결 리스트(Linked List)
### 19. Array(배열)에 대해 설명하고 장단점을 기술하시오.

정의
>
동일한 성질을 가진 자료형을 연속적으로 저장하는 자료구조 

장점
>
인덱스를 사용하여 빠른 접근 가능 <br>
메모리 할당이 연속적이므로 캐시 효율성이 높음

단점
>
크기가 고정되어 있어 동적 크기 조정이 불가능 <br>
삽입과 삭제가 비효율적임

### 20. 3차원 배열 값에 대한 배열의 각각의 요소 값과 Memory에 할당되는 방법에 대해 기술하시오. 
>
| 항목 | 2차원 배열 | 3차원 배열 |
|-------|------------------|------------------|
| 구조 | 행 × 열 | 층 × 행 × 열 |
| 선언 | arr[2][3] | arr[2][3][4] |
| 요소 수 | 6개 | 24개 |
| 메모리 저장 순서 | Row-Major Order | Row-Major Order |
| 주소 계산 | i * 열 + j | (i * 행 + j) * 열 + k |

### 21. 배열(Array)과 연결 리스트(Linked List)의 차이점
정의
> 배열은 동일한 자료형의 데이터를 연속적으로 저장하는 자료구조이며, 연결 리스트는 노드들이 포인터로 연결된 비연속적인 메모리 구조이다.

> 
| 항목 | 배열(Array) | 연결 리스트(Linked List) |
|-------|------------------|------------------|
| 메모리 구조 | 연속적 | 비연속적 |
| 크기 | 고정 | 동적 |
| 접근 | 인덱스 사용 | 포인터 사용 |
| 삽입/삭제 | 비효율적 | 효율적 |
| 탐색 | O(1) | O(n) |
| 메모리 사용 | 고정 | 동적 |
| 장점 | 빠른 접근 | 동적 크기 조정 |
| 단점 | 삽입/삭제 비효율적 | 탐색 비효율적 |

### 22. 선형 List(Linear List)에서 처리할 수 있는 연산에 대해 설명
>
길이(Length): 리스트의 길이를 반환하는 연산 <br>
접근(Access): 리스트의 특정 위치에 있는 요소를 반환하는 연산 <br>
검색(Search): 리스트에서 특정 값을 검색하는 연산 <br색
삽입(Insert): 리스트의 특정 위치에 요소를 삽입하는 연산 <br>
삭제(Delete): 리스트의 특정 위치에 있는 요소를 삭제하는 연산 <br>
복사(Copy): 리스트의 모든 요소를 복사하는 연산 <br>
정렬(Sort): 리스트의 요소를 정렬하는 연산 <br>
병합(Merge): 두 개의 리스트를 하나로 병합하는 연산 <br>
분리(Split): 리스트를 두 개로 분리하는 연산 <br>

### 23. Linked List의 구성과 비순차적인 메모리 구성에 따른 삽입과 삭제
구성
> 노드(Node): 데이터와 포인터로 구성된 기본 단위 <br>
```cpp
struct Node {
    int data; // 데이터
    struct Node* next; // 다음 노드에 대한 포인터
};
```

비순차적인 메모리 구성에 따른 삽입과 삭제 예제
> 삽입: 새로운 노드를 생성하고, 이전 노드의 포인터를 새로운 노드로 변경 <br>
삭제: 삭제할 노드를 찾고, 이전 노드의 포인터를 삭제할 노드의 다음 노드로 변경 <br>

### 24. 연결 리스트 구현
- 작은 수부터 순서가 정렬된 연결 리스트에 삽입하는 함수 구현
- 모든 노드를 출력하는 함수 구현
- 숫자를 입력 받아 삭제하는 함수 구현
> 
```cpp
#include <stdio.h>
#include <stdlib.h>
// 구조체 정의
struct Node {
    int data;
    struct Node* next;
};
// 전역 변수 
node *head, *tail;
// 초기화 함수
void init(void) {
    head = (node *)malloc(sizeof(node));
    tail = (node *)malloc(sizeof(node));
    head->next = tail;
    tail->next = tail;
}
// 순서 유지 삽입 함수
node* insert(int data) {
    node *newNode = (node *)malloc(sizeof(node));
    newNode->data = data;
    // 
    node *current = head->next;
    node *previous = head;
    // 
    while (current != tail && current->data < data) {
        previous = current;
        current = current->next;
    }
    // 
    previous->next = newNode;
    newNode->next = current;
    // 
    return newNode;
}
// 모든 노드 출력 함수
void printList() {
    node *current = head->next;
    while (current != tail) {
        printf("%d -> ", current->data);
        current = current->next;
    }
    printf("NULL\n");
}
// 특정 숫자 삭제 함수
node *delete(int data) {
    node *current = head->next;
    node *previous = head;
    // 
    while (current != tail && current->data != data) {
        previous = current;
        current = current->next;
    }
    // 
    if (current == tail) {
        printf("Data not found\n");
        return NULL;
    }
    // 
    previous->next = current->next;
    free(current);
    // 
    return previous->next;
}
```

### 25. 이중 연결 리스트(Doubly Linked List)에서 삽입, 삭제 과정
삽입
> 새로운 노드를 생성하고, 이전 노드와 다음 노드의 포인터를 새로운 노드로 변경 <br>
```cpp
void insert(node* newNode, node* previous) {
    newNode->next = previous->next;
    newNode->prev = previous;
    if (previous->next != NULL) {
        previous->next->prev = newNode;
    }
    previous->next = newNode;
}
```

삭제
> 삭제할 노드를 찾고, 이전 노드와 다음 노드의 포인터를 삭제할 노드의 포인터로 변경 <br>
```cpp
void delete(node* target) {
    if (target->prev != NULL) {
        target->prev->next = target->next;
    }
    if (target->next != NULL) {
        target->next->prev = target->prev;
    }
    free(target);
}
```

### 26. 인접 다중 리스트(Adjacency multi list)에 대해 설명
정의

--

## PART4. 스택(Stack)과 큐(Queue)
### 27. 스택(Stack)에서 사용되는 용어와 연산
### 28. -
### 29. -
### 30. Stack의 활용예 5가지 이상과 2개의 상세예제 그리고 stack overflow 발생방지방법 2가지
### 31. Queue에 대해 설명하고 Queue를 표현하기 위한 조건과 큐의 삽입과 삭제에 대해 Coding
### 32. 원형 큐(Circular Queue)에서 Enqueue와 Dequeue, Empty와 Full 상태
### 33. 우선순위 큐(Priority Queue)를 구현하는 방법으로 배열, 연결 리스트, 힙을 이용하는 방법에 대해 각각 설명
### 34. 데크(Deque)의 삽입과 삭제 과정
--

## PART5. 정렬(Sorting)
### 35.
### 36.
### 37.
### 38.
### 39.
### 40.
### 41.
### 42.
### 43.
### 44.
### 45.
### 46.
### 47.
### 48.
### 49.
### 50.
### 51.
### 52.
### 53.
### 54.
### 55.
### 56.
### 57.

--

## PART6. 탐색(Searching)
### 58.
### 59.
### 60.
### 61.
### 62.
### 63.
### 64.
### 65.
### 66.
### 67.
### 68.
### 69.
### 70.
### 71.


--

## PART7. 산술식 표현과 트리(Tree)
### 72.
### 73.
### 74.
### 75.
### 76.
### 77.
### 78.
### 79.
### 80.
### 81.
### 82.
### 83.
### 84.
### 85.
### 86.
### 87.
### 88.
### 89.
### 90.
### 91.
### 92.
### 93.
### 94.
### 95.
### 96.
### 97.
### 98.
### 99.
### 100.
### 101.
### 102.
### 103.
### 104.
### 105.
### 106.
### 107.
### 108.
### 109.
### 110.
### 111.
### 112.

--

## PART8. 그래프(Graph)
### 113.
### 114.
### 115.
### 116.
### 117.
### 118.
### 119.
### 120.
### 121.
### 122.
### 123.
### 124.
### 125.
### 126.

--

## PART9. 기타 알고리즘
### 127.
### 128.
### 129.
### 130.
### 131.
### 132.
### 133.
### 134.
### 135.
### 136.
### 137.
### 138.
### 139.
### 140.
### 141.
### 142.
### 143.