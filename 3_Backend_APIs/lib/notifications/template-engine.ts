/**
 * P4BA11: 알림 템플릿 엔진
 * 작업일: 2025-11-09
 * 설명: 알림 템플릿 변수 치환 및 처리 엔진
 */

/**
 * 템플릿 변수 타입 정의
 */
export interface TemplateVariables {
  작성자?: string;
  댓글내용?: string;
  게시글제목?: string;
  사용자이름?: string;
  팔로워이름?: string;
  대상사용자?: string;
  [key: string]: string | undefined;
}

/**
 * 템플릿 렌더링 옵션
 */
export interface RenderOptions {
  truncateLength?: number; // 문자열 자르기 길이 (기본값: 50)
  escapeHtml?: boolean; // HTML 이스케이프 (기본값: true)
  fallbackValue?: string; // 변수가 없을 때 기본값 (기본값: '')
}

/**
 * 템플릿 엔진 클래스
 */
export class TemplateEngine {
  private static instance: TemplateEngine;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 획득
   */
  public static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  /**
   * 템플릿 렌더링
   * @param template 템플릿 문자열 (예: "{작성자}님이 댓글을 남겼습니다")
   * @param variables 변수 객체
   * @param options 렌더링 옵션
   * @returns 렌더링된 문자열
   */
  public render(
    template: string,
    variables: TemplateVariables,
    options: RenderOptions = {}
  ): string {
    const {
      truncateLength = 50,
      escapeHtml = true,
      fallbackValue = '',
    } = options;

    // 중괄호로 둘러싸인 변수명을 찾아서 치환
    return template.replace(/\{([^}]+)\}/g, (match, varName) => {
      const trimmedVarName = varName.trim();
      let value = variables[trimmedVarName];

      // 변수가 없으면 fallback 값 사용
      if (value === undefined || value === null) {
        return fallbackValue;
      }

      // 문자열 자르기
      if (truncateLength > 0 && value.length > truncateLength) {
        value = value.substring(0, truncateLength) + '...';
      }

      // HTML 이스케이프
      if (escapeHtml) {
        value = this.escapeHtml(value);
      }

      return value;
    });
  }

  /**
   * 여러 템플릿 일괄 렌더링
   * @param templates 템플릿 맵 (키: 템플릿 이름, 값: 템플릿 문자열)
   * @param variables 변수 객체
   * @param options 렌더링 옵션
   * @returns 렌더링된 문자열 맵
   */
  public renderMultiple(
    templates: Record<string, string>,
    variables: TemplateVariables,
    options?: RenderOptions
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, template] of Object.entries(templates)) {
      result[key] = this.render(template, variables, options);
    }

    return result;
  }

  /**
   * 템플릿 검증
   * @param template 템플릿 문자열
   * @returns 검증 결과
   */
  public validate(template: string): {
    valid: boolean;
    variables: string[];
    errors: string[];
  } {
    const errors: string[] = [];
    const variables: string[] = [];
    const variablePattern = /\{([^}]+)\}/g;

    if (!template || template.trim().length === 0) {
      errors.push('Template cannot be empty');
      return { valid: false, variables: [], errors };
    }

    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      const varName = match[1].trim();

      // 변수명이 비어있는지 확인
      if (varName.length === 0) {
        errors.push('Empty variable name found: {}');
        continue;
      }

      // 중복 변수 체크
      if (!variables.includes(varName)) {
        variables.push(varName);
      }

      // 중첩된 중괄호 체크
      if (varName.includes('{') || varName.includes('}')) {
        errors.push(`Invalid nested braces in variable: {${varName}}`);
      }
    }

    return {
      valid: errors.length === 0,
      variables,
      errors,
    };
  }

  /**
   * 템플릿에서 사용된 변수 추출
   * @param template 템플릿 문자열
   * @returns 변수명 배열
   */
  public extractVariables(template: string): string[] {
    const variables: string[] = [];
    const variablePattern = /\{([^}]+)\}/g;

    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      const varName = match[1].trim();
      if (varName && !variables.includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }

  /**
   * 변수가 모두 제공되었는지 확인
   * @param template 템플릿 문자열
   * @param variables 변수 객체
   * @returns 검증 결과
   */
  public validateVariables(
    template: string,
    variables: TemplateVariables
  ): {
    valid: boolean;
    missingVariables: string[];
  } {
    const requiredVariables = this.extractVariables(template);
    const missingVariables: string[] = [];

    for (const varName of requiredVariables) {
      if (variables[varName] === undefined || variables[varName] === null) {
        missingVariables.push(varName);
      }
    }

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * HTML 이스케이프
   * @param text 이스케이프할 텍스트
   * @returns 이스케이프된 텍스트
   */
  private escapeHtml(text: string): string {
    const htmlEscapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char] || char);
  }

  /**
   * 템플릿 프리뷰 생성 (샘플 데이터로 렌더링)
   * @param template 템플릿 문자열
   * @returns 프리뷰 텍스트
   */
  public preview(template: string): string {
    const sampleVariables: TemplateVariables = {
      작성자: '홍길동',
      댓글내용: '좋은 글 감사합니다!',
      게시글제목: '정치인 검색 서비스 소개',
      사용자이름: '김철수',
      팔로워이름: '이영희',
      대상사용자: '박지성',
    };

    return this.render(template, sampleVariables);
  }
}

