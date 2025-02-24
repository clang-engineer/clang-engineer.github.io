---
title       : 나머지 합
description :
date        : 2024-10-07 15:36:25 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [coding-test, baekjoon]
tags        : [coding-test]
pin         : false
hidden      : false
---

# 문제

## 출처
- [백준 10986번](https://www.acmicpc.net/problem/10986)

## 문제
```plaintext
수 N개 A1, A2, ..., AN이 주어진다. 이때, 연속된 부분 구간의 합이 M으로 나누어 떨어지는 구간의 개수를 구하는 프로그램을 작성하시오.
즉, Ai + ... + Aj (i ≤ j) 의 합이 M으로 나누어 떨어지는 (i, j) 쌍의 개수를 구해야 한다.
```

## 입력
```plaintext
첫째 줄에 N과 M이 주어진다. (1 ≤ N ≤ 106, 2 ≤ M ≤ 103)
둘째 줄에 N개의 수 A1, A2, ..., AN이 주어진다. (0 ≤ Ai ≤ 109)
```

## 출력
```plaintext
첫째 줄에 연속된 부분 구간의 합이 M으로 나누어 떨어지는 구간의 개수를 출력한다.
```

## 예제 입력 1 
```plaintext
// 입력
> 5 3
> 1 2 3 1 2

// 출력
> 7
```

---

# 풀이

## 핵심 아이디어
- "(A+B)%C 는 ((A%C) + (B%C))%C 와 같다." 라는 성질과 누적합을 이용한다.
- 누적합의 배열 S가 있다고 할 때, S[i]%M == S[j]%M 이면 (S[i] - S[j])%M == 0 이다.

## 의사코드
```plaintext
1. 누적합 배열 S를 만든다.
for (i -> 1 to N) {
    S[i] = S[i-1] + A[i]
}

2. 나머지가 같은 누적합의 개수를 센다.
for (i -> 0 to N) {
    count[S[i]%M] += 1
}

3. 같은 나머지의 누적합에서 2개를 선택하는 경우의 수를 계산한다.
for (i -> 0 to M) {
    answer += count[i] * (count[i] - 1) / 2
}
```
