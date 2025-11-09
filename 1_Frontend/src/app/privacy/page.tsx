'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
          <p className="text-gray-500 mb-8">시행일: 2025년 10월 27일</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제1조 (개인정보의 처리 목적)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                PoliticianFinder (이하 &ldquo;회사&rdquo;)는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>회원 가입 및 관리: 회원 식별, 회원자격 유지·관리, 서비스 부정이용 방지 등</li>
                <li>서비스 제공: 콘텐츠 제공, 맞춤 서비스 제공 등</li>
                <li>신규 서비스 개발 및 마케팅·광고에의 활용</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제2조 (처리하는 개인정보의 항목)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">&ldquo;회사&rdquo;는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>필수항목: 이메일, 비밀번호, 닉네임</li>
                <li>선택항목: 프로필 사진, 관심 정치인</li>
                <li>자동수집항목: IP 주소, 쿠키, 서비스 이용 기록, 기기정보</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제3조 (개인정보의 처리 및 보유 기간)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                1. &ldquo;회사&rdquo;는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다: 회원 가입 및 관리 정보는 회원 탈퇴 시까지 보유합니다. 다만, 관련 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지 보유합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제4조 (개인정보의 제3자 제공)</h2>
              <p className="text-gray-700 leading-relaxed">
                &ldquo;회사&rdquo;는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">정보주체는 &ldquo;회사&rdquo;에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>개인정보 열람요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제요구</li>
                <li>처리정지 요구</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제6조 (개인정보 보호책임자)</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-3">
                  &ldquo;회사&rdquo;는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="pl-4">
                  <p>- 책임자: 개인정보보호책임자</p>
                  <p>- 이메일: privacy@politicianfinder.com</p>
                  <p>- 전화: 02-1234-5678</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제7조 (개인정보의 파기)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                1. &ldquo;회사&rdquo;는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                2. 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">3. 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>파기절차: &ldquo;회사&rdquo;는 파기 사유가 발생한 개인정보를 선정하고, &ldquo;회사&rdquo;의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                <li>파기방법: &ldquo;회사&rdquo;는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제8조 (개인정보의 안전성 확보조치)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">&ldquo;회사&rdquo;는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                1. &ldquo;회사&rdquo;는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 &lsquo;쿠키(cookie)&rsquo;를 사용합니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                2. 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>쿠키의 사용목적: 이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부, 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 사용됩니다.</li>
                <li>쿠키의 설치·운영 및 거부: 웹브라우저 상단의 도구&gt;인터넷 옵션&gt;개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
                <li>쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제10조 (아동의 개인정보 보호)</h2>
              <p className="text-gray-700 leading-relaxed">
                &ldquo;회사&rdquo;는 만 14세 미만 아동의 개인정보를 수집하는 경우 법정대리인의 동의를 받습니다. 법정대리인은 아동의 개인정보에 대한 열람, 정정 및 삭제를 요청할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">제11조 (개인정보처리방침의 변경)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                1. 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                2. 다만, 개인정보의 수집 및 활용, 제3자 제공 등과 같이 이용자 권리의 중요한 변경이 있을 경우에는 최소 30일 전에 고지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b">부칙</h2>
              <p className="text-gray-700 leading-relaxed mb-3">1. 본 방침은 2025년 10월 27일부터 시행됩니다.</p>
              <p className="text-gray-700 leading-relaxed mb-3">2. 이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>2025년 10월 27일 ~ 현재: 현행 방침</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
