// Task ID: P7F5
// Admin Report Management Page
// 관리자 신고 관리 페이지 (신고 처리, 검토, 조치)

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  target_type: 'post' | 'comment' | 'user';
  target_id: string;
  reason: string;
  description: string;
  reporter_id: string;
  status: 'pending' | 'pending_review' | 'accepted' | 'rejected';
  action?: string | null;
  admin_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  updated_at: string;
  users?: {
    id: string;
    username: string;
    email: string;
  };
}

type ReportType = 'all' | 'post' | 'comment' | 'user';
type ReportStatus = 'all' | 'pending' | 'pending_review' | 'accepted' | 'rejected';

interface AIModerateResult {
  reportId: string;
  action: 'ignore' | 'review' | 'delete';
  severity: number;
  riskLevel: string;
  reasons: string[];
  aiAnalysis: string;
  actionTaken: {
    contentDeleted: boolean;
    userWarned: boolean;
    adminNotified: boolean;
  };
  metadata: {
    analyzedAt: string;
    confidence: number;
    model: string;
  };
}

const REPORT_CATEGORIES: Record<string, string> = {
  spam: '스팸/광고',
  violence: '폭력/혐오',
  hate_speech: '욕설/비방',
  inappropriate: '부적절한 콘텐츠',
  copyright: '저작권 침해',
  other: '기타',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기중', color: 'bg-gray-100 text-gray-700' },
  pending_review: { label: '검토중', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: '처리완료', color: 'bg-green-100 text-green-700' },
  rejected: { label: '기각됨', color: 'bg-red-100 text-red-700' },
};

