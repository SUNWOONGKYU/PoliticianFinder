"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  NotificationBell,
  NotificationDropdown,
  CommentForm,
  CommentList,
  ReplyThread,
  LikeButton,
  LikeStats,
  MentionInput
} from './index'
import { Comment, CreateCommentDto } from '@/types/phase3-database'

/**
 * Community Components Usage Example
 * Phase 3 Frontend Components 통합 예제
 */

// 샘플 데이터
const sampleComments: Comment[] = [
  {
    id: 1,
    post_id: 1,
    user_id: 'user1',
    content: '정말 좋은 정책이라고 생각합니다. @user2 님 의견은 어떠신가요?',
    parent_id: null,
    depth: 0,
    path: '1',
    mentioned_users: ['user2'],
    upvotes: 15,
    downvotes: 2,
    score: 13,
    status: 'active' as any,
    is_edited: false,
    edit_count: 0,
    is_deleted: false,
    report_count: 0,
    is_hidden: false,
    created_at: '2025-01-17T10:00:00Z',
    updated_at: '2025-01-17T10:00:00Z',
    author: {
      id: 'user1',
      username: 'citizen_kim',
      full_name: '김시민',
      avatar_url: '/avatars/user1.jpg',
      is_admin: false,
      user_type: 'normal',
      user_level: 3,
      points: 1250,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2025-01-17T10:00:00Z'
    }
  },
  {
    id: 2,
    post_id: 1,
    user_id: 'user2',
    content: '저도 동의합니다. 특히 환경 문제 해결에 도움이 될 것 같네요.',
    parent_id: 1,
    depth: 1,
    path: '1.2',
    upvotes: 8,
    downvotes: 1,
    score: 7,
    status: 'active' as any,
    is_edited: true,
    edited_at: '2025-01-17T11:00:00Z',
    edit_count: 1,
    is_deleted: false,
    report_count: 0,
    is_hidden: false,
    created_at: '2025-01-17T10:30:00Z',
    updated_at: '2025-01-17T11:00:00Z',
    author: {
      id: 'user2',
      username: 'eco_lee',
      full_name: '이환경',
      avatar_url: '/avatars/user2.jpg',
      is_admin: false,
      user_type: 'normal',
      user_level: 5,
      points: 3200,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2025-01-17T10:00:00Z'
    }
  }
]

export function CommunityExample() {
  const [mentionText, setMentionText] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const currentUserId = 'current-user-id'

  const handleCommentSubmit = async (comment: CreateCommentDto) => {
    console.log('New comment:', comment)
    // API 호출 로직
  }

  const handleReply = (parentId: number) => {
    console.log('Reply to comment:', parentId)
  }

  const handleEdit = (commentId: number) => {
    console.log('Edit comment:', commentId)
  }

  const handleDelete = (commentId: number) => {
    console.log('Delete comment:', commentId)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Phase 3 Community Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications">알림</TabsTrigger>
              <TabsTrigger value="comments">댓글</TabsTrigger>
              <TabsTrigger value="likes">좋아요</TabsTrigger>
              <TabsTrigger value="mentions">멘션</TabsTrigger>
            </TabsList>

            {/* P3F1 & P3F5: 알림 시스템 */}
            <TabsContent value="notifications" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">알림 시스템</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">알림 벨 (P3F1)</p>
                    <NotificationBell userId={currentUserId} />
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">알림 드롭다운 (P3F5)</p>
                    <NotificationDropdown userId={currentUserId} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* P3F2, P3F3, P3F4: 댓글 시스템 */}
            <TabsContent value="comments" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">댓글 시스템</h3>

                {/* 댓글 작성 폼 */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">댓글 작성 (P3F2)</p>
                  <CommentForm
                    postId={1}
                    onSubmit={handleCommentSubmit}
                    currentUser={{
                      id: currentUserId,
                      username: 'current_user',
                      avatar_url: '/avatars/current.jpg'
                    }}
                  />
                </div>

                <Separator />

                {/* 댓글 목록 */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">댓글 목록 (P3F3)</p>
                  <CommentList
                    postId={1}
                    comments={sampleComments}
                    currentUserId={currentUserId}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>

                <Separator />

                {/* 대댓글 스레드 */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">대댓글 (P3F4)</p>
                  <Card className="p-4">
                    <ReplyThread
                      parentComment={sampleComments[0]}
                      replies={sampleComments.filter(c => c.parent_id === 1)}
                      currentUserId={currentUserId}
                      onReplySubmit={async (parentId, content) => {
                        console.log('Reply:', { parentId, content })
                      }}
                    />
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* P3F6: 좋아요 시스템 */}
            <TabsContent value="likes" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">좋아요 시스템 (P3F6)</h3>

                <div className="space-y-4">
                  {/* 기본 좋아요 버튼 */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">기본 스타일</p>
                    <div className="flex gap-4">
                      <LikeButton
                        targetId={1}
                        targetType="post"
                        initialCount={42}
                        size="sm"
                      />
                      <LikeButton
                        targetId={1}
                        targetType="post"
                        initialCount={42}
                        size="md"
                      />
                      <LikeButton
                        targetId={1}
                        targetType="post"
                        initialCount={42}
                        size="lg"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* 미니멀 스타일 */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">미니멀 스타일</p>
                    <LikeButton
                      targetId={2}
                      targetType="comment"
                      initialCount={15}
                      variant="minimal"
                    />
                  </div>

                  <Separator />

                  {/* 이모지 스타일 */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">이모지 스타일</p>
                    <LikeButton
                      targetId={3}
                      targetType="post"
                      initialCount={128}
                      variant="emoji"
                      showTypes
                    />
                  </div>

                  <Separator />

                  {/* 좋아요 통계 */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">좋아요 통계</p>
                    <LikeStats targetId={1} targetType="post" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* P3F7: 멘션 시스템 */}
            <TabsContent value="mentions" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">멘션 시스템 (P3F7)</h3>

                <div>
                  <p className="text-sm text-gray-600 mb-2">멘션 입력 (@username)</p>
                  <MentionInput
                    value={mentionText}
                    onChange={(value, mentions) => {
                      setMentionText(value)
                      setMentions(mentions)
                    }}
                    placeholder="@를 입력하여 사용자를 멘션하세요..."
                    onMentionSelect={(user) => {
                      console.log('Selected user:', user)
                    }}
                  />

                  {mentions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">멘션된 사용자:</p>
                      <div className="flex flex-wrap gap-2">
                        {mentions.map((username, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            @{username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 통합 예제 */}
      <Card>
        <CardHeader>
          <CardTitle>통합 예제</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">커뮤니티 게시글</h3>
              <div className="flex items-center gap-2">
                <LikeButton
                  targetId={100}
                  targetType="post"
                  initialCount={256}
                  showTypes
                />
                <NotificationDropdown userId={currentUserId} />
              </div>
            </div>

            <Separator />

            {/* 댓글 영역 */}
            <div>
              <CommentForm
                postId={100}
                onSubmit={handleCommentSubmit}
                placeholder="@를 사용하여 다른 사용자를 멘션할 수 있습니다..."
              />
              <div className="mt-4">
                <CommentList
                  postId={100}
                  comments={sampleComments}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}