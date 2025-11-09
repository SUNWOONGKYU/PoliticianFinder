'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function SupportPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email) {
      setAlertMessage('이메일 주소를 입력해주세요.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlertMessage('올바른 이메일 주소를 입력해주세요.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
      return;
    }

    // Submit logic (would normally send to API)
    setAlertMessage('문의가 성공적으로 접수되었습니다.\n빠른 시일 내에 답변드리겠습니다.');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);

    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const faqs = [
    {
      question: 'Q. AI 평가는 어떻게 이루어지나요?',
      answer:
        'A. 5개의 서로 다른 AI 모델(Claude, ChatGPT, Gemini, Grok, Perplexity)이 10개 분야 70개 항목을 데이터 기반으로 평가합니다. 1,000점 만점으로 정량적 평가를 수행하며, 다중 AI 시스템으로 편향을 최소화합니다.',
    },
    {
      question: 'Q. 회원가입은 필수인가요?',
      answer:
        'A. 정치인 정보와 AI 평가 결과는 로그인 없이 누구나 볼 수 있습니다. 다만 게시글 작성, 댓글 작성, 포인트 적립 등 커뮤니티 활동을 하시려면 회원가입이 필요합니다.',
    },
    {
      question: 'Q. 어떤 게시판에 글을 쓸 수 있나요?',
      answer:
        'A. 회원이라면 누구나 회원 자유게시판에 글을 작성할 수 있습니다. 정치인 게시판은 등록된 정치인만 글을 작성할 수 있으며, 일반 회원은 댓글로 참여할 수 있습니다.',
    },
    {
      question: 'Q. 포인트는 어떻게 적립되나요?',
      answer:
        'A. 다양한 활동을 통해 포인트가 적립됩니다. 게시글 작성(10p), 댓글 작성(5p), 로그인(1p/일), 정치인 평가(3p), 게시글 공감받기(2p), 댓글 공감받기(1p), 베스트글 선정(50p) 등이 있으며, 월간 보너스도 지급됩니다. 포인트가 쌓이면 활동 등급(ML1~ML10)이 올라가며, 포인트에 상응하는 소정의 활동보수를 지급받을 수 있습니다.',
    },
    {
      question: 'Q. 활동 등급과 영향력 등급의 차이는 무엇인가요?',
      answer:
        'A. 활동 등급(ML1~ML10)은 포인트를 쌓아서 올리는 개인 활동 수준이고, 영향력 등급(방랑자~군주)은 팔로워 수와 지역구 내 순위로 결정되는 커뮤니티 영향력입니다. 활동 등급은 활동 수준을, 영향력 등급은 커뮤니티 내 위상을 나타냅니다.',
    },
    {
      question: 'Q. 비밀번호를 잊어버렸어요',
      answer:
        'A. 로그인 페이지에서 \'비밀번호 찾기\'를 클릭하시면 가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">고객센터</h1>
          <p className="text-lg text-gray-600 mt-2">무엇을 도와드릴까요?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">문의하기</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  핸드폰 번호 <span className="text-gray-500 text-xs">(선택사항)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="010-1234-5678"
                  pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  문의 내용
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                >
                  문의 제출
                </button>
              </div>
            </form>

            {/* Report Notice */}
            <div className="mt-6 p-4 bg-purple-50 border-l-4 border-secondary-500 rounded">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-secondary-600 mt-0.5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-purple-900">잘못된 정보 발견 시 또는 신고</h3>
                  <p className="text-sm text-purple-800 mt-1">
                    정치인 정보나 기타 내용에 오류가 있거나, 부적절한 게시글/댓글을 발견하신 경우 위 문의 폼을 통해 제보 및 신고해주세요. 검토 후 신속하게 조치하겠습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                  <p className="text-gray-600 mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
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
