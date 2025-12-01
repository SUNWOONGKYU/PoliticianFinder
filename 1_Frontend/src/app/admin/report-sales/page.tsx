'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ReportPurchase {
  id: string;
  politician_id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  currency: string;
  payment_confirmed: boolean;
  payment_confirmed_at: string | null;
  report_type: string;
  report_period: string | null;
  sent: boolean;
  sent_at: string | null;
  sent_email: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending_payment: number;
  pending_send: number;
  completed: number;
}

export default function ReportSalesPage() {
  const [purchases, setPurchases] = useState<ReportPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<ReportPurchase[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending_payment: 0, pending_send: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_payment' | 'pending_send' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  // 데이터 로드
  const loadPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const calculateStats = (data: ReportPurchase[]) => {
    const total = data.length;
    const pending_payment = data.filter(p => !p.payment_confirmed).length;
    const pending_send = data.filter(p => p.payment_confirmed && !p.sent).length;
    const completed = data.filter(p => p.payment_confirmed && p.sent).length;

    setStats({ total, pending_payment, pending_send, completed });
  };

  // 필터링
  useEffect(() => {
    let filtered = [...purchases];

    // 상태 필터
    if (filter === 'pending_payment') {
      filtered = filtered.filter(p => !p.payment_confirmed);
    } else if (filter === 'pending_send') {
      filtered = filtered.filter(p => p.payment_confirmed && !p.sent);
    } else if (filter === 'completed') {
      filtered = filtered.filter(p => p.payment_confirmed && p.sent);
    }

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.buyer_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPurchases(filtered);
  }, [purchases, filter, searchTerm]);

  // 입금 확인
  const confirmPayment = async (id: string) => {
    if (!confirm('입금을 확인하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('report_purchases')
        .update({
          payment_confirmed: true,
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      alert('입금이 확인되었습니다.');
      loadPurchases();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('입금 확인에 실패했습니다.');
    }
  };

  // 이메일 발송
  const sendReport = async (purchase: ReportPurchase) => {
    if (!confirm(`${purchase.buyer_email}로 보고서를 발송하시겠습니까?`)) return;

    try {
      // 이메일 발송 API 호출
      const response = await fetch('/api/admin/report-sales/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_id: purchase.id,
          email: purchase.buyer_email,
          politician_name: purchase.buyer_name
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to send email');

      alert('보고서가 발송되었습니다.');
      loadPurchases();
    } catch (error) {
      console.error('Failed to send report:', error);
      alert('보고서 발송에 실패했습니다.');
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">보고서 판매 관리</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">전체 구매</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">입금 대기</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending_payment}</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">발송 대기</div>
          <div className="text-3xl font-bold text-blue-600">{stats.pending_send}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">발송 완료</div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              전체 ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending_payment')}
              className={`px-4 py-2 rounded ${filter === 'pending_payment' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
            >
              입금 대기 ({stats.pending_payment})
            </button>
            <button
              onClick={() => setFilter('pending_send')}
              className={`px-4 py-2 rounded ${filter === 'pending_send' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              발송 대기 ({stats.pending_send})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              완료 ({stats.completed})
            </button>
          </div>
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
          />
        </div>
      </div>

      {/* 구매 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">구매일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">구매자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">보고서</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">입금 상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">발송 상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  {new Date(purchase.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4 text-sm font-medium">{purchase.buyer_name}</td>
                <td className="px-6 py-4 text-sm">{purchase.buyer_email}</td>
                <td className="px-6 py-4 text-sm">
                  {purchase.report_type}
                  {purchase.report_period && ` (${purchase.report_period})`}
                </td>
                <td className="px-6 py-4 text-sm">
                  {purchase.amount.toLocaleString()} {purchase.currency}
                </td>
                <td className="px-6 py-4 text-sm">
                  {purchase.payment_confirmed ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      확인완료
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      대기중
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {purchase.sent ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      발송완료
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      미발송
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {!purchase.payment_confirmed && (
                      <button
                        onClick={() => confirmPayment(purchase.id)}
                        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        입금확인
                      </button>
                    )}
                    {purchase.payment_confirmed && !purchase.sent && (
                      <button
                        onClick={() => sendReport(purchase)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        발송하기
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            구매 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
