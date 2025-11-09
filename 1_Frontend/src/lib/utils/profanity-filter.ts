const PROFANITY_WORDS = [
  "비방", "욕설", "사기", "해킹", "노출",
];

const REPLACEMENT_MAP: Record<string, string> = {
  "비방": "***",
  "욕설": "***",
  "사기": "***",
  "해킹": "***",
  "노출": "***",
};

export function filterProfanity(text: string): { filtered: string; isCritical: boolean } {
  let filtered = text;
  let isCritical = false;

  for (const word of PROFANITY_WORDS) {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      isCritical = true;
      const regex = new RegExp(word, "gi");
      filtered = filtered.replace(regex, REPLACEMENT_MAP[word] || "***");
    }
  }

  return { filtered, isCritical };
}

export function validateContent(content: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (content.length < 10) warnings.push("내용이 너무 짧습니다");
  if (content.length > 5000) warnings.push("내용이 너무 깁니다");

  const { isCritical } = filterProfanity(content);
  if (isCritical) warnings.push("부적절한 내용이 포함되어 있습니다");

  return { valid: warnings.length === 0, warnings };
}