const TYPE_LABELS: Record<string, string> = {
  post: '게시글',
  comment: '댓글',
  user: '사용자',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [typeFilter, setTypeFilter] = useState<ReportType>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResult, setAIResult] = useState<AIModerateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [aiLoading, setAILoading] = useState(false);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '신고 목록을 불러오는데 실패했습니다.');
      }

      setReports(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    // Type filter
    if (typeFilter !== 'all' && report.target_type !== typeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const username = report.users?.username || '';
      if (
        !report.id.toLowerCase().includes(query) &&
        !username.toLowerCase().includes(query) &&
        !report.target_id.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'pending_review').length,
    resolved: reports.filter(r => r.status === 'accepted').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: Report['status'], action?: string) => {
    try {
      setUpdating(true);

      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          status: newStatus,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '신고 상태 업데이트에 실패했습니다.');
      }

      // Update local state
      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, status: newStatus, action, updated_at: new Date().toISOString() }
            : report
        )
      );

      setShowModal(false);
      alert('신고 처리가 완료되었습니다.');
    } catch (error) {
      console.error('Failed to update report status:', error);
      alert(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAIAutoModerate = async (report: Report) => {
    try {
      setAILoading(true);
      setAIResult(null);

      const response = await fetch('/api/admin/auto-moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          contentType: report.target_type,
          contentId: report.target_id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'AI 자동 중재에 실패했습니다.');
      }

      setAIResult(result.data);
      setShowAIModal(true);

      // Refresh reports to get updated status
      await fetchReports();
    } catch (error) {
      console.error('Failed to auto-moderate:', error);
      alert(error instanceof Error ? error.message : 'AI 중재 중 오류가 발생했습니다.');
    } finally {
      setAILoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f97316] mx-auto mb-4"></div>
          <p className="text-gray-600">신고 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-[#f97316]">홈</Link>
            <span>/</span>
            <Link href="/admin" className="hover:text-[#f97316]">관리자</Link>
            <span>/</span>
            <span className="text-gray-900">신고 관리</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">신고 관리</h1>
              <p className="mt-2 text-gray-600">
                사용자 신고를 검토하고 적절한 조치를 취할 수 있습니다.
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              관리자 대시보드
            </Link>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">전체 신고</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">대기중</p>
            <p className="text-2xl font-bold text-gray-700">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">검토중</p>
            <p className="text-2xl font-bold text-blue-600">{stats.reviewing}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">처리완료</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">기각됨</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 유형
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ReportType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="post">게시글</option>
                <option value="comment">댓글</option>
                <option value="user">사용자</option>
              </select>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                처리 상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
                <option value="pending_review">검토중</option>
                <option value="accepted">처리완료</option>
                <option value="rejected">기각됨</option>
              </select>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="신고 ID, 작성자, 신고자"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{filteredReports.length}</span>건의 신고
          </p>
        </div>

        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신고 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대상
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신고자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사유
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      조회된 신고가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.id.substring(0, 8)}...</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {TYPE_LABELS[report.target_type]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(report.created_at)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {report.target_id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            대상 ID
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{report.users?.username || 'Unknown'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {REPORT_CATEGORIES[report.reason] || report.reason}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {report.description || '설명 없음'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_LABELS[report.status].color}`}>
                          {STATUS_LABELS[report.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
                          >
                            상세보기
                          </button>
                          {(report.status === 'pending' || report.status === 'pending_review') && (
                            <button
                              onClick={() => handleAIAutoModerate(report)}
                              disabled={aiLoading}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              {aiLoading ? 'AI 분석 중...' : 'AI 자동 중재'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          
          <div className="lg:hidden divide-y divide-gray-200">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                조회된 신고가 없습니다.
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">{report.id.substring(0, 8)}...</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {TYPE_LABELS[report.target_type]}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_LABELS[report.status].color}`}>
                          {STATUS_LABELS[report.status].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      대상 ID: {report.target_id}
                    </p>
                  </div>

                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">신고 사유</p>
                    <p className="text-sm font-medium text-gray-900">
                      {REPORT_CATEGORIES[report.reason] || report.reason}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {report.description || '설명 없음'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      <p>신고자: {report.users?.username || 'Unknown'}</p>
                      <p>{formatDate(report.created_at)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
                      >
                        상세보기
                      </button>
                      {(report.status === 'pending' || report.status === 'pending_review') && (
                        <button
                          onClick={() => handleAIAutoModerate(report)}
                          disabled={aiLoading}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                        >
                          {aiLoading ? 'AI 분석 중...' : 'AI 자동 중재'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">신고 상세 정보</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">신고 ID</p>
                <p className="text-base font-medium text-gray-900">{selectedReport.id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고 유형</p>
                <p className="text-base text-gray-900">{TYPE_LABELS[selectedReport.target_type]}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">신고 대상</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                    대상 ID: {selectedReport.target_id}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고 사유</p>
                <p className="text-base font-medium text-gray-900">
                  {REPORT_CATEGORIES[selectedReport.reason] || selectedReport.reason}
                </p>
                <p className="text-sm text-gray-700 mt-1">{selectedReport.description || '설명 없음'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고자</p>
                <p className="text-base text-gray-900">{selectedReport.users?.username || 'Unknown'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고 일시</p>
                <p className="text-base text-gray-900">{formatDate(selectedReport.created_at)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">처리 상태</p>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_LABELS[selectedReport.status].color}`}>
                  {STATUS_LABELS[selectedReport.status].label}
                </span>
              </div>

              {selectedReport.action && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">조치 내용</p>
                  <p className="text-base text-gray-900">{selectedReport.action}</p>
                </div>
              )}

              {selectedReport.admin_notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">관리자 노트</p>
                  <p className="text-base text-gray-900">{selectedReport.admin_notes}</p>
                </div>
              )}
            </div>

            {selectedReport.status === 'pending' || selectedReport.status === 'pending_review' ? (
              <div className="p-6 border-t border-gray-200 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'pending_review')}
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updating ? '처리 중...' : '검토 시작'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'accepted', '적절한 조치 완료')}
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updating ? '처리 중...' : '처리 완료'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'rejected', '신고 기각')}
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updating ? '처리 중...' : '기각'}
                  </button>
                </div>
                <button
                  onClick={() => handleAIAutoModerate(selectedReport)}
                  disabled={aiLoading}
                  className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {aiLoading ? 'AI 분석 중...' : 'AI 자동 중재'}
                </button>
              </div>
            ) : (
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAIModal && aiResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">AI 자동 중재 결과</h2>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">권장 조치</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    aiResult.action === 'delete' ? 'bg-red-100 text-red-700' :
                    aiResult.action === 'review' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {aiResult.action === 'delete' ? '삭제' :
                     aiResult.action === 'review' ? '검토 필요' :
                     '무시'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">심각도</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        aiResult.severity >= 70 ? 'bg-red-600' :
                        aiResult.severity >= 40 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${aiResult.severity}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{aiResult.severity}/100</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">위험도: {aiResult.riskLevel}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신뢰도</p>
                <p className="text-base text-gray-900">{(aiResult.metadata.confidence * 100).toFixed(1)}%</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">분석 이유</p>
                <ul className="space-y-1">
                  {aiResult.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">AI 분석</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResult.aiAnalysis}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">실행된 조치</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${aiResult.actionTaken.contentDeleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {aiResult.actionTaken.contentDeleted ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-gray-700">콘텐츠 삭제</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${aiResult.actionTaken.userWarned ? 'text-green-600' : 'text-gray-400'}`}>
                      {aiResult.actionTaken.userWarned ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-gray-700">사용자 경고</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${aiResult.actionTaken.adminNotified ? 'text-green-600' : 'text-gray-400'}`}>
                      {aiResult.actionTaken.adminNotified ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-gray-700">관리자 알림</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t">
                <p>분석 시각: {new Date(aiResult.metadata.analyzedAt).toLocaleString('ko-KR')}</p>
                <p>모델: {aiResult.metadata.model}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAIModal(false)}
                className="w-full px-4 py-2.5 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
