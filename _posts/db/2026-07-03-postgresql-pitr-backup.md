---
title       : "PostgreSQL PITR와 백업 전략 — WAL 아카이빙·pg_basebackup·시점 복구"
description : "pg_dump 논리 백업의 한계를 넘어, WAL 아카이빙과 pg_basebackup으로 PITR을 구성해 원하는 시점으로 복구하는 원리와 RPO/RTO 기준의 백업 전략 설계."
date        : 2026-07-03 17:00:00 +0900
updated     : 2026-07-03 17:00:00 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql, pitr, wal, backup]
pin         : false
hidden      : false
---

`pg_dump`로 매일 밤 백업을 뜬다고 해보자. 오후 3시에 누군가 `DELETE` 한 방으로 테이블을 날렸다면, 복구할 수 있는 최신 지점은 어젯밤이다. 그사이의 모든 변경은 사라진다. 이 격차를 메우는 것이 물리 백업과 PITR(Point-In-Time Recovery)이다. WAL을 계속 모아 두면 어젯밤 백업에서 출발해 오후 2시 59분 59초까지 되감을 수 있다. 이 글은 PostgreSQL 16/17 기준으로 그 원리와 절차를 다룬다.

## 1. 논리 백업 vs 물리 백업

`pg_dump`는 SQL 문(또는 아카이브 포맷)으로 데이터베이스 내용을 덤프하는 **논리 백업**이다. 반면 PITR은 데이터 디렉토리의 파일 자체를 복사하는 **물리 백업**을 기반으로 한다.

| 구분 | 논리 백업 (pg_dump) | 물리 백업 + PITR |
| --- | --- | --- |
| 대상 | SQL 재현 가능한 객체·데이터 | 데이터 디렉토리 파일 전체 |
| 복구 지점 | 덤프를 뜬 **그 시점**만 | 백업 이후 **임의 시점** |
| 이식성 | 다른 메이저 버전·플랫폼으로 이동 가능 | 동일 메이저 버전·아키텍처 필요 |
| 부분 복원 | 특정 테이블/스키마만 가능 | 클러스터 전체 단위 |
| 대용량 | 덤프·복원이 느림 | 파일 복사라 빠름 |
| 무중단성 | 스냅샷 일관성 확보에 부담 | 온라인 백업 + WAL로 연속 보호 |

> `pg_dump`의 한계는 "특정 시점의 스냅샷"이라는 점 그 자체다. 덤프 사이의 변경은 남지 않고, 수백 GB급에서는 덤프·복원 시간이 비현실적이다. PITR은 이 두 문제를 동시에 푼다.

두 방식은 대체재가 아니라 병행 대상이다. 논리 백업은 버전 이관·부분 복원·장기 보관에, 물리 백업+PITR은 재해 복구·짧은 RPO에 쓴다.

## 2. WAL — 모든 것의 기반

PostgreSQL은 데이터 파일을 바로 고치지 않는다. 변경을 먼저 **WAL(Write-Ahead Log)** 에 순차 기록하고, 데이터 파일 반영은 나중에 몰아서 한다. 크래시가 나도 WAL을 재생(replay)하면 커밋된 변경을 복구할 수 있다. 이것이 내구성(durability)의 핵심이다.

여기서 통찰이 나온다. **WAL은 데이터베이스에 일어난 모든 변경의 순차 기록**이다. 어떤 시점의 베이스 백업 하나와, 그 이후 생성된 WAL을 모두 가지고 있으면, 베이스 백업 위에 WAL을 원하는 지점까지 재생해 그 순간의 상태를 재구성할 수 있다.

- 베이스 백업 = 출발점(스냅샷)
- WAL 아카이브 = 출발점 이후의 모든 변경 로그

이 둘을 합친 것이 PITR이다. WAL은 16MB 단위 세그먼트 파일로 `pg_wal/` 디렉토리에 쌓이는데, 오래된 세그먼트는 재사용을 위해 곧 덮어써진다. 따라서 세그먼트가 사라지기 전에 **다른 곳으로 복사해 보관**해야 한다. 이것이 WAL 아카이빙이다.

## 3. WAL 아카이빙 설정

`postgresql.conf`에서 아카이빙을 켠다.

```ini
# postgresql.conf
wal_level = replica          # minimal 이면 안 됨 (replica 또는 그 이상)
archive_mode = on
archive_command = 'test ! -f /mnt/archive/%f && cp %p /mnt/archive/%f'
```

