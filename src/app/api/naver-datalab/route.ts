import { NextRequest, NextResponse } from "next/server";

// 네이버 데이터랩 오픈 API는 브라우저에서 직접 호출하면 CORS로 막히기 때문에,
// 이 라우트가 서버에서 대신 호출해주는 프록시 역할만 한다.
// Client ID/Secret은 사용자가 각자 발급받아 브라우저(localStorage)에만 저장하고,
// 매 요청마다 body로 함께 보내서 그대로 네이버로 전달할 뿐 우리 서버/DB에는 저장하지 않는다.

type KeywordGroup = { groupName: string; keywords: string[] };

type SearchTrendBody = {
  mode: "search-trend";
  clientId: string;
  clientSecret: string;
  startDate: string;
  endDate: string;
  timeUnit: "date" | "week" | "month";
  keywordGroups: KeywordGroup[];
};

type ShoppingKeywordBody = {
  mode: "shopping-keyword";
  clientId: string;
  clientSecret: string;
  startDate: string;
  endDate: string;
  timeUnit: "date" | "week" | "month";
  category: string;
  keyword: string;
  device?: "" | "pc" | "mo";
  gender?: "" | "f" | "m";
  ages?: string[];
};

type Body = SearchTrendBody | ShoppingKeywordBody;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const clientId = body.clientId?.trim();
  const clientSecret = body.clientSecret?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "네이버 API 키(Client ID / Client Secret)를 입력해주세요." },
      { status: 400 }
    );
  }

  let url: string;
  let payload: Record<string, unknown>;

  if (body.mode === "search-trend") {
    const groups = (body.keywordGroups || []).filter(
      (g) => g.groupName?.trim() && g.keywords?.length
    );
    if (!groups.length) {
      return NextResponse.json({ error: "키워드를 1개 이상 입력해주세요." }, { status: 400 });
    }
    url = "https://openapi.naver.com/v1/datalab/search";
    payload = {
      startDate: body.startDate,
      endDate: body.endDate,
      timeUnit: body.timeUnit,
      keywordGroups: groups.slice(0, 5).map((g) => ({
        groupName: g.groupName.trim(),
        keywords: g.keywords.slice(0, 20),
      })),
    };
  } else if (body.mode === "shopping-keyword") {
    if (!body.category?.trim() || !body.keyword?.trim()) {
      return NextResponse.json({ error: "카테고리 코드와 키워드를 입력해주세요." }, { status: 400 });
    }
    url = "https://openapi.naver.com/v1/datalab/shopping/category/keywords";
    payload = {
      startDate: body.startDate,
      endDate: body.endDate,
      timeUnit: body.timeUnit,
      category: body.category.trim(),
      keyword: [{ name: body.keyword.trim(), param: [body.keyword.trim()] }],
      device: body.device || "",
      gender: body.gender || "",
      ages: body.ages?.length ? body.ages : [],
    };
  } else {
    return NextResponse.json({ error: "지원하지 않는 조회 유형입니다." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const message =
        data?.errorMessage ||
        (res.status === 401 || res.status === 403
          ? "네이버 API 키가 올바르지 않습니다. Client ID / Secret을 다시 확인해주세요."
          : `네이버 API 오류 (${res.status})`);
      return NextResponse.json({ error: message }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("naver-datalab proxy failed", err);
    return NextResponse.json({ error: "네이버 API 호출 중 오류가 발생했습니다." }, { status: 500 });
  }
}
