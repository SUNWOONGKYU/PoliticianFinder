/**
 * P3F4: Field Mapper Utility
 *
 * Converts database fields (snake_case) to frontend fields (camelCase)
 * and adds computed fields (age, postCount, etc.)
 */

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Map politician fields from database (snake_case) to frontend (camelCase)
 *
 * @param dbRecord - Raw record from politicians table
 * @param communityStats - Optional community statistics (postCount, likeCount, taggedCount)
 * @returns Mapped politician object with camelCase fields
 */
export function mapPoliticianFields(
  dbRecord: any,
  communityStats?: {
    postCount?: number;
    upvoteCount?: number;
    downvoteCount?: number;
    taggedCount?: number;
  }
) {
  // Calculate age from birth_date
  const age = calculateAge(dbRecord.birth_date);

  return {
    // Basic info
    id: dbRecord.id,
    name: dbRecord.name,
    nameKanji: dbRecord.name_kanji || '',
    nameEn: dbRecord.name_en || dbRecord.name_english || '',

    // P3F3: identity and title (separated from status)
    identity: dbRecord.identity || '현직',
    title: dbRecord.title || '',

    // Position and party
    position: dbRecord.position || '',
    party: dbRecord.party || '',
    region: dbRecord.region || '',
    district: dbRecord.district || '',

    // Personal info
    birthDate: dbRecord.birth_date || '',
    age: age,
    gender: dbRecord.gender || '',

    // AI evaluation (snake_case → camelCase)
    claudeScore: dbRecord.ai_score || 0,
    totalScore: dbRecord.evaluation_score || 0,
    grade: dbRecord.evaluation_grade || '',
    gradeEmoji: getGradeEmoji(dbRecord.evaluation_grade || ''),
    lastUpdated: dbRecord.updated_at || '',

    // Community activity (computed fields)
    postCount: communityStats?.postCount || 0,
    upvoteCount: communityStats?.upvoteCount || 0,
    downvoteCount: communityStats?.downvoteCount || 0,
    taggedCount: communityStats?.taggedCount || 0,

    // Election Commission official info
    education: dbRecord.education || [],
    career: dbRecord.career || [],
    electionHistory: dbRecord.election_history || [],
    militaryService: dbRecord.military_service || '',
    assets: dbRecord.assets || {},
    taxArrears: dbRecord.tax_arrears || '없음',
    criminalRecord: dbRecord.criminal_record || '없음',
    militaryServiceIssue: dbRecord.military_service_issue || '없음',
    residencyFraud: dbRecord.residency_fraud || '없음',
    pledges: dbRecord.pledges || [],
    legislativeActivity: dbRecord.legislative_activity || {},

    // Other fields
    profileImageUrl: dbRecord.profile_image_url || null,
    websiteUrl: dbRecord.website || null,
    bio: dbRecord.bio || '',
    phone: dbRecord.phone || '',
    email: dbRecord.email || '',

    // SNS
    twitterHandle: dbRecord.twitter_handle || '',
    facebookUrl: dbRecord.facebook_url || '',
    instagramHandle: dbRecord.instagram_handle || '',

    // Metadata
    verifiedAt: dbRecord.verified_at || null,
    isActive: dbRecord.is_active !== false,
    createdAt: dbRecord.created_at || '',
    updatedAt: dbRecord.updated_at || '',

    // User ratings
    userRating: dbRecord.user_rating || 0,
    ratingCount: dbRecord.rating_count || 0,
  };
}

/**
 * Map politician list fields (lightweight version for list view)
 * Only includes essential fields for better performance
 */
export function mapPoliticianListFields(dbRecord: any) {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    identity: dbRecord.identity || '현직',
    title: dbRecord.title || '',
    position: dbRecord.position || '',
    party: dbRecord.party || '',
    region: dbRecord.region || '',

    // AI scores
    claudeScore: dbRecord.ai_score || 0,
    totalScore: dbRecord.evaluation_score || 0,
    grade: dbRecord.evaluation_grade || '',
    gradeEmoji: getGradeEmoji(dbRecord.evaluation_grade || ''),

    // User ratings
    userRating: dbRecord.user_rating || 0,
    ratingCount: dbRecord.rating_count || 0,

    // Metadata
    profileImageUrl: dbRecord.profile_image_url || null,
    updatedAt: dbRecord.updated_at || '',
  };
}

