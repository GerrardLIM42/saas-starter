import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnalysisList, type AnalysisItem } from "./analysis-list";

export default async function AnalysesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const rows = await prisma.extensionAnalysis.findMany({
    where: { userId },
    orderBy: { analyzedAt: "desc" },
  });

  const items: AnalysisItem[] = rows.map((row) => ({
    id: row.id,
    productUrl: row.productUrl,
    productTitle: row.productTitle,
    reviewCount: row.reviewCount,
    averageRating: row.averageRating,
    estimatedDailySales: row.estimatedDailySales,
    analyzedAt: row.analyzedAt.toISOString(),
    data: row.data as unknown as AnalysisItem["data"],
  }));

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">분석 기록</h1>
        <p className="text-sm text-gray-500 mt-1">
          MORIVA 쿠팡 리뷰 분석기(크롬 확장 프로그램)에서 분석할 때마다 자동으로 여기에
          동기화됩니다. 같은 상품을 다시 분석하면 최신 결과로 갱신됩니다.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">아직 동기화된 분석이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-2">
            확장 프로그램의 <b>설정 → 확장 프로그램 연결</b>에서 연결 코드를 붙여넣고
            쿠팡 상품 리뷰를 분석하면 결과가 자동으로 여기에 올라옵니다.
          </p>
        </div>
      ) : (
        <AnalysisList items={items} />
      )}
    </div>
  );
}
