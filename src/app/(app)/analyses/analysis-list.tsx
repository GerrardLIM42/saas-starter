"use client";

import { useState } from "react";

type TopicCount = { label: string; count: number };
type StarCount = { label: string; rating: number; count: number };
type ReviewRow = {
  date?: string;
  rating?: number;
  reviewer?: string;
  option?: string;
  itemName?: string;
  title?: string;
  content?: string;
};

type AnalysisData = {
  analysis?: {
    reviewCount?: number;
    averageRating?: number;
    confidence?: string;
    coverage?: number;
    firstDate?: string;
    lastDate?: string;
    reviewsPerDay?: number;
    estimatedDailySales?: number;
    estimatedDailySalesLow?: number;
    estimatedDailySalesHigh?: number;
    starCounts?: StarCount[];
    sentimentCounts?: { positive: number; neutral: number; negative: number };
    positiveTopics?: TopicCount[];
    negativeTopics?: TopicCount[];
    warnings?: string[];
    reviews?: ReviewRow[];
  };
  payload?: {
    ids?: { productId?: string; itemId?: string; vendorItemId?: string };
  };
};

export type AnalysisItem = {
  id: string;
  productUrl: string;
  productTitle: string | null;
  reviewCount: number;
  averageRating: number;
  estimatedDailySales: number | null;
  analyzedAt: string;
  data: AnalysisData;
};

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function stars(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

export function AnalysisList({ items }: { items: AnalysisItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const open = openId === item.id;
        const a = item.data?.analysis || {};
        return (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setOpenId(open ? null : item.id)}
              className="w-full text-left p-5 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#071a35] truncate">
                  {item.productTitle || item.productUrl}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(item.analyzedAt)} 분석됨</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                  <span>리뷰 {fmtNum(item.reviewCount)}개</span>
                  <span>{stars(item.averageRating)} {fmtNum(item.averageRating, 1)}</span>
                  {item.estimatedDailySales !== null && (
                    <span>추정 일판매 약 {fmtNum(item.estimatedDailySales)}개</span>
                  )}
                  {a.confidence && <span className="text-gray-400">신뢰도 {a.confidence}</span>}
                </div>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{open ? "접기 ▲" : "상세보기 ▼"}</span>
            </button>

            {open && (
              <div className="border-t border-gray-100 p-5 flex flex-col gap-5 bg-gray-50">
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-[#c9961a] font-medium hover:underline break-all"
                >
                  쿠팡 상품 페이지 열기 →
                </a>

                {/* 요약 지표 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="리뷰 수" value={`${fmtNum(item.reviewCount)}개`} />
                  <Stat label="평균 별점" value={fmtNum(item.averageRating, 1)} />
                  <Stat
                    label="추정 일 판매량"
                    value={item.estimatedDailySales !== null ? `약 ${fmtNum(item.estimatedDailySales)}개` : "-"}
                  />
                  <Stat label="일평균 리뷰" value={a.reviewsPerDay ? fmtNum(a.reviewsPerDay, 2) + "개/일" : "-"} />
                </div>

                {/* 별점 분포 */}
                {!!a.starCounts?.length && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">별점 분포</p>
                    <div className="flex flex-col gap-1">
                      {a.starCounts.map((s) => {
                        const total = item.reviewCount || 1;
                        const pct = Math.round((s.count / total) * 100);
                        return (
                          <div key={s.rating} className="flex items-center gap-2 text-xs">
                            <span className="w-8 text-gray-500">{s.rating}점</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full bg-[#c9961a]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-16 text-right text-gray-400">{fmtNum(s.count)}개 ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 감성 분석 */}
                {a.sentimentCounts && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">감성 분석</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-[#4f7864]">긍정 {fmtNum(a.sentimentCounts.positive)}</span>
                      <span className="text-gray-400">중립 {fmtNum(a.sentimentCounts.neutral)}</span>
                      <span className="text-[#b8453a]">부정 {fmtNum(a.sentimentCounts.negative)}</span>
                    </div>
                  </div>
                )}

                {/* 토픽 */}
                {(!!a.positiveTopics?.length || !!a.negativeTopics?.length) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!!a.positiveTopics?.length && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1.5">긍정 키워드</p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.positiveTopics.slice(0, 8).map((t) => (
                            <span key={t.label} className="rounded-full bg-[#4f7864]/10 text-[#4f7864] text-[11px] px-2 py-1">
                              {t.label} {t.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!a.negativeTopics?.length && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1.5">부정 키워드</p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.negativeTopics.slice(0, 8).map((t) => (
                            <span key={t.label} className="rounded-full bg-[#b8453a]/10 text-[#b8453a] text-[11px] px-2 py-1">
                              {t.label} {t.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!!a.warnings?.length && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    {a.warnings.map((w, i) => (
                      <p key={i} className="text-[11px] text-amber-700">
                        ⚠ {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* 최근 리뷰 */}
                {!!a.reviews?.length && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      리뷰 목록 (최근 {Math.min(20, a.reviews.length)}개 표시)
                    </p>
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                      {a.reviews.slice(0, 20).map((r, i) => (
                        <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span>{stars(r.rating || 0)}</span>
                            <span>{r.date}</span>
                            {r.option && <span>· {r.option}</span>}
                          </div>
                          {r.title && <p className="text-xs font-medium text-[#071a35] mt-1">{r.title}</p>}
                          {r.content && <p className="text-xs text-gray-600 mt-0.5">{r.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-3">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-[#071a35] mt-0.5">{value}</p>
    </div>
  );
}
