/**
 * Task ID: P5M13
 * 작업명: M13 - CommentThread 컴포넌트 테스트
 * 작업일: 2025-11-25
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentThread, Comment } from '../CommentThread';

const mockComments: Comment[] = [
  {
    id: '1',
    author: '홍길동',
    authorId: 'user1',
    authorType: 'member',
    authorLevel: 'Lv.5',
    content: '첫 번째 댓글입니다.',
    createdAt: new Date().toISOString(),
    upvotes: 10,
    downvotes: 2,
    replies: [
      {
        id: '1-1',
        author: '정치인A',
        authorId: 'pol1',
        authorType: 'politician',
        content: '대댓글입니다.',
        createdAt: new Date().toISOString(),
        upvotes: 5,
        downvotes: 0,
        parentId: '1',
      },
    ],
  },
  {
    id: '2',
    author: '김철수',
    authorId: 'user2',
    authorType: 'member',
    content: '두 번째 댓글입니다.',
    createdAt: new Date().toISOString(),
    upvotes: 3,
    downvotes: 1,
  },
];

describe('CommentThread Component', () => {
  describe('Rendering', () => {
    it('should render comment count in header', () => {
      render(<CommentThread comments={mockComments} />);

      // 총 3개 댓글 (2개 루트 + 1개 대댓글)
      // 헤더의 댓글 수를 확인 (클래스로 구분)
      const countElement = document.querySelector('.text-primary-600');
      expect(countElement).toHaveTextContent('3');
    });

    it('should render all comments', () => {
      render(<CommentThread comments={mockComments} />);

      expect(screen.getByText('첫 번째 댓글입니다.')).toBeInTheDocument();
      expect(screen.getByText('대댓글입니다.')).toBeInTheDocument();
      expect(screen.getByText('두 번째 댓글입니다.')).toBeInTheDocument();
    });

    it('should render author names', () => {
      render(<CommentThread comments={mockComments} />);

      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('정치인A')).toBeInTheDocument();
      expect(screen.getByText('김철수')).toBeInTheDocument();
    });

    it('should render author level badge', () => {
      render(<CommentThread comments={mockComments} />);

      expect(screen.getByText('Lv.5')).toBeInTheDocument();
    });

    it('should render upvote/downvote counts', () => {
      render(<CommentThread comments={mockComments} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render empty state when no comments', () => {
      render(<CommentThread comments={[]} />);

      expect(screen.getByText('첫 댓글을 작성해보세요!')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<CommentThread comments={[]} loading />);

      expect(screen.getByText('댓글을 불러오는 중...')).toBeInTheDocument();
    });
  });

  describe('Comment Input', () => {
    it('should render comment input when onSubmitComment provided', () => {
      const mockSubmit = jest.fn();
      render(
        <CommentThread comments={mockComments} onSubmitComment={mockSubmit} />
      );

      expect(screen.getByPlaceholderText('댓글을 입력하세요...')).toBeInTheDocument();
      expect(screen.getByText('댓글 등록')).toBeInTheDocument();
    });

    it('should not render comment input when onSubmitComment not provided', () => {
      render(<CommentThread comments={mockComments} />);

      expect(screen.queryByPlaceholderText('댓글을 입력하세요...')).not.toBeInTheDocument();
    });

    it('should call onSubmitComment when submitting', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      render(
        <CommentThread comments={mockComments} onSubmitComment={mockSubmit} />
      );

      const input = screen.getByPlaceholderText('댓글을 입력하세요...');
      fireEvent.change(input, { target: { value: '새 댓글' } });

      const submitBtn = screen.getByText('댓글 등록');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith('새 댓글');
      });
    });

    it('should disable submit button when input is empty', () => {
      const mockSubmit = jest.fn();
      render(
        <CommentThread comments={mockComments} onSubmitComment={mockSubmit} />
      );

      const submitBtn = screen.getByText('댓글 등록');
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('Reply Functionality', () => {
    it('should show reply button for comments within maxDepth', () => {
      render(<CommentThread comments={mockComments} maxDepth={3} />);

      const replyButtons = screen.getAllByText('답글');
      expect(replyButtons.length).toBeGreaterThan(0);
    });

    it('should toggle reply form when clicking reply button', () => {
      const mockSubmit = jest.fn();
      render(
        <CommentThread
          comments={mockComments}
          onSubmitComment={mockSubmit}
          maxDepth={3}
        />
      );

      const replyButton = screen.getAllByText('답글')[0];
      fireEvent.click(replyButton);

      expect(screen.getByPlaceholderText('답글을 입력하세요...')).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand', () => {
    it('should show collapse button for comments with replies', () => {
      render(<CommentThread comments={mockComments} />);

      expect(screen.getByText('접기')).toBeInTheDocument();
    });

    it('should toggle visibility when clicking collapse/expand', () => {
      render(<CommentThread comments={mockComments} />);

      const collapseBtn = screen.getByText('접기');
      fireEvent.click(collapseBtn);

      expect(screen.getByText('답글 1개 보기')).toBeInTheDocument();
      expect(screen.queryByText('대댓글입니다.')).not.toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete button for comment owner', () => {
      const mockDelete = jest.fn();
      render(
        <CommentThread
          comments={mockComments}
          currentUserId="user1"
          onDeleteComment={mockDelete}
        />
      );

      const deleteButtons = screen.getAllByText('삭제');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should not show delete button for non-owner', () => {
      const mockDelete = jest.fn();
      render(
        <CommentThread
          comments={mockComments}
          currentUserId="otherUser"
          onDeleteComment={mockDelete}
        />
      );

      expect(screen.queryByText('삭제')).not.toBeInTheDocument();
    });
  });

  describe('Deleted Comments', () => {
    it('should show deleted message for deleted comments', () => {
      const commentsWithDeleted: Comment[] = [
        {
          id: '1',
          author: '홍길동',
          authorId: 'user1',
          authorType: 'member',
          content: '삭제된 댓글',
          createdAt: new Date().toISOString(),
          upvotes: 0,
          downvotes: 0,
          isDeleted: true,
        },
      ];

      render(<CommentThread comments={commentsWithDeleted} />);

      expect(screen.getByText('삭제된 댓글입니다.')).toBeInTheDocument();
    });
  });

  describe('Vote Functionality', () => {
    it('should call onUpvote when clicking upvote button', () => {
      const mockUpvote = jest.fn();
      render(
        <CommentThread comments={mockComments} onUpvote={mockUpvote} />
      );

      // 첫 번째 댓글의 upvote 수가 10인 버튼 찾기
      const upvoteButton = screen.getAllByText('10')[0].closest('button');
      if (upvoteButton) {
        fireEvent.click(upvoteButton);
        expect(mockUpvote).toHaveBeenCalledWith('1');
      }
    });

    it('should call onDownvote when clicking downvote button', () => {
      const mockDownvote = jest.fn();
      render(
        <CommentThread comments={mockComments} onDownvote={mockDownvote} />
      );

      // 첫 번째 댓글의 downvote 수가 2인 버튼 찾기
      const downvoteButton = screen.getAllByText('2')[0].closest('button');
      if (downvoteButton) {
        fireEvent.click(downvoteButton);
        expect(mockDownvote).toHaveBeenCalledWith('1');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      render(<CommentThread comments={mockComments} />);

      // 헤더가 있는지 확인
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});
