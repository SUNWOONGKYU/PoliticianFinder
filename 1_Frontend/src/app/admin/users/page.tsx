'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  status: 'active' | 'suspended' | 'banned';
  role: 'user' | 'admin' | 'moderator';
  admin_notes?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EditModalData {
  userId: string;
  currentStatus: string;
  currentRole: string;
  currentNotes?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<EditModalData | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    role: '',
    admin_notes: '',
  });

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchText) params.append('search', searchText);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, statusFilter, roleFilter]);

  // Handle search button click
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // Handle block/unblock user
  const handleToggleBlock = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      alert(newStatus === 'active' ? '사용자 차단이 해제되었습니다' : '사용자가 차단되었습니다');
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const response = await fetch(`/api/admin/users?user_id=${deleteUserId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      alert('사용자가 삭제되었습니다');
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setEditModalData({
      userId: user.id,
      currentStatus: user.status,
      currentRole: user.role,
      currentNotes: user.admin_notes,
    });
    setEditFormData({
      status: user.status,
      role: user.role,
      admin_notes: user.admin_notes || '',
    });
    setShowEditModal(true);
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!editModalData) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editModalData.userId,
          status: editFormData.status,
          role: editFormData.role,
          admin_notes: editFormData.admin_notes,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      alert('사용자 정보가 업데이트되었습니다');
      setShowEditModal(false);
      setEditModalData(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (userId: string) => {
    setDeleteUserId(userId);
    setShowDeleteConfirm(true);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">회원 관리</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="회원 검색 (이름, 이메일)"
                className="flex-grow p-2 border rounded-lg"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <select
                className="p-2 border rounded-lg"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">모든 역할</option>
                <option value="user">일반 사용자</option>
                <option value="moderator">중재자</option>
                <option value="admin">관리자</option>
              </select>
              <select
                className="p-2 border rounded-lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">모든 상태</option>
                <option value="active">정상</option>
                <option value="suspended">차단</option>
                <option value="banned">영구 차단</option>
              </select>
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                disabled={loading}
              >
                검색
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* User Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">사용자명</th>
                        <th className="p-3">이메일</th>
                        <th className="p-3">가입일</th>
                        <th className="p-3">역할</th>
                        <th className="p-3">상태</th>
                        <th className="p-3">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-gray-500">
                            사용자가 없습니다
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                            <td className="p-3 font-semibold">{user.username}</td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {user.role === 'admin' ? '관리자' :
                                 user.role === 'moderator' ? '중재자' : '일반'}
                              </span>
                            </td>
                            <td className="p-3">
                              {user.status === 'active' ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                  정상
                                </span>
                              ) : user.status === 'suspended' ? (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                                  차단
                                </span>
                              ) : (
                                <span className="bg-black text-white px-2 py-1 rounded-full text-xs">
                                  영구 차단
                                </span>
                              )}
                            </td>
                            <td className="p-3 space-x-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="text-blue-500 hover:underline"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleToggleBlock(user.id, user.status)}
                                className={user.status === 'active' ? 'text-red-500 hover:underline' : 'text-green-500 hover:underline'}
                              >
                                {user.status === 'active' ? '차단' : '해제'}
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(user.id)}
                                className="text-gray-500 hover:underline"
                              >
                                삭제
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
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      총 {pagination.total}명 (페이지 {pagination.page} / {pagination.totalPages})
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        이전
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {showEditModal && editModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">사용자 정보 수정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">상태</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="active">정상</option>
                  <option value="suspended">차단</option>
                  <option value="banned">영구 차단</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">역할</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="user">일반 사용자</option>
                  <option value="moderator">중재자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">관리자 메모</label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  value={editFormData.admin_notes}
                  onChange={(e) => setEditFormData({ ...editFormData, admin_notes: e.target.value })}
                  placeholder="관리자 메모 입력..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditModalData(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">사용자 삭제 확인</h2>
            <p className="mb-6 text-gray-600">
              정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteUserId(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