/**
 * 글로벌 템플릿 엔진 인스턴스
 */
export const templateEngine = TemplateEngine.getInstance();

/**
 * 헬퍼 함수: 댓글 알림 렌더링
 */
export function renderCommentNotification(
  authorName: string,
  commentContent: string,
  options?: RenderOptions
): { title: string; body: string } {
  const engine = TemplateEngine.getInstance();

  return {
    title: engine.render(
      '{작성자}님이 댓글을 남겼습니다',
      { 작성자: authorName },
      options
    ),
    body: engine.render(
      '{작성자}님이 회원님의 게시글에 댓글을 남겼습니다: "{댓글내용}"',
      { 작성자: authorName, 댓글내용: commentContent },
      options
    ),
  };
}

/**
 * 헬퍼 함수: 좋아요 알림 렌더링
 */
export function renderLikeNotification(
  authorName: string,
  options?: RenderOptions
): { title: string; body: string } {
  const engine = TemplateEngine.getInstance();

  return {
    title: engine.render(
      '{작성자}님이 공감했습니다',
      { 작성자: authorName },
      options
    ),
    body: engine.render(
      '{작성자}님이 회원님의 게시글을 공감했습니다.',
      { 작성자: authorName },
      options
    ),
  };
}

/**
 * 헬퍼 함수: 팔로우 알림 렌더링
 */
export function renderFollowNotification(
  followerName: string,
  options?: RenderOptions
): { title: string; body: string } {
  const engine = TemplateEngine.getInstance();

  return {
    title: engine.render(
      '{팔로워이름}님이 팔로우했습니다',
      { 팔로워이름: followerName },
      options
    ),
    body: engine.render(
      '{팔로워이름}님이 회원님을 팔로우했습니다.',
      { 팔로워이름: followerName },
      options
    ),
  };
}

/**
 * 헬퍼 함수: 멘션 알림 렌더링
 */
export function renderMentionNotification(
  authorName: string,
  postTitle: string,
  options?: RenderOptions
): { title: string; body: string } {
  const engine = TemplateEngine.getInstance();

  return {
    title: engine.render(
      '{작성자}님이 회원님을 언급했습니다',
      { 작성자: authorName },
      options
    ),
    body: engine.render(
      '{작성자}님이 게시글에서 회원님을 언급했습니다: "{게시글제목}"',
      { 작성자: authorName, 게시글제목: postTitle },
      options
    ),
  };
}

/**
 * 헬퍼 함수: 커스텀 알림 렌더링
 */
export function renderCustomNotification(
  titleTemplate: string,
  bodyTemplate: string,
  variables: TemplateVariables,
  options?: RenderOptions
): { title: string; body: string } {
  const engine = TemplateEngine.getInstance();

  return {
    title: engine.render(titleTemplate, variables, options),
    body: engine.render(bodyTemplate, variables, options),
  };
}
