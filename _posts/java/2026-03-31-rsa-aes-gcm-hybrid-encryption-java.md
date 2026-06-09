---
title       : "Java에서 RSA + AES-GCM 하이브리드 암호화 구현"
description : "RSA 공개키로 AES 세션키를 암호화하고 AES-GCM으로 payload를 암호화하는 하이브리드 패턴 정리"
date        : 2026-03-31 11:00:00 +0900
updated     : 2026-03-31 11:00:00 +0900
categories  : [java]
tags        : [rsa, aes-gcm, encryption, spring-boot, bouncycastle, java]
pin         : false
hidden      : false
---

RSA 공개키로 AES 세션키를 암호화하고, AES-GCM으로 payload를 암호화하는 하이브리드 암호화 패턴.

## 핵심 흐름

```
1. AES-256 세션키 생성
2. 세션키를 상대방 RSA 공개키로 암호화 → aesKey
3. 데이터를 AES-GCM으로 암호화 → payload
4. aesKey + payload를 전송
```

## 코드

```java
// AES 세션키 생성
SecretKey aesKey = KeyGenerator.getInstance("AES").generateKey(); // 256bit
String aesKeyString = Base64.getEncoder().encodeToString(aesKey.getEncoded());

// RSA 공개키로 세션키 암호화
Cipher rsaCipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
rsaCipher.init(Cipher.ENCRYPT_MODE, publicKey);
String encryptedAesKey = Base64.getEncoder().encodeToString(rsaCipher.doFinal(aesKeyString.getBytes()));

// AES-GCM으로 payload 암호화 (IV 12byte를 암호문 앞에 붙임)
Cipher gcmCipher = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);
gcmCipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(128, iv));
byte[] encrypted = gcmCipher.doFinal(data.getBytes());
// combined = iv + encrypted → Base64
```

## PEM 공개키 로딩 (BouncyCastle 없이)

```java
String pem = Files.readString(Paths.get("public_key.pem"));
String base64Key = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replaceAll("\\s", "");
byte[] keyBytes = Base64.getDecoder().decode(base64Key);
PublicKey publicKey = KeyFactory.getInstance("RSA")
    .generatePublic(new X509EncodedKeySpec(keyBytes));
```

BouncyCastle(`bcprov-jdk15on`)은 Java 11 + Spring Boot 2.5.7 환경에서 `IllegalArgumentException: illegal lookupClass` 에러가 발생할 수 있음. 단순 공개키 로딩은 순수 Java로 충분.

## payload 포맷 (재전송 공격 방지)

```java
String payload = jsonData + "|" + timestamp + "|" + nonce;
// nonce: SecureRandom 16byte → Base64
```

## Gradle 테스트에서 println 출력 보기

```bash
# 기본 설정으로는 System.out.println이 안 보임
# --rerun-tasks: 캐시 무시, -i: INFO 레벨 (stdout 포함)
./gradlew test --tests "패키지.TestClass.methodName" --rerun-tasks -i
```
