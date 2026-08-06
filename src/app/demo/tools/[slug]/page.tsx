// 실제 도구 상세 페이지를 그대로 재사용한다(정적 HTML을 iframe으로 보여줄 뿐 로그인/DB에 의존하지 않음).
export { default, generateStaticParams } from "@/app/(app)/tools/[slug]/page";
