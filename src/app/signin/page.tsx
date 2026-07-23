"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
      <h1 className="text-xl font-semibold">로그인</h1>

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-sm text-gray-500">
        계정이 없으신가요? <Link href="/signup" className="underline">회원가입</Link>
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex-1 h-px bg-gray-200" />
        또는
        <span className="flex-1 h-px bg-gray-200" />
      </div>

      <a
        href="/demo"
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-center hover:border-[#c9961a]/60 hover:text-[#c9961a] transition"
      >
        로그인 없이 데모로 둘러보기
      </a>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
