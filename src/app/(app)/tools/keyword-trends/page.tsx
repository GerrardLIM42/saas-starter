"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Mode = "search-trend" | "shopping-keyword";
type TimeUnit = "date" | "week" | "month";

type Series = {
  id: string;
  label: string;
  color: string;
  data: { period: string; ratio: number }[];
};

const COLORS = ["#071a35", "#c9961a", "#3e5f82", "#b8453a", "#4f7864", "#86586b", "#5b7c99"];

const KEY_STORE = "moriva_naver_keys";

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function loadKeys() {
  if (typeof window === "undefined") return { clientId: "", clientSecret: "" };
  try {
    return JSON.parse(window.localStorage.getItem(KEY_STORE) || "{}");
  } catch {
    return { clientId: "", clientSecret: "" };
  }
}

export default function KeywordTrendsPage() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saveKeys, setSaveKeys] = useState(false);

  const [mode, setMode] = useState<Mode>("search-trend");
  const [startDate, setStartDate] = useState(todayStr(-90));
  const [endDate, setEndDate] = useState(todayStr());
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("date");

  // 검색어 트렌드 / 연관 키워드 비교 모드
  const [keywordInputs, setKeywordInputs] = useState(["", "", "", "", ""]);

  // 쇼핑인사이트 모드
  const [category, setCategory] = useState("");
  const [shopKeyword, setShopKeyword] = useState("");
  const [device, setDevice] = useState<"" | "pc" | "mo">("");
  const [gender, setGender] = useState<"" | "f" | "m">("");
  const [ages, setAges] = useState<string[]>([]);

  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = loadKeys();
    if (saved.clientId) setClientId(saved.clientId);
    if (saved.clientSecret) setClientSecret(saved.clientSecret);
    if (saved.clientId || saved.clientSecret) setSaveKeys(true);
  }, []);

  function persistKeys(id: string, secret: string, save: boolean) {
    try {
      if (save && (id.trim() || secret.trim())) {
        window.localStorage.setItem(KEY_STORE, JSON.stringify({ clientId: id.trim(), clientSecret: secret.trim() }));
      } else {
        window.localStorage.removeItem(KEY_STORE);
      }
    } catch {
      // localStorage 접근 불가 시 조용히 무시
    }
  }

  function toggleAge(a: string) {
    setAges((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function runQuery() {
    setError("");
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("네이버 API 키(Client ID / Client Secret)를 먼저 입력해주세요.");
      return;
    }
    persistKeys(clientId, clientSecret, saveKeys);

    let body: Record<string, unknown>;
    let label: string;

    if (mode === "search-trend") {
      const groups = keywordInputs
        .map((k) => k.trim())
        .filter(Boolean)
        .map((k) => ({ groupName: k, keywords: [k] }));
      if (!groups.length) {
        setError("키워드를 1개 이상 입력해주세요.");
        return;
      }
      body = { mode, clientId, clientSecret, startDate, endDate, timeUnit, keywordGroups: groups };
      label = groups.map((g) => g.groupName).join(" · ");
    } else {
      if (!category.trim() || !shopKeyword.trim()) {
        setError("카테고리 코드와 키워드를 입력해주세요.");
        return;
      }
      body = {
        mode,
        clientId,
        clientSecret,
        startDate,
        endDate,
        timeUnit,
        category: category.trim(),
        keyword: shopKeyword.trim(),
        device,
        gender,
        ages,
      };
      const filterBits = [
        device === "pc" ? "PC" : device === "mo" ? "모바일" : "",
        gender === "f" ? "여성" : gender === "m" ? "남성" : "",
        ages.length ? ages.map((a) => a + "대").join("/") : "",
      ].filter(Boolean);
      label = shopKeyword.trim() + (filterBits.length ? ` (${filterBits.join(", ")})` : " (전체)");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/naver-datalab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "조회에 실패했습니다.");

      const results = (json.results || []) as { title: string; data: { period: string; ratio: number }[] }[];
      if (!results.length) throw new Error("결과가 없습니다.");

      if (mode === "search-trend") {
        const newSeries: Series[] = results.map((r, i) => ({
          id: `${Date.now()}-${i}`,
          label: r.title,
          color: COLORS[(series.length + i) % COLORS.length],
          data: r.data,
        }));
        setSeries((prev) => [...prev, ...newSeries]);
      } else {
        setSeries((prev) => [
          ...prev,
          {
            id: `${Date.now()}`,
            label,
            color: COLORS[prev.length % COLORS.length],
            data: results[0].data,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function removeSeries(id: string) {
    setSeries((prev) => prev.filter((s) => s.id !== id));
  }
  function clearAll() {
    setSeries([]);
    setError("");
  }

  const chart = useMemo(() => buildChart(series), [series]);

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-3xl mx-auto">
      <div>
        <Link href="/tools" className="text-xs text-gray-400 hover:text-[#071a35]">
          ← 도구 목록
        </Link>
        <h1 className="text-xl font-semibold text-[#071a35] mt-2">네이버 키워드 분석</h1>
        <p className="text-sm text-gray-500 mt-1">
          네이버 데이터랩으로 검색어 트렌드·연관 키워드·쇼핑인사이트(연령/성별/기기)를 조회합니다.
          본인 명의 네이버 API 키가 필요합니다 (무료 발급).
        </p>
      </div>

      {/* API 키 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-[#071a35] mb-3">네이버 API 설정</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Client ID</span>
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="네이버 개발자센터에서 발급"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9961a]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Client Secret</span>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="off"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9961a]"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <input type="checkbox" checked={saveKeys} onChange={(e) => setSaveKeys(e.target.checked)} />
          이 브라우저에 키 저장 (내 PC에서만 사용할 때 체크)
        </label>
        <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
          발급: <a href="https://developers.naver.com/apps/#/register" target="_blank" rel="noopener" className="text-[#c9961a] font-medium">네이버 개발자센터 → Application 등록</a>
          {" "}(사용 API에서 "데이터랩(검색어 트렌드)"·"데이터랩(쇼핑인사이트)" 선택, 무료·즉시 발급). 키는 이 브라우저에만 저장되고 서버 DB에는 저장되지 않습니다.
        </p>
      </div>

      {/* 모드 탭 */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        <button
          onClick={() => setMode("search-trend")}
          className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
            mode === "search-trend" ? "bg-[#071a35] text-white" : "text-gray-500"
          }`}
        >
          검색어 트렌드 · 연관 키워드 비교
        </button>
        <button
          onClick={() => setMode("shopping-keyword")}
          className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
            mode === "shopping-keyword" ? "bg-[#071a35] text-white" : "text-gray-500"
          }`}
        >
          쇼핑인사이트 (연령·성별·기기)
        </button>
      </div>

      {/* 조회 조건 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">시작일</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">종료일</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">단위</span>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="date">일간</option>
              <option value="week">주간</option>
              <option value="month">월간</option>
            </select>
          </label>
        </div>

        {mode === "search-trend" ? (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              키워드 (최대 5개 — 각각 한 줄의 그래프로 비교됩니다)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keywordInputs.map((v, i) => (
                <input
                  key={i}
                  value={v}
                  onChange={(e) => {
                    const next = [...keywordInputs];
                    next[i] = e.target.value;
                    setKeywordInputs(next);
                  }}
                  placeholder={`키워드 ${i + 1}`}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">카테고리 코드</span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 50000000 (패션의류)"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">키워드</span>
                <input
                  value={shopKeyword}
                  onChange={(e) => setShopKeyword(e.target.value)}
                  placeholder="예: 캠핑의자"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <p className="text-[11px] text-gray-400 -mt-1">
              카테고리 코드는 네이버쇼핑에서 카테고리 클릭 시 주소창의 catId 값으로 확인할 수 있어요. (예시: 패션의류 = 50000000)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">기기</span>
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value as "" | "pc" | "mo")}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  <option value="pc">PC</option>
                  <option value="mo">모바일</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">성별</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "" | "f" | "m")}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">전체</option>
                  <option value="f">여성</option>
                  <option value="m">남성</option>
                </select>
              </label>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-600 block mb-1.5">연령대 (복수 선택, 비우면 전체)</span>
              <div className="flex flex-wrap gap-2">
                {["10", "20", "30", "40", "50", "60"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAge(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      ages.includes(a)
                        ? "border-[#071a35] bg-[#071a35] text-white"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {a}대
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              연령/성별/기기를 바꿔가며 "조회 추가"를 여러 번 누르면 그래프에 선이 쌓여서 서로 비교할 수 있어요.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-[#b8453a]">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={runQuery}
            disabled={loading}
            className="rounded-md bg-[#071a35] text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-50"
          >
            {loading ? "조회 중…" : "조회 추가"}
          </button>
          {series.length > 0 && (
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-[#b8453a]">
              전체 지우기
            </button>
          )}
        </div>
      </div>

      {/* 결과 차트 */}
      {series.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-[#071a35] mb-4">
            검색량 추이 <span className="text-gray-400 font-normal">(최고값을 100으로 한 상대 비율)</span>
          </p>
          <svg viewBox="0 0 600 220" className="w-full h-auto">
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1={40}
                  x2={590}
                  y1={190 - v * 1.6}
                  y2={190 - v * 1.6}
                  stroke="#eceef3"
                  strokeWidth={1}
                />
                <text x={4} y={194 - v * 1.6} fontSize={9} fill="#9ca3af">
                  {v}
                </text>
              </g>
            ))}
            {chart.paths.map((p) => (
              <path key={p.id} d={p.d} fill="none" stroke={p.color} strokeWidth={2} />
            ))}
          </svg>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-gray-700">{s.label}</span>
                <button onClick={() => removeSeries(s.id)} className="text-gray-300 hover:text-[#b8453a]">
                  ✕
                </button>
              </div>
            ))}
          </div>
          {chart.dateLabels.first && (
            <p className="text-[10.5px] text-gray-400 mt-2">
              {chart.dateLabels.first} ~ {chart.dateLabels.last}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function buildChart(series: Series[]) {
  const maxLen = Math.max(0, ...series.map((s) => s.data.length));
  const paths = series.map((s) => {
    const n = s.data.length;
    const pts = s.data.map((d, i) => {
      const x = 40 + (n <= 1 ? 0 : (i / (n - 1)) * 550);
      const y = 190 - Math.max(0, Math.min(100, d.ratio)) * 1.6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { id: s.id, color: s.color, d: pts.length ? "M" + pts.join(" L") : "" };
  });
  const longest = series.find((s) => s.data.length === maxLen);
  return {
    paths,
    dateLabels: {
      first: longest?.data[0]?.period ?? "",
      last: longest?.data[longest.data.length - 1]?.period ?? "",
    },
  };
}
