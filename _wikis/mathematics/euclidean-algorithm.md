---
layout  : wiki
title   : Euclidean algorithm
summary : 
date    : 2024-08-22 09:31:50 +0900
updated : 2024-08-22 09:46:25 +0900
tags    : 
toc     : true
public  : true
parent  : [[mathematics/index]]
latex   : false
---
* TOC
{:toc}

# 유클리드 호제법 (Euclidean algorithm)
- 두 정수의 최대공약수를 구하는 알고리즘이다.
- 두 정수 a, b에 대해 a를 b로 나눈 나머지를 r이라고 하면, a와 b의 최대공약수는 b와 r의 최대공약수와 같다.
- 이를 반복하여 나머지가 0이 될 때까지 반복하면, 나누는 수가 최대공약수가 된다.

# 예시
```txt
- MOD연산이란? 두 값을 나눈 나머지를 구하는 연산!

1112와 695의 최대공약수를 구한다고 가정하자.

먼저, 큰 수를 작은 수로 나눈 나머지를 구한다. 즉, MOD 연산을 한다.

1112 mod 695 = 417
그 다음, 나눴던 수와 나머지로 또 MOD 연산을 한다.

695 mod 417 = 278
이 과정을 계속 반복한다.

417 mod 278 = 139
278 mod 139 = 0
나머지가 0이 됐을 때, 마지막 계산에서 나누는 수로 사용된 139가 1112와 695의 최대공약수가 된다.
```

# 코드
```cpp
// 제약 조건: a는 b보다 크거나 같다.
int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}
```

# 최대공약수(GCD: Greatest Common Divisor)와 최소공배수(LCM: Least Common Multiple)
- 두 수 a, b의 최대공약수를 GCD(a, b), 최소공배수를 LCM(a, b)라고 하면, 다음과 같은 관계가 성립한다.
- GCD(a, b) * LCM(a, b) = a * b
```cpp
int lcm(int a, int b) {
    return a * b / gcd(a, b);
}
```