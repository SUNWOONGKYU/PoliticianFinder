'use client';

import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

interface Politician {
  id: number;
  name: string;
  party: string;
  region: string;
  position: string;
  verified: boolean;
}

const SAMPLE_POLITICIANS: Politician[] = [
  {
    id: 1,
    name: '김민준',
    party: '더불어민주당',
    region: '서울 강남구',
    position: '국회의원',
    verified: true,
  },
  {
    id: 2,
    name: '이서연',
    party: '국민의힘',
    region: '부산광역시',
    position: '부산광역시장',
    verified: false,
  },
  {
    id: 3,
    name: '박지훈',
    party: '정의당',
    region: '경기도 성남시',
    position: '국회의원',
    verified: true,
  },
];

export default function AdminPoliticiansPage() {
  const [politicians] = useState<Politician[]>(SAMPLE_POLITICIANS);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">정치인 관리</h1>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">정치인 목록</h2>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                + 새 정치인 추가
              </button>
            </div>

            {/* Politician Table */}
            <div className="overflow-x-auto">
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
                  {politicians.map((politician) => (
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
                        <button className="text-blue-500 hover:underline">수정</button>
                        <button className="text-red-500 hover:underline">삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
