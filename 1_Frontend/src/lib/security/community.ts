// P3BA13: 커뮤니티 보안

const spamCheckCache: Record<string, { count: number; lastTime: number }> = {};

export function sanitizeContent(content: string): string {
  // XSS 방어: 기본 스크립트 태그 제거
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function isSpamming(userId: string): boolean {
  const now = Date.now();
  const cache = spamCheckCache[userId];

  if (!cache) {
    spamCheckCache[userId] = { count: 1, lastTime: now };
    return false;
  }

  // 2초 이내에 연속 작성 제한
  if (now - cache.lastTime < 2000) {
    cache.count++;
    if (cache.count > 3) {
      return true;
    }
  } else {
    cache.count = 1;
  }

  cache.lastTime = now;
  return false;
}

export function validateFileUpload(file: File): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) return false;

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(file.type)) return false;

  return true;
}

export function flagSuspiciousContent(content: string): boolean {
  // 의심 키워드 감지
  const suspiciousKeywords = ['폭력', '차별', '혐오'];
  return suspiciousKeywords.some((keyword) => content.includes(keyword));
}