- `%p` : 아카이브할 WAL 파일의 경로(데이터 디렉토리 기준)
- `%f` : 파일명만
- `archive_command`는 **성공 시 종료 코드 0**, 실패 시 0이 아닌 값을 반환해야 한다. 위 명령의 `test ! -f ...`는 대상에 같은 파일이 이미 있으면 덮어쓰지 않게 막는 안전장치다.

PostgreSQL 15부터는 셸 명령 대신 C 모듈로 아카이빙하는 `archive_library`도 쓸 수 있다. `archive_command`와 `archive_library`는 **동시에 설정할 수 없다**.

```ini
archive_library = 'basic_archive'   # 예시. contrib 모듈 또는 서드파티 라이브러리
```

세그먼트가 다 차기 전이라도 일정 시간마다 강제로 아카이브를 돌리려면 `archive_timeout`을 준다. 유휴 DB에서 RPO를 확보하는 데 유용하다.

```ini
archive_timeout = 60         # 60초마다 세그먼트 전환 강제
```

> 아카이빙 관련 파라미터를 바꾼 뒤에는 서버 재시작(또는 최소 `reload`)이 필요하다. `wal_level`, `archive_mode` 변경은 재시작을 요구한다.

## 4. pg_basebackup — 베이스 백업 뜨기

베이스 백업은 실행 중인 서버에서 데이터 디렉토리 전체를 물리 복사한 것이다. `pg_basebackup`이 이 과정을 안전하게(백업 시작/종료 마킹까지) 처리한다.

```bash
pg_basebackup -h {host} -U {replication_user} \
  -D /backup/base \
  -Ft -z -Xs -P
```

- `-D` : 백업을 저장할 디렉토리
- `-Ft` : tar 포맷으로 출력 (`-Fp`는 데이터 디렉토리 그대로 펼침)
- `-z` : gzip 압축
- `-Xs` : 백업 중 생성된 WAL을 스트리밍으로 함께 받아 백업만으로도 일관성 있게 복구 가능하게 함
- `-P` : 진행률 표시

`pg_basebackup`을 쓰려면 접속 계정에 `REPLICATION` 권한이 있고, `pg_hba.conf`에서 replication 접속이 허용돼야 한다.

PostgreSQL 17부터는 **증분 베이스 백업**도 지원한다. 직전 백업의 매니페스트를 기준으로 바뀐 블록만 뜨고, 복구 시 `pg_combinebackup`으로 합친다. 대용량에서 백업 용량·시간을 크게 줄인다.

```bash
# PostgreSQL 17+
pg_basebackup -D /backup/incr1 -i /backup/base/backup_manifest -Ft -z -Xs
```

## 5. PITR 복구 흐름

시나리오: 오후 3시에 `DELETE`로 데이터를 날렸다. 오후 2시 59분 상태로 되돌린다.

**1) 서버 정지 후 현재 데이터 디렉토리 보존**

```bash
pg_ctl stop -D /var/lib/postgresql/data
# 만일을 대비해 현재 데이터 디렉토리를 통째로 다른 곳에 복사해 둔다
```

**2) 데이터 디렉토리를 비우고 베이스 백업 복원**

```bash
# 데이터 디렉토리와 테이블스페이스를 비운 뒤 베이스 백업을 풀어 넣는다
rm -rf /var/lib/postgresql/data/*
tar -xzf /backup/base/base.tar.gz -C /var/lib/postgresql/data
# pg_wal/ 안의 오래된 세그먼트는 비우고, 아직 아카이브되지 않은 세그먼트가 있으면 넣는다
```

**3) 복구 파라미터 설정 (`postgresql.conf`)**

과거 버전의 `recovery.conf`는 **PostgreSQL 12에서 폐지됐다.** 이제 복구 파라미터는 `postgresql.conf`에 직접 쓴다.

```ini
# postgresql.conf
restore_command = 'cp /mnt/archive/%f %p'
recovery_target_time = '2026-07-03 14:59:00+09'
recovery_target_action = 'promote'
```

- `restore_command` : 아카이브에서 WAL 세그먼트를 가져오는 명령 (`archive_command`의 역방향)
- `recovery_target_time` : 이 시점까지 WAL을 재생하고 멈춘다
- `recovery_target_action` : 목표 도달 후 동작. `promote`는 정상 서비스로 승격, `pause`는 멈춰서 결과를 확인 후 수동 승격

