---
layout  : wiki
title   : binomial coefficient
summary : 
date    : 2023-07-26 09:10:41 +0900
updated : 2023-07-26 09:11:07 +0900
tags    : 
toc     : true
public  : true
parent  : [[math/index]]
latex   : false
---
* TOC
{:toc}


# Overview

이항계수는 조합(combination)의 개념을 나타내는 수학적인 개념 중 하나이다. 주로 주어진 집합에서 원하는 개수만큼의 원소를 선택하는 방법의 수를 계산하는 데 사용된다. 또한, 이항계수는 이항식(binomial)의 계수를 나타내는 데에 사용됩니다.
이항계수는 확률, 통계학, 조합론 등 다양한 분야에서 활용되며, 이항분포와 관련하여 확률 계산에 사용될 수도 있다. 또한 이항계수는 파스칼의 삼각형(Pascal's Triangle)이라고 알려진 특별한 삼각형 패턴에 나타나며, 계산을 더욱 쉽게 할 수 있도록 도와준다.

# Formula

이항계수는 nCr로 표기되며, 다음과 같이 계산할 수 있다.

```
nCr = n! / (r! * (n - r)!)
```
- n은 전체 원소의 개수이고, r은 선택하려는 원소의 개수. 

- ex> 5C3

```
5C3 = 5! / (3! * (5 - 3)!)
= 5! / (3! * 2!)
= (5 * 4 * 3!) / (3! * 2)
= (5 * 4) / 2
= 10
```

# Pascal's Triangle

파스칼의 삼각형은 이항계수를 나타내는 특별한 삼각형 패턴이다. 파스칼의 삼각형은 다음과 같은 규칙을 따른다.

- 첫 번째 줄은 1이다.
- 두 번째 줄부터 각 줄의 양 끝의 값은 1이다.
- 각 줄의 가운데 값은 바로 위의 줄의 양 끝의 값의 합이다.
- nCk = n-1Ck-1 + n-1Ck 의 공식을 따른다.

```
1
1 1
1 2 1
1 3 3 1
1 4 6 4 1
...
```


# Implementation

## 1. Recursive

```cpp

int binomial_coefficient(int n, int k) {
    if (k == 0 || n == k) {
        return 1;
    }
    return binomial_coefficient(n - 1, k - 1) + binomial_coefficient(n - 1, k);
}
```

## 2. Dynamic Programming

```cpp

int binomial_coefficient(int n, int k) {
    int dp[n + 1][k + 1];
    for (int i = 0; i <= n; i++) {
        for (int j = 0; j <= min(i, k); j++) {
            if (j == 0 || j == i) {
                dp[i][j] = 1;
            } else {
                dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];
            }
        }
    }
    return dp[n][k];
}
```

## 3. Dynamic Programming (Space Optimized)

```cpp

int binomial_coefficient(int n, int k) {
    int dp[k + 1];
    memset(dp, 0, sizeof(dp));
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = min(i, k); j > 0; j--) {
            dp[j] = dp[j] + dp[j - 1];
        }
    }
    return dp[k];
}
```

# References

- [Binomial Coefficient](https://www.geeksforgeeks.org/binomial-coefficient-dp-9/)