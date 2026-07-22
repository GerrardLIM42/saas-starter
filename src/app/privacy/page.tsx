import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 — MORIVA",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col items-center bg-white text-[#1a1a1a] min-h-screen">
      <div className="w-full max-w-2xl px-4 py-16 flex flex-col gap-8">
        <div>
          <Link href="/" className="text-sm text-[#c9961a] font-medium hover:underline">
            ← MORIVA 홈으로
          </Link>
          <h1 className="text-2xl font-bold mt-4">개인정보처리방침</h1>
          <p className="text-sm text-gray-500 mt-2">
            시행일: 2026년 7월 23일 · 적용 대상: MORIVA 웹사이트 및 &quot;MORIVA 쿠팡 리뷰 분석기&quot; 크롬 확장
            프로그램
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">1. 확장 프로그램이 수집하는 정보</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            &quot;MORIVA 쿠팡 리뷰 분석기&quot;는 사용자가 직접 연 쿠팡 상품 페이지(www.coupang.com/vp/products/*)의
            공개된 리뷰·상품 정보를 브라우저 안에서만 읽고 분석합니다. 분석 결과와 저장한 프로젝트는 사용자의
            브라우저(chrome.storage)에만 저장되며, 저희 서버로 전송되거나 외부에 공유되지 않습니다.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">2. MORIVA 계정 연결 시 전송되는 정보</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            사용자가 설정 페이지에서 발급한 &quot;연결 코드&quot;를 확장 프로그램에 직접 입력한 경우에 한해, 그
            코드가 저희 서버(saas-starter)로 전송되어 구독·크레딧 보유 여부를 확인하는 데에만 사용됩니다. 이
            과정에서 리뷰 분석 데이터나 쿠팡 페이지 내용은 전송되지 않습니다.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">3. 웹사이트 회원 정보</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            MORIVA 웹사이트 가입 시 이메일, 이름(선택), 비밀번호(암호화 저장)를 수집합니다. 결제 정보는 Stripe가
            직접 처리하며 저희 서버에 카드 정보가 저장되지 않습니다. 수집한 정보는 서비스 제공(로그인, 크레딧/구독
            관리) 목적 외에는 사용하지 않습니다.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">4. 권한(Permissions) 사용 목적</h2>
          <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 flex flex-col gap-1">
            <li>tabs: 분석용 쿠팡 탭을 열고 완료 후 관리하기 위해 사용합니다.</li>
            <li>storage / unlimitedStorage: 분석 결과와 프로젝트를 사용자 브라우저에 저장하기 위해 사용합니다.</li>
            <li>host_permissions(coupang.com): 리뷰·상품 정보를 읽기 위해 필요합니다.</li>
            <li>host_permissions(MORIVA 사이트): 연결 코드로 구독/크레딧 상태를 확인하기 위해 필요합니다.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">5. 문의</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            개인정보 처리와 관련해 문의사항이 있으시면 hyeon.chul.lim@gmail.com으로 연락해주세요.
          </p>
        </section>
      </div>
    </div>
  );
}
