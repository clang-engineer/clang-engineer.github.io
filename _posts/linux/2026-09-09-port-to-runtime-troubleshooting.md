---
title       : "포트 번호 하나로 죽은 DB의 실행 경로 역추적하기"
description : "DB 접속 포트만 아는 상태에서 방화벽, LISTEN, 설정, systemd, Docker/Podman, shell history, volume까지 따라가 실행 구조를 복원하는 장애 대응 흐름"
date        : 2026-09-09 09:00:00 +0900
updated     : 2026-09-09 09:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [troubleshooting, port, podman, systemd, database, vertica]
pin         : false
hidden      : false
---

DB 접속 장애가 발생했는데 알고 있는 정보가 **"이 서버의 특정 포트로 DB에 접속했었다"** 정도뿐이라면 어디서부터 찾아야 할까?

실행 방식을 알고 있다면 간단하다. systemd 서비스라면 `systemctl`, Docker라면 `docker ps`, Podman이라면 `podman ps`를 보면 된다. 문제는 그것조차 모르는 경우다.

이번에는 포트 번호 하나에서 출발해 서비스 종류, 실행 주체, 컨테이너 런타임, 데이터 볼륨까지 역추적했다. 핵심은 특정 제품의 복구 명령이 아니라 **현재 확인할 수 있는 사실에서 다음 질문을 만드는 순서**다.

---

## 1. 방화벽과 LISTEN은 별개의 문제다

먼저 외부 접속이 안 된다고 해서 바로 방화벽 문제라고 판단하면 안 된다.

```bash
sudo firewall-cmd --query-port=<PORT>/tcp
```

방화벽에서 포트가 허용되어 있다면 실제로 해당 포트를 LISTEN하는 프로세스가 있는지 확인한다.

```bash
sudo ss -lntp | grep ':<PORT>'
```

예를 들어 다음과 같은 상태라면 방화벽이 원인이 아니다.

```text
방화벽       OPEN
프로세스     LISTEN 없음
```

방화벽은 패킷이 들어오는 것을 허용할 뿐이다. 해당 포트를 받아줄 프로세스가 없다면 접속할 수 없다.

---

## 2. 죽은 프로세스는 `ss`로 찾을 수 없다

프로세스가 살아 있다면 다음 명령으로 실행 주체를 바로 찾을 수 있다.

```bash
ss -lntp
lsof -iTCP:<PORT> -sTCP:LISTEN
```

하지만 프로세스가 이미 죽었다면 소켓도 사라진다. 이때부터는 **현재 상태가 아니라 남아 있는 흔적을 역추적**해야 한다.

가장 먼저 포트 번호가 설정 파일에 남아 있는지 검색했다.

```bash
sudo grep -Rni "<PORT>" \
  /etc /opt /usr/local /home /root 2>/dev/null
```

애플리케이션의 JDBC 설정이 발견되면서 해당 포트가 Vertica 접속에 사용됐다는 사실을 알 수 있었다.

```text
jdbc:vertica://127.0.0.1:<PORT>/<DATABASE>
```

이제 질문은 "이 포트가 무엇인가?"에서 **"이 서버에서 Vertica는 어떻게 실행되고 있었는가?"**로 바뀐다.

---

## 3. 실행 방식을 하나씩 제거한다

먼저 일반적인 systemd 서비스인지 확인한다.

```bash
systemctl list-units --all --type=service \
  | grep -Ei 'vertica|database|db'
```

서비스가 없다면 호스트에 Vertica가 직접 설치되어 있는지도 확인한다.

```bash
sudo find /opt /usr/local /usr -type f \
  \( -name 'vertica' -o -name 'admintools' -o -name 'vsql' \) \
  2>/dev/null
```

둘 다 없다면 컨테이너 환경을 의심할 수 있다.

```bash
docker ps
docker ps -a
```

실행 중인 컨테이너뿐 아니라 종료된 컨테이너도 봐야 한다. 그래도 찾지 못한다면 포트 번호를 기준으로 Docker metadata를 검색할 수 있다.

```bash
for c in $(docker ps -aq); do
  docker inspect "$c" 2>/dev/null \
    | grep -q '"<PORT>"' \
    && echo "FOUND: $c"
done
```

여기까지 아무것도 없다면 현재 시스템 정보만으로는 실행 주체가 남아 있지 않을 수 있다.

---

## 4. 현재 흔적이 없다면 shell history를 본다

이럴 때 shell history가 의외로 강한 단서가 된다. root만 보지 말고 다른 사용자도 확인한다.

```bash
grep -Ei '<PORT>|vertica' /root/.bash_history

grep -RniE '<PORT>|vertica' \
  /home/*/.bash_history 2>/dev/null
```

