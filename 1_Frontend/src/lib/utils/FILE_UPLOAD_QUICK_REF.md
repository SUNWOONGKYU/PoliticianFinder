# File Upload Helper - Quick Reference

**Task**: P4BA4 | **File**: `@/lib/utils/file-upload`

## Quick Import

```typescript
import {
  uploadPostAttachment,
  uploadMultipleAttachments,
  validateFile,
  deleteAttachment,
  deletePostAttachments,
  FileCategory,
  ERROR_CODES,
} from '@/lib/utils/file-upload';
```

## File Type Limits

| Category | Extensions | Max Size | MIME Types |
|----------|-----------|----------|------------|
| 📄 Document | pdf, doc, docx, txt | 10MB | application/pdf, application/msword, ... |
| 🖼️ Image | jpg, jpeg, png, gif, webp | 5MB | image/jpeg, image/png, image/gif, image/webp |
| 📦 Archive | zip, rar | 20MB | application/zip, application/x-rar-compressed |

## Storage Path

```
attachments/{userId}/{postId}/filename_timestamp_random.ext
```

## Common Usage

### 1. Upload Single File

```typescript
const result = await uploadPostAttachment({
  userId: 'user-uuid',
  postId: 'post-uuid',
  file: fileObject,
});

if (result.success) {
  console.log(result.url);  // Public URL
} else {
  console.log(result.error); // Error message
}
```

### 2. Validate Before Upload

```typescript
const validation = validateFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
// Proceed with upload...
```

### 3. Upload Multiple Files

```typescript
const results = await uploadMultipleAttachments(
  userId,
  postId,
  [file1, file2, file3]
);

const successCount = results.filter(r => r.success).length;
```

### 4. Delete File

```typescript
await deleteAttachment(path);
```

### 5. Delete All Post Attachments

```typescript
await deletePostAttachments(userId, postId);
```

## Error Handling

```typescript
if (!result.success) {
  switch (result.code) {
    case ERROR_CODES.INVALID_FILE_TYPE:
      // Handle invalid type
      break;
    case ERROR_CODES.FILE_TOO_LARGE:
      // Handle size limit
      break;
    case ERROR_CODES.STORAGE_ERROR:
      // Handle storage error
      break;
  }
}
```

## Error Codes

- `INVALID_FILE_TYPE` - Unsupported file type
- `FILE_TOO_LARGE` - File exceeds size limit
- `UPLOAD_FAILED` - Upload failed
- `INVALID_PARAMS` - Invalid parameters
- `STORAGE_ERROR` - Supabase storage error

## HTML File Input

```html
<input
  type="file"
  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
  onChange={handleFileChange}
/>
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## TypeScript Types

```typescript
interface FileUploadOptions {
  userId: string;
  postId: string;
  file: File;
}

interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  code?: string;
}
```

## API Route Example

```typescript
// POST /api/posts/attachments
const formData = new FormData();
formData.append('userId', userId);
formData.append('postId', postId);
formData.append('file', fileObject);

const response = await fetch('/api/posts/attachments', {
  method: 'POST',
  body: formData,
});
```

## Full Documentation

See: `src/lib/utils/FILE_UPLOAD_USAGE.md`
