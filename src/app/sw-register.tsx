"use client";

import { useEffect } from "react";

// 홈 화면에 앱을 추가(설치)할 수 있으려면 매니페스트와 함께 서비스워커 등록이 필요하다.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
