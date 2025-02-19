---
layout  : wiki
title   : KNN  (K-Nearest Neighbors)
summary : 
date    : 2022-11-04 08:28:18 +0900
updated : 2022-11-04 08:31:58 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}


```python
import pandas as pd
import sklearn

df = pd.read_csv("https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv")


# 1. outlier


# 2. encoding
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
df[['sepal_length']] = scaler.fit_transform(df[['sepal_length']])
df[['sepal_width']] = scaler.fit_transform(df[['sepal_width']])
df[['petal_length']] = scaler.fit_transform(df[['petal_length']])
df[['petal_width']] = scaler.fit_transform(df[['petal_width']])


# 3. data setting
from sklearn.model_selection import train_test_split
X = df[['sepal_length','sepal_width', 'petal_length', 'petal_width']]
y = df['species']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state = 11)


# 4. fitting model
from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(n_neighbors = 3)
knn.fit(X_train, y_train)


# 5. validation
from sklearn.metrics import accuracy_score
pred = knn.predict(X_test)
accuracy_score(y_test, pred)
```
