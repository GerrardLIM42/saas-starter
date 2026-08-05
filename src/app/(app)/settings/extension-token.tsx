"use client";

import { useEffect, useState } from "react";

export function ExtensionTokenSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/extension/token")
      .then((res) => res.json())
      .then((data) => setToken(data.token ?? null))
      .finally(() => setLoading(false));
  }, []);

  async function regenerate() {
    if (!confirm("연결 코드를 재발급하면 기존 코드로 연결된 확장 프로그램은 다시 연결해야 합니다. 계속할까요?")) {
      return;
    }
    setRegenerating(true);
    const res = await fetch("/api/extension/token", { method: "POST" });
    const data = await res.json();
    setToken(data.token);
    setRegenerating(false);
  }

  async function copy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // moriva-tools(별도 정적 사이트)의 "분석 기록" 페이지를 연결 코드가 이미 채워진
  // 상태로 새 탭에 연다. 사용자가 코드를 직접 복사/붙여넣기 하지 않아도 되도록,
  // 코드는 URL 쿼리로 한 번만 전달되고 moriva-tools 쪽에서 즉시 저장한 뒤
  // 주소창에서 지운다 (index.html의 route() 참고).
  function openInMorivaTools() {
    if (!token) return;
    const url = `https://gerrardlim42.github.io/moriva-tools/?token=${encodeURIComponent(token)}#analysis-history`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        MORIVA 쿠팡 리뷰 분석기(크롬 확장 프로그램) 대시보드에 아래 연결 코드를 붙여넣으면
        구독/크레딧 상태를 확인해 기능을 사용할 수 있습니다.
      </p>
      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              readOnly
              value={token ?? ""}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono bg-gray-50"
            />
            <button
              onClick={copy}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-[#c9961a]/60 transition"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <button
            onClick={openInMorivaTools}
            disabled={!token}
            className="self-start rounded-md bg-[#c9961a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b9860f] transition disabled:opacity-50"
          >
            모리바 도구모음에서 분석 기록 보기 ↗
          </button>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="self-start text-xs text-gray-400 hover:text-red-600 transition disabled:opacity-50"
          >
            {regenerating ? "재발급 중..." : "코드 재발급"}
          </button>
        </>
      )}
    </div>
  );
}
