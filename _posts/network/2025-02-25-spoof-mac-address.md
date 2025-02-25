---
title       : 맥 os에서 nic 고유 주소(mac address) 변조
description :
date        : 2024-05-23 08:41:19 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, network]
tags        : [network, mac address, mac os]
pin         : false
hidden      : false
---

# mac address 변조
- 보안 망에서 mac address로 사용자를 식별하여 네트워크 접근을 제어하는 경우가 있습니다. 이때 mac address를 변조하여 사용자를 식별하는 것을 회피할 수 있습니다.
- 변경한 mac address는 재부팅하면 원래의 mac address로 복구됩니다.
- 보안상의 이유로 특정 버전이상의 맥 운영체제에서는 en0, en1 등의 네트워크 인터페이스를 변경할 수 없습니다.
> nic (Network Interface Card): 네트워크 인터페이스 카드, 네트워크 장치와 컴퓨터를 연결할 수 있게 해주는 하드웨어 장치
> mac address: 네트워크 카드의 물리적 주소로, 고유한 값으로 제조사에 의해 할당됨.

# terminal 을 이용한 mac 주소 변조
1. SIP(Security Integrity Protection) 비활성화를 위해 리커버리 모드로 진입합니다.
- sip를 비활성화 하지 않으면 mac 주소를 변조할 수 없습니다.
- 보안을 위해 SIP를 비활성화하는 것은 권장하지 않습니다. 때문에, SIP를 비활성화한 후에는 다시 활성화해야 합니다.
> 맥북: cmd + R, 맥미니: 전원버튼을 계속 누르면서 부팅

2. 터미널을 열고 다음 명령어를 입력합니다.
```bash
csrutil disable  # SIP 비활성화 <-> csrutil enable (SIP 활성화)
```

3. pc를 재부팅합니다.

4. 터미널을 열고 네트워크가 연결된 인터페이스를 확인합니다.
> mac os -> en0: 유선 네트워크, en1: 무선 네트워크, en2: 블루투스, en3: 기타
> linux os -> eth0: 유선 네트워크, wlan0: 무선 네트워크
> windows os -> Ethernet: 유선 네트워크, Wi-Fi: 무선 네트워크
```bash
ifconfig -a
```

5. 네트워크 인터페이스의 mac 주소를 변조합니다.
```bash
sudo ifconfig en1 ether 00:11:22:33:44:55
```

6. 네트워크를 재시작합니다.
```bash
sudo ifconfig en1 down
sudo ifconfig en1 up
```

# spoof mac을 이용한 mac 주소 변조

1. spoof mac을 설치합니다.
```bash
brew install spoof-mac
```

2. 네트워크 인터페이스의 mac 주소를 변조합니다.
```bash
sudo spoof-mac randomize en1
sudo spoof-mac set en1 00:11:22:33:44:55
```

3. 네트워크를 재시작합니다.
```bash
sudo ifconfig en1 down
sudo ifconfig en1 up
```

## mac 주소 복구
```bash
sudo spoof-mac reset en1
```