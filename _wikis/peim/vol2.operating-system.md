---
layout  : wiki
title   : vol2. OS (Operating System)
summary : 
date    : 2025-02-15 15:50:57 +0900
updated : 2025-02-15 15:51:10 +0900
tags    : 
toc     : true
public  : true
parent  : [[peim/index]]
latex   : false
---
* TOC
{:toc}

--- 

# PART1. OS (Operating System)

# 1. 운영체제에 대해 설명하시오.
# 2. 운영체제의 기능과 역할에 대해 설명하시오.
# 3. windows os의 부텅 순서에 대해 설명하시오.
# 4. Process에 대해 설명하시오.
# 5. Thread에 대해 설명하시오.
# 6. Muiti-Thread에 대해 설명하시오.
# 7. 내부단편화와 외부단편화에 대해 설명하시오.
# 8. Context Switching에 대해 설명하시오.
# 9. UNIX System에서 사용되는 umask에 대해 설명하시오.
# 10. UNIX Systtem Call 동작 과정을 설영하시오.
# 11. UNIX File System의 개념, 구조, 특징 및 inode에 대해 설명하시오. 
# 12. Application과 kernel 통신 방법에서 Non Blocked I/O와 Blocked I/O에 대해 비교 설명하시오.
# 13. Application program과 kernel간의 비동기 I/O(Asynchronous I/O) 제어 방식에 대해 설명하시오.
# 14. 마이크로 커널(Micro Kernel)에 대해 설명하고 Monolitic 커널과 비교하시오.
# 15. Cloud Operating System, OpenStack에 대해 설명하시오.
# 16. Embedded OS 특징과 기능에 대해 설명하시오.
# 17. 실시간 시스템, 실시간 운영체제(Real time operating system)에 대해 설명하시오.
# 18. Tiny OS 구조와 kernel scheduler에 대해 설명하시오.
# 19. Embedded System 개발 위한 Cross Development(교차 개발) 환경과 Debugger 종류에 대해 설명하시오.
# 20. Embedded system과 Embedded s/w 특성을 설명하시오.
# 21. 임베디스 시스템 메모리 최적화 방안(HW, SW측면)에 대해 설명하시오.
# 22. 자동차용 Embedded system 기술에 대해 설명하시오.
# 23. Buffer, Buffering과 Cache, Caching의 개념, 활용 예, 활용 시의 주의 사항에 대해 설명하시오.    

---

# PART2. 스케쥴링 (Scheduling)

# 24. CPU Scheduing에 대해 설명하시오.
# 25. CPU Scheduler 종류에 대해 설명하시오.
# 26. CPU 스케쥴링은 선점형과 비섬형으로 분류된다. 각각에 대해 설명하시오.
# 27. Round Robin 방식의 CPU 스케쥴링에 대해 설명하시오.
# 28. Fixed Time Slice 알고리즘에 대해 설명하시오.
# 29. 아래 주어진 표에서 J1, J2, J3 순으로 실행시 39가 소요되는 원인과 Job 실행을 변경했을 때의 시간을 각각 구하고 적절한 스케쥴링시 몇초까지 실행시간을 줄일 수 있는지 논리적으로 설명하시오

|Job|CPU 수행시간|
|---|---|
|J1|5초|
|J2|10초|
|J3|4초|

# 30. FCFS와 SJF의 동작원리를 설명하시오.
# 31. 아래 Table 상화에서 SRT(Shortest Remaining Time) 알고리즘을 적용하여 평균대기시간과 평균반환시간을 구하시오.

|Process|도착시간|실행시간|
|---|---|---|
|P1|0|8|
|P2|1|4|
|P3|2|6|
|P4|3|5|

# 32. 선점형 스케쥴링 방식인 MLQ(Multi Level Queue)와 MLFQ(Multi Level Feedback Queue)에 대해 설명하시오.
# 33. SJF(Shortest Job First) 방식에서 기아현상(Starvation)을 HRN(Highest Response Ratio Next)방식으로 해결됨을 증명하시오.
# 34. Round Robin 방식 (Process 도착 방식 미고려)
# 35. 우선순위 역전 발생원인에 대해 설명하시오.
# 36. 우선순위 역적 방지 방법에 대해 설명하시오.
# 37. Hard real time의 RM(Rate Monotonic)과 EDF(Earliest Deadline First) Scheduing 에 대해 설명하시오. 아래 두개의 Task로 RM과 EDF 스케쥴링 시간을 도식화하시오.

|Task|실행시간|주기(Deadline)|
|---|---|---|
|Task1|0.7초|2초|
|Task2|1.5초|3초|

# 38. HDD(Hard Disk Drive)의 Disk Access time에 대해 설명하시오.
# 39. NCQ(Native Command Queuing)의 동작원리에 대해 설명하시오.