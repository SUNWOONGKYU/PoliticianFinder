'use client';

import { useState } from 'react';

// 샘플 정치인 데이터
const politicians = [
  { id: 1, name: '김민준', party: '더불어민주당', position: '국회의원', region: '서울 강남구' },
  { id: 2, name: '이서연', party: '국민의힘', position: '국회의원', region: '경기 성남시 분당구' },
  { id: 3, name: '박준호', party: '더불어민주당', position: '국회의원', region: '부산 해운대구' },
  { id: 4, name: '최지우', party: '조국혁신당', position: '국회의원', region: '서울 마포구' },
  { id: 5, name: '정하늘', party: '국민의힘', position: '국회의원', region: '경기 수원시' }
];

// 지역 데이터
const regions = {
  seoul: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  busan: ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  daegu: ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  incheon: ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
  gwangju: ['광산구', '남구', '동구', '북구', '서구'],
  daejeon: ['대덕구', '동구', '서구', '유성구', '중구'],
  ulsan: ['남구', '동구', '북구', '울주군', '중구'],
  sejong: ['세종시'],
  gyeonggi: ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  gangwon: ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  chungbuk: ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  chungnam: ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  jeonbuk: ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'],
  jeonnam: ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  gyeongbuk: ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
  gyeongnam: ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  jeju: ['서귀포시', '제주시']
};