실제 사례에서는 여기서 과거 `podman run` 명령을 발견했다.

```bash
podman run -d \
  --name <CONTAINER> \
  -p <HOST_PORT>:5433 \
  -v <HOST_PATH>:<CONTAINER_PATH>:Z \
  <VERTICA_IMAGE>
```

즉 Docker가 아니라 **rootless Podman**으로 실행되고 있었다.

```text
Client
   │
   │ HOST_PORT
   ▼
Linux Host
   │
   │ Podman port publish
   ▼
Vertica Container :5433
   │
   ▼
Vertica DB
```

`docker ps`만 반복해서 봤다면 찾을 수 없는 구조였다.

---

## 5. rootless Podman은 실행 사용자 기준으로 조회한다

rootless Podman은 root의 컨테이너 저장소와 별개다. 따라서 실제 실행 사용자 기준으로 조회해야 한다.

```bash
sudo -iu <USER> podman ps -a
sudo -iu <USER> podman images
sudo -iu <USER> podman volume ls
```

컨테이너는 이미 삭제되어 있었지만 이미지와 user systemd unit은 남아 있었다.

```bash
cat ~/.config/systemd/user/container-<NAME>.service
```

unit의 핵심이 다음과 같다고 하자.

```ini
ExecStart=/usr/bin/podman start <CONTAINER>
ExecStop=/usr/bin/podman stop <CONTAINER>
```

이 경우 systemd unit이 정상이어도 시작할 컨테이너 자체가 삭제됐다면 서비스는 복구되지 않는다. **서비스 정의와 실행 대상은 별개의 상태**다.

rootless user service를 부팅 후에도 유지하는 구성이라면 `loginctl show-user <USER>`에서 `Linger=yes` 여부도 함께 확인할 수 있다.

---

## 6. bind mount가 있다고 그곳에 DB 데이터가 있다는 뜻은 아니다

기존 실행 명령에는 호스트 디렉터리 bind mount가 있었지만 해당 디렉터리는 비어 있었다. 처음에는 데이터가 삭제된 것으로 생각하기 쉽다.

하지만 컨테이너 이미지의 실제 데이터 경로를 확인해야 한다.

```bash
sudo -iu <USER> podman image inspect <IMAGE>
```

이미지 설정에서 다음과 같은 정보를 확인할 수 있다.

```text
VERTICADATA=<ACTUAL_DATA_PATH>
VOLUME=<ACTUAL_DATA_PATH>
```

기존 `podman run`의 bind mount 목적지가 이 경로와 다르다면 Vertica는 그 bind mount를 데이터 저장소로 사용하지 않는다. 이미지가 선언한 `VOLUME` 때문에 별도의 anonymous volume이 생성될 수 있다.

```text
잘못 이해한 구조

Host directory
      │
      ▼
Container /some/path
      │
      X
Vertica가 사용하지 않음

실제 구조

Podman anonymous volume
      │
      ▼
Container <ACTUAL_DATA_PATH>
      │
      ▼
Vertica catalog / data
```

따라서 컨테이너의 mount 옵션만 보는 것이 아니라 **이미지가 실제로 어느 디렉터리를 데이터 경로로 사용하는지** 확인해야 한다.

---

## 7. 컨테이너가 삭제되어도 volume은 남을 수 있다

```bash
sudo -iu <USER> podman volume ls
```

각 볼륨의 실제 위치와 생성 시각은 `inspect`로 확인한다.

```bash
sudo -iu <USER> podman volume inspect <VOLUME>
```

크기도 좋은 단서가 된다.

```bash
du -sh ~/.local/share/containers/storage/volumes/* 2>/dev/null
```

큰 anonymous volume을 조사했을 때 다음과 같은 구조가 발견된다면 Vertica 데이터일 가능성이 높다.

```text
catalog/
  <database>/
    v_<database>_node0001_catalog/

data/
  <database>/
    v_<database>_node0001_data/
```

즉 컨테이너는 사라졌지만 DB 데이터는 별도 volume에 남아 있을 수 있다.

---

## 8. 복구할 때는 실제 데이터 경로에 연결한다

기존 데이터를 복구해야 한다면 찾은 volume을 이미지가 실제 사용하는 데이터 경로에 연결한다.

```bash
sudo -iu <USER> podman run -d \
  --name <CONTAINER> \
  -p <HOST_PORT>:5433 \
  -v <VOLUME>:<ACTUAL_DATA_PATH> \
  <VERTICA_IMAGE>
```

반대로 새 DB를 만들 목적이라면 anonymous volume 대신 호스트 경로를 명시적으로 관리하는 방법이 추후 운영에 더 명확하다.

