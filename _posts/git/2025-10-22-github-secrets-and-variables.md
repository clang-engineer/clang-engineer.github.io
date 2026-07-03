---
title       : "GitHub Actions Secrets & Variables 설정 가이드"
description : "GitHub Actions의 Secrets와 Variables 차이, 적용 범위(Repository/Environment/Organization), 그리고 환경별 분리 예시"
date        : 2025-10-22 12:54:06 +0900
updated     : 2025-10-22 12:57:47 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github]
pin         : false
hidden      : false
---

## 개요

GitHub Actions에서 서버 배포나 CI/CD를 구성할 때는
**Secrets**와 **Variables**를 통해 민감 정보와 환경 설정 값을 안전하게 관리할 수 있습니다.
이 문서는 그 차이와 사용 위치를 명확히 정리합니다.

---

## 1. GitHub Secrets의 종류

| 구분                       | 설명                                  | 적용 범위     | 설정 경로                                                                              |
| ------------------------ | ----------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| **Repository secrets**   | 특정 저장소에서만 사용 가능                     | 단일 저장소    | `Settings > Secrets and variables > Actions > Repository secrets`                  |
| **Environment secrets**  | 같은 저장소 내에서도 환경별(dev, prod 등)로 구분 가능 | 저장소 내 환경별 | `Settings > Environments > [환경 이름] > Environment secrets`                          |
| **Organization secrets** | 조직 내 여러 저장소에서 공통 사용 가능              | 조직 전체     | `Organization > Settings > Secrets and variables > Actions > Organization secrets` |

### 사용 가이드

| 상황             | 추천 Secret 종류         | 이유           |
| -------------- | -------------------- | ------------ |
| 단일 프로젝트 배포     | Repository secrets   | 단순하고 빠름      |
| 개발/운영 환경 분리 배포 | Environment secrets  | 환경별 접근 제어 가능 |
| 여러 저장소 공통 키 사용 | Organization secrets | 중앙 관리에 용이    |

---

## 2. Environment secrets 설정 예시

**예시: 개발(Development) / 운영(Production) 환경 분리**

1. 저장소 이동 → `Settings > Environments`
2. 두 개 환경 생성

   * `development`
   * `production`
3. 각 환경에 Secrets 추가

### 개발 서버 (Development)

| Key                  | 설명                      | 예시               |
| -------------------- | ----------------------- | ---------------- |
| `DEV_SERVER_HOST`    | 개발 서버 IP                | `203.0.113.20`   |
| `DEV_SERVER_USER`    | SSH 사용자명                | `deployer`       |
| `DEV_SERVER_SSH_KEY` | SSH Private Key (개행 포함) | *(비공개 키 입력)*     |
| `DEV_SERVER_PORT`    | SSH 포트                  | `2222`           |
| `DEV_SERVER_PATH`    | 배포 경로                   | `/home/deployer` |

### 운영 서버 (Production)

| Key                   | 설명                      | 예시                 |
| --------------------- | ----------------------- | ------------------ |
| `PROD_SERVER_HOST`    | 운영 서버 IP                | `203.0.113.20`     |
| `PROD_SERVER_USER`    | SSH 사용자명                | `deployer`         |
| `PROD_SERVER_SSH_KEY` | SSH Private Key (개행 포함) | *(비공개 키 입력)*       |
| `PROD_SERVER_PORT`    | SSH 포트                  | `2223`             |
| `PROD_SERVER_PATH`    | 배포 경로                   | `/home/deployer`   |
| `PROD_SERVER_URL`     | Health Check URL (선택)   | `https://example.com` |

---

## 3. 중요 사항

* 배포 사용자(`deployer`)는 다음 명령을 비밀번호 없이 실행할 수 있어야 합니다:

  ```bash
  sudo systemctl restart myapp
  ```

* SSH 접속 전, 서버 ACG(Security Group)에서
  **GitHub Actions의 아웃바운드 IP**를 허용해야 합니다.
  (GitHub Actions IP는 고정되지 않으므로, 필요 시 Bastion Host나 VPN 사용 권장)

---

## 4. Secrets vs Variables

| 구분             | **Secrets**               | **Variables**          |
| -------------- | ------------------------- | ---------------------- |
| **보안성**     | 암호화 저장 (Encrypted)        | 평문 저장 (Not encrypted)  |
| **로그 노출**  | 자동 마스킹(`***`) 처리          | 그대로 출력될 수 있음           |
| **용도**      | 비밀번호, 토큰, SSH 키 등 민감 정보   | 일반 설정 값, 경로, 포트 등      |
| **값 확인**    | 저장 후 값 확인 불가              | 언제든 확인 및 수정 가능         |
| **워크플로 접근** | `${{ secrets.KEY_NAME }}` | `${{ vars.KEY_NAME }}` |

---

## 5. 사용 예시

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          echo "Deploying to ${{ vars.SERVER_ENV }}..."
          ssh -i ${{ secrets.SSH_PRIVATE_KEY }} \
              ${{ vars.SERVER_USER }}@${{ vars.SERVER_HOST }} \
              -p ${{ vars.SERVER_PORT }}
```

* `secrets.SSH_PRIVATE_KEY` → 민감 정보
* `vars.SERVER_PORT`, `vars.SERVER_USER` → 일반 설정 값

---

## 6. 실무 팁

**Secrets**

* 민감한 정보 (API Key, Token, SSH Key 등)
* GitHub 로그에서 자동 마스킹
* 저장 후 값 확인 불가

**Variables**

* 설정 값 (환경 이름, 경로, 포트, 버전 등)
* 여러 워크플로에서 공유 가능
* 디버깅 시 유용

---

### 결론

> * **Secrets** → 보안을 위한 민감 정보 저장소
> * **Variables** → 일반 설정 값 관리용
> * **Environment secrets** → 환경별 분리 관리 시 최적
