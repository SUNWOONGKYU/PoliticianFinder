# Image Upload Utility - P4BA3

> Supabase Storage 이미지 업로드 헬퍼 (Sharp 리사이징 포함)

## 개요

이 유틸리티는 Supabase Storage에 이미지를 업로드하고 관리하는 기능을 제공합니다. Sharp 라이브러리를 사용하여 이미지를 리사이징하고 최적화합니다.

## 주요 기능

- ✅ 이미지 업로드 (JPG, PNG, WebP, GIF)
- ✅ 자동 리사이징 (thumbnail, medium, large)
- ✅ Sharp를 이용한 이미지 최적화
- ✅ Supabase Storage 연동
- ✅ 이미지 삭제 기능
- ✅ 타입 안전성 (TypeScript)

## 설치

```bash
npm install sharp
```

## 상수

### IMAGE_SIZES

이미지 리사이징 규격:

```typescript
{
  thumbnail: { width: 200, height: 200 },
  medium: { width: 800, height: 800 },
  large: { width: 1200, height: 1200 }
}
```

### STORAGE_PATHS

Storage 버킷 경로 템플릿:

```typescript
{
  avatars: (userId: string) => `avatars/${userId}/`,
  politicianImages: (politicianId: string) => `politician-images/${politicianId}/`
}
```

## 사용 예시

### 1. 기본 이미지 업로드

```typescript
import { uploadImage } from '@/lib/utils/image-upload';

const result = await uploadImage({
  file: imageFile, // File 또는 Buffer
  bucket: 'avatars',
  path: 'avatars/user123/',
  filename: 'profile',
  sizes: ['thumbnail', 'medium'],
  keepOriginal: true,
});

if (result.success) {
  console.log('업로드된 이미지:', result.images);
  // result.images[0].url - 썸네일 URL
  // result.images[1].url - 중간 크기 URL
  // result.images[2].url - 원본 URL
} else {
  console.error('에러:', result.error, result.code);
}
```

### 2. 사용자 아바타 업로드

```typescript
import { uploadUserAvatar } from '@/lib/utils/image-upload';

const result = await uploadUserAvatar('user123', imageFile);
```

### 3. 정치인 이미지 업로드

```typescript
import { uploadPoliticianImage } from '@/lib/utils/image-upload';

const result = await uploadPoliticianImage('pol456', imageFile);
```

### 4. 이미지 삭제

```typescript
import { deleteImages } from '@/lib/utils/image-upload';

const result = await deleteImages('avatars', [
  'avatars/user123/profile_thumbnail.jpg',
  'avatars/user123/profile_medium.jpg',
]);
```

### 5. 특정 경로의 모든 이미지 삭제

```typescript
import { deleteImagesInPath } from '@/lib/utils/image-upload';

const result = await deleteImagesInPath('avatars', 'avatars/user123/');
```

## API 엔드포인트 사용

### POST /api/storage/upload

```typescript
// 사용자 아바타 업로드
const formData = new FormData();
formData.append('file', imageFile);
formData.append('uploadType', 'avatar');

const response = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();

// 정치인 이미지 업로드
const formData = new FormData();
formData.append('file', imageFile);
formData.append('uploadType', 'politician');
formData.append('filename', 'pol123');

const response = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData,
});

// 커스텀 업로드
const formData = new FormData();
formData.append('file', imageFile);
formData.append('uploadType', 'custom');
formData.append('bucket', 'my-bucket');
formData.append('path', 'my-path/');
formData.append('filename', 'my-image');

const response = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData,
});
```

### DELETE /api/storage/upload

```typescript
const response = await fetch('/api/storage/upload', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bucket: 'avatars',
    paths: ['avatars/user123/profile.jpg'],
  }),
});

const data = await response.json();
```

## 타입 정의

### ImageUploadOptions

```typescript
interface ImageUploadOptions {
  file: Buffer | File;
  bucket: string;
  path: string;
  filename: string;
  sizes?: ImageSize[]; // 기본값: ['thumbnail', 'medium', 'large']
  keepOriginal?: boolean; // 기본값: true
}
```

### UploadedImage

```typescript
interface UploadedImage {
  size: ImageSize | 'original';
  path: string;
  url: string;
  fileSize: number;
  width: number;
  height: number;
}
```

### ImageUploadResult

```typescript
interface ImageUploadResult {
  success: boolean;
  images: UploadedImage[];
  error?: string;
  code?: string;
}
```

## 에러 코드

| 코드 | 설명 |
|------|------|
| `INVALID_FORMAT` | 허용되지 않은 이미지 형식 |
| `FILE_TOO_LARGE` | 파일 크기가 5MB를 초과 |
| `UPLOAD_ERROR` | 업로드 중 에러 발생 |

## 제약 사항

- **허용 포맷**: JPG, JPEG, PNG, WebP, GIF
- **최대 파일 크기**: 5MB
- **리사이징**: Sharp 라이브러리 사용 (서버 환경 필요)

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (선택)
```

## 참고 사항

- 서버 환경(API Routes)에서만 사용 가능 (Sharp는 Node.js 환경 필요)
- 클라이언트에서는 `/api/storage/upload` 엔드포인트 사용
- 업로드된 이미지는 자동으로 JPEG 형식으로 변환됨
- 리사이징 시 이미지 비율을 유지하며 center crop 적용

## 테스트

```bash
npm test -- image-upload.test.ts
```

## 파일 구조

```
src/lib/utils/
├── image-upload.ts              # 메인 유틸리티
├── __tests__/
│   └── image-upload.test.ts     # 단위 테스트
└── IMAGE_UPLOAD_README.md       # 문서 (본 파일)

src/app/api/storage/upload/
└── route.ts                     # API 엔드포인트
```

## 작업 정보

- **작업 ID**: P4BA3
- **작업일**: 2025-11-09
- **Phase**: Phase 4
- **담당**: api-designer
