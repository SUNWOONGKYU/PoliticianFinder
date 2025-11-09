const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
}

export async function uploadFile(options: UploadOptions): Promise<{ url: string; error?: string }> {
  if (!ALLOWED_TYPES.includes(options.file.type)) {
    return { url: "", error: "지원하지 않는 파일 형식입니다" };
  }

  if (options.file.size > MAX_FILE_SIZE) {
    return { url: "", error: "파일 크기가 10MB를 초과합니다" };
  }

  const formData = new FormData();
  formData.append("file", options.file);
  formData.append("bucket", options.bucket);
  formData.append("path", options.path);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return { url: "", error: "업로드 실패" };
  }

  const data = await response.json();
  return { url: data.url };
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop() || "";
}
