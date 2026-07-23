"use client";

import { TOOLS, type ToolDef } from "./tools-data";

// 사용자가 드래그/화살표로 바꾼 도구 순서를 브라우저에 저장한다.
// 계정 간 동기화가 필요한 값이 아니라(브라우저별 UI 취향) DB가 아닌 localStorage로 충분하다.
const STORAGE_KEY = "moriva_tool_order";
export const TOOL_ORDER_EVENT = "moriva-tool-order-changed";

function readStoredOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// 저장된 slug 순서대로 TOOLS를 정렬한다.
// 저장된 순서에 없는 새 도구(나중에 추가된 도구)는 원래 순서 그대로 뒤에 붙이고,
// 더 이상 존재하지 않는 slug는 조용히 무시한다.
export function getOrderedTools(): ToolDef[] {
  const order = readStoredOrder();
  if (!order.length) return TOOLS;

  const remaining = new Map(TOOLS.map((t) => [t.slug, t]));
  const ordered: ToolDef[] = [];
  order.forEach((slug) => {
    const tool = remaining.get(slug);
    if (tool) {
      ordered.push(tool);
      remaining.delete(slug);
    }
  });
  TOOLS.forEach((t) => {
    if (remaining.has(t.slug)) ordered.push(t);
  });
  return ordered;
}

export function saveToolOrder(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) 시 조용히 무시 — 순서 변경만 반영 안 될 뿐 기능엔 영향 없음
  }
  window.dispatchEvent(new CustomEvent(TOOL_ORDER_EVENT));
}
