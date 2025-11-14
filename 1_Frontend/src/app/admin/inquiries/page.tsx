// Task ID: P3F6
// Admin Inquiries Management Page
// 문의 관리 대시보드

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Inquiry {
  id: string;
  email: string;
  title: string;
  content: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  politician_name?: string;
  admin_response?: string;
  created_at: string;
  responded_at?: string;
  resolved_at?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  politician?: {
    id: string;
    name: string;
    party: string;
    position: string;
  };
  admin?: {
    id: string;
    username: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Selected inquiry for detail view
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch inquiries
  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/inquiries?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 목록 조회 실패");
      }

      setInquiries(data.inquiries);
      setPagination(data.pagination);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, priorityFilter, pagination.page]);

  // Update inquiry
  const updateInquiry = async (
    inquiry_id: string,
    updates: {
      status?: string;
      priority?: string;
      admin_response?: string;
    }
  ) => {
    try {
      setUpdating(true);
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiry_id, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 업데이트 실패");
      }

      // Update local state
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiry_id ? data.inquiry : inq))
      );

      // Update selected inquiry if it's the one we updated
      if (selectedInquiry?.id === inquiry_id) {
        setSelectedInquiry(data.inquiry);
      }

      setError("");
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  // Status labels
  const statusLabels: Record<string, string> = {
    pending: "대기중",
    in_progress: "처리중",
    resolved: "해결됨",
    closed: "종료됨",
  };

  const priorityLabels: Record<string, string> = {
    low: "낮음",
    normal: "보통",
    high: "높음",
    urgent: "긴급",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    normal: "bg-blue-100 text-blue-600",
    high: "bg-orange-100 text-orange-600",
    urgent: "bg-red-100 text-red-600",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">문의 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            고객 문의를 확인하고 답변할 수 있습니다.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
                <option value="in_progress">처리중</option>
                <option value="resolved">해결됨</option>
                <option value="closed">종료됨</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">전체</option>
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">대기중</p>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  inquiries.filter((inq) => inq.status === "pending").length
                }
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">처리중</p>
              <p className="text-2xl font-bold text-blue-600">
                {
                  inquiries.filter((inq) => inq.status === "in_progress")
                    .length
                }
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">해결됨</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  inquiries.filter((inq) => inq.status === "resolved").length
                }
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">긴급</p>
              <p className="text-2xl font-bold text-red-600">
                {
                  inquiries.filter((inq) => inq.priority === "urgent").length
                }
              </p>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              문의가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      문의자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      정치인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inquiries.map((inquiry) => (
                    <tr
                      key={inquiry.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inquiry.user?.username || "익명"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {inquiry.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inquiry.politician_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[inquiry.priority]}`}
                        >
                          {priorityLabels[inquiry.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[inquiry.status]}`}
                        >
                          {statusLabels[inquiry.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInquiry(inquiry);
                            setAdminResponse(inquiry.admin_response || "");
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    전체 <span className="font-medium">{pagination.total}</span>
                    개 중{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    표시
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    문의 상세
                  </h2>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Inquiry Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${priorityColors[selectedInquiry.priority]}`}
                    >
                      {priorityLabels[selectedInquiry.priority]}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[selectedInquiry.status]}`}
                    >
                      {statusLabels[selectedInquiry.status]}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      제목
                    </label>
                    <p className="mt-1 text-lg text-gray-900">
                      {selectedInquiry.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        문의자
                      </label>
                      <p className="mt-1 text-gray-900">
                        {selectedInquiry.user?.username || "익명"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedInquiry.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        관련 정치인
                      </label>
                      <p className="mt-1 text-gray-900">
                        {selectedInquiry.politician_name || "-"}
                      </p>
                      {selectedInquiry.politician && (
                        <p className="text-sm text-gray-500">
                          {selectedInquiry.politician.party} ·{" "}
                          {selectedInquiry.politician.position}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      문의 내용
                    </label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {selectedInquiry.content}
                    </p>
                  </div>

                  <div className="text-sm text-gray-500">
                    생성일:{" "}
                    {new Date(selectedInquiry.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Status & Priority Management */}
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">상태 관리</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상태 변경
                      </label>
                      <select
                        value={selectedInquiry.status}
                        onChange={(e) =>
                          updateInquiry(selectedInquiry.id, {
                            status: e.target.value,
                          })
                        }
                        disabled={updating}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="pending">대기중</option>
                        <option value="in_progress">처리중</option>
                        <option value="resolved">해결됨</option>
                        <option value="closed">종료됨</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        우선순위 변경
                      </label>
                      <select
                        value={selectedInquiry.priority}
                        onChange={(e) =>
                          updateInquiry(selectedInquiry.id, {
                            priority: e.target.value,
                          })
                        }
                        disabled={updating}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">낮음</option>
                        <option value="normal">보통</option>
                        <option value="high">높음</option>
                        <option value="urgent">긴급</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Admin Response */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">관리자 답변</h3>

                  {selectedInquiry.admin_response && (
                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        답변일:{" "}
                        {selectedInquiry.responded_at
                          ? new Date(
                              selectedInquiry.responded_at
                            ).toLocaleString()
                          : "-"}
                      </p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedInquiry.admin_response}
                      </p>
                      {selectedInquiry.admin && (
                        <p className="text-sm text-gray-500 mt-2">
                          답변자: {selectedInquiry.admin.username}
                        </p>
                      )}
                    </div>
                  )}

                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="답변 내용을 입력하세요..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      닫기
                    </button>
                    <button
                      onClick={async () => {
                        const success = await updateInquiry(
                          selectedInquiry.id,
                          {
                            admin_response: adminResponse,
                            status: "in_progress",
                          }
                        );
                        if (success) {
                          alert("답변이 저장되었습니다.");
                        }
                      }}
                      disabled={updating || !adminResponse.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? "저장 중..." : "답변 저장"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