export default function ConnectionPage() {
  // Inquiry Form State
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryResults, setInquiryResults] = useState<any[]>([]);
  const [inquiryShowResults, setInquiryShowResults] = useState(false);
  const [inquirySelected, setInquirySelected] = useState<any>(null);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');

  // Proposal Form State
  const [proposalSearch, setProposalSearch] = useState('');
  const [proposalResults, setProposalResults] = useState<any[]>([]);
  const [proposalShowResults, setProposalShowResults] = useState(false);
  const [proposalSelected, setProposalSelected] = useState<any>(null);
  const [proposalMetro, setProposalMetro] = useState('');
  const [proposalLocal, setProposalLocal] = useState('');
  const [proposalLocalOptions, setProposalLocalOptions] = useState<string[]>([]);
  const [proposalCategory, setProposalCategory] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const [proposalEmail, setProposalEmail] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  // Search Functions
  const searchInquiryPolitician = (query: string) => {
    setInquirySearch(query);
    if (query.trim() === '') {
      setInquiryShowResults(false);
      return;
    }

    const filtered = politicians
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
                   p.party.includes(query) ||
                   p.region.includes(query))
      .slice(0, 20);

    setInquiryResults(filtered);
    setInquiryShowResults(true);
  };

  const searchProposalPolitician = (query: string) => {
    setProposalSearch(query);
    if (query.trim() === '') {
      setProposalShowResults(false);
      return;
    }

    const filtered = politicians
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
                   p.party.includes(query) ||
                   p.region.includes(query))
      .slice(0, 20);

    setProposalResults(filtered);
    setProposalShowResults(true);
  };

  const selectInquiryPolitician = (politician: any) => {
    setInquirySelected(politician);
    setInquirySearch(politician.name);
    setInquiryShowResults(false);
  };

  const selectProposalPolitician = (politician: any) => {
    setProposalSelected(politician);
    setProposalSearch(politician.name);
    setProposalShowResults(false);
  };

  const clearInquiryPolitician = () => {
    setInquirySelected(null);
    setInquirySearch('');
  };

  const clearProposalPolitician = () => {
    setProposalSelected(null);
    setProposalSearch('');
  };

  const handleMetroChange = (value: string) => {
    setProposalMetro(value);
    setProposalLocal('');

    if (value && value !== 'sejong') {
      const options = regions[value as keyof typeof regions] || [];
      setProposalLocalOptions(options);
    } else {
      setProposalLocalOptions([]);
    }
  };

  const resetInquiryForm = () => {
    setInquirySearch('');
    setInquirySelected(null);
    setInquiryTitle('');
    setInquiryContent('');
    setInquiryEmail('');
  };

  const resetProposalForm = () => {
    setProposalSearch('');
    setProposalSelected(null);
    setProposalMetro('');
    setProposalLocal('');
    setProposalCategory('');
    setProposalTitle('');
    setProposalContent('');
    setProposalEmail('');
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirySelected) {
      setAlertMessage('정치인을 선택해주세요.');
      setShowAlert(true);
      return;
    }
    setAlertMessage('문의가 등록되었습니다.\n빠른 시일 내에 답변드리겠습니다.');
    setShowAlert(true);
    resetInquiryForm();
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalSelected) {
      setAlertMessage('정치인을 선택해주세요.');
      setShowAlert(true);
      return;
    }
    if (!proposalMetro) {
      setAlertMessage('광역 지역을 선택해주세요.');
      setShowAlert(true);
      return;
    }
    if (proposalMetro !== 'sejong' && !proposalLocal) {
      setAlertMessage('기초 지역을 선택해주세요.');
      setShowAlert(true);
      return;
    }
    setAlertMessage('제안이 등록되었습니다.\n정치인에게 전달됩니다.');
    setShowAlert(true);
    resetProposalForm();
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">연결</h1>
          <p className="text-lg text-gray-600">정치인과 시민을 연결해드립니다</p>
        </div>

        {/* Two Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inquiry Form */}
          <section id="inquiry-section">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">문의하기</h2>
              <p className="text-gray-600 mb-6">관심있는 정치인에게 질문을 할 수 있습니다. 정치인 선택 후 문의 내용을 작성해주세요.</p>

              <form onSubmit={handleInquirySubmit} className="space-y-6">
                {/* Politician Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    정치인 검색 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inquirySearch}
                      onChange={(e) => searchInquiryPolitician(e.target.value)}
                      placeholder="정치인 이름을 입력하세요"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      autoComplete="off"
                    />
                    {inquiryShowResults && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {inquiryResults.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">검색 결과가 없습니다.</div>
                        ) : (
                          inquiryResults.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => selectInquiryPolitician(p)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <div className="text-sm text-gray-600">{p.party} | {p.position} | {p.region}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {inquirySelected && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{inquirySelected.name}</div>
                          <div className="text-sm text-gray-600">{inquirySelected.party} | {inquirySelected.position} | {inquirySelected.region}</div>
                        </div>
                        <button
                          type="button"
                          onClick={clearInquiryPolitician}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                    maxLength={100}
                    placeholder="제목을 입력하세요"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    maxLength={5000}
                    rows={16}
                    placeholder="문의 내용을 입력하세요 (최대 5000자)"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>최대 5000자</span>
                    <span>{inquiryContent.length} / 5000</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="답변받을 이메일을 입력하세요"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetInquiryForm}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    초기화
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    문의 등록하기
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Proposal Form */}
          <section id="proposal-section">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">제안하기</h2>
              <p className="text-gray-600 mb-6">지역 발전을 위한 아이디어나 개선이 필요한 사항을 제안할 수 있습니다. 관련 정치인 선택 후 제안 내용을 작성해주세요.</p>

              <form onSubmit={handleProposalSubmit} className="space-y-6">
                {/* Politician Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    정치인 검색 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={proposalSearch}
                      onChange={(e) => searchProposalPolitician(e.target.value)}
                      placeholder="정치인 이름을 입력하세요"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      autoComplete="off"
                    />
                    {proposalShowResults && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {proposalResults.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">검색 결과가 없습니다.</div>
                        ) : (
                          proposalResults.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => selectProposalPolitician(p)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <div className="text-sm text-gray-600">{p.party} | {p.position} | {p.region}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {proposalSelected && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{proposalSelected.name}</div>
                          <div className="text-sm text-gray-600">{proposalSelected.party} | {proposalSelected.position} | {proposalSelected.region}</div>
                        </div>
                        <button
                          type="button"
                          onClick={clearProposalPolitician}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metro Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    광역 지역 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={proposalMetro}
                    onChange={(e) => handleMetroChange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">광역 지역을 선택하세요</option>
                    <option value="seoul">서울특별시</option>
                    <option value="busan">부산광역시</option>
                    <option value="daegu">대구광역시</option>
                    <option value="incheon">인천광역시</option>
                    <option value="gwangju">광주광역시</option>
                    <option value="daejeon">대전광역시</option>
                    <option value="ulsan">울산광역시</option>
                    <option value="sejong">세종특별자치시</option>
                    <option value="gyeonggi">경기도</option>
                    <option value="gangwon">강원특별자치도</option>
                    <option value="chungbuk">충청북도</option>
                    <option value="chungnam">충청남도</option>
                    <option value="jeonbuk">전북특별자치도</option>
                    <option value="jeonnam">전라남도</option>
                    <option value="gyeongbuk">경상북도</option>
                    <option value="gyeongnam">경상남도</option>
                    <option value="jeju">제주특별자치도</option>
                  </select>
                </div>

                {/* Local Region */}
                {proposalMetro && proposalMetro !== 'sejong' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      기초 지역 선택 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={proposalLocal}
                      onChange={(e) => setProposalLocal(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">기초 지역을 선택하세요</option>
                      {proposalLocalOptions.map((local) => (
                        <option key={local} value={local}>{local}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={proposalCategory}
                    onChange={(e) => setProposalCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    <option value="education">교육</option>
                    <option value="transport">교통</option>
                    <option value="environment">환경</option>
                    <option value="welfare">복지</option>
                    <option value="safety">안전</option>
                    <option value="culture">문화</option>
                    <option value="economy">경제</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    maxLength={100}
                    placeholder="제안 제목을 입력하세요"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={proposalContent}
                    onChange={(e) => setProposalContent(e.target.value)}
                    maxLength={5000}
                    rows={6}
                    placeholder="제안 내용을 구체적으로 작성해주세요 (최대 5000자)"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>최대 5000자</span>
                    <span>{proposalContent.length} / 5000</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={proposalEmail}
                    onChange={(e) => setProposalEmail(e.target.value)}
                    placeholder="답변받을 이메일을 입력하세요"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetProposalForm}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    초기화
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    제안 등록하기
                  </button>
                </div>
              </form>
            </div>
          </section>
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
