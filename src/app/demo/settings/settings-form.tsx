"use client";

import { useState } from "react";
import { DEMO_DISABLED_MESSAGE } from "@/lib/demo";

// 실제 NameForm/PasswordForm(src/app/(app)/settings/settings-form.tsx)와 화면은 동일하지만,
// 서버에 저장을 요청하지 않고 데모 안내 메시지만 보여준다.
export function DemoNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(DEMO_DISABLED_MESSAGE);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-xs font-medium text-gray-500">표시 이름</label>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-[#071a35] text-white px-4 py-2 text-sm font-medium hover:bg-[#0d345e] transition"
        >
          저장
        </button>
      </div>
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </form>
  );
}

export function DemoPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(DEMO_DISABLED_MESSAGE);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">현재 비밀번호</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">새 비밀번호 (8자 이상)</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="self-start rounded-md bg-[#071a35] text-white px-4 py-2 text-sm font-medium hover:bg-[#0d345e] transition"
      >
        비밀번호 변경
      </button>
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </form>
  );
}