시점 대신 다른 기준으로도 목표를 지정할 수 있다.

| 파라미터 | 목표 기준 |
| --- | --- |
| `recovery_target_time` | 특정 타임스탬프 |
| `recovery_target_lsn` | 특정 WAL 위치(LSN) |
| `recovery_target_name` | `pg_create_restore_point()`로 찍어 둔 이름 |
| `recovery_target_xid` | 특정 트랜잭션 ID |
| `recovery_target = 'immediate'` | 백업 일관성 확보 즉시 |

**4) `recovery.signal` 생성 후 기동**

```bash
touch /var/lib/postgresql/data/recovery.signal
pg_ctl start -D /var/lib/postgresql/data
```

`recovery.signal` 파일이 있으면 서버는 아카이브 복구 모드로 뜬다. 베이스 백업 이후의 WAL을 `restore_command`로 하나씩 가져와 목표 시점까지 재생한다. 복구가 끝나 승격되면 `recovery.signal`은 자동으로 제거된다.

> 되감기는 되감기다. 목표 시점 이후의 데이터는 사라진다. `pause`로 멈춰 상태를 검증한 뒤 승격하고, 승격 전에 반드시 새 베이스 백업을 확보한다. 승격은 새 타임라인을 만든다.

## 6. 백업 전략 설계 — RPO/RTO

도구를 안다고 전략이 서는 건 아니다. 두 지표에서 출발한다.

- **RPO(Recovery Point Objective)** — 얼마만큼의 데이터 손실을 감내하는가. "최대 5분 치까지 잃어도 된다." WAL 아카이빙 주기(`archive_timeout`)와 직결된다.
- **RTO(Recovery Time Objective)** — 얼마 안에 복구를 끝내야 하는가. "30분 안에 서비스 재개." 베이스 백업 주기·크기, WAL 재생량이 좌우한다. 베이스 백업이 오래됐을수록 재생할 WAL이 많아 RTO가 길어진다.

이 둘로부터 실무 원칙이 나온다.

- **논리+물리 병행** — 물리 백업+PITR로 짧은 RPO/RTO를, 논리 백업(`pg_dump`)으로 버전 이관·부분 복원·장기 보관을 커버한다.
- **주기와 보존** — 베이스 백업 주기를 RTO에 맞춰 잡고(예: 주 1회 풀 + 매일 증분), WAL·백업 보존 기간을 규정에 맞게 정한다. 오래된 아카이브 정리 정책도 함께.
- **복구 리허설** — 검증하지 않은 백업은 백업이 아니다. 정기적으로 실제 복구를 돌려 절차·소요 시간·무결성을 확인한다. RTO 추정치는 리허설로만 신뢰할 수 있는 수치가 된다.
- **아카이브 위치 분리** — WAL 아카이브와 베이스 백업은 원본 스토리지·호스트와 물리적으로 분리한다. 같은 디스크에 두면 재해 시 함께 사라진다.

## 7. 외부 도구 — pgBackRest, Barman

지금까지의 절차는 원리 이해에는 좋지만, 운영에서 매번 손으로 하기엔 번거롭고 실수가 잦다. 실무에서는 전용 도구로 자동화한다.

- **pgBackRest** — 병렬 백업/복원, 증분·차등 백업, 압축·암호화, 보존 정책, S3 등 오브젝트 스토리지 연동을 갖춘 사실상의 표준. WAL 아카이빙과 복구를 커맨드 한 줄로 오케스트레이션한다.
- **Barman(Backup and Recovery Manager)** — EnterpriseDB가 관리하는 도구로, 여러 PostgreSQL 서버의 백업을 중앙에서 관리·모니터링하는 데 강하다.

> 학습·소규모에서는 `pg_basebackup` + `archive_command` 조합으로 충분하다. 다만 복수 서버·엄격한 RPO/RTO·오브젝트 스토리지가 얽히면 pgBackRest 도입이 정공법이다.

## 관련 글

| 글 | 관계 |
| --- | --- |
| [PostgreSQL pg_dump, pg_restore 사용법](/posts/db/2025-01-14-postgresql-pgdump/) | 논리 백업 — 이 글이 넘어서는 출발점 |
| [PostgreSQL 복제와 고가용성](/posts/db/2026-07-03-postgresql-replication-ha/) | 같은 WAL을 실시간 복제에 쓰는 법 |
