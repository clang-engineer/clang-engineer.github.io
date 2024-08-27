---
layout  : wiki
title   : GCD(Greatest Common Divisor, 최대공약수)와 LCM(Least Common Multiple, 최소공배수)
summary : 
date    : 2024-08-27 09:18:27 +0900
updated : 2024-08-27 09:18:46 +0900
tags    : 
toc     : true
public  : true
parent  : [[mathematics/index]]
latex   : false
---
* TOC
{:toc}

# GCD(Greatest Common Divisor, 최대공약수)
- 두 수가 주어졌을 때, 두 수의 공통된 약수 중 가장 큰 수를 의미한다. (ex> 12와 18의 최대공약수는 6)
- 두 수 a, b의 최대공약수를 GCD(a, b)라고 표현한다.
- 유명한 알고리즘인 유클리드 호제법을 사용하여 최대공약수를 구할 수 있다.

```cpp
// 제약 조건: a는 b보다 크거나 같다.
int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}
```

# LCM(Least Common Multiple, 최소공배수)
- 두 수가 주어졌을 때, 두 수의 공통된 배수 중 가장 작은 수를 의미한다. (ex> 12와 18의 최소공배수는 36)
- 두 수 a, b의 최소공배수를 LCM(a, b)라고 표현한다.

```cpp
int lcm(int a, int b) {
    return a * b / gcd(a, b);
}
```

# 최대공약수와 최소공배수의 관계
- 최대공약수와 최소공배수의 곱은 두 자연수의 곱과 같다.
- GCD(a, b) * LCM(a, b) = a * b

## 증명
```txt
A, B의 최대공약수를 G, 최소공배수를 L이라고 하자.
A = G * a, B = G * b, L = G * a * b 관계가 성립한다. (a, b는 서로소)

때문에 A * B = G * a * G * b = G^2 * a * b = G * L
```