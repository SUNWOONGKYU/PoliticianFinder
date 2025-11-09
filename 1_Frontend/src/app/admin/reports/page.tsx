// Task ID: P7F5
// Admin Report Management Page
// 관리자 신고 관리 페이지 (신고 처리, 검토, 조치)

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  type: 'post' | 'comment' | 'user';
  target: {
    id: string;
    title?: string;
    content: string;
    author: string;
  };
  reporter: {
    id: string;
    name: string;
  };
  reason: string;
  category: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  action?: string;
  reviewer?: string;
}

type ReportType = 'all' | 'post' | 'comment' | 'user';
type ReportStatus = 'all' | 'pending' | 'reviewing' | 'resolved' | 'rejected';

// Sample data
const SAMPLE_REPORTS: Report[] = [
  {
    id: 'R001',
    type: 'post',
    target: {
      id: 'P003',
      title: '부적절한 내용이 포함된 게시글',
      content: '욕설과 비방이 포함된 내용입니다...',
      author: '이영희',
    },
    reporter: { id: 'U001', name: '김민수' },
    reason: '욕설 및 비방',
    category: 'abuse',
    description: '명백한 욕설과 타인 비방이 포함되어 있습니다.',
    createdAt: '2025-11-03T09:30:00Z',
    status: 'pending',
  },
  {
    id: 'R002',
    type: 'comment',
    target: {
      id: 'C123',
      content: '광고성 댓글입니다. 여기를 클릭하세요 http://...',
      author: '최서연',
    },
    reporter: { id: 'U002', name: '박준호' },
    reason: '스팸/광고',
    category: 'spam',
    description: '명백한 광고성 댓글입니다.',
    createdAt: '2025-11-03T08:15:00Z',
    status: 'reviewing',
    reviewer: '관리자A',
  },
  {
    id: 'R003',
    type: 'post',
    target: {
      id: 'P042',
      title: '허위 정보 유포',
      content: '검증되지 않은 허위 사실을 유포하고 있습니다...',
      author: '정민수',
    },
    reporter: { id: 'U003', name: '강지은' },
    reason: '허위 정보',
    category: 'misinformation',
    description: '사실과 다른 정보를 게시하여 혼란을 야기하고 있습니다.',
    createdAt: '2025-11-02T16:20:00Z',
    status: 'resolved',
    action: '게시글 숨김 처리',
    reviewer: '관리자B',
  },
  {
    id: 'R004',
    type: 'user',
    target: {
      id: 'U099',
      content: '반복적인 스팸 게시 행위',
      author: '도배러',
    },
    reporter: { id: 'U004', name: '윤서준' },
    reason: '악의적 행위',
    category: 'abuse',
    description: '지속적으로 도배와 스팸 행위를 반복하고 있습니다.',
    createdAt: '2025-11-02T14:00:00Z',
    status: 'resolved',
    action: '계정 7일 정지',
    reviewer: '관리자A',
  },
  {
    id: 'R005',
    type: 'comment',
    target: {
      id: 'C456',
      content: '정상적인 의견입니다.',
      author: '홍길동',
    },
    reporter: { id: 'U005', name: '신유진' },
    reason: '기타',
    category: 'other',
    description: '개인적으로 마음에 들지 않아서 신고합니다.',
    createdAt: '2025-11-01T10:30:00Z',
    status: 'rejected',
    action: '신고 기각 - 정상 콘텐츠',
    reviewer: '관리자C',
  },
];

const REPORT_CATEGORIES: Record<string, string> = {
  abuse: '욕설/비방',
  spam: '스팸/광고',
  misinformation: '허위정보',
  sexual: '음란물',
  violence: '폭력/혐오',
  privacy: '개인정보 침해',
  copyright: '저작권 침해',
  other: '기타',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기중', color: 'bg-gray-100 text-gray-700' },
  reviewing: { label: '검토중', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '처리완료', color: 'bg-green-100 text-green-700' },
  rejected: { label: '기각됨', color: 'bg-red-100 text-red-700' },
};

const TYPE_LABELS: Record<string, string> = {
  post: '게시글',
  comment: '댓글',
  user: '사용자',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>(SAMPLE_REPORTS);
  const [typeFilter, setTypeFilter] = useState<ReportType>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter reports
  const filteredReports = reports.filter(report => {
    // Type filter
    if (typeFilter !== 'all' && report.type !== typeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !report.id.toLowerCase().includes(query) &&
        !report.target.author.toLowerCase().includes(query) &&
        !report.reporter.name.toLowerCase().includes(query)
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
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: Report['status'], action?: string) => {
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 500));

      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, status: newStatus, action, reviewer: '현재 관리자' }
            : report
        )
      );

      setShowModal(false);
      alert('신고 처리가 완료되었습니다.');
    } catch (error) {
      console.error('Failed to update report status:', error);
      alert('처리 중 오류가 발생했습니다.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
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
                <option value="reviewing">검토중</option>
                <option value="resolved">처리완료</option>
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
                          <p className="text-sm font-medium text-gray-900">{report.id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {TYPE_LABELS[report.type]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {report.target.title && (
                            <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                              {report.target.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {report.target.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            작성자: {report.target.author}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{report.reporter.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {REPORT_CATEGORIES[report.category]}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_LABELS[report.status].color}`}>
                          {STATUS_LABELS[report.status].label}
                        </span>
                        {report.reviewer && (
                          <p className="text-xs text-gray-500 mt-1">
                            담당: {report.reviewer}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
                        >
                          상세보기
                        </button>
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
                      <p className="text-sm font-medium text-gray-900 mb-1">{report.id}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {TYPE_LABELS[report.type]}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_LABELS[report.status].color}`}>
                          {STATUS_LABELS[report.status].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    {report.target.title && (
                      <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                        {report.target.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {report.target.content}
                    </p>
                    <p className="text-xs text-gray-500">
                      작성자: {report.target.author}
                    </p>
                  </div>

                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">신고 사유</p>
                    <p className="text-sm font-medium text-gray-900">
                      {REPORT_CATEGORIES[report.category]}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      <p>신고자: {report.reporter.name}</p>
                      <p>{formatDate(report.createdAt)}</p>
                      {report.reviewer && <p>담당: {report.reviewer}</p>}
                    </div>
                    <button
                      onClick={() => handleViewReport(report)}
                      className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
                    >
                      상세보기
                    </button>
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
                <p className="text-base text-gray-900">{TYPE_LABELS[selectedReport.type]}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">신고 대상</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {selectedReport.target.title && (
                    <p className="font-medium text-gray-900 mb-2">{selectedReport.target.title}</p>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                    {selectedReport.target.content}
                  </p>
                  <p className="text-xs text-gray-500">작성자: {selectedReport.target.author}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고 사유</p>
                <p className="text-base font-medium text-gray-900">
                  {REPORT_CATEGORIES[selectedReport.category]}
                </p>
                <p className="text-sm text-gray-700 mt-1">{selectedReport.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고자</p>
                <p className="text-base text-gray-900">{selectedReport.reporter.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">신고 일시</p>
                <p className="text-base text-gray-900">{formatDate(selectedReport.createdAt)}</p>
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

              {selectedReport.reviewer && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">담당자</p>
                  <p className="text-base text-gray-900">{selectedReport.reviewer}</p>
                </div>
              )}
            </div>

            {selectedReport.status === 'pending' || selectedReport.status === 'reviewing' ? (
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'reviewing')}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  검토 시작
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved', '적절한 조치 완료')}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  처리 완료
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'rejected', '신고 기각')}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  기각
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
    </div>
  );
}
