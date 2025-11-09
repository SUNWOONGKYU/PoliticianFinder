'use client';

import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

interface User {
  id: number;
  nickname: string;
  email: string;
  joinDate: string;
  level: string;
  status: 'active' | 'blocked';
}

const SAMPLE_USERS: User[] = [
  {
    id: 1,
    nickname: '정치관심러',
    email: 'user1@example.com',
    joinDate: '2025-10-20',
    level: 'ML3',
    status: 'active',
  },
  {
    id: 2,
    nickname: '불량유저',
    email: 'user2@example.com',
    joinDate: '2025-10-21',
    level: 'ML1',
    status: 'blocked',
  },
  {
    id: 3,
    nickname: '열정시민',
    email: 'user3@example.com',
    joinDate: '2025-10-22',
    level: 'ML4',
    status: 'active',
  },
  {
    id: 4,
    nickname: '정의의사자',
    email: 'user4@example.com',
    joinDate: '2025-10-23',
    level: 'ML2',
    status: 'active',
  },
];

export default function AdminUsersPage() {
  const [users] = useState<User[]>(SAMPLE_USERS);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nickname.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesLevel = levelFilter === 'all' || user.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">회원 관리</h1>

          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="회원 검색 (이름, 닉네임, 이메일)"
                className="flex-grow p-2 border rounded-lg"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <select
                className="p-2 border rounded-lg"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="all">모든 등급</option>
                <option value="ML1">ML1</option>
                <option value="ML2">ML2</option>
                <option value="ML3">ML3</option>
                <option value="ML4">ML4</option>
                <option value="ML5">ML5</option>
              </select>
              <select
                className="p-2 border rounded-lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">모든 상태</option>
                <option value="active">정상</option>
                <option value="blocked">차단</option>
              </select>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                검색
              </button>
            </div>

            {/* User Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">닉네임</th>
                    <th className="p-3">이메일</th>
                    <th className="p-3">가입일</th>
                    <th className="p-3">등급</th>
                    <th className="p-3">상태</th>
                    <th className="p-3">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{user.id}</td>
                      <td className="p-3 font-semibold">{user.nickname}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.joinDate}</td>
                      <td className="p-3">{user.level}</td>
                      <td className="p-3">
                        {user.status === 'active' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            정상
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                            차단
                          </span>
                        )}
                      </td>
                      <td className="p-3 space-x-2">
                        <button className="text-blue-500 hover:underline">수정</button>
                        {user.status === 'active' ? (
                          <button className="text-red-500 hover:underline">차단</button>
                        ) : (
                          <button className="text-green-500 hover:underline">해제</button>
                        )}
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
