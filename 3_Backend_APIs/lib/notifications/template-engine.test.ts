/**
 * P4BA11: Template Engine Unit Tests
 * 작업일: 2025-11-09
 * 설명: 템플릿 엔진 단위 테스트
 */

import {
  TemplateEngine,
  TemplateVariables,
  RenderOptions,
  renderCommentNotification,
  renderLikeNotification,
  renderFollowNotification,
  renderMentionNotification,
  renderCustomNotification,
} from './template-engine';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = TemplateEngine.getInstance();
  });

  describe('render', () => {
    it('should render template with simple variables', () => {
      const template = '{작성자}님이 댓글을 남겼습니다';
      const variables: TemplateVariables = { 작성자: '홍길동' };
      const result = engine.render(template, variables);
      expect(result).toBe('홍길동님이 댓글을 남겼습니다');
    });

    it('should render template with multiple variables', () => {
      const template = '{작성자}님이 {게시글제목}에 댓글을 남겼습니다';
      const variables: TemplateVariables = {
        작성자: '홍길동',
        게시글제목: '정치인 검색 서비스',
      };
      const result = engine.render(template, variables);
      expect(result).toBe('홍길동님이 정치인 검색 서비스에 댓글을 남겼습니다');
    });

    it('should handle missing variables with fallback', () => {
      const template = '{작성자}님이 {존재하지않는변수}를 남겼습니다';
      const variables: TemplateVariables = { 작성자: '홍길동' };
      const options: RenderOptions = { fallbackValue: '[알 수 없음]' };
      const result = engine.render(template, variables, options);
      expect(result).toBe('홍길동님이 [알 수 없음]를 남겼습니다');
    });

    it('should truncate long content', () => {
      const template = '{댓글내용}';
      const variables: TemplateVariables = {
        댓글내용: 'A'.repeat(100),
      };
      const options: RenderOptions = { truncateLength: 50 };
      const result = engine.render(template, variables, options);
      expect(result).toBe('A'.repeat(50) + '...');
    });

    it('should escape HTML by default', () => {
      const template = '{댓글내용}';
      const variables: TemplateVariables = {
        댓글내용: '<script>alert("XSS")</script>',
      };
      const result = engine.render(template, variables);
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should not escape HTML when disabled', () => {
      const template = '{댓글내용}';
      const variables: TemplateVariables = {
        댓글내용: '<b>Bold</b>',
      };
      const options: RenderOptions = { escapeHtml: false };
      const result = engine.render(template, variables, options);
      expect(result).toBe('<b>Bold</b>');
    });

    it('should handle empty template', () => {
      const template = '';
      const variables: TemplateVariables = { 작성자: '홍길동' };
      const result = engine.render(template, variables);
      expect(result).toBe('');
    });

    it('should handle template with no variables', () => {
      const template = '시스템 알림입니다.';
      const variables: TemplateVariables = {};
      const result = engine.render(template, variables);
      expect(result).toBe('시스템 알림입니다.');
    });
  });

  describe('renderMultiple', () => {
    it('should render multiple templates', () => {
      const templates = {
        title: '{작성자}님의 알림',
        body: '{작성자}님이 {행동}했습니다.',
      };
      const variables: TemplateVariables = {
        작성자: '홍길동',
        행동: '댓글을 남겼습니다',
      };
      const result = engine.renderMultiple(templates, variables);
      expect(result.title).toBe('홍길동님의 알림');
      expect(result.body).toBe('홍길동님이 댓글을 남겼습니다했습니다.');
    });
  });

  describe('validate', () => {
    it('should validate correct template', () => {
      const template = '{작성자}님이 {행동}했습니다.';
      const result = engine.validate(template);
      expect(result.valid).toBe(true);
      expect(result.variables).toEqual(['작성자', '행동']);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty template', () => {
      const template = '';
      const result = engine.validate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template cannot be empty');
    });

    it('should detect empty variable names', () => {
      const template = '{}님이 댓글을 남겼습니다.';
      const result = engine.validate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Empty variable name'))).toBe(true);
    });

    it('should detect nested braces', () => {
      const template = '{{작성자}}님이 댓글을 남겼습니다.';
      const result = engine.validate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('nested braces'))).toBe(true);
    });

    it('should handle duplicate variables', () => {
      const template = '{작성자}님이 {작성자}님의 글에 댓글을 남겼습니다.';
      const result = engine.validate(template);
      expect(result.valid).toBe(true);
      expect(result.variables).toEqual(['작성자']);
    });
  });

  describe('extractVariables', () => {
    it('should extract all variables', () => {
      const template = '{작성자}님이 {게시글제목}에 {댓글내용}를 남겼습니다.';
      const variables = engine.extractVariables(template);
      expect(variables).toEqual(['작성자', '게시글제목', '댓글내용']);
    });

    it('should return empty array for template without variables', () => {
      const template = '시스템 알림입니다.';
      const variables = engine.extractVariables(template);
      expect(variables).toEqual([]);
    });

    it('should handle whitespace in variable names', () => {
      const template = '{ 작성자 }님이 댓글을 남겼습니다.';
      const variables = engine.extractVariables(template);
      expect(variables).toEqual(['작성자']);
    });
  });

  describe('validateVariables', () => {
    it('should validate when all variables are provided', () => {
      const template = '{작성자}님이 {행동}했습니다.';
      const variables: TemplateVariables = {
        작성자: '홍길동',
        행동: '댓글을 남겼습니다',
      };
      const result = engine.validateVariables(template, variables);
      expect(result.valid).toBe(true);
      expect(result.missingVariables).toHaveLength(0);
    });

    it('should detect missing variables', () => {
      const template = '{작성자}님이 {행동}했습니다.';
      const variables: TemplateVariables = { 작성자: '홍길동' };
      const result = engine.validateVariables(template, variables);
      expect(result.valid).toBe(false);
      expect(result.missingVariables).toContain('행동');
    });
  });

  describe('preview', () => {
    it('should generate preview with sample data', () => {
      const template = '{작성자}님이 댓글을 남겼습니다: "{댓글내용}"';
      const preview = engine.preview(template);
      expect(preview).toContain('님이 댓글을 남겼습니다:');
      expect(preview.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    describe('renderCommentNotification', () => {
      it('should render comment notification', () => {
        const result = renderCommentNotification('홍길동', '좋은 글 감사합니다!');
        expect(result.title).toBe('홍길동님이 댓글을 남겼습니다');
        expect(result.body).toContain('홍길동님이 회원님의 게시글에 댓글을 남겼습니다');
        expect(result.body).toContain('좋은 글 감사합니다!');
      });

      it('should truncate long comment content', () => {
        const longComment = 'A'.repeat(100);
        const options: RenderOptions = { truncateLength: 50 };
        const result = renderCommentNotification('홍길동', longComment, options);
        expect(result.body).toContain('A'.repeat(50) + '...');
      });
    });

    describe('renderLikeNotification', () => {
      it('should render like notification', () => {
        const result = renderLikeNotification('김철수');
        expect(result.title).toBe('김철수님이 공감했습니다');
        expect(result.body).toBe('김철수님이 회원님의 게시글을 공감했습니다.');
      });
    });

    describe('renderFollowNotification', () => {
      it('should render follow notification', () => {
        const result = renderFollowNotification('이영희');
        expect(result.title).toBe('이영희님이 팔로우했습니다');
        expect(result.body).toBe('이영희님이 회원님을 팔로우했습니다.');
      });
    });

    describe('renderMentionNotification', () => {
      it('should render mention notification', () => {
        const result = renderMentionNotification('박지성', '정치인 검색 서비스 소개');
        expect(result.title).toBe('박지성님이 회원님을 언급했습니다');
        expect(result.body).toContain('박지성님이 게시글에서 회원님을 언급했습니다');
        expect(result.body).toContain('정치인 검색 서비스 소개');
      });
    });

    describe('renderCustomNotification', () => {
      it('should render custom notification', () => {
        const titleTemplate = '{사용자}님께 {타입} 알림';
        const bodyTemplate = '{사용자}님, {메시지}';
        const variables: TemplateVariables = {
          사용자: '홍길동',
          타입: '시스템',
          메시지: '새로운 업데이트가 있습니다.',
        };
        const result = renderCustomNotification(
          titleTemplate,
          bodyTemplate,
          variables
        );
        expect(result.title).toBe('홍길동님께 시스템 알림');
        expect(result.body).toBe('홍길동님, 새로운 업데이트가 있습니다.');
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const engine1 = TemplateEngine.getInstance();
      const engine2 = TemplateEngine.getInstance();
      expect(engine1).toBe(engine2);
    });
  });

  describe('Security', () => {
    it('should prevent XSS attacks', () => {
      const template = '{댓글내용}';
      const variables: TemplateVariables = {
        댓글내용: '<script>alert("XSS")</script>',
      };
      const result = engine.render(template, variables);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape special HTML characters', () => {
      const template = '{내용}';
      const variables: TemplateVariables = {
        내용: '& < > " \' /',
      };
      const result = engine.render(template, variables);
      expect(result).toBe('&amp; &lt; &gt; &quot; &#39; &#x2F;');
    });
  });
});