/**
 * V24.0 등급 체계 - 점수 기반 등급/이모지 계산 (10단계 금속)
 * P3BA33/P3BA34: 항상 점수 기준으로 등급 결정 - DB 불일치 방지
 */
export function calculateV24Grade(score: number): { grade: string; gradeEmoji: string; gradeName: string } {
  if (score >= 920) return { grade: 'M', gradeEmoji: '🌺', gradeName: 'Mugunghwa' };
  if (score >= 840) return { grade: 'D', gradeEmoji: '💎', gradeName: 'Diamond' };
  if (score >= 760) return { grade: 'E', gradeEmoji: '💚', gradeName: 'Emerald' };
  if (score >= 680) return { grade: 'P', gradeEmoji: '🥇', gradeName: 'Platinum' };
  if (score >= 600) return { grade: 'G', gradeEmoji: '🥇', gradeName: 'Gold' };
  if (score >= 520) return { grade: 'S', gradeEmoji: '🥈', gradeName: 'Silver' };
  if (score >= 440) return { grade: 'B', gradeEmoji: '🥉', gradeName: 'Bronze' };
  if (score >= 360) return { grade: 'I', gradeEmoji: '⚫', gradeName: 'Iron' };
  if (score >= 280) return { grade: 'Tn', gradeEmoji: '⬜', gradeName: 'Tin' };
  return { grade: 'L', gradeEmoji: '⬛', gradeName: 'Lead' };
}

/**
 * Map politician list fields with V24.0 score
 * P3BA34: ai_final_scores 테이블의 점수를 사용하여 등급 계산
 */
export function mapPoliticianListFieldsWithScore(
  dbRecord: any,
  totalScore: number,
  claudeScore?: number,
  chatgptScore?: number,
  grokScore?: number
) {
  const gradeInfo = calculateV24Grade(totalScore);

  return {
    id: dbRecord.id,
    name: dbRecord.name,
    identity: dbRecord.identity || '현직',
    title: dbRecord.title || '',
    position: dbRecord.position || '',
    party: dbRecord.party || '',
    region: dbRecord.region || '',

    // V24.0 AI scores (개별 AI 점수 사용)
    claudeScore: claudeScore || totalScore,
    totalScore: totalScore,
    claude: claudeScore || totalScore,       // 홈 화면 테이블용
    chatgpt: chatgptScore || totalScore,     // 홈 화면 테이블용
    grok: grokScore || totalScore,           // 홈 화면 테이블용
    grade: gradeInfo.grade,
    gradeEmoji: gradeInfo.gradeEmoji,
    gradeName: gradeInfo.gradeName,

    // User ratings
    userRating: dbRecord.user_rating || 0,
    ratingCount: dbRecord.rating_count || 0,

    // Metadata
    profileImageUrl: dbRecord.profile_image_url || null,
    updatedAt: dbRecord.updated_at || '',
  };
}

/**
 * Get grade emoji based on evaluation grade (Legacy - 하위 호환용)
 */
function getGradeEmoji(grade: string): string {
  const emojiMap: Record<string, string> = {
    'M': '🌺',  // Mugunghwa (920-1000)
    'D': '💎',  // Diamond (840-919)
    'E': '💚',  // Emerald (760-839)
    'P': '🥇',  // Platinum (680-759)
    'G': '🥇',  // Gold (600-679)
    'S': '🥈',  // Silver (520-599)
    'B': '🥉',  // Bronze (440-519)
    'I': '⚫',  // Iron (360-439)
    'Tn': '⬜', // Tin (280-359)
    'L': '⬛',  // Lead (200-279)
  };

  return emojiMap[grade] || '⬜';
}

/**
 * Calculate grade from score (Legacy - 하위 호환용)
 * @deprecated Use calculateV24Grade instead
 */
export function calculateGrade(score: number): string {
  return calculateV24Grade(score).grade;
}
