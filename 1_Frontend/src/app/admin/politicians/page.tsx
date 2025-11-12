'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';

interface Politician {
  id: number;
  name: string;
  party: string;
  region: string;
  position: string;
  verified: boolean;
}

export default function AdminPoliticiansPage() {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [filteredPoliticians, setFilteredPoliticians] = useState<Politician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  // Fetch politicians from API
  useEffect(() => {
    fetchPoliticians();
  }, []);

  const fetchPoliticians = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/politicians');

      if (!response.ok) {
        throw new Error('정치인 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setPoliticians(data);
      setFilteredPoliticians(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Apply search and filters
  useEffect(() => {
    let filtered = [...politicians];

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by party
    if (partyFilter !== 'all') {
      filtered = filtered.filter(p => p.party === partyFilter);
    }

    // Filter by verified status
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(p =>
        verifiedFilter === 'verified' ? p.verified : !p.verified
      );
    }

    setFilteredPoliticians(filtered);
  }, [searchTerm, partyFilter, verifiedFilter, politicians]);

  // Get unique parties for filter dropdown
  const uniqueParties = Array.from(new Set(politicians.map(p => p.party)));

  // Handle edit politician
  const handleEdit = (id: number) => {
    // TODO: Navigate to edit page or open modal
    console.log('Edit politician:', id);
    alert(`정치인 ID ${id} 수정 기능은 구현 예정입니다.`);
  };

  // Handle delete politician
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 정치인을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/politicians/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      // Refresh list after deletion
      await fetchPoliticians();
      alert('정치인이 성공적으로 삭제되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  // Handle add new politician
  const handleAddNew = () => {
    // TODO: Navigate to add page or open modal
    console.log('Add new politician');
    alert('새 정치인 추가 기능은 구현 예정입니다.');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">정치인 관리</h1>

          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">정치인 목록</h2>
              <button
                onClick={handleAddNew}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                + 새 정치인 추가
              </button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 검색
                </label>
                <input
                  type="text"
                  placeholder="정치인 이름 입력..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Party Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정당 필터
                </label>
                <select
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  {uniqueParties.map(party => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>

              {/* Verified Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  인증 상태
                </label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="verified">인증됨</option>
                  <option value="unverified">미인증</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="font-semibold">오류가 발생했습니다</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchPoliticians}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredPoliticians.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">검색 결과가 없습니다.</p>
                <p className="text-sm">다른 검색어나 필터를 시도해보세요.</p>
              </div>
            )}

            {/* Politician Table */}
            {!loading && !error && filteredPoliticians.length > 0 && (
              <div className="overflow-x-auto">
                <div className="mb-2 text-sm text-gray-600">
                  총 {filteredPoliticians.length}명의 정치인
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">이름</th>
                      <th className="p-3">정당</th>
                      <th className="p-3">지역</th>
                      <th className="p-3">직책</th>
                      <th className="p-3">인증계정</th>
                      <th className="p-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPoliticians.map((politician) => (
                      <tr key={politician.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{politician.id}</td>
                        <td className="p-3 font-semibold">{politician.name}</td>
                        <td className="p-3">{politician.party}</td>
                        <td className="p-3">{politician.region}</td>
                        <td className="p-3">{politician.position}</td>
                        <td className="p-3">
                          {politician.verified ? (
                            <span className="text-green-600 font-bold">Y</span>
                          ) : (
                            <span className="text-gray-400">N</span>
                          )}
                        </td>
                        <td className="p-3 space-x-2">
                          <button
                            onClick={() => handleEdit(politician.id)}
                            className="text-blue-500 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(politician.id)}
                            className="text-red-500 hover:underline"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
