import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NameForm, PasswordForm } from "./settings-form";

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
    </div>
  );
}
