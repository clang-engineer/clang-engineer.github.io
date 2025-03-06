---
title       : 에라토스테네스의 체 (Eratosthenes' Sieve)
description : >-
  소수를 구하는 알고리즘 중 하나인 에라토스테네스의 체 알고리즘에 대해 설명합니다.
date        : 2024-10-07 15:36:25 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [study, mathematics]
tags        : [prime number]
pin         : false
hidden      : false
---

## 에라토스테네스의 원리
1. 구하고자 하는 수의 범위만큼 1차원 배열을 생성합니다.
2. 2부터 시작하고 선택된 숫자의 배수에 해당하는 수를 배열에서 탐색하여 제거합니다.
3. 2부터 시작하여 남아있는 수를 출력합니다.

## 코드
- M, N 범위의 소수 구하기

```cpp
#include <iostream>
#include <vector>
#include <cmath>

using namespace std;

int main() {
    int M, N;
    cin >> M >> N;
    vector<int> A(N+1);
    
    for (int i = 2; i <= N; i++) {
        A[i] = i;
    }

    for (int i = 2; i <= sqrt(N); i++) { // 2부터 N의 제곱근까지 반복
        if (A[i] == 0) continue;

        for (int j = i+i; j <= N; j += i) { // i의 배수를 제거
            A[j] = 0;
        }
    }

    for (int i = M; i <= N; i++) {
        if (A[i] != 0) {
            cout << A[i] << '\n';
        }
    }
}
```

## N의 제곱근까지만 반복하는 이유
- N의 제곱근이 n이라고 할 때 N=a*b를 만족하는 a와 b중 적어도 하나는 n 이하이게 됩니다. 즉, N보다 작은 가운데 소수가 아닌 수는 항상 n보다 작은 약수를 가지게 됩니다. 따라서 에라토스테네스의 체로 n이하의 수의 배수를 모두 제거하면 남은 수는 소수가 됩니다.