```bash
mkdir -p <HOST_DATA_PATH>
chown <USER>:<USER> <HOST_DATA_PATH>

sudo -iu <USER> podman run -d \
  --name <CONTAINER> \
  -p <HOST_PORT>:5433 \
  -v <HOST_DATA_PATH>:<ACTUAL_DATA_PATH>:Z \
  <VERTICA_IMAGE>
```

이렇게 하면 다음 장애에서 "DB 데이터가 어디 있는가?"를 다시 추적할 필요가 줄어든다.

---

## 9. 컨테이너가 UP이라고 DB까지 정상인 것은 아니다

복구 후에는 계층별로 확인한다.

```bash
# 컨테이너
sudo -iu <USER> podman ps

# 호스트 포트
ss -lntp | grep ':<HOST_PORT>'

# Vertica 노드
sudo -iu <USER> podman exec --user dbadmin <CONTAINER> \
  /opt/vertica/bin/admintools -t view_cluster
```

정상이라면 Vertica 노드가 `UP`으로 표시된다.

```text
DB        Host   State
<DB>      ALL    UP
```

컨테이너 상태, 호스트 포트, DB 프로세스는 서로 다른 계층이므로 각각 확인하는 편이 좋다.

---

## 10. DB가 살아난 뒤에도 장애는 끝나지 않을 수 있다

DB를 복구한 뒤 이번에는 신규 세션이 거부되는 문제가 발생했다.

```text
New session rejected due to limit
```

DB 자체는 `UP`인데 신규 접속을 받을 수 없는 상태였다. 호스트에서 연결을 조사했다.

```bash
ss -ntp | grep ':<HOST_PORT>'
```

특정 Java 프로세스가 대량의 connection을 가지고 있었다.

```bash
ps -fp <PID>
```

해당 애플리케이션을 중지하자 DB 세션 수가 즉시 정상 수준으로 감소했다. 이후 애플리케이션 jar의 설정을 조사해 HikariCP connection pool 설정까지 역추적할 수 있었다.

여기서 중요한 것은 **DB 프로세스가 정상이라고 DB 서비스 전체가 정상인 것은 아니라는 점**이다. DB 세션, connection pool, 클라이언트 상태까지 이어서 확인해야 한다.

---

## 11. 마지막 검증: 정말 내가 작업한 DB를 보고 있는가?

이번 과정에서 의외로 시간을 잡아먹은 부분이 하나 더 있었다.

DB를 초기화했는데도 기존 테이블이 계속 보였다. 볼륨을 확인하고 mount를 확인하고 DB를 다시 생성했는데도 결과가 이상했다.

원인은 단순했다.

**다른 DB 인스턴스를 조회하고 있었다.**

트러블슈팅 과정이 길어질수록 "내가 지금 보고 있는 대상이 처음에 생각했던 대상과 같은가?"라는 가장 기본적인 전제를 놓치기 쉽다.

따라서 복구나 초기화 검증 전에는 최소한 다음을 다시 확인한다.

```text
Host
Port
Database
Schema
Container
```

데이터가 예상과 다르다면 데이터를 다시 지우기 전에 **접속 대상을 먼저 검증한다.**

---

## 전체 추적 흐름

이번 장애의 추적 과정을 압축하면 다음과 같다.

```text
포트 접속 실패
     ↓
방화벽 확인
     ↓
LISTEN 없음
     ↓
포트 번호로 설정 검색
     ↓
DB 종류 식별
     ↓
systemd / 호스트 설치 확인
     ↓
Docker 확인
     ↓
현재 실행 정보에서 발견 못함
     ↓
shell history 검색
     ↓
rootless Podman 발견
     ↓
user systemd 확인
     ↓
컨테이너 삭제 상태 확인
     ↓
image inspect
     ↓
실제 데이터 경로 확인
     ↓
anonymous volume 추적
     ↓
DB 복구
     ↓
세션 고갈 발견
     ↓
클라이언트 프로세스 추적
     ↓
connection pool 설정 확인
     ↓
접속 대상까지 최종 검증
```

특정 명령어를 외우는 것보다 중요한 것은 **현재 확인할 수 있는 사실에서 다음 질문을 만드는 것**이었다.

프로세스가 없다면 설정을 찾고, 설정에서 서비스 종류를 알아냈다면 실행 방식을 찾고, 현재 실행 정보가 없다면 과거 흔적을 찾는다. 복구가 끝났다고 생각했을 때도 한 번 더 확인한다.

**지금 내가 보고 있는 대상이 정말 내가 복구한 그 대상인가?**
