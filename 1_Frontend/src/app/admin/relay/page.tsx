// P3BA40: 중개 서비스 업체 관리 Admin 페이지
// 중개 업체 등록/관리 대시보드

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RelayProvider {
  id: string;
  name: string;
  service_type: string;
  company_description: string;
  service_description: string;
  phone: string;
  email: string;
  website?: string;
  address?: string;
  logo_url?: string;
  representative?: string;
  business_number?: string;
  status: "active" | "inactive" | "pending";
  display_order: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "활성", color: "bg-green-100 text-green-800" },
  inactive: { label: "비활성", color: "bg-gray-100 text-gray-800" },
  pending: { label: "심사중", color: "bg-yellow-100 text-yellow-800" },
};

type StatusType = "active" | "inactive" | "pending";

interface FormData {
  name: string;
  service_type: string;
  company_description: string;
  service_description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo_url: string;
  representative: string;
  business_number: string;
  status: StatusType;
  display_order: number;
}

const INITIAL_FORM: FormData = {
  name: "",
  service_type: "",
  company_description: "",
  service_description: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  logo_url: "",
  representative: "",
  business_number: "",
  status: "pending",
  display_order: 0,
};

export default function AdminRelayPage() {
  const [providers, setProviders] = useState<RelayProvider[]>([]);
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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<RelayProvider | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Fetch providers
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/relay?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "중개 업체 목록 조회 실패");
      }

      setProviders(data.data || []);
      setPagination(data.pagination);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [statusFilter, pagination.page]);

  // Open modal for new provider
  const openNewModal = () => {
    setEditingProvider(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (provider: RelayProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      service_type: provider.service_type,
      company_description: provider.company_description,
      service_description: provider.service_description,
      phone: provider.phone,
      email: provider.email,
      website: provider.website || "",
      address: provider.address || "",
      logo_url: provider.logo_url || "",
      representative: provider.representative || "",
      business_number: provider.business_number || "",
      status: provider.status,
      display_order: provider.display_order,
    });
    setShowModal(true);
  };

  // Save provider (create or update)
  const saveProvider = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.name || !formData.service_type || !formData.company_description ||
          !formData.service_description || !formData.phone || !formData.email) {
        alert("필수 항목을 모두 입력해주세요.");
        return;
      }

      if (formData.service_type.length > 10) {
        alert("서비스 유형은 10자 이내로 입력해주세요.");
        return;
      }

      const method = editingProvider ? "PATCH" : "POST";
      const body = editingProvider
        ? { id: editingProvider.id, ...formData }
        : formData;

      const response = await fetch("/api/admin/relay", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "저장 실패");
      }

      alert(editingProvider ? "업체 정보가 수정되었습니다." : "새 업체가 등록되었습니다.");
      setShowModal(false);
      fetchProviders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  // Update status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/relay", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상태 변경 실패");
      }

      fetchProviders();
      alert("상태가 변경되었습니다.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  };

  // Delete provider
  const deleteProvider = async (id: string, name: string) => {
    if (!confirm(`"${name}" 업체를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/relay?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "삭제 실패");
      }

      fetchProviders();
      alert("업체가 삭제되었습니다.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다");
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
          <h1 className="text-2xl font-bold text-gray-900">중개 서비스 업체 관리</h1>
          <div className="flex gap-4">
            <button
              onClick={openNewModal}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 새 업체 등록
            </button>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 py-2">
              ← 대시보드로 돌아가기
            </Link>
          </div>
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
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="pending">심사중</option>
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
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => {
                const count = providers.filter((p) => p.status === key).length;
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
                      순서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      업체명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      서비스 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        등록된 중개 업체가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    providers.map((provider) => (
                      <tr key={provider.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {provider.display_order}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {provider.name}
                          </div>
                          {provider.representative && (
                            <div className="text-sm text-gray-500">
                              대표: {provider.representative}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {provider.service_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{provider.phone}</div>
                          <div className="text-sm text-gray-500">{provider.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              STATUS_LABELS[provider.status]?.color || "bg-gray-100"
                            }`}
                          >
                            {STATUS_LABELS[provider.status]?.label || provider.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(provider.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(provider)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              수정
                            </button>
                            {provider.status === "pending" && (
                              <button
                                onClick={() => updateStatus(provider.id, "active")}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                승인
                              </button>
                            )}
                            {provider.status === "active" && (
                              <button
                                onClick={() => updateStatus(provider.id, "inactive")}
                                className="text-yellow-600 hover:text-yellow-800 text-sm"
                              >
                                비활성화
                              </button>
                            )}
                            {provider.status === "inactive" && (
                              <button
                                onClick={() => updateStatus(provider.id, "active")}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                활성화
                              </button>
                            )}
                            <button
                              onClick={() => deleteProvider(provider.id, provider.name)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          </div>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">
                  {editingProvider ? "업체 정보 수정" : "새 업체 등록"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* 필수 정보 */}
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-3">필수 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        업체명 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="업체명"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        서비스 유형 * (10자 이내)
                      </label>
                      <input
                        type="text"
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value.slice(0, 10) })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="예: 법률, 컨설팅"
                        maxLength={10}
                      />
                      <span className="text-xs text-gray-500">{formData.service_type.length}/10</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회사 소개 *
                    </label>
                    <textarea
                      value={formData.company_description}
                      onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                      className="w-full border rounded px-3 py-2 h-20"
                      placeholder="회사 소개를 입력하세요"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      서비스 소개 *
                    </label>
                    <textarea
                      value={formData.service_description}
                      onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                      className="w-full border rounded px-3 py-2 h-20"
                      placeholder="제공하는 서비스에 대한 설명"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        연락처 *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="02-1234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* 선택 정보 */}
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-3">선택 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        홈페이지
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        대표자명
                      </label>
                      <input
                        type="text"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="대표자명"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      주소
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="서울시 강남구..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        사업자등록번호
                      </label>
                      <input
                        type="text"
                        value={formData.business_number}
                        onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="123-45-67890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        로고 URL
                      </label>
                      <input
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* 관리 설정 */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">관리 설정</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상태
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusType })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="pending">심사중</option>
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        노출 순서
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full border rounded px-3 py-2"
                        min={0}
                      />
                      <span className="text-xs text-gray-500">낮을수록 먼저 노출</span>
                    </div>
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveProvider}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "저장 중..." : editingProvider ? "수정" : "등록"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
