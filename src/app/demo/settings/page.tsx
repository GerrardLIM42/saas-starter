import { DEMO_USER } from "@/lib/demo";
import { DemoNameForm, DemoPasswordForm } from "./settings-form";
import { DemoExtensionTokenSection } from "./extension-token";

// 실제 설정 페이지(src/app/(app)/settings/page.tsx)와 동일한 화면 구성을 로그인/DB 없이 보여준다.
export default function DemoSettingsPage() {
  const user = DEMO_USER;

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">설정</h1>
        <p className="text-sm text-gray-500 mt-1">프로필 정보를 관리하세요. (데모 예시 데이터)</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-1">
        <p className="text-xs text-gray-400">이메일 (로그인 ID)</p>
        <p className="text-sm font-medium text-[#071a35]">{user.email}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <DemoNameForm initialName={user.name} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-[#071a35] mb-3">비밀번호 변경</p>
        <DemoPasswordForm />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-[#071a35] mb-3">확장 프로그램 연결</p>
        <DemoExtensionTokenSection />
      </div>
    </div>
  );
}
