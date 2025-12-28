'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderInfo {
  productName: string;
  politicianName: string;
  politicianPosition: string;
  party: string;
  region: string;
  amount: string;
  depositorName: string;
}

export default function AccountTransferPage() {
  const [email, setEmail] = useState('');
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deadline, setDeadline] = useState('');

  const orderInfo: OrderInfo = {
    productName: '정치인 AI 상세평가보고서',
    politicianName: '정원오',
    politicianPosition: '현직 국회의원',
    party: '더불어민주당',
    region: '서울 강남구',
    amount: '500,000원',
    depositorName: '정원오',
  };

  useEffect(() => {
    // Set deadline (3 days from now)
    const now = new Date();
    const deadlineDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const formatted = `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}-${String(deadlineDate.getDate()).padStart(2, '0')} ${String(deadlineDate.getHours()).padStart(2, '0')}:${String(deadlineDate.getMinutes()).padStart(2, '0')}`;
    setDeadline(formatted);
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setAlertMessage(message);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    }).catch(() => {
      setAlertMessage('복사에 실패했습니다.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    });
  };

  const saveEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setAlertMessage('이메일 주소를 입력해주세요.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
      return;
    }

    if (!emailRegex.test(email)) {
      setAlertMessage('올바른 이메일 주소를 입력해주세요.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
      return;
    }

    setEmailRegistered(true);
    setAlertMessage(`이메일이 등록되었습니다.\n\n입금 확인 후 ${email} 으로 보고서를 발송해 드립니다.`);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
              <span className="ml-2 text-sm font-medium text-gray-900">주문완료</span>
            </div>
            <div className="w-12 h-0.5 bg-primary-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <span className="ml-2 text-sm font-medium text-primary-600">입금대기</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">3</div>
              <span className="ml-2 text-sm font-medium text-gray-500">결제완료</span>
            </div>
          </div>
        </div>

        {/* Order Complete Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">주문이 완료되었습니다</h1>
          <p className="text-gray-600">아래 계좌로 입금해주시면 입금 확인 후 보고서가 발행됩니다.</p>
        </div>

        {/* Bank Account Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">입금 계좌 정보</h2>

          <div className="space-y-4">
            {/* Bank Name */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-1">은행명</div>
                <div className="text-lg font-bold text-gray-900">하나은행</div>
              </div>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">계좌번호</div>
                <div className="text-lg font-bold text-gray-900">287-910921-40507</div>
              </div>
              <button
                onClick={() => copyToClipboard('287-910921-40507', '계좌번호가 복사되었습니다.')}
                className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
              >
                복사
              </button>
            </div>

            {/* Account Holder */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-1">예금주</div>
                <div className="text-lg font-bold text-gray-900">파인더월드(선웅규)</div>
              </div>
            </div>

            {/* Deposit Amount */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border-2 border-primary-500">
              <div className="flex-1">
                <div className="text-sm text-primary-600 mb-1">입금 금액</div>
                <div className="text-2xl font-bold text-primary-600">{orderInfo.amount}</div>
                <div className="text-xs text-gray-600 mt-1">부가세 포함</div>
              </div>
              <button
                onClick={() => copyToClipboard(orderInfo.amount, '금액이 복사되었습니다.')}
                className="ml-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm font-medium"
              >
                복사
              </button>
            </div>

            {/* Deadline */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <div className="text-sm text-amber-700 mb-1">입금 기한</div>
                <div className="text-lg font-bold text-amber-900">{deadline}</div>
              </div>
            </div>

            {/* Depositor Name */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-1">입금자명</div>
                <div className="text-lg font-bold text-gray-900">{orderInfo.depositorName}</div>
                <div className="text-xs text-gray-500 mt-1">본인 인증 시 입력한 이름으로 입금해주세요</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">주문 정보</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>상품명</span>
              <span className="font-medium">{orderInfo.productName}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>정치인</span>
              <span className="font-medium">{orderInfo.politicianName} | {orderInfo.politicianPosition}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>소속</span>
              <span className="font-medium">{orderInfo.party} · {orderInfo.region}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">결제 금액</span>
                <span className="text-xl font-bold text-primary-600">{orderInfo.amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Email */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">보고서 발송 이메일</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="report-email" className="block text-sm font-medium text-gray-900 mb-2">
                이메일 주소 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="report-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailRegistered}
                  placeholder="example@email.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                />
                <button
                  onClick={saveEmail}
                  disabled={emailRegistered}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium whitespace-nowrap disabled:bg-gray-400"
                >
                  등록
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">입금 확인 후 해당 이메일로 PDF 보고서를 발송해 드립니다.</p>
            </div>

            {/* Email Success Message */}
            {emailRegistered && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="font-medium">이메일이 등록되었습니다.</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  입금 확인 후 <strong>{email}</strong> 으로 보고서를 발송해 드립니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 mb-6">
          <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            입금 시 유의사항
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>입금자명은 반드시 <strong>본인 인증 시 입력한 이름</strong>과 동일해야 합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>입금 기한 내에 입금이 확인되지 않으면 주문이 자동 취소됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>입금 확인 후 보고서가 발행되며, 등록하신 이메일로 발송됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>입금 후 환불은 불가능합니다.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/politicians"
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition font-medium"
          >
            정치인 상세페이지로 이동
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-primary-500 text-white text-center rounded-lg hover:bg-primary-600 transition font-medium"
          >
            홈으로 이동
          </Link>
        </div>

        {/* Contact Information */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>입금 관련 문의: <a href="tel:010-2289-6461" className="text-primary-600 hover:underline">010-2289-6461</a></p>
          <p className="mt-1">이메일: <a href="mailto:wksun999@hanmail.net" className="text-primary-600 hover:underline">wksun999@hanmail.net</a></p>
        </div>
      </main>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="mb-6">
              <p className="text-gray-900 text-center whitespace-pre-line">{alertMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAlert(false)}
                className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
