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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    name_en: '',
    party: '',
    position: '', // 출마직종
    region: '', // 광역 지역
    district: '', // 기초 지역
    identity: '', // 신분
    title: '', // 직책
    birth_date: '', // 생년월일
    gender: '', // 성별
  });
  const [submitting, setSubmitting] = useState(false);

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

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setPoliticians(result.data);
        setFilteredPoliticians(result.data);
      } else {
        // Fallback: if API doesn't return expected format
        const data = Array.isArray(result) ? result : [];
        setPoliticians(data);
        setFilteredPoliticians(data);
      }
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
    setShowAddModal(true);
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setAddFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!addFormData.name || !addFormData.party || !addFormData.position || !addFormData.region || !addFormData.district || !addFormData.identity) {
      alert('필수 항목을 모두 입력해주세요 (이름, 정당, 출마직종, 광역 지역, 기초 지역, 신분)');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/politicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addFormData.name,
          name_en: addFormData.name_en,
          party: addFormData.party,
          position: addFormData.position,
          region: addFormData.region,
          district: addFormData.district || null,
          identity: addFormData.identity,
          title: addFormData.title || null,
          birth_date: addFormData.birth_date || null,
          gender: addFormData.gender || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '정치인 추가에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        alert(`정치인 "${addFormData.name}"이(가) 성공적으로 추가되었습니다.\n\n추가 정보는 데이터 수집 프로세스를 통해 채워집니다.`);

        // Reset form and close modal
        setAddFormData({
          name: '',
          name_en: '',
          party: '',
          position: '',
          region: '',
          district: '',
          identity: '',
          title: '',
          birth_date: '',
          gender: '',
        });
        setShowAddModal(false);

        // Refresh politician list
        await fetchPoliticians();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '정치인 추가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    if (submitting) return;

    if (addFormData.name || addFormData.party) {
      if (!confirm('입력한 내용이 저장되지 않습니다. 정말 닫으시겠습니까?')) {
        return;
      }
    }

    setAddFormData({
      name: '',
      name_en: '',
      party: '',
      position: '',
      region: '',
      district: '',
      identity: '',
      title: '',
      birth_date: '',
      gender: '',
    });
    setShowAddModal(false);
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

      {/* Add Politician Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900">새 정치인 추가</h3>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-blue-900 mb-2">📋 안내사항</h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>기본 정보</strong>만 입력하세요 (이름, 정당, 출마직종, 지역, 신분/직책)</li>
                <li>상세 정보(학력, 경력, SNS 등)는 <strong>데이터 수집 프로세스</strong>를 통해 자동으로 채워집니다</li>
                <li>정치인 추가 후 데이터 수집 작업을 별도로 진행해주세요</li>
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-4">
                {/* Name (Korean) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 (한글) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="예: 홍길동"
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Name (English) - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 (영문) <span className="text-gray-400">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.name_en}
                    onChange={(e) => handleFormChange('name_en', e.target.value)}
                    placeholder="예: Hong Gildong"
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Party */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    소속 정당 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.party}
                    onChange={(e) => handleFormChange('party', e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">선택하세요</option>
                    <option value="더불어민주당">더불어민주당</option>
                    <option value="국민의힘">국민의힘</option>
                    <option value="정의당">정의당</option>
                    <option value="개혁신당">개혁신당</option>
                    <option value="진보당">진보당</option>
                    <option value="무소속">무소속</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                {/* Position (출마직종) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출마직종 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">선택하세요</option>
                    <option value="국회의원">국회의원</option>
                    <option value="광역단체장">광역단체장</option>
                    <option value="광역의원">광역의원</option>
                    <option value="기초단체장">기초단체장</option>
                    <option value="기초의원">기초의원</option>
                  </select>
                </div>

                {/* Region (광역) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    광역 지역 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.region}
                    onChange={(e) => handleFormChange('region', e.target.value)}
                    placeholder="예: 서울, 부산, 경기"
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* District (기초) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기초 지역 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.district}
                    onChange={(e) => handleFormChange('district', e.target.value)}
                    placeholder="예: 강남구 갑, 서초구 을"
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Identity (신분) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    신분 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.identity}
                    onChange={(e) => handleFormChange('identity', e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">선택하세요</option>
                    <option value="현직">현직</option>
                    <option value="후보자">후보자</option>
                    <option value="예비후보자">예비후보자</option>
                    <option value="출마자">출마자</option>
                  </select>
                </div>

                {/* Title (직책) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    직책 <span className="text-gray-400">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="예: 국회의원 (21대), 서울시의원"
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Birth Date (생년월일) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생년월일 <span className="text-gray-400">(선택)</span>
                  </label>
                  <input
                    type="date"
                    value={addFormData.birth_date}
                    onChange={(e) => handleFormChange('birth_date', e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Gender (성별) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성별 <span className="text-gray-400">(선택)</span>
                  </label>
                  <select
                    value={addFormData.gender}
                    onChange={(e) => handleFormChange('gender', e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">선택하세요</option>
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </div>
              </div>

              {/* Data Collection Note */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  다음 정보는 데이터 수집 프로세스를 통해 채워집니다
                </h4>
                <ul className="text-sm text-amber-800 space-y-1 ml-7 list-disc">
                  <li>프로필 사진</li>
                  <li>생년월일, 학력, 경력</li>
                  <li>웹사이트, SNS 계정 (Facebook, Twitter, Instagram, YouTube)</li>
                  <li>연락처 (전화번호, 이메일, 사무실 주소)</li>
                  <li>AI 평가 점수 및 등급</li>
                </ul>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      추가 중...
                    </>
                  ) : (
                    '정치인 추가'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
