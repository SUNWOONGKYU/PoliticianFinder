# 모바일 개발 계획

## 📋 프로젝트 개요

현재 PoliticianFinder는 HTML 프로토타입 단계이며, 커뮤니티 게시글 공유 기능이 데스크톱과 모바일 웹에서 구현되었습니다.

---

## ✅ 현재 구현 상태 (프로토타입)

### 데스크톱 (Chrome, Firefox, Edge)
- ✅ 링크 복사
- ✅ Facebook 공유
- ✅ X (Twitter) 공유
- ✅ 네이버 블로그 공유
- ❌ "더 많은 옵션" 버튼 숨김 (데스크톱에서 불필요)

### 모바일 웹 (iOS Safari, Android Chrome)
- ✅ 링크 복사
- ✅ Facebook 공유
- ✅ X (Twitter) 공유
- ✅ 네이버 블로그 공유
- ✅ **더 많은 옵션** (Web Share API 사용)
  - 카카오톡
  - SMS
  - 기타 설치된 모든 공유 가능 앱

---

## 🚀 향후 모바일 앱 개발 계획

### 1단계: 데스크톱 기능 완성 (진행 중)
- 프로토타입 완성
- UI/UX 검증
- 사용자 테스트

### 2단계: 프론트엔드 개발 (예정)

#### 웹 프론트엔드 (React/Next.js 등)
- 현재 프로토타입 기능 그대로 구현
- 반응형 디자인 유지
- Web Share API 사용 (모바일 웹)

#### 모바일 앱 개발 (React Native / Flutter 등)

##### A. 카카오톡 공유 기능
**구현 방법:**
- **Kakao SDK 연동**
  - 카카오 개발자 등록 필요
  - 앱 키 발급
  - SDK 설치 및 초기화

**기능:**
- 카카오톡 메시지로 직접 공유
- 피드 공유 (카카오스토리)
- 카카오톡 링크 공유

**참고:**
- [Kakao Developers](https://developers.kakao.com/)
- React Native: `react-native-kakao-share-link`
- Flutter: `kakao_flutter_sdk`

##### B. 네이버 밴드 공유 (선택사항)
**구현 방법:**
- 네이버 밴드 공유 URL 사용
- 또는 네이티브 공유 API 활용

##### C. 네이티브 공유 API
**iOS:**
- `UIActivityViewController` 사용
- 자동으로 카카오톡, SMS, 이메일 등 표시

**Android:**
- `Intent.ACTION_SEND` 사용
- 자동으로 설치된 모든 공유 앱 표시

##### D. 기타 SNS 공유
- Facebook SDK 연동 (선택)
- Twitter SDK 연동 (선택)
- 또는 Web Share API로 통합 처리

---

## 📱 모바일 앱 개발 시 권장 구조

### 공유 기능 모듈화
```
/src/services/share/
  ├── ShareService.ts (공유 서비스 메인)
  ├── KakaoShare.ts (카카오톡 전용)
  ├── NaverShare.ts (네이버 블로그 전용)
  ├── NativeShare.ts (네이티브 공유)
  └── WebShare.ts (웹 공유)
```

### 플랫폼별 분기 처리
```typescript
// 예시 코드
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // 모바일: Kakao SDK 또는 Native Share 사용
  if (isKakaoInstalled) {
    await KakaoShare.share(content);
  } else {
    await NativeShare.share(content);
  }
} else {
  // 웹: Web Share API 또는 URL 기반 공유
  if (navigator.share) {
    await navigator.share(content);
  } else {
    openShareWindow(url);
  }
}
```

---

## 🔧 개발 우선순위

### Phase 1: 프로토타입 완성 ✅
- [x] 데스크톱 공유 기능
- [x] 모바일 웹 공유 기능 (Web Share API)

### Phase 2: 웹 프론트엔드 개발
- [ ] React/Next.js 마이그레이션
- [ ] API 연동
- [ ] 상태 관리
- [ ] 반응형 UI 구현

### Phase 3: 모바일 앱 개발
- [ ] React Native / Flutter 선택
- [ ] 카카오톡 SDK 연동
- [ ] 네이티브 공유 API 구현
- [ ] 푸시 알림 (추후)
- [ ] 딥링크 (추후)

---

## 📝 참고사항

### 카카오톡 SDK 사전 준비사항
1. 카카오 개발자 계정 생성
2. 앱 등록
3. 플랫�폼 추가 (iOS, Android)
4. 키 해시 등록 (Android)
5. Bundle ID 등록 (iOS)

### 비용 고려사항
- 카카오톡 SDK: **무료**
- Facebook SDK: **무료**
- Twitter API: **제한적 무료** (v2 API 확인 필요)
- 네이버 API: **무료** (일부 제한)

### 테스트 계획
1. **웹 브라우저 테스트**
   - Chrome, Safari, Firefox, Edge
   - 모바일 웹 (iOS Safari, Android Chrome)

2. **모바일 앱 테스트**
   - iOS 실기기 테스트
   - Android 실기기 테스트
   - 카카오톡 설치/미설치 시나리오

---

## 📅 예상 개발 일정

| 단계 | 작업 | 예상 기간 |
|-----|------|----------|
| Phase 1 | 프로토타입 완성 | ✅ 완료 |
| Phase 2 | 웹 프론트엔드 개발 | 4-6주 |
| Phase 3 | 모바일 앱 개발 | 8-12주 |
| 총 예상 기간 | - | 3-4개월 |

---

## 💡 추가 검토 사항

### 1. 공유 트래킹
- 공유 클릭 수 추적
- 공유 채널별 통계
- Google Analytics 또는 자체 서버 로깅

### 2. 딥링크 (Deep Link)
- 공유된 링크 클릭 시 앱으로 자동 이동
- iOS Universal Links
- Android App Links

### 3. 오픈그래프 (Open Graph)
- 카카오톡, Facebook 등에서 미리보기 최적화
- og:title, og:description, og:image 설정

---

## 📞 문의 및 참고 자료

### 공식 문서
- [Kakao Developers](https://developers.kakao.com/)
- [Naver Developers](https://developers.naver.com/)
- [React Native Share](https://github.com/react-native-share/react-native-share)
- [Flutter Share Plus](https://pub.dev/packages/share_plus)

### 커뮤니티
- Stack Overflow
- GitHub Issues
- 카카오 개발자 포럼

---

**문서 작성일**: 2025-10-28
**최종 수정일**: 2025-10-28
**작성자**: Claude (AI Assistant)
**프로젝트**: PoliticianFinder