---
layout  : wiki
title   : SVM - Support Vector Machine
summary : 
date    : 2022-11-04 08:25:56 +0900
updated : 2022-11-04 08:26:50 +0900
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

df = pd.read_csv("https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv")

#1 outlier
d_mean = df['Age'].mean()
df['Age'].fillna(d_mean, inplace=True)

d_mode = df['Embarked'].mode()[0]
df['Embarked'].fillna(d_mode, inplace=True)

df['FamilySize'] = df['SibSp'] + df['Parch']


#2 encoding
onehot_sex = pd.get_dummies(df['Sex'])
df = pd.concat([df, onehot_sex], axis = 1)

onehot_embarked = pd.get_dummies(df['Embarked'])
df = pd.concat([df, onehot_embarked], axis = 1)


#3 data setting
from sklearn.model_selection import train_test_split
X = df[['Pclass', 'Age', 'Fare', 'FamilySize', 'female', 'male', 'C', 'Q', 'S']]
y = df['Survived']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.3, random_state = 10)


#4 model fitting
from sklearn import svm

sv = svm.SVC(kernel = 'rbf')
sv.fit(X_train, y_train)


#5 validation
pred = sv.predict(X_test)

from sklearn.metrics import accuracy_score
acc = accuracy_score(y_test, pred)
print(acc)

from sklearn.metrics import confusion_matrix
mat = confusion_matrix(y_test, pred)
print(mat)

from sklearn.metrics import classification_report
rpt = classification_report(y_test, pred)
print(rpt)
```
