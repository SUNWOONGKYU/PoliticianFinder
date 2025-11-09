# File Upload Helper - Usage Guide

**Task ID**: P4BA4
**Created**: 2025-11-09
**File**: `src/lib/utils/file-upload.ts`

## Overview

게시글 첨부파일 업로드를 위한 헬퍼 함수 모음입니다. Supabase Storage를 사용하여 파일을 안전하게 저장하고 관리합니다.

## Features

- ✅ 파일 타입 검증 (MIME type & extension)
- ✅ 파일 크기 제한 체크
- ✅ 안전한 파일명 생성 (특수문자 제거, 타임스탬프 추가)
- ✅ Supabase Storage 업로드
- ✅ 다중 파일 업로드 지원
- ✅ 파일 삭제 기능
- ✅ 에러 처리 및 코드 표준화

## Allowed File Types

### 문서 (Document)
- **형식**: PDF, DOC, DOCX, TXT
- **최대 크기**: 10MB
- **MIME Types**:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `text/plain`

### 이미지 (Image)
- **형식**: JPG, JPEG, PNG, GIF, WEBP
- **최대 크기**: 5MB
- **MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`

### 압축파일 (Archive)
- **형식**: ZIP, RAR
- **최대 크기**: 20MB
- **MIME Types**:
  - `application/zip`
  - `application/x-rar-compressed`
  - `application/x-zip-compressed`

## Storage Structure

```
attachments/
└── {userId}/
    └── {postId}/
        ├── document_1699123456789_abc123.pdf
        ├── image_1699123457890_def456.jpg
        └── archive_1699123458901_ghi789.zip
```

## Environment Variables Required

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage Examples

### 1. Single File Upload

```typescript
import { uploadPostAttachment } from '@/lib/utils/file-upload';

async function handleFileUpload(file: File, userId: string, postId: string) {
  const result = await uploadPostAttachment({
    userId,
    postId,
    file,
  });

  if (result.success) {
    console.log('Upload successful!');
    console.log('URL:', result.url);
    console.log('Path:', result.path);
  } else {
    console.error('Upload failed:', result.error);
    console.error('Error code:', result.code);
  }
}
```

### 2. Multiple Files Upload

```typescript
import { uploadMultipleAttachments } from '@/lib/utils/file-upload';

async function handleMultipleFilesUpload(
  files: File[],
  userId: string,
  postId: string
) {
  const results = await uploadMultipleAttachments(userId, postId, files);

  results.forEach((result, index) => {
    if (result.success) {
      console.log(`File ${index + 1} uploaded:`, result.url);
    } else {
      console.error(`File ${index + 1} failed:`, result.error);
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`${successCount}/${files.length} files uploaded successfully`);
}
```

### 3. File Validation Before Upload

```typescript
import { validateFile } from '@/lib/utils/file-upload';

function handleFileSelect(file: File) {
  const validation = validateFile(file);

  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  console.log('File is valid!');
  console.log('Category:', validation.category); // 'document' | 'image' | 'archive'

  // Proceed with upload...
}
```

### 4. Client-Side File Input

```typescript
import { validateFile, uploadPostAttachment } from '@/lib/utils/file-upload';

function FileUploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Upload
    setUploading(true);
    const result = await uploadPostAttachment({
      userId: 'user-uuid',
      postId: 'post-uuid',
      file,
    });

    setUploading(false);

    if (result.success) {
      setUploadedUrl(result.url!);
      alert('Upload successful!');
    } else {
      alert(`Upload failed: ${result.error}`);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && <img src={uploadedUrl} alt="Uploaded" />}
    </div>
  );
}
```

### 5. API Route Integration

```typescript
// app/api/posts/[id]/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadPostAttachment } from '@/lib/utils/file-upload';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  const result = await uploadPostAttachment({
    userId,
    postId: params.id,
    file,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 400 }
    );
  }

  return NextResponse.json({
    url: result.url,
    path: result.path,
  });
}
```

### 6. Delete Attachment

```typescript
import { deleteAttachment } from '@/lib/utils/file-upload';

async function handleDeleteFile(path: string) {
  const success = await deleteAttachment(path);

  if (success) {
    console.log('File deleted successfully');
  } else {
    console.error('Failed to delete file');
  }
}
```

### 7. Delete All Post Attachments

```typescript
import { deletePostAttachments } from '@/lib/utils/file-upload';

async function handleDeletePost(userId: string, postId: string) {
  // Delete all attachments before deleting the post
  const success = await deletePostAttachments(userId, postId);

  if (success) {
    console.log('All attachments deleted');
    // Proceed to delete the post from database...
  }
}
```

### 8. Get File Type Configuration

```typescript
import {
  getAllowedExtensions,
  getAllowedMimeTypes,
  getMaxFileSizeMB,
  FileCategory,
} from '@/lib/utils/file-upload';

// Get all allowed extensions
const extensions = getAllowedExtensions();
console.log(extensions); // ['pdf', 'doc', 'docx', 'txt', 'jpg', ...]

// Get all allowed MIME types
const mimeTypes = getAllowedMimeTypes();
console.log(mimeTypes); // ['application/pdf', 'image/jpeg', ...]

