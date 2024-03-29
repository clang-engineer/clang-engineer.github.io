---
layout  : wiki
title   : Java Check Point
summary : 
date    : 2023-04-30 15:54:10 +0900
updated : 2023-05-01 20:04:20 +0900
tags    : 
toc     : true
public  : true
parent  : [[check-point/index]]
latex   : false
---
* TOC
{:toc}

# 1. Java의 특징과 장단점에 대해 설명해주세요.
```
Java의 특징은 크게 3가지로 나눌 수 있습니다. 첫 번째는 객체 지향 프로그래밍(OOP)을 지원한다는 점입니다. 두 번째는 플랫폼 독립성이며, 이는 JVM(Java Virtual Machine)이라는 가상 머신을 이용해 어느 운영체제에서든 Java 프로그램을 실행할 수 있다는 것을 의미합니다. 세 번째는 안정성과 보안성이 높다는 점입니다.

장점으로는 다음과 같은 것들이 있습니다.

- 플랫폼 독립성으로 어느 운영체제에서든 Java 프로그램을 실행할 수 있다.
- 안정성과 보안성이 높아서 오류 발생 확률이 낮고, 보안 문제를 예방할 수 있다.
- JVM이 자동으로 메모리 관리를 해주므로 메모리 누수 등의 문제를 줄일 수 있다.
- 다양한 라이브러리와 프레임워크가 존재하므로 생산성이 높아진다.

단점으로는 다음과 같은 것들이 있습니다.

- C++에 비해 실행 속도가 느리다는 평가가 있습니다.
- JVM에 의존하므로 초기 구동 시간이 길다는 단점이 있다.
- 상대적으로 메모리 사용량이 높아질 수 있다.
```

