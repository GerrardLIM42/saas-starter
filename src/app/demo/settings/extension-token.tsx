"use client";

import { useState } from "react";
import { DEMO_USER } from "@/lib/demo";

// 실제 ExtensionTokenSection(src/app/(app)/settings/extension-token.tsx)과 화면은 동일하지만,
// 서버에서 토큰을 발급받지 않고 고정된 데모 토큰만 보여준다.
export function DemoExtensionTokenSection() {
  const [token] = useState(DEMO_USER.extensionToken);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        MORIVA 쿠팡 리뷰 분석기(크롬 확장 프로그램) 대시보드에 아래 연결 코드를 붙여넣으면
        구독/크레딧 상태를 확인해 기능을 사용할 수 있습니다. (데모 예시 코드)
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={token}
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
        onClick={() => alert("데모 버전에서는 코드를 재발급할 수 없습니다.")}
        className="self-start text-xs text-gray-400 hover:text-red-600 transition"
      >
        코드 재발급
      </button>
    </div>
  );
}