// Get max file size for a category
const maxDocSize = getMaxFileSizeMB(FileCategory.DOCUMENT); // 10
const maxImageSize = getMaxFileSizeMB(FileCategory.IMAGE); // 5
const maxArchiveSize = getMaxFileSizeMB(FileCategory.ARCHIVE); // 20
```

## Error Handling

### Error Codes

```typescript
export const ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  INVALID_PARAMS: 'INVALID_PARAMS',
  STORAGE_ERROR: 'STORAGE_ERROR',
};
```

### Error Response Format

```typescript
interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  code?: string;
}
```

### Example Error Handling

```typescript
import { uploadPostAttachment, ERROR_CODES } from '@/lib/utils/file-upload';

async function uploadWithErrorHandling(file: File, userId: string, postId: string) {
  const result = await uploadPostAttachment({ userId, postId, file });

  if (!result.success) {
    switch (result.code) {
      case ERROR_CODES.INVALID_FILE_TYPE:
        alert('지원하지 않는 파일 형식입니다.');
        break;
      case ERROR_CODES.FILE_TOO_LARGE:
        alert('파일 크기가 너무 큽니다.');
        break;
      case ERROR_CODES.STORAGE_ERROR:
        alert('저장소 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        break;
      default:
        alert(`업로드 실패: ${result.error}`);
    }
    return null;
  }

  return result.url;
}
```

## Testing

### Run Tests

```bash
npm test -- file-upload.test.ts
```

### Test Coverage

- ✅ File extension extraction
- ✅ File category detection
- ✅ Safe filename generation
- ✅ Storage path generation
- ✅ File validation (type, size)
- ✅ Document file handling
- ✅ Image file handling
- ✅ Archive file handling
- ✅ Invalid file rejection
- ✅ Edge cases (empty files, size limits, special characters)

## API Documentation

### Main Functions

#### `uploadPostAttachment(options: FileUploadOptions): Promise<FileUploadResult>`

게시글 첨부파일을 업로드합니다.

**Parameters:**
- `options.userId` - 사용자 UUID
- `options.postId` - 게시글 UUID
- `options.file` - File 객체

**Returns:**
- `success` - 성공 여부
- `url` - 업로드된 파일의 공개 URL (성공 시)
- `path` - Storage 내부 경로 (성공 시)
- `error` - 에러 메시지 (실패 시)
- `code` - 에러 코드 (실패 시)

---

#### `uploadMultipleAttachments(userId: string, postId: string, files: File[]): Promise<FileUploadResult[]>`

다중 파일을 업로드합니다.

**Parameters:**
- `userId` - 사용자 UUID
- `postId` - 게시글 UUID
- `files` - File 객체 배열

**Returns:**
- 각 파일의 업로드 결과 배열

---

#### `validateFile(file: File): FileValidationResult`

파일의 타입과 크기를 검증합니다.

**Parameters:**
- `file` - 검증할 File 객체

**Returns:**
- `valid` - 유효성 여부
- `category` - 파일 카테고리 (유효한 경우)
- `error` - 에러 메시지 (유효하지 않은 경우)
- `code` - 에러 코드 (유효하지 않은 경우)

---

#### `deleteAttachment(path: string): Promise<boolean>`

파일을 삭제합니다.

**Parameters:**
- `path` - Storage 경로

**Returns:**
- 삭제 성공 여부

---

#### `deletePostAttachments(userId: string, postId: string): Promise<boolean>`

게시글의 모든 첨부파일을 삭제합니다.

**Parameters:**
- `userId` - 사용자 UUID
- `postId` - 게시글 UUID

**Returns:**
- 삭제 성공 여부

## Security Considerations

1. **File Type Validation**: MIME type과 extension을 모두 체크합니다
2. **Size Limits**: 카테고리별로 다른 크기 제한을 적용합니다
3. **Safe Filenames**: 특수문자를 제거하고 타임스탬프를 추가합니다
4. **Service Role Key**: 서버 사이드에서만 사용 (클라이언트 노출 금지)
5. **Path Isolation**: userId와 postId로 파일을 격리합니다

## Supabase Storage Setup

### 1. Create Bucket

Supabase Dashboard > Storage > Create Bucket:
- Name: `attachments`
- Public: Yes (for public access to uploaded files)

### 2. Set Storage Policies (RLS)

```sql
-- Allow authenticated users to upload to their own folders
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Best Practices

1. **Always validate files on the client side** before uploading
2. **Use the service role key only in API routes** (server-side)
3. **Delete attachments when deleting posts** to avoid orphaned files
4. **Display upload progress** for better UX
5. **Implement retry logic** for failed uploads
6. **Show file preview** before upload (especially for images)
7. **Limit the number of files** per post (e.g., max 5 files)

## Troubleshooting

### Upload fails with "Missing Supabase environment variables"

Ensure `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Files upload but return 404 when accessed

Check Supabase Storage bucket is set to **Public**.

### "CORS error" when uploading

Supabase automatically handles CORS. If you encounter this, check your Supabase project settings.

### Storage quota exceeded

Monitor your Supabase storage usage in the dashboard. Consider implementing file cleanup policies.

## Related Files

- Implementation: `src/lib/utils/file-upload.ts`
- Tests: `src/lib/utils/__tests__/file-upload.test.ts`
- API Example: `src/app/api/posts/attachments/route.ts`
- Database Types: `src/lib/database.types.ts`

## Next Steps

1. Implement file upload UI component
2. Add drag-and-drop support
3. Add image compression before upload
4. Implement upload progress tracking
5. Add file preview thumbnails
6. Implement batch delete functionality
