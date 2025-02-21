---
layout  : wiki
title   : 문자열 구분자로 분리하기
summary : 
date    : 2024-10-07 15:36:25 +0900
updated : 2024-10-18 09:23:21 +0900
tags    : 
toc     : true
public  : true
parent  : [[cpp/index]]
latex   : false
---
* TOC
{:toc}

# string class만 사용해서 구분자로 문자열 분리하기

```cpp
#include <vector>
#include <string>

using namespace std;

vector<string> split(string input, string delimiter) 
{
    vector<string> vec;

  	int pos = 0;
    string token = "";

    while ((pos = input.find(delimiter)) != string::npos)
  	{
  		token = input.substr(0, pos);
  		vec.push_back(token);
        input.erase(0, pos + delimiter.length());
    }

  	vec.push_back(input);

    return vec;
}
```

# string stream을 사용해서 구분자로 문자열 분리하기

```cpp
#include <vector>
#include <string>
#include <sstream>

using namespace std;

vector<string> split(const string& str, char delimiter) 
{
    vector<string> vec;

    string token;
    stringstream ss(str);

    while (getline(ss, token, delimiter)) 
  	{
        vec.push_back(token);
    }

    return vec;
}
```