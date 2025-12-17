// P3BA39: 연결 서비스 관리 Admin 페이지
// 정치인-시민 연결 요청 관리 대시보드

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Connection {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
  politician_id: string;
  subject: string;
  message: string;
  purpose?: string;
  preferred_date?: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  admin_notes?: string;
  processed_at?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  politicians?: {
    id: string;
    name: string;
    party: string;
    position: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "승인됨", color: "bg-green-100 text-green-800" },
  rejected: { label: "거부됨", color: "bg-red-100 text-red-800" },
  completed: { label: "완료됨", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "취소됨", color: "bg-gray-100 text-gray-800" },
};

export default function AdminConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Selected connection for detail view
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch connections
  const fetchConnections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/connections?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "연결 요청 목록 조회 실패");
      }

      setConnections(data.data || []);
      setPagination(data.pagination);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [statusFilter, pagination.page]);

  // Update connection status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch("/api/admin/connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          admin_notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상태 변경 실패");
      }

      // Refresh list
      fetchConnections();
      setSelectedConnection(null);
      setAdminNotes("");
      alert("연결 요청이 처리되었습니다.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">연결 서비스 관리</h1>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="font-medium">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거부됨</option>
              <option value="completed">완료됨</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => {
                const count = connections.filter((c) => c.status === key).length;
                return (
                  <div key={key} className="bg-white rounded-lg shadow p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${color}`}>
                      {label}
                    </span>
                    <p className="text-2xl font-bold mt-2">{count}</p>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      요청자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      정치인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      요청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        연결 요청이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    connections.map((connection) => (
                      <tr key={connection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {connection.requester_name || "익명"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {connection.requester_email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {connection.politicians ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {connection.politicians.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {connection.politicians.party} · {connection.politicians.position}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {connection.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              STATUS_LABELS[connection.status]?.color || "bg-gray-100"
                            }`}
                          >
                            {STATUS_LABELS[connection.status]?.label || connection.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(connection.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedConnection(connection);
                              setAdminNotes(connection.admin_notes || "");
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">연결 요청 상세</h2>
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* 요청자 정보 */}
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-2">요청자 정보</h3>
                  <p>이름: {selectedConnection.requester_name || "익명"}</p>
                  <p>이메일: {selectedConnection.requester_email}</p>
                  {selectedConnection.requester_phone && (
                    <p>연락처: {selectedConnection.requester_phone}</p>
                  )}
                </div>

                {/* 정치인 정보 */}
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-2">연결 대상 정치인</h3>
                  {selectedConnection.politicians ? (
                    <>
                      <p>이름: {selectedConnection.politicians.name}</p>
                      <p>정당: {selectedConnection.politicians.party}</p>
                      <p>직위: {selectedConnection.politicians.position}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">정보 없음</p>
                  )}
                </div>

                {/* 요청 내용 */}
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-2">요청 내용</h3>
                  <p className="font-medium">{selectedConnection.subject}</p>
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                    {selectedConnection.message}
                  </p>
                  {selectedConnection.purpose && (
                    <p className="mt-2">목적: {selectedConnection.purpose}</p>
                  )}
                  {selectedConnection.preferred_date && (
                    <p>희망 일시: {selectedConnection.preferred_date}</p>
                  )}
                </div>

                {/* 관리자 메모 */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">관리자 메모</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full border rounded p-2 h-24"
                    placeholder="관리자 메모를 입력하세요..."
                  />
                </div>

                {/* 처리 버튼 */}
                {selectedConnection.status === "pending" && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => updateStatus(selectedConnection.id, "approved")}
                      disabled={updating}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {updating ? "처리 중..." : "승인"}
                    </button>
                    <button
                      onClick={() => updateStatus(selectedConnection.id, "rejected")}
                      disabled={updating}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {updating ? "처리 중..." : "거부"}
                    </button>
                  </div>
                )}

                {selectedConnection.status === "approved" && (
                  <div className="pt-4">
                    <button
                      onClick={() => updateStatus(selectedConnection.id, "completed")}
                      disabled={updating}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? "처리 중..." : "완료 처리"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
