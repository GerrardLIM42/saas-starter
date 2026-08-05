import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NameForm, PasswordForm } from "./settings-form";
import { ExtensionTokenSection } from "./extension-token";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, password: true },
  });

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">설정</h1>
        <p className="text-sm text-gray-500 mt-1">프로필 정보를 관리하세요.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-1">
        <p className="text-xs text-gray-400">이메일 (로그인 ID)</p>
        <p className="text-sm font-medium text-[#071a35]">{user.email}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <NameForm initialName={user.name ?? ""} />
      </div>

      {user.password && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-[#071a35] mb-3">비밀번호 변경</p>
          <PasswordForm />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#071a35]">MORIVA 쿠팡 리뷰 분석기 다운로드</p>
          <span className="text-xs font-mono text-gray-400">v1.14.0</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          쿠팡 상품 URL로 리뷰를 분석하고 1688 상품 정보·이미지를 수집하는 크롬 확장 프로그램입니다.
          내려받은 ZIP의 압축을 풀고 <code className="text-xs bg-gray-100 rounded px-1 py-0.5">chrome://extensions</code>에서
          개발자 모드를 켠 뒤 <b>압축해제된 확장 프로그램을 로드합니다</b>로 폴더를 선택하면 바로 사용할 수 있습니다.
        </p>
        <a
          href="/downloads/moriva-coupang-review-lab-v1.14.0.zip"
          download
          className="inline-flex items-center gap-2 rounded-md bg-[#071a35] text-white px-4 py-2 text-sm font-medium hover:bg-[#0a2547] transition"
        >
          ZIP 다운로드
        </a>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-[#071a35] mb-3">확장 프로그램 연결</p>
        <ExtensionTokenSection />
      </div>
    </div>
  );
}