# 2. Java에서 인터페이스와 추상 클래스의 차이는 무엇인가요?
```
인터페이스와 추상 클래스는 Java에서 추상화(abstraction)를 구현하기 위한 개념입니다. 하지만 인터페이스와 추상 클래스는 목적과 특성이 다릅니다.

인터페이스는 추상 메서드와 상수만을 가진 템플릿입니다. 즉, 인터페이스에서는 메서드의 시그니처만을 정의하고, 구현부는 작성하지 않습니다. 이는 인터페이스를 구현하는 클래스에서 메서드를 직접 구현하도록 강제하기 때문입니다. 또한, 다중 상속을 지원하기 때문에 한 클래스가 여러 개의 인터페이스를 구현할 수 있습니다.

추상 클래스는 일부 메서드는 구현할 수 있고, 일부 메서드는 추상 메서드로 선언할 수 있는 클래스입니다. 추상 메서드는 메서드의 시그니처만을 가지고 있고, 구현부는 작성하지 않습니다. 추상 클래스는 인스턴스화할 수 없기 때문에, 추상 클래스를 상속받아서 추상 메서드를 구현한 서브 클래스를 만들어야 합니다.

추상 클래스와 인터페이스는 모두 추상화를 구현하는 용도로 사용됩니다. 하지만 인터페이스는 구현을 강제하고 다중 상속을 지원하며, 추상 클래스는 일부 메서드를 구현할 수 있고 인스턴스화할 수 없습니다. 따라서 개발자는 인터페이스와 추상 클래스 중에 어떤 것을 사용할지, 어떤 용도로 사용할지를 고려해야 합니다.

인터페이스는 기능의 명세서라고 할 수 있습니다. 즉, 인터페이스는 어떤 객체가 가져야 할 기능(메서드)들을 정의하는 일종의 계약서입니다. 예를 들어, List 인터페이스는 리스트 형태의 데이터를 다루기 위한 메서드들을 정의하고 있습니다. 이를 구현한 ArrayList 클래스나 LinkedList 클래스는 List 인터페이스의 메서드를 반드시 구현해야 합니다. 이러한 인터페이스의 특징으로 인해, 인터페이스는 서로 다른 구현체들을 유연하게 대체할 수 있는 구조를 만들어 줍니다.

추상 클래스는 구현 클래스들이 가져야 할 공통된 기능들을 구현할 수 있도록 하는 용도로 사용됩니다. 즉, 추상 클래스는 구현 클래스들의 공통점을 추출해서 일반화된 형태로 만들어 놓은 것입니다. 예를 들어, Shape 추상 클래스는 도형의 공통 기능을 추상화한 클래스입니다. 이를 구현한 Circle 클래스나 Rectangle 클래스는 Shape 추상 클래스에 정의된 메서드들을 상속받아 사용할 수 있습니다. 이러한 추상 클래스의 특징으로 인해, 추상 클래스는 코드의 재사용성을 높여주고 일관된 구조를 유지할 수 있도록 해줍니다.
```
> [참조: 인파님 티스토리](https://inpa.tistory.com/entry/JAVA-%E2%98%95-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4-vs-%EC%B6%94%EC%83%81%ED%81%B4%EB%9E%98%EC%8A%A4-%EC%B0%A8%EC%9D%B4%EC%A0%90-%EC%99%84%EB%B2%BD-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0)

# 3. Java에서 예외 처리의 목적은 무엇이며, 어떤 방식으로 처리할 수 있나요?
```
Java에서 예외 처리의 목적은 프로그램 실행 중 발생할 수 있는 예기치 않은 상황(예외)을 처리하여 프로그램이 안정적으로 동작하도록 보장하는 것입니다. 예외는 다양한 원인으로 발생할 수 있으며, 예외가 발생한 경우 해당 예외를 처리하지 않으면 프로그램이 강제 종료되거나, 원치 않는 결과가 발생할 수 있습니다.

Java에서는 예외 처리를 위해 try-catch 블록을 사용합니다. try 블록은 예외가 발생할 수 있는 코드를 포함하고, catch 블록은 try 블록에서 발생한 예외를 처리하는 코드를 포함합니다. 예외가 발생하면 해당 예외에 대한 catch 블록이 실행되며, 프로그램은 정상적으로 계속 실행됩니다.
```

# 4. Java에서 메모리 관리 방식과 Garbage Collection에 대해 설명해주세요.
```
Java는 가비지 컬렉션(Garbage Collection)을 사용하여 메모리 관리를 합니다. 이는 프로그래머가 수동으로 메모리를 할당하고 해제하는 작업을 하지 않아도 된다는 장점이 있습니다.

Java에서 메모리는 두 가지 영역으로 나누어져 있습니다. 하나는 스택(stack)이고 다른 하나는 힙(heap)입니다. 스택은 지역 변수, 메서드 호출 등에 사용되며, 힙은 객체와 배열 등을 저장하는 데 사용됩니다. 메모리는 JVM(Java Virtual Machine)에서 관리되며, JVM은 가비지 컬렉션을 통해 사용되지 않는 객체를 자동으로 제거하여 메모리를 회수합니다.

Java의 가비지 컬렉션은 메모리를 관리하는 알고리즘에 따라 다양한 방식으로 동작합니다. 대표적인 알고리즘으로는 Mark-and-Sweep, Reference Counting, Generational 등이 있습니다.

Mark-and-Sweep 알고리즘은 힙에서 사용하지 않는 객체를 탐색하고, 해당 객체를 참조하는 모든 포인터를 삭제한 뒤, 메모리를 해제합니다. Reference Counting 알고리즘은 객체를 참조하는 포인터의 개수를 세어, 참조하는 포인터가 없을 때 해당 객체를 제거합니다. Generational 알고리즘은 객체를 새로 생성하면 새로운 영역에 할당하고, 일정 시간이 지나면 해당 영역의 객체를 일괄 제거합니다.

Java에서 가비지 컬렉션은 시스템 자원을 사용하므로, 메모리 사용량과 성능 간의 균형을 유지하는 것이 중요합니다. 따라서, 메모리 사용 패턴과 애플리케이션의 특성에 따라 적절한 가비지 컬렉션 방식을 선택하고, 가비지 컬렉션 튜닝을 통해 최적화하는 것이 필요합니다.
```

# 5. Java에서 다형성이란 무엇이며, 어떻게 구현할 수 있나요?
```
Java에서 다형성(Polymorphism)은 객체지향 프로그래밍의 중요한 개념 중 하나입니다. 다형성은 하나의 객체가 여러 가지 타입을 가질 수 있고, 하나의 타입으로부터 여러 가지 객체를 생성할 수 있다는 것을 의미합니다. 이것은 코드의 재사용성과 유연성을 높여줍니다.

Java에서 다형성을 구현하는 방법은 크게 두 가지가 있습니다.

1. 메소드 오버로딩 (Method Overloading)
- 메소드 오버로딩은 같은 이름의 메소드를 매개변수의 개수, 타입, 순서 등의 차이로 여러 개 정의할 수 있는 기능입니다.
- 컴파일러는 전달받은 매개변수를 기반으로 가장 적합한 메소드를 선택합니다.

2. 메소드 오버라이딩 (Method Overriding)
- 메소드 오버라이딩은 상위 클래스에서 정의된 메소드를 하위 클래스에서 동일한 이름과 시그니처로 재정의하는 기능입니다.
- 하위 클래스의 메소드가 호출되면, 런타임에 객체의 실제 타입을 기반으로 해당 메소드가 실행됩니다.
- 이때, 상위 클래스와 하위 클래스 간에 동일한 메소드가 존재하고, 런타임에 실제 타입을 기반으로 실행 결과가 결정되므로 다형성이 구현됩니다.

위의 두 가지 방법은 Java에서 다형성을 구현하는 가장 대표적인 방법들입니다. 다형성을 구현하면 코드의 유연성과 확장성을 높일 수 있습니다.
```

# 6. Java에서 쓰레드와 동기화에 대해 설명해주세요.
```
Java에서 쓰레드(Thread)는 동시에 여러 가지 작업을 처리할 수 있도록 하는 기능입니다. 하나의 프로세스 내에서 실행되며, 각각의 쓰레드는 독립적인 실행 흐름을 가지고 있습니다. 

Java에서 쓰레드를 구현하는 방법은 두 가지가 있습니다.

1. Thread 클래스를 상속받아 구현하는 방법
- Thread 클래스를 상속받아 run() 메소드를 구현하고 start() 메소드를 호출하여 실행합니다.

2. Runnable 인터페이스를 구현하는 방법
- Runnable 인터페이스를 구현한 클래스의 객체를 생성하고, 이를 Thread 클래스의 생성자로 전달하여 실행합니다.

Java에서 동기화(Synchronization)는 여러 쓰레드가 공유하는 자원에 대한 접근을 제어하는 기능입니다. 동기화를 사용하지 않으면 여러 쓰레드가 동시에 자원에 접근하여 원하지 않는 결과를 초래할 수 있습니다.

Java에서 동기화를 구현하는 방법은 두 가지가 있습니다.

1. synchronized 키워드를 사용하는 방법
- synchronized 키워드를 사용하여 특정 블록이나 메소드에 대한 접근을 한 번에 하나의 쓰레드만 가능하도록 제한합니다.

2. Lock 인터페이스를 사용하는 방법
- Lock 인터페이스를 구현한 클래스를 사용하여 동기화를 구현합니다.
- ReentrantLock 클래스는 가장 많이 사용되는 Lock 인터페이스 구현체 중 하나입니다.

동기화를 사용하여 여러 쓰레드가 공유하는 자원에 대한 접근을 제어하면서, 쓰레드 간의 경쟁 상황(Race Condition)이 발생하지 않도록 합니다. 이를 통해 안정적인 멀티쓰레드 환경을 구현할 수 있습니다.
```

# 6. Java에서 컬렉션 프레임워크에 대해 설명해주세요.
```
Java에서 컬렉션 프레임워크(Collection Framework)는 데이터 그룹을 저장, 조작, 검색하기 위한 클래스와 인터페이스를 제공합니다. 이러한 클래스와 인터페이스를 사용하여 데이터 그룹을 쉽게 조작하고 처리할 수 있습니다.

컬렉션 프레임워크는 다음과 같은 특징을 가지고 있습니다.

1. 인터페이스와 구현 클래스의 분리
- 인터페이스와 구현 클래스가 분리되어 있기 때문에, 사용자는 인터페이스를 사용하여 구현 클래스의 구현 내용을 알 필요가 없습니다.
자동으로 크기 조절 가능
크기를 조절하는 메소드를 제공하여, 데이터 그룹의 크기를 자동으로 조절할 수 있습니다.
2. 제네릭스(Generic) 지원
- 제네릭스를 사용하여 컬렉션에 저장되는 데이터 타입을 명시할 수 있습니다. 이를 통해 안정적인 프로그래밍이 가능해집니다.

Java에서 제공하는 주요 컬렉션 클래스는 다음과 같습니다.

1. List
- 순서가 있는 데이터 그룹을 저장합니다.
- 중복된 데이터를 허용합니다.
- ArrayList, LinkedList, Vector 등이 있습니다.

2. Set
- 순서가 없는 데이터 그룹을 저장합니다.
- 중복된 데이터를 허용하지 않습니다.
- HashSet, TreeSet 등이 있습니다.

3. Map
- Key와 Value의 쌍으로 이루어진 데이터를 저장합니다.
- Key는 중복될 수 없습니다.
- HashMap, TreeMap 등이 있습니다.

컬렉션 프레임워크는 Java에서 데이터 그룹을 다루는 가장 중요한 기능 중 하나입니다. 이를 활용하여 데이터 처리와 관리를 효율적으로 할 수 있습니다.
```

# 7. Java에서 문자열(String)과 StringBuilder/StringBuffer의 차이는 무엇인가요?
```
Java에서 문자열(String)은 불변(immutable)한 객체입니다. 즉, 한 번 생성된 문자열 객체의 값은 변경할 수 없습니다. 이러한 특성 때문에 문자열을 변경하는 작업이 필요한 경우에는 매번 새로운 문자열 객체가 생성되어 메모리를 소비하게 됩니다.

반면에 StringBuilder와 StringBuffer는 가변(mutable)한 객체입니다. 이들은 문자열을 동적으로 생성하고 변경할 수 있습니다. StringBuilder와 StringBuffer는 내부적으로 가변 크기의 char 배열을 유지하며, 문자열을 추가하거나 변경할 때 배열의 크기를 조절하여 문자열을 저장합니다. 이러한 특성 때문에 StringBuilder와 StringBuffer는 문자열을 변경하는 작업이 필요한 경우에 유용하게 사용됩니다.

StringBuilder와 StringBuffer의 차이점은 동기화(synchronization) 여부입니다. StringBuffer는 동기화된 메소드로 구현되어 있기 때문에 멀티스레드 환경에서 안전하게 사용할 수 있습니다. 하지만 StringBuilder는 동기화되지 않은 메소드로 구현되어 있기 때문에 멀티스레드 환경에서 사용할 때는 주의가 필요합니다.

따라서, 문자열을 변경하는 작업이 필요한 경우에는 StringBuilder나 StringBuffer를 사용하고, 문자열을 변경할 필요가 없는 경우에는 String을 사용하는 것이 좋습니다.
```

# 8. Java에서 static 키워드가 무엇을 의미하며, 어떻게 사용될까요?
```
Java에서 static은 클래스 레벨의 키워드로 사용됩니다. 이는 다음과 같은 의미를 갖습니다.

1. static 변수
static 변수는 클래스 레벨에서 정의되는 변수로, 객체 생성과 상관없이 클래스가 로딩될 때 초기화됩니다. 모든 객체가 이 변수를 공유하며, 변경될 경우 모든 객체에서 동일한 값이 유지됩니다.

2. static 메소드
static 메소드는 클래스 레벨에서 정의되는 메소드로, 객체 생성과 상관없이 호출될 수 있습니다. static 메소드 내부에서는 인스턴스 변수에 접근할 수 없으며, 오직 static 변수나 메소드에만 접근이 가능합니다. 주로 유틸리티 메소드나 팩토리 메소드 등을 구현할 때 사용됩니다.

3. static 블록
static 블록은 클래스 로딩시에 실행되는 코드 블록입니다. 주로 클래스 초기화에 필요한 작업을 수행할 때 사용됩니다.

static 키워드는 다음과 같은 장점을 갖습니다.
- 객체 생성 없이 클래스 레벨에서 접근 가능하므로, 메모리 사용을 최적화할 수 있습니다.
- 상수나 유틸리티 메소드 등을 구현할 때 유용합니다.
- 객체 지향 프로그래밍에서는 객체 간 상호작용을 통해 데이터를 처리하는 것이 일반적입니다. 그러나 static 변수나 메소드는 클래스 레벨에서 공유되므로, 다른 객체 간에 데이터를 공유해야 할 때 사용할 수 있습니다.

하지만 static 키워드의 남발은 객체 지향적인 설계를 방해할 수 있으므로, 적절한 사용이 필요합니다. 특히, static 변수를 사용할 때는 공유 데이터에 대한 동기화 문제가 발생할 수 있으므로, 주의가 필요합니다.
```

# 9. Java에서 다중 상속이 불가능한 이유는 무엇인가요?
```
Java에서 다중 상속이 불가능한 이유는 여러 가지가 있지만, 가장 큰 이유 중 하나는 다이아몬드 상속 문제입니다.

예를 들어, 클래스 A와 B가 클래스 C를 상속하고, 클래스 D가 A와 B를 상속하는 경우, 클래스 D는 A와 B 모두에서 C 클래스를 상속받게 됩니다. 이 경우, D 클래스에서 C 클래스의 어떤 메소드를 호출해야 하는지 모호해지며, 이러한 모호성 때문에 다이아몬드 상속 문제가 발생할 수 있습니다.

이를 해결하기 위해서 Java에서는 클래스 다중 상속 대신 인터페이스를 이용한 다중 상속을 지원하고 있습니다. 인터페이스는 다중 상속이 가능하며, 다이아몬드 상속 문제도 발생하지 않습니다. 인터페이스는 구현해야 하는 메소드를 강제하기 때문에 클래스 간의 상속 관계에서 발생할 수 있는 문제를 방지할 수 있습니다.
```

# 10. Java8의 특징?
```
1. 람다 표현식
함수형 프로그래밍을 지원하기 위해 람다 표현식이 추가되었습니다. 이를 통해 코드의 간결성과 가독성이 증가하였습니다.
람다 표현식은 익명 함수를 정의하는 것으로, 메서드의 매개변수로 전달하거나 변수에 할당할 수 있습니다.

2. 스트림 API
스트림 API는 람다 표현식과 함께 제공되어 컬렉션 데이터를 처리하는 방법을 개선하였습니다. 스트림 API를 사용하면 병렬 처리가 가능해져서 대용량 데이터 처리가 더욱 효율적으로 이루어집니다.

3. 메서드 참조
람다 표현식에서 사용되는 메서드 참조는 람다 표현식을 더욱 간결하게 만들어줍니다.

4. 인터페이스의 디폴트 메서드
인터페이스에 디폴트 메서드를 추가하여 기존 코드의 호환성을 유지하면서 새로운 기능을 추가할 수 있습니다.

5. Optional 클래스
Optional 클래스는 null을 다루는 방법을 개선하였습니다. Optional 클래스를 사용하면 null 처리를 명시적으로 표현하여 코드의 가독성을 높일 수 있습니다.
Optional 클래스는 null을 반환하는 메서드에서 NullPointerException을 방지하기 위해 도입되었습니다. 이를 통해 안전하게 null 처리를 할 수 있습니다.

6. Date/Time API
자바 8에서는 새로운 Date/Time API가 도입되었습니다. 이는 이전의 Date/Time API와 달리 불변 객체로 설계되어 있으며, 시간 계산과 관련된 다양한 기능을 제공합니다.

7. Nashorn JavaScript 엔진
Nashorn은 자바스크립트의 빠른 실행 속도와 자바 플랫폼의 강력한 기능을 함께 사용할 수 있도록 자바스크립트 엔진을 제공합니다. 이를 통해 자바와 자바스크립트 간의 상호 운용성이 향상되었습니다.

8. PermGen 공간의 제거
Java 8에서는 PermGen 공간이 제거되었습니다. PermGen 공간은 클래스 메타데이터를 저장하는 공간으로, Java 7 이전에는 PermGen 공간이 가득 차면 OutOfMemoryError가 발생하였습니다. Java 8에서는 PermGen 공간이 제거되고, 클래스 메타데이터는 Metaspace 영역에 저장됩니다. Metaspace 영역은 PermGen 공간과 달리 힙 영역에 할당되며, 필요한 만큼 메모리를 동적으로 할당하여 사용합니다.
```

# 11. Java 예외의 구조
```
Java에서 예외는 Throwable 클래스를 상속하는 Exception 및 Error 클래스를 기반으로 합니다.

Exception : 일반적인 예외 상황을 나타냅니다. 프로그램에서 예측 가능하며 처리가 가능한 예외입니다. RuntimeException 및 그 하위 클래스와, IOException, SQLException 등이 이에 속합니다.
Error : 시스템 레벨의 예외 상황을 나타냅니다. 시스템에서 처리할 수 없는 예외로, 프로그램에서 이러한 예외를 처리하는 것은 권장되지 않습니다. OutOfMemoryError, StackOverflowError 등이 이에 속합니다.
Exception과 그 하위 클래스는 반드시 처리해야 하는 체크 예외와, 처리하지 않아도 되는 언체크 예외로 나뉘어집니다.

체크 예외 : IOException, SQLException 등처럼 반드시 예외 처리를 해주어야 하는 예외입니다. 메소드를 호출할 때 반드시 예외 처리 코드를 작성해야 합니다.
언체크 예외 : RuntimeException, NullPointerException 등처럼 예외 처리 코드를 작성하지 않아도 되는 예외입니다.
```

# 12. Java 가비지 컬렉션 튜닝 방법 ?
```
1. 메모리 할당과 해제를 최소화합니다.
객체 생성과 해제를 빈번하게 하면 가비지 컬렉션이 자주 발생하므로 성능 저하의 원인이 됩니다. 따라서, 객체를 재사용하고, 불필요한 객체는 적절히 해제하여 메모리 사용을 최적화합니다.

2. 적절한 가비지 컬렉션 방식을 선택합니다.
가비지 컬렉션 방식은 메모리 사용 패턴과 애플리케이션의 특성에 따라 다르게 선택해야 합니다. 예를 들어, 메모리 사용이 일정하게 발생하는 경우에는 Mark-and-Sweep 알고리즘이 적합하고, 객체가 빠르게 생성되고 삭제되는 경우에는 Generational 알고리즘이 적합합니다.

3. 메모리 크기를 조정합니다.
애플리케이션에서 사용하는 메모리 크기는 JVM의 Xmx 옵션으로 조정할 수 있습니다. 메모리 크기를 충분히 크게 설정하면 가비지 컬렉션이 발생하는 빈도를 줄일 수 있습니다. 그러나 메모리를 너무 많이 할당하면 시스템의 다른 프로세스에서 사용하는 메모리를 차지할 수 있으므로, 적절한 메모리 크기를 선택해야 합니다.

4. 가비지 컬렉션 로그를 분석합니다.
JVM에서는 가비지 컬렉션 로그를 제공하므로, 이를 분석하여 가비지 컬렉션에 걸리는 시간, 힙 메모리 사용량 등을 확인할 수 있습니다. 로그를 분석하여 가비지 컬렉션 횟수를 최소화하고, 가비지 컬렉션으로 인한 성능 저하를 최소화할 수 있습니다.

5. GC 튜닝 옵션을 설정합니다.
JVM은 다양한 GC 튜닝 옵션을 제공합니다. 이를 설정하여 가비지 컬렉션의 동작 방식을 조정할 수 있습니다. 예를 들어, Young Generation의 크기를 늘리거나, Old Generation의 크기를 조정할 수 있습니다.
```

# 13. Java에서 Annotation(어노테이션)이란 무엇이며, 어떻게 사용하나요?
```
Java에서 Annotation(어노테이션)은 코드에 메타데이터(metadata)를 추가하는 방법 중 하나입니다. 즉, 코드에 대한 정보를 추가하거나, 코드를 처리하거나, 컴파일러에게 정보를 전달하는 방법으로 사용됩니다. 

Java에서 기본적으로 제공하는 Annotation은 @Override, @Deprecated, @SuppressWarnings 등이 있습니다. 이 외에도 사용자가 직접 Annotation을 정의하여 사용할 수 있습니다.

Annotation은 주로 클래스, 메서드, 변수 등에 적용됩니다. 예를 들어, 클래스나 메서드의 사용 방법, 제약 조건 등을 명시할 때 사용할 수 있습니다. Annotation은 소스 코드에 추가되므로, 코드를 읽을 때 코드 자체에 대한 정보를 쉽게 파악할 수 있게 됩니다.

Annotation은 주로 컴파일러나 런타임에서 사용됩니다. 컴파일러에서는 Annotation을 통해 코드의 문제점을 검사하거나, 코드를 최적화하는 등의 작업을 수행합니다. 런타임에서는 Annotation을 통해 코드의 동작을 변경하거나, 추가적인 작업을 수행하는 등의 작업을 수행할 수 있습니다.

Annotation을 사용하면 코드의 가독성을 높일 수 있고, 코드를 관리하기 쉽게 만들 수 있습니다. 또한, Annotation을 사용하여 코드를 자동으로 생성하는 등의 작업도 가능합니다. 따라서, Java에서 Annotation은 매우 중요한 개념 중 하나입니다.
```

# 14. Java에서 Serializable 인터페이스가 무엇인지 설명하십시오.
```
Java에서 Serializable 인터페이스는 객체를 직렬화(Serialization)할 수 있도록 하는 인터페이스입니다. 객체를 직렬화한다는 것은, 객체를 바이트 스트림으로 변환하여 저장하거나 네트워크를 통해 전송할 수 있도록 만드는 것을 의미합니다.

Serializable 인터페이스는 아무런 메서드도 가지고 있지 않지만, 직렬화 가능한 객체를 나타내는 마커 인터페이스(marker interface)입니다. 즉, Serializable 인터페이스를 구현하는 클래스는 직렬화가 가능한 클래스라는 것을 나타내기 위해 해당 인터페이스를 구현해야 합니다.

Java에서 Serializable 인터페이스를 구현하면, 해당 객체는 ObjectInputStream 및 ObjectOutputStream을 사용하여 직렬화 및 역직렬화할 수 있습니다. 직렬화된 객체는 파일이나 데이터베이스에 저장하거나, 네트워크를 통해 전송할 수 있습니다.

Serializable 인터페이스를 구현하는 클래스의 필드 중에는 직렬화 대상이 아닌 것이 있을 수 있습니다. 이 경우에는 transient 키워드를 사용하여 해당 필드를 직렬화에서 제외할 수 있습니다.

Serializable 인터페이스를 구현하면, Java에서 제공하는 여러 기능들을 사용할 수 있습니다. 예를 들어, Java에서는 직렬화된 객체를 캐시(cache)에 저장하여, 다시 생성하지 않고 빠르게 사용할 수 있는 기능도 제공합니다. 따라서, Java에서 Serializable 인터페이스는 매우 중요한 개념 중 하나입니다.
```

# 15. Java에서 대용량 데이터를 다룰 때 어떤 방식으로 처리하는 것이 좋은가요?
```
Java에서 대용량 데이터를 다룰 때는 다음과 같은 방식으로 처리하는 것이 좋습니다.

1. 스트림 API 사용하기: Java 8에서 추가된 스트림 API를 사용하면 대용량 데이터를 효율적으로 처리할 수 있습니다. 스트림 API를 사용하면 데이터를 일관된 방식으로 처리할 수 있으며, 병렬 처리도 쉽게 구현할 수 있습니다.

2. 메모리 제한에 유의하기: 대용량 데이터를 메모리에 한 번에 올리는 것은 불가능할 수도 있습니다. 따라서 메모리 제한을 고려하여 데이터를 적절히 분할하여 처리하는 것이 좋습니다.

3. 데이터베이스 사용하기: 대용량 데이터를 다룰 때는 데이터베이스를 사용하는 것이 좋습니다. 데이터베이스는 대용량 데이터를 처리하는 데 최적화되어 있으며, 데이터를 적절히 쿼리하여 필요한 데이터만 가져올 수 있습니다.

4. 파일 입출력 사용하기: 대용량 데이터를 파일로 저장하고, 필요한 부분만 읽어들이는 방식으로 처리하는 것도 좋은 방법입니다. 이 경우 파일 입출력 API를 사용하여 파일을 읽고 쓰는 것이 필요합니다.

5. 적절한 자료구조 사용하기: 대용량 데이터를 다룰 때는 적절한 자료구조를 사용하여 데이터를 저장하고 처리하는 것이 중요합니다. 예를 들어, LinkedList는 데이터를 추가/삭제하는데 용이하지만, 검색/접근 속도가 느릴 수 있습니다. 반면에, ArrayList는 검색/접근 속도가 빠르지만, 데이터를 추가/삭제하는 것은 상대적으로 느립니다. 따라서 데이터를 어떻게 다룰지에 따라 적절한 자료구조를 선택해야 합니다.
```

# 16. Java에서 HTTP 프로토콜과 TCP/IP 프로토콜의 차이점은 무엇인가요?
```
HTTP 프로토콜과 TCP/IP 프로토콜은 서로 다른 프로토콜이며, 다음과 같은 차이점이 있습니다.

1. 계층 구조: TCP/IP 프로토콜은 OSI 7계층 모델에서 전송 계층과 인터넷 계층을 담당하는 프로토콜이며, HTTP 프로토콜은 OSI 7계층 모델에서 응용 계층을 담당하는 프로토콜입니다.

2. 연결 지향성: TCP/IP 프로토콜은 연결 지향적인 프로토콜이며, 데이터의 신뢰성을 보장하기 위해 데이터의 송수신 전에 연결 설정 과정을 거칩니다. 반면에, HTTP 프로토콜은 비연결형 프로토콜이며, 데이터의 신뢰성은 보장하지 않습니다.

3. 데이터 전송 방식: TCP/IP 프로토콜은 데이터를 바이트 스트림 형태로 전송하며, 데이터의 경계를 구분하지 않습니다. 반면에, HTTP 프로토콜은 MIME 타입과 같은 헤더 정보를 이용하여 데이터의 경계를 구분하고, 데이터를 전송합니다.

4. 포트 번호: TCP/IP 프로토콜은 송수신하는 데이터를 어느 프로그램에서 처리할지를 구분하기 위해 포트 번호를 사용합니다. 반면에, HTTP 프로토콜은 웹 서버에서 80번 포트를 사용합니다.

5. 상태 정보: HTTP 프로토콜은 상태 정보를 기억하지 않으며, 요청과 응답 간에 독립적입니다. 반면에, TCP/IP 프로토콜은 연결을 유지하며, 연결 상태를 기억합니다. 

6. 기능: TCP/IP 프로토콜은 데이터를 안정적으로 전송하는 기능을 수행하며, HTTP 프로토콜은 웹 서버와 클라이언트 간에 데이터를 전송하는 기능을 수행합니다.
```

# 17. Java에서 JAR 파일이란 무엇이며, 어떻게 사용하나요?
```
Java Archive (JAR) 파일은 Java 클래스, 리소스, 라이브러리, 메타데이터 및 기타 파일들을 압축한 파일 형식입니다. JAR 파일은 하나 이상의 클래스 파일 및 관련 리소스를 하나의 파일로 묶어서 배포하고, 실행 환경에서 클래스 로딩 및 리소스 액세스를 쉽게 관리할 수 있도록 지원합니다.

JAR 파일을 만들기 위해서는 JDK(Java Development Kit)에 포함된 jar 유틸리티를 사용합니다. 일반적으로 다음과 같은 명령어를 사용하여 JAR 파일을 만듭니다.

jar cf jar파일이름.jar 클래스파일

JAR 파일은 다음과 같은 방법으로 사용할 수 있습니다.

1. 라이브러리 사용: JAR 파일은 외부 라이브러리를 사용할 때 주로 사용됩니다. JAR 파일에 포함된 클래스를 사용하기 위해서는 클래스패스에 JAR 파일의 경로를 추가해주어야 합니다.
2. 배포: JAR 파일은 Java 애플리케이션을 배포할 때 사용됩니다. Java 애플리케이션을 JAR 파일로 묶어서 배포하면, 애플리케이션 실행 시 필요한 클래스 파일 및 리소스를 쉽게 관리할 수 있습니다.
3. 실행: JAR 파일은 Java 애플리케이션을 실행할 때도 사용됩니다. java 명령어를 사용하여 JAR 파일을 실행할 수 있습니다.

java -jar jar파일이름.jar

JAR 파일은 Java 애플리케이션을 배포 및 실행하기 위한 중요한 도구입니다. JAR 파일을 사용하면 애플리케이션을 쉽게 배포하고 관리할 수 있으며, 라이브러리 및 클래스 파일을 쉽게 사용할 수 있습니다.
```

# 18. Java에서 제네릭(generics)의 장단점은 무엇인가요?
```
Java에서 제네릭(generics)은 컬렉션과 같은 자료구조에서 타입 안정성(type safety)을 보장하는 기능입니다. 이를 통해 코드의 안정성을 높일 수 있고, 형변환을 줄여 코드의 가독성을 높일 수 있습니다.

제네릭을 사용하는 장점은 다음과 같습니다.

1. 타입 안정성: 제네릭은 타입 안정성을 보장합니다. 제네릭을 사용하면 컴파일러가 컴파일 시점에 타입을 체크하여 타입 불일치에 따른 오류를 방지할 수 있습니다.
2. 형변환 제거: 제네릭을 사용하면 컬렉션에서 값을 꺼내거나 넣을 때 형변환을 할 필요가 없어져 코드의 가독성이 좋아집니다.
3. 재사용성: 제네릭을 사용하면 여러 종류의 자료형에 대해서도 재사용성이 높은 코드를 작성할 수 있습니다.

제네릭을 사용하는 단점은 다음과 같습니다.

1. 코드가 복잡해질 수 있습니다: 제네릭을 사용하면 코드가 복잡해질 수 있습니다. 특히, 와일드카드와 같은 복잡한 제네릭 문법을 사용하면 코드의 가독성이 떨어질 수 있습니다.
2. 성능 저하: 제네릭을 사용하면 성능이 떨어질 수 있습니다. 제네릭은 실행 시점에 형변환을 하기 때문에 오버헤드가 발생할 수 있습니다. 하지만 이러한 성능 저하는 일반적으로 미미하며, 최근의 JVM은 제네릭을 효율적으로 처리할 수 있도록 최적화되어 있습니다.

종합적으로, 제네릭은 코드의 안정성과 가독성을 높여주는 장점이 있지만, 코드가 복잡해지고 성능이 저하될 수 있는 단점도 있습니다. 따라서, 적절한 상황에서 적절하게 사용해야 합니다.
```

# 19. Java에서 병렬 처리(Parallel Processing)를 어떻게 구현하나요?
```
Java에서 병렬 처리를 구현하는 방법은 여러 가지가 있습니다. 여기에서는 대표적인 두 가지 방법에 대해 살펴보겠습니다.

1. 스레드(Thread)를 사용한 병렬 처리
- Java에서는 스레드를 사용하여 병렬 처리를 구현할 수 있습니다. 스레드를 사용하면 여러 개의 작업을 동시에 처리할 수 있으며, 멀티코어 CPU를 사용하는 경우에는 성능 향상을 기대할 수 있습니다. 스레드를 사용하는 방법에는 Thread 클래스나 Runnable 인터페이스를 구현하는 방법이 있습니다. 또한, Java 8부터는 람다 표현식을 사용하여 간단하게 스레드를 생성할 수도 있습니다.

2. 병렬 스트림(Parallel Stream)
- Java 8에서는 병렬 스트림(Parallel Stream)을 제공하여 병렬 처리를 간단하게 구현할 수 있습니다. 병렬 스트림을 사용하면 내부적으로 스레드 풀(Thread Pool)을 사용하여 처리하므로, 스레드를 직접 구현하지 않아도 됩니다. 또한, 병렬 스트림을 사용하면 코드를 간결하게 유지할 수 있으며, 성능 향상을 기대할 수 있습니다.

두 가지 방법 모두 장단점이 있으며, 상황에 따라 적절한 방법을 선택해야 합니다. 스레드를 사용하는 경우에는 스레드 간의 동기화 문제나 데드락 등에 대한 고려가 필요하며, 병렬 스트림을 사용하는 경우에는 병렬 처리가 가능한 연산에만 사용해야 하고, 스트림 내부적으로 사용되는 스레드 풀의 크기 조정에 대한 고려가 필요합니다.
```

# 20. Java에서 함수형 프로그래밍(Functional Programming)이란 무엇인가요? 어떻게 사용하나요?
```
함수형 프로그래밍(Functional Programming)은 프로그래밍 패러다임 중 하나로, 순수 함수(pure function)를 조합하고 이를 통해 소프트웨어를 구축하는 것을 강조합니다. 이는 상태를 변경하지 않고 입력 값에 대한 출력 값을 반환하는 함수를 구현하여 부작용(side effect)을 최소화하고 코드의 안정성과 가독성을 높이는 것을 목적으로 합니다.

Java에서는 함수형 프로그래밍을 지원하기 위해 Java 8에서 람다 표현식(Lambda Expression)과 스트림(Stream) API를 도입했습니다. 람다 표현식을 사용하면 함수를 변수에 할당하거나 다른 함수의 인자로 전달할 수 있으며, 스트림 API를 사용하면 컬렉션의 데이터를 함수형으로 처리할 수 있습니다. 이를 통해 코드의 가독성과 성능을 개선할 수 있습니다.

Java에서 함수형 프로그래밍을 사용하는 것은 객체 지향 프로그래밍(Object-Oriented Programming)과 함께 사용될 수 있습니다. 예를 들어, 함수형 프로그래밍을 통해 데이터를 처리한 후 결과를 객체로 반환할 수 있습니다. 또한 Java에서 제공하는 함수형 인터페이스(Functional Interface)를 사용하여 함수형 프로그래밍을 보다 쉽게 구현할 수 있습니다.
```

# 21. Java에서 I/O(입출력) 처리 방법과 관련된 클래스를 설명해보세요.
```
Java에서 I/O 처리 방법과 관련된 클래스는 다음과 같습니다.

1. InputStream과 OutputStream 클래스:
- InputStream과 OutputStream은 byte 스트림을 다루는 추상 클래스입니다.
- FileInputStream과 FileOutputStream 등 구체적인 클래스를 사용하여 파일로부터 byte 스트림을 읽고 쓸 수 있습니다.

2. Reader와 Writer 클래스:
- Reader와 Writer는 char 스트림을 다루는 추상 클래스입니다.
- FileReader와 FileWriter 등 구체적인 클래스를 사용하여 파일로부터 char 스트림을 읽고 쓸 수 있습니다.

3. BufferedInputStream과 BufferedOutputStream 클래스:
- BufferedInputStream과 BufferedOutputStream은 byte 스트림을 다루는 보조 클래스입니다.
- 버퍼를 사용하여 데이터를 미리 읽어들이거나 쓰기 때문에 더 빠른 I/O 처리가 가능합니다.

4. BufferedReader와 BufferedWriter 클래스:
- BufferedReader와 BufferedWriter는 char 스트림을 다루는 보조 클래스입니다.
- 버퍼를 사용하여 더 빠른 I/O 처리가 가능합니다.

5. InputStreamReader와 OutputStreamWriter 클래스:
- InputStreamReader와 OutputStreamWriter는 byte 스트림과 char 스트림 간의 변환을 담당합니다.
- 파일의 인코딩을 지정하여 데이터를 다룰 수 있습니다.

6. DataInputStream과 DataOutputStream 클래스:
- DataInputStream과 DataOutputStream은 자바의 기본 데이터 타입을 byte 스트림으로 변환하거나, byte 스트림을 기본 데이터 타입으로 변환할 수 있는 클래스입니다.

7. ObjectInputStream과 ObjectOutputStream 클래스:
- ObjectInputStream과 ObjectOutputStream은 객체 직렬화(Serialization)를 지원하는 클래스입니다.
- 객체를 파일에 저장하거나 네트워크를 통해 전송할 수 있습니다.
```

# 22. Java에서 쓰레드(Thread) 동기화(Synchronization)를 어떻게 처리하나요?
```
Java에서 쓰레드 동기화는 여러 쓰레드가 공유하는 자원(메모리)에 대한 접근을 조율하는 메커니즘입니다. 쓰레드 동기화를 통해 여러 쓰레드가 동시에 접근하는 경우 발생할 수 있는 경쟁 조건(race condition)과 같은 문제를 방지하고, 안전하게 공유 자원에 접근할 수 있도록 합니다.

Java에서는 쓰레드 동기화를 위해 다음과 같은 방법들을 제공합니다:

1. synchronized 키워드: 메소드나 블록에 synchronized 키워드를 사용하여 해당 영역을 하나의 쓰레드만 접근할 수 있도록 만듭니다.

2. volatile 키워드: volatile 키워드를 사용하면 해당 변수를 사용하는 모든 쓰레드에서 해당 변수에 대한 변경 사항이 공유됩니다. 이를 통해 다른 쓰레드에서 변수의 변경 사항을 즉시 알 수 있습니다.

3. Lock 인터페이스: Lock 인터페이스를 사용하여 Lock 객체를 생성하고, synchronized 블록 대신 Lock 객체를 사용하여 쓰레드 동기화를 수행할 수 있습니다. Lock 객체는 synchronized 블록보다 더 다양한 기능을 제공합니다.

4. Atomic 클래스: Atomic 클래스는 원자적 연산(atomic operation)을 제공하여 쓰레드 동기화를 수행합니다. 원자적 연산은 여러 쓰레드가 동시에 접근할 때 발생할 수 있는 경쟁 조건 문제를 방지하면서 동시성을 보장합니다.

쓰레드 동기화는 잘못 구현하면 성능 저하나 데드락(deadlock) 등의 문제를 발생시킬 수 있으므로, 주의해서 구현해야 합니다. 따라서 쓰레드 동기화에 대한 이해와 경험이 필요합니다.
```

# 23. Java에서 스트림(Stream) API란 무엇이며, 어떻게 사용하나요?
```
Java 8부터 도입된 스트림(Stream) API는 자바 컬렉션을 함수형 프로그래밍의 스타일로 처리할 수 있도록 도와주는 API입니다. 스트림은 데이터를 저장하거나 변경하는 것이 아니라 원본 데이터 소스로부터 데이터를 추출하고, 원하는 결과를 얻기 위한 중간 연산과 최종 연산을 수행하는 파이프 라인입니다.

스트림 API를 사용하면 더 간결하고 가독성이 높은 코드를 작성할 수 있으며, 병렬 처리에 효과적입니다.

스트림 API를 사용하기 위해선 먼저 데이터 소스를 생성해야 합니다. 이 소스는 배열, 컬렉션, 파일, 네트워크 연결 등 다양한 데이터 소스가 될 수 있습니다.

스트림 API의 사용 예시는 다음과 같습니다.

// List에서 짝수를 필터링하고, 각각에 2를 곱한 후 총합을 계산하는 코드
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
int sum = numbers.stream()
                .filter(n -> n % 2 == 0)
                .map(n -> n * 2)
                .reduce(0, Integer::sum);

위 코드에서 `stream()` 메소드를 호출하여 List에서 스트림을 생성하고, `filter()` 메소드를 사용하여 짝수만 필터링합니다. 이후 `map()` 메소드를 사용하여 각각의 요소에 2를 곱한 값을 계산하고, `reduce()` 메소드를 사용하여 총합을 계산합니다.

스트림 API의 메소드는 크게 중간 연산과 최종 연산으로 나눌 수 있습니다. 중간 연산은 스트림을 반환하며, 최종 연산은 스트림을 소모하여 최종 결과를 반환합니다. 중간 연산과 최종 연산을 조합하여 스트림 파이프 라인을 구성할 수 있습니다. 

스트림 API의 사용은 함수형 프로그래밍과 밀접한 관련이 있습니다. 람다 표현식과 함께 사용되어 가독성 높은 코드를 작성할 수 있습니다.
```

# 23. Java에서 JDBC란 무엇이며, 어떻게 사용하나요?
```
Java Database Connectivity (JDBC)는 자바 언어를 사용하여 데이터베이스와 연동하기 위한 API입니다. JDBC API를 사용하면 다양한 데이터베이스 관리 시스템(DBMS)과 자바 애플리케이션 간의 통신이 가능합니다.

JDBC API를 사용하여 데이터베이스와 연동하려면 다음과 같은 작업을 수행해야 합니다.

1. JDBC 드라이버 로드: 먼저 사용할 데이터베이스의 JDBC 드라이버를 로드합니다. 이를 위해 Class.forName() 메서드를 사용합니다.
2. 데이터베이스 연결: DriverManager.getConnection() 메서드를 사용하여 데이터베이스에 연결합니다.
3. SQL 문 실행: Statement, PreparedStatement 또는 CallableStatement 인터페이스를 사용하여 SQL 문을 실행합니다.
4. 결과 처리: SQL 문 실행 결과를 처리합니다. SELECT 문을 실행한 경우 ResultSet 인터페이스를 사용하여 결과를 처리합니다.
5. 연결 종료: 모든 작업이 완료된 후, 연결을 종료합니다. Connection, Statement 및 ResultSet 객체를 close() 메서드를 사용하여 명시적으로 닫아줘야 합니다.

JDBC API는 다양한 기능을 제공하며, 이를 활용하여 데이터베이스 연동에 필요한 다양한 작업을 수행할 수 있습니다. 예를 들어, PreparedStatement 인터페이스를 사용하여 SQL 문을 더 안전하게 실행하고, ResultSetMetaData 인터페이스를 사용하여 ResultSet 객체에서 데이터 타입 및 컬럼 정보를 가져올 수 있습니다.
```

# 24. Java에서 ORM(Object-Relational Mapping)이란 무엇이며, 어떻게 사용하나요?
```
ORM(Object-Relational Mapping)은 객체 지향 프로그래밍 언어에서 데이터베이스와의 상호 작용을 추상화하는 기술입니다. 이를 통해 개발자는 객체 지향 언어로 데이터베이스를 다룰 수 있습니다.

Java에서는 대표적인 ORM 프레임워크로 Hibernate, MyBatis, EclipseLink 등이 있습니다. 이러한 ORM 프레임워크를 사용하면 SQL 질의문을 작성하고 데이터베이스에 접근하는 것이 아닌, 객체 지향적인 방법으로 데이터베이스를 다룰 수 있습니다.

ORM 프레임워크는 객체와 데이터베이스 간의 매핑(mapping)을 제공합니다. 이를 위해 개발자는 데이터베이스 스키마를 객체 모델과 매핑할 수 있도록 매핑 규칙을 정의해야 합니다. 이러한 매핑 규칙을 통해 ORM 프레임워크는 개발자가 작성한 객체 모델을 기반으로 SQL 질의문을 자동으로 생성하고 데이터베이스에 접근합니다.

ORM 프레임워크는 일반적으로 데이터베이스와의 상호 작용을 위해 JDBC 드라이버를 사용합니다. 개발자는 데이터베이스 연결 정보를 설정하고, 매핑 규칙을 정의한 객체 모델을 ORM 프레임워크에 등록한 후, 해당 객체를 사용하여 데이터베이스와 상호 작용할 수 있습니다.
```

# 25. Jar 와  War의 차이점은 무엇인가요?
```
Java에서 jar 파일은 Java 클래스 파일, 리소스, 메타데이터, 라이브러리 등을 포함하는 패키지 파일입니다. 일반적으로 라이브러리나 애플리케이션의 실행 가능한 파일로 사용됩니다.

반면에, war 파일은 Java 웹 어플리케이션을 패키징하기 위한 파일입니다. war 파일은 jar 파일에 웹 어플리케이션을 실행하기 위한 추가적인 기능이 포함되어 있습니다. 예를 들어, 웹 어플리케이션의 웹 페이지, JSP 파일, HTML 파일, CSS 파일, JavaScript 파일, 이미지 파일 등과 같은 웹 어플리케이션과 관련된 모든 자원들이 포함됩니다. 

보통, jar 파일은 라이브러리 혹은 독립적인 애플리케이션의 실행 파일로 사용되며, war 파일은 웹 어플리케이션을 배포하고 실행하기 위한 파일로 사용됩니다.
```

# 26. Java8에서 인터페이스에 default 메소드를 추가한 이유는 무엇인가요?
```
Java 8에서 인터페이스에 디폴트 메소드(default method)가 도입된 이유는 두 가지가 있습니다.

첫째, 이전의 자바 버전에서 인터페이스는 구현이 불가능한 추상 메소드만을 가지고 있었습니다. 따라서 인터페이스를 구현하는 클래스에서는 모든 추상 메소드를 반드시 구현해야 했습니다. 이는 상속 관계에서 불필요한 코드 중복을 야기하고, 새로운 메소드를 추가하는 경우에 모든 클래스에서 해당 메소드를 구현해야 했기 때문에 유연성이 떨어졌습니다.
둘째, 인터페이스의 디폴트 메소드는 기존의 인터페이스를 수정하지 않고도 새로운 메소드를 추가할 수 있도록 합니다. 즉, 인터페이스를 구현하는 클래스에서는 해당 메소드를 구현하지 않아도 되며, 디폴트 구현을 그대로 사용할 수 있습니다. 이는 기존의 코드와의 호환성을 유지하면서도 새로운 기능을 추가할 수 있도록 하며, 유연성과 확장성을 높입니다.

따라서 인터페이스의 디폴트 메소드는 자바 8에서 인터페이스의 유연성과 확장성을 높이기 위해 도입되었습니다.

> ...(중략) ... 바로 "하위 호환성"때문이다. 예를 들어 설명하자면, 여러분들이 만약 오픈 소스코드를 만들었다고 가정하자. 그 오픈소스가 엄청 유명해져서 전 세계 사람들이 다 사용하고 있는데, 인터페이스에 새로운 메소드를 만들어야 하는 상황이 발생했다. 자칫 잘못하면 내가 만든 오픈소스를 사용한 사람들은 전부 오류가 발생하고 수정을 해야 하는 일이 발생할 수도 있다. 이럴 때 사용하는 것이 바로 default 메소드다. (자바의 신 2권)
```

# 27. Java8의 함수형 인터페이스란 무엇인가요?
```
Java에서 함수형 프로그래밍을 지원하기 위해 다양한 함수형 인터페이스를 제공합니다. 함수형 인터페이스는 하나의 추상 메서드만을 가지고 있는 인터페이스로, 람다식(lambda expression)을 사용하여 구현할 수 있습니다.

Java에서 제공하는 함수형 인터페이스의 종류는 다음과 같습니다.
1. `Runnable` : 매개변수와 반환값이 없는 작업을 수행합니다.
2. `Supplier` : 매개변수는 없고, 반환값이 있는 작업을 수행합니다.
3. `Consumer` : 매개변수는 있고, 반환값이 없는 작업을 수행합니다.
4. `Function` : 매개변수와 반환값이 모두 있는 작업을 수행합니다.
5. `Predicate` : 매개변수는 있고, boolean 값을 반환하는 작업을 수행합니다.
6. `UnaryOperator` : 하나의 매개변수와 반환값이 모두 같은 작업을 수행합니다.
7. `BinaryOperator` : 두 개의 매개변수와 반환값이 모두 같은 작업을 수행합니다.

이 외에도 다양한 함수형 인터페이스가 제공됩니다. 예를 들어, `BiFunction` 인터페이스는 두 개의 매개변수와 반환값이 있는 작업을 수행하는 인터페이스이며, `UnaryOperator`와 `BinaryOperator` 인터페이스를 상속받고 있습니다.

함수형 인터페이스를 사용하면 람다식을 이용하여 코드를 간결하게 작성할 수 있습니다. 예를 들어, 다음과 같이 `Consumer` 인터페이스를 사용하여 리스트의 요소를 출력하는 코드를 작성할 수 있습니다.

List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
Consumer<Integer> print = (Integer number) -> {
    System.out.print(number + " ");
};
numbers.forEach(print);

위의 코드에서는 `Consumer` 인터페이스를 사용하여 `print` 객체를 정의하였습니다. 이 객체는 람다식을 사용하여 정의된 함수를 저장하고 있습니다. `numbers.forEach(print)` 코드에서는 `numbers` 리스트의 모든 요소에 대해 `print` 객체의 함수를 호출하여 출력하는 작업을 수행합니다.
```