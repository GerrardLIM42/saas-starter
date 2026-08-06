"use client";

import { useState } from "react";

const DEMO_REPLY =
  "(데모 응답) 실제 배포본에서는 이 자리에 OpenAI가 생성한 답변이 표시되고, 크레딧이 실제로 차감됩니다. 지금은 화면 구성만 보여드리는 데모라 AI를 호출하지 않았습니다.";

// 실제 ChatWidget(src/app/(app)/dashboard/chat-widget.tsx)과 화면은 동일하지만,
// 서버에 요청을 보내지 않고 고정된 데모 응답만 보여준다.
export function DemoChatWidget({ initialBalance }: { initialBalance: number }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setReply(null);
    window.setTimeout(() => {
      setReply(DEMO_REPLY);
      setBalance((prev) => Math.max(0, prev - 5));
      setLoading(false);
    }, 500);
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-3">
      <p className="text-sm text-gray-500">현재 크레딧 잔액: {balance}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="OpenAI에게 물어볼 내용을 입력하세요 (데모에서는 실제로 전송되지 않습니다)"
          required
          rows={3}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "요청 중..." : "전송 (크레딧 차감)"}
        </button>
      </form>

      {reply && (
        <div className="border border-gray-200 rounded-md p-3 text-sm whitespace-pre-wrap">
          {reply}
        </div>
      )}
    </div>
  );
}
