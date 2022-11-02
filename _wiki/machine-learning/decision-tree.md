---
layout  : wiki
title   : Decision Tree (의사 결정 나무)
summary : 
date    : 2022-11-03 08:28:20 +0900
updated : 2022-11-03 08:33:07 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}

# Decision Tree (의사 결정 나무)

- titinic 생존자 예측
- 
```python
import pandas as pd
import sklearn

# read data
df = pd.read_csv("https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv")


# replace outlier
d_mean = df['Age'].mean()
df['Age'].fillna(d_mean, inplace = True)

d_mode = df['Embarked'].mode()[0]
df['Embarked'].fillna(d_mode, inplace = True)


# encoding variable
from sklearn.preprocessing import LabelEncoder
df['Sex'] = LabelEncoder().fit_transform(df['Sex'])
df['Embarked'] = LabelEncoder().fit_transform(df['Embarked'])

df['FamilySize'] = df["SibSp"] + df['Parch']


# ready data set
from sklearn.model_selection import train_test_split
X = df[["Pclass", "Sex", "Age", "Fare", "Embarked", "FamilySize"]]
y = df["Survived"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state = 11)


# fit model
from sklearn.tree import DecisionTreeClassifier
dt = DecisionTreeClassifier(random_state = 11)
dt.fit(X_train, y_train)


# validation
from sklearn.metrics import accuracy_score
pred = dt.predict(X_test)
acc = accuracy_score(y_test, pred)
print(acc)
```


- iris 분류
 
```python
import pandas as pd
import sklearn


# read data
df = pd.read_csv("https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv")


# encoding variable
df['species'].replace({'setosa': 0, 'versicolor': 1, 'virginica': 2}, inplace = True)


# ready data set
from sklearn.model_selection import train_test_split

X = df[['sepal_length', 'sepal_width', 'petal_length', 'petal_width']]
y = df['species']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state = 11)


# fit model
from sklearn.tree import DecisionTreeClassifier
dt = DecisionTreeClassifier(random_state = 11)

dt.fit(X_train, y_train)


# validation
from sklearn.metrics import accuracy_score
pred = dt.predict(X_test)
acc = accuracy_score(y_test, pred)
print(acc)
```
