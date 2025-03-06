---
title       : Window 운영체제에서 실시간 로깅 (ex. tail -f) 하는 법
description : >-
date        : 2025-02-24 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, windows]
tags        : [windows, tail]
pin         : false
hidden      : false
---

- Window 운영체제에서는 Powershell을 이용하여 실시간 로깅을 할 수 있습니다.
- `Get-Content` 명령어를 이용하여 파일의 내용을 읽어오고 `-Wait` 옵션을 이용하여 실시간으로 파일의 변화를 감지할 수 있습니다.
```powershell
Get-Content "C:\path\to\file.log" -Wait -Tail 10  # 파일의 끝에서 10줄을 읽어옵니다.
```

- Get-Content 를 gc로 줄여서 사용할 수 있습니다.
```powershell
gc "C:\path\to\file.log" -Wait -Tail 10  # 파일의 끝에서 10줄을 읽어옵니다.
```

## Get-Content 명령어 옵션
- `-Wait` : 파일의 변화를 실시간으로 감지합니다.
- `-Tail` : 파일의 끝에서 몇 줄을 읽어옵니다.
- `-Head` : 파일의 시작에서 몇 줄을 읽어옵니다.
- `-TotalCount` : 파일의 전체 줄 수를 읽어옵니다.
- `-Encoding` : 파일의 인코딩을 지정합니다.
- `-Delimiter` : 파일의 구분자를 지정합니다.
- `-Raw` : 파일의 텍스트를 가공하지 않고 그대로 출력합니다.
- `-ReadCount` : 한 번에 읽어올 줄 수를 지정합니다.
- `-First` : 파일의 처음부터 읽어올 줄 수를 지정합니다.
- `-Last` : 파일의 끝부터 읽어올 줄 수를 지정합니다.