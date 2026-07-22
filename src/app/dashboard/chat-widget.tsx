"use client";

import { useState } from "react";

export function ChatWidget({ initialBalance }: { initialBalance: number }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReply(null);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "요청에 실패했습니다.");
      return;
    }

    setReply(data.reply);
    setBalance((prev) => prev - data.creditCost);
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-3">
      <p className="text-sm text-gray-500">현재 크레딧 잔액: {balance}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="OpenAI에게 물어볼 내용을 입력하세요"
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {reply && (
        <div className="border border-gray-200 rounded-md p-3 text-sm whitespace-pre-wrap">
          {reply}
        </div>
      )}
    </div>
  );
}
