# SaaS Starter (구독 + 크레딧 + OpenAI)

Next.js(App Router) + Prisma + Auth.js(NextAuth v5) + Stripe + OpenAI 스타터입니다.

## 포함된 것

- 이메일/비밀번호 회원가입·로그인 (Auth.js, JWT 세션)
- Prisma 스키마: `User`, `Subscription`, `Plan`, `CreditLedger` (크레딧 원장 방식)
- 크레딧 지급/차감 헬퍼 (`src/lib/credits.ts`) — 트랜잭션 + 원자적 차감으로 동시성 안전
- OpenAI 프록시 API (`src/app/api/ai/chat`) — 서버에서만 키 사용, 실사용 토큰 기준 크레딧 차감
- Stripe 웹훅 스켈레톤 (`src/app/api/webhooks/stripe`) — 구독 갱신/크레딧 구매 이벤트 처리
- 대시보드 페이지 + 간단한 채팅 위젯 (크레딧 잔액 실시간 표시)

## 시작하기

### 1. 환경변수

```bash
cp .env.example .env
```

`.env`를 채우세요:

- `DATABASE_URL`: Postgres 연결 문자열 (로컬은 Docker 등으로 띄우면 됩니다)
- `AUTH_SECRET`: `npx auth secret` 로 생성
- `OPENAI_API_KEY`: OpenAI 대시보드에서 발급
- `STRIPE_*`: Stripe 테스트 모드 키 (2단계에서 실제로 사용, 지금은 비워둬도 앱 실행에는 지장 없음)

### 2. DB

```bash
npm run db:push    # 스키마를 DB에 반영 (개발 초기엔 migrate 대신 push로 빠르게)
npm run db:seed     # Free/Pro 플랜 시드 데이터 생성
```

### 3. 개발 서버

```bash
npm run dev
```

`/signup` 에서 가입하면 가입 즉시 50 크레딧이 지급됩니다(`WELCOME_CREDITS`,
`src/app/api/auth/signup/route.ts`). `/dashboard` 에서 크레딧 잔액을 보고
OpenAI 호출(`/api/ai/chat`)을 테스트할 수 있습니다.

## 다음 단계 (2단계: Stripe 연동)

1. Stripe 대시보드(테스트 모드)에서 Pro 플랜의 월간/연간 Price, 크레딧 팩 Price 생성
2. `.env`의 `STRIPE_PRICE_*` 값 채우고 `npm run db:seed` 재실행
3. Checkout Session 생성 API 라우트 추가 (`/api/stripe/checkout`)
4. `stripe listen --forward-to localhost:3000/api/webhooks/stripe` 로 로컬 웹훅 테스트

## 크레딧/모델 단가 조정

`src/lib/openai.ts`의 `MODEL_CREDIT_RATE`에서 모델별 "1,000 토큰당 크레딧"을
직접 책정합니다. OpenAI 원가 대비 마진을 고려해 조정하세요.

## 폴더 구조 참고

```
src/
  auth.ts                  # NextAuth 설정 (Credentials + Prisma adapter)
  middleware.ts             # /dashboard 보호
  lib/
    prisma.ts
    credits.ts               # 크레딧 지급/차감 (원장 기반)
    openai.ts                # OpenAI 클라이언트 + 토큰→크레딧 환산
    stripe.ts
  app/
    api/
      auth/[...nextauth]/    # NextAuth 핸들러
      auth/signup/            # 회원가입
      ai/chat/                 # OpenAI 프록시 (크레딧 차감)
      credits/balance/         # 잔액 조회
      webhooks/stripe/         # Stripe 웹훅
    dashboard/                 # 로그인 후 대시보드 + 채팅 위젯
    signin/, signup/
prisma/
  schema.prisma
  seed.ts
```
