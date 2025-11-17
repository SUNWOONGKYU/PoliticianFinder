# P3BA30: Whois 도메인을 Vercel에 연동하는 방법 - 완전 가이드

**작성일**: 2025-11-18
**작업자**: Claude Code
**관련 테스크**: P3BA30 - Resend 이메일 시스템 연동
**도메인**: politicianfinder.ai.kr (한국 .ai.kr 도메인)
**호스팅**: Vercel (politician-finder 프로젝트)

---

## 📋 목차

1. [작업 개요](#작업-개요)
2. [문제 상황 및 원인](#문제-상황-및-원인)
3. [해결 과정](#해결-과정)
4. [최종 해결 방법](#최종-해결-방법)
5. [Whois DNS 설정 가이드](#whois-dns-설정-가이드)
6. [트러블슈팅](#트러블슈팅)
7. [교훈 및 권장사항](#교훈-및-권장사항)

---

## 1. 작업 개요

### 목표
- **Resend 이메일 시스템** 연동을 위한 도메인 인증
- **politicianfinder.ai.kr** 도메인을 Vercel 프로젝트에 연결
- 이메일 발송 기능 구현 (문의 답변, 회원가입 인증 등)

### 초기 상황
- ✅ 도메인: Whois에서 `politicianfinder.ai.kr` 구매 완료
- ✅ 호스팅: Vercel `politician-finder` 프로젝트 배포 완료
- ❌ 도메인-호스팅 연결: 미완료
- ❌ 이메일 시스템: 미구현

---

## 2. 문제 상황 및 원인

### 2.1. 발생한 문제들

#### 문제 1: Vercel 네임서버 권한 오류
```
Error: Not authorized to use politicianfinder.ai.kr (403)
This domain is linked to another Vercel account.
```

**원인**:
- 네임서버를 `ns1.vercel-dns.com`으로 변경했을 때
- 도메인이 Vercel 내부적으로 **다른 계정에 등록되어 있거나 캐시됨**
- 한국 도메인(.ai.kr)은 Vercel DNS에서 완전히 지원되지 않음

#### 문제 2: Whois DNS 제한사항
```
- CNAME 레코드 입력 불가
- TXT 레코드 입력 시 특수문자(_) 사용 불가
- A 레코드 호스트명에 @ 입력 불가
```

**원인**:
- Whois DNS 관리 인터페이스의 **사용자 입력 제한**
- 일반 DNS 호스트 관리 화면에서는 제한적인 기능만 제공
- **네임서버 고급설정**에서만 CNAME/TXT 레코드 관리 가능

#### 문제 3: Cloudflare DNS 사용 불가
```
Invalid domain: politicianfinder.ai.kr
```

**원인**:
- Cloudflare가 **.ai.kr 도메인을 지원하지 않음**
- 한국 특수 도메인(ccTLD)은 일부 DNS 서비스에서 제한됨

---

### 2.2. 근본 원인 분석

| 문제 유형 | 근본 원인 | 해결 방향 |
|----------|----------|----------|
| Vercel DNS 권한 오류 | .ai.kr 도메인 특성 + Vercel 내부 등록 충돌 | Whois DNS 사용 |
| DNS 레코드 입력 제한 | Whois 일반 관리 화면 사용 | 네임서버 고급설정 사용 |
| Cloudflare 불가 | .ai.kr 도메인 미지원 | Whois DNS 계속 사용 |

---

## 3. 해결 과정

### 3.1. 시도한 방법들 (실패)

#### ❌ 방법 1: Vercel DNS 사용
```bash
# 네임서버를 Vercel로 변경
ns1.vercel-dns.com
ns2.vercel-dns.com

# 결과: 403 권한 오류
Error: Not authorized to use politicianfinder.ai.kr
```

**실패 이유**: 도메인이 다른 Vercel 계정에 연결되어 있거나 .ai.kr 미지원

---

#### ❌ 방법 2: Whois 일반 DNS 관리
```
문제:
- CNAME 레코드 추가 불가 (IP 주소만 입력 가능)
- TXT 레코드에 _vercel 입력 불가 (특수문자 제한)
- A 레코드 호스트명에 @ 입력 불가
```

**실패 이유**: 일반 DNS 호스트 관리 화면의 기능 제한

---

#### ❌ 방법 3: Cloudflare DNS 사용
```
1. Cloudflare 계정 생성
2. 도메인 추가 시도: politicianfinder.ai.kr
3. 결과: Invalid domain
```

**실패 이유**: Cloudflare가 .ai.kr 도메인을 지원하지 않음

---

### 3.2. 최종 성공 방법 발견

**Whois 네임서버 고급설정** 사용

1. Whois 도메인 관리 → **부가서비스** → **네임서버 변경/부가서비스**
2. **네임서버 고급설정** 메뉴 진입
3. 다음 섹션들 발견:
   - ✅ **A 레코드 관리(네임서버 호스팅)**
   - ✅ **CNAME 레코드 관리**
   - ✅ **SPF(TXT) 레코드 관리**

---

## 4. 최종 해결 방법

### 4.1. Whois 네임서버 설정

**네임서버를 Whois 기본값으로 유지**:
```
ns1.whoisdomain.kr
ns2.whoisdomain.kr
ns3.whoisdomain.kr
ns4.whoisdomain.kr
```

**중요**: Vercel DNS로 변경하지 않고 Whois DNS 사용

---

### 4.2. Vercel에서 도메인 추가

**URL**: `https://vercel.com/finder-world/politician-finder/settings/domains`

1. **Add Domain** 버튼 클릭
2. `www.politicianfinder.ai.kr` 입력 (www 포함)
3. **Production** 환경에 연결
4. 추가

**Vercel이 요구하는 DNS 레코드**:
```
Type: CNAME
Name: www
Value: cab135ccde227379.vercel-dns-016.com

Type: TXT
Name: _vercel
Value: vc-domain-verify=www.politicianfinder.ai.kr,40b3cc2672da384e0ba8
```

---

### 4.3. Whois DNS 레코드 설정

#### 1️⃣ A 레코드 추가

**경로**: 네임서버 고급설정 → **A 레코드 관리(네임서버 호스팅)** → 관리페이지 열기

```
호스트명: www
IP 주소: 216.150.1.1
```

**주의사항**:
- 호스트명을 비워두거나 `@` 입력 시 에러 발생
- 루트 도메인(`politicianfinder.ai.kr`)은 Whois DNS 제한으로 설정 불가
- **www 서브도메인만 사용**

---

#### 2️⃣ CNAME 레코드 추가

**경로**: 네임서버 고급설정 → **CNAME 레코드 관리** → 관리페이지 열기

```
호스트명: www
값: cab135ccde227379.vercel-dns-016.com
```

**참고**: Vercel이 제공하는 CNAME 값은 프로젝트마다 다름

---

#### 3️⃣ TXT 레코드 추가

**경로**: 네임서버 고급설정 → **SPF(TXT) 레코드 관리** → 관리페이지 열기

```
호스트명: _vercel
값: vc-domain-verify=www.politicianfinder.ai.kr,40b3cc2672da384e0ba8
```

**주의사항**:
- 일반 DNS 관리에서는 `_vercel` 입력 불가 (특수문자 제한)
- **고급설정**에서만 가능

---

### 4.4. DNS 전파 대기

**소요 시간**: 6시간 ~ 48시간

**진행 상황 확인**:
```bash
# DNS 전파 확인
nslookup www.politicianfinder.ai.kr 8.8.8.8

# 성공 예시:
Server:  dns.google
Address:  8.8.8.8

Name:    www.politicianfinder.ai.kr
Address:  216.150.1.1
```

---

### 4.5. Vercel에서 인증 완료 확인

**Vercel 도메인 설정 페이지**:
- `www.politicianfinder.ai.kr` 상태 확인
- **"Generating SSL Certificate"** → SSL 인증서 생성 중 (1-5분)
- **"Valid Configuration"** (초록색 체크) → 성공!

---

## 5. Whois DNS 설정 가이드

### 5.1. 네임서버 고급설정 접근 방법

```
Whois 로그인
  ↓
도메인 관리
  ↓
부가서비스 → 네임서버 변경/부가서비스
  ↓
네임서버 고급설정
  ↓
- A 레코드 관리
- CNAME 레코드 관리
- SPF(TXT) 레코드 관리
```

---

### 5.2. 각 레코드 설정 화면

#### A 레코드 관리
```
[서비스 선택]
○ 등록  ○ 변경  ○ 삭제

호스트명: www
IP 주소: 216.150.1.1

[호스트 추가] 버튼
```

#### CNAME 레코드 관리
```
호스트명: www
별칭(CNAME): cab135ccde227379.vercel-dns-016.com

[등록] 버튼
```

#### TXT 레코드 관리
```
호스트명: _vercel
TXT 값: vc-domain-verify=www.politicianfinder.ai.kr,40b3cc2672da384e0ba8

[등록] 버튼
```

---

### 5.3. 저장 및 확인

1. 각 레코드 추가 후 **[다음 단계로]** 또는 **[확인]** 버튼 클릭
2. **신청 정보** 화면에서 등록 내역 확인
3. **"등록완료"** 상태 확인
4. DNS 전파 대기 (6-48시간)

---

## 6. 트러블슈팅

### 6.1. 일반적인 문제

#### ❌ 문제: "특수문자를 입력할 수 없습니다"

**증상**:
```
호스트명에 @ 입력 시:
"호스트명에 특수문자를 입력할 수 없습니다"

_vercel 입력 시:
"특수문자를 사용할 수 없습니다"
```

**해결**:
- 일반 DNS 관리 화면이 아닌 **네임서버 고급설정** 사용
- A 레코드는 `@` 대신 `www` 사용
- TXT 레코드는 고급설정 메뉴에서 입력

---

#### ❌ 문제: CNAME 레코드 입력란에 IP 주소만 입력 가능

**증상**:
```
CNAME 값에 "cab135ccde227379.vercel-dns-016.com" 입력 시:
"IP 주소를 입력하세요"
```

**해결**:
- 일반 DNS 관리 화면은 A 레코드만 지원
- **네임서버 고급설정 → CNAME 레코드 관리** 사용

---

#### ❌ 문제: DNS_PROBE_FINISHED_NXDOMAIN 오류

**증상**:
```
브라우저 접속 시:
"사이트에 연결할 수 없음"
"DNS_PROBE_FINISHED_NXDOMAIN"
```

**원인**: DNS가 아직 전파되지 않음

**해결**:
1. DNS 전파 확인: `nslookup www.politicianfinder.ai.kr 8.8.8.8`
2. 6-48시간 대기
3. Whois DNS에서 레코드 저장 확인

---

#### ❌ 문제: Vercel "Verification Needed" 경고

**증상**:
```
Vercel 도메인 상태:
⚠️ Verification Needed
```

**원인**:
- DNS 레코드가 아직 전파 안 됨
- 또는 TXT 레코드가 누락됨

**해결**:
1. Whois DNS에서 TXT 레코드 확인
2. DNS 전파 대기
3. Vercel에서 **"Refresh"** 버튼 클릭

---

### 6.2. Vercel 관련 문제

#### ❌ 문제: "Not authorized to use domain (403)"

**증상**:
```bash
npx vercel domains add politicianfinder.ai.kr
Error: Not authorized to use politicianfinder.ai.kr (403)
```

**원인**:
- 도메인이 다른 Vercel 계정에 등록됨
- 또는 Vercel DNS를 사용했을 때 권한 충돌

**해결**:
1. Vercel DNS 사용 중단
2. Whois DNS로 전환
3. 웹 대시보드에서 도메인 추가 (CLI 사용 안 함)

---

#### ❌ 문제: "This domain is linked to another Vercel account"

**증상**:
```
Vercel DNS 탭:
"Please move this domain to this team"
```

**원인**: 네임서버를 Vercel로 변경했을 때 발생

**해결**:
1. 도메인을 프로젝트에서 제거
2. Whois에서 네임서버를 **Whois 기본값으로 변경**
3. A/CNAME/TXT 레코드 방식으로 연결

---

## 7. 교훈 및 권장사항

### 7.1. 핵심 교훈

1. **한국 도메인(.ai.kr)은 특수성이 있음**
   - Cloudflare 등 일부 DNS 서비스에서 미지원
   - Vercel DNS도 완전 호환되지 않음
   - **Whois DNS를 그대로 사용하는 것이 가장 안전**

2. **Whois DNS 고급설정을 활용해야 함**
   - 일반 DNS 관리 화면은 기능 제한적
   - CNAME/TXT 레코드는 고급설정에서만 가능

3. **루트 도메인(@) 대신 www 서브도메인 사용**
   - Whois DNS 제한으로 루트 도메인 설정이 어려움
   - `www.politicianfinder.ai.kr` 사용 권장

4. **DNS 전파는 오래 걸림 (6-48시간)**
   - 조급해하지 말고 기다려야 함
   - `nslookup`으로 주기적 확인

---

### 7.2. 권장 설정 방법

**추천 구성**:
```
도메인 등록: Whois
네임서버: Whois 기본값 (ns1.whoisdomain.kr)
DNS 관리: Whois 네임서버 고급설정
호스팅: Vercel
도메인: www.politicianfinder.ai.kr (www 포함)
```

**추천하지 않는 방법**:
- ❌ Vercel DNS 사용 (.ai.kr 도메인)
- ❌ Cloudflare DNS 사용 (.ai.kr 미지원)
- ❌ 루트 도메인(@) 직접 설정

---

### 7.3. 향후 작업

1. ✅ **도메인 연결 완료 확인**
   - `www.politicianfinder.ai.kr` 접속 테스트
   - SSL 인증서 정상 작동 확인

2. ⏳ **Resend 이메일 설정**
   - Resend API 키 발급
   - 도메인 인증 (이메일 발송용)
   - 이메일 발송 테스트

3. ⏳ **루트 도메인 리다이렉트 설정**
   - `politicianfinder.ai.kr` → `www.politicianfinder.ai.kr` 리다이렉트
   - Vercel 설정 또는 DNS 설정

---

## 8. 요약

### 최종 설정 결과

| 항목 | 설정 값 |
|------|---------|
| **도메인** | www.politicianfinder.ai.kr |
| **네임서버** | ns1.whoisdomain.kr ~ ns4.whoisdomain.kr |
| **A 레코드** | www → 216.150.1.1 |
| **CNAME 레코드** | www → cab135ccde227379.vercel-dns-016.com |
| **TXT 레코드** | _vercel → vc-domain-verify=... |
| **호스팅** | Vercel (politician-finder) |
| **SSL** | Let's Encrypt (자동) |

---

### 작업 시간

- **총 소요 시간**: 약 3-4시간
- **주요 시행착오**: Vercel DNS, Cloudflare 시도
- **최종 해결**: Whois 네임서버 고급설정 발견

---

### 성공 요인

1. ✅ Whois DNS 고급설정 기능 발견
2. ✅ www 서브도메인 사용 결정
3. ✅ DNS 레코드 (A, CNAME, TXT) 모두 추가
4. ✅ 인내심 (DNS 전파 대기)

---

## 9. 참고 자료

### Vercel 공식 문서
- [Adding a Domain](https://vercel.com/docs/projects/domains/add-a-domain)
- [DNS Records](https://vercel.com/docs/projects/domains/working-with-domains)

### Whois 설정 화면
- 도메인 관리 → 부가서비스 → 네임서버 고급설정

### DNS 확인 도구
```bash
# DNS 전파 확인
nslookup www.politicianfinder.ai.kr 8.8.8.8

# 또는
dig www.politicianfinder.ai.kr
```

---

**작성 완료일**: 2025-11-18
**문서 버전**: 1.0
**관련 테스크**: P3BA30
