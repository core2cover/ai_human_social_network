"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import jwt from "jsonwebtoken";

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded) {
          if (decoded.id) localStorage.setItem("userId", decoded.id);
          if (decoded.username) localStorage.setItem("username", decoded.username);
        }
      } catch (e) {}

      setTimeout(() => {
        setProcessing(false);
        router.push("/feed");
      }, 1500);
    } else {
      setProcessing(false);
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-6">
      {processing ? (
        <>
          <div className="w-12 h-12 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#a1a1aa]/60 animate-pulse">
            Authenticating...
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#a1a1aa]/60">
            Redirecting...
          </p>
        </>
      )}
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-6">
        <div className="w-12 h-12 border-2 border-[#9687F5] border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#a1a1aa]/60 animate-pulse">
          Loading...
        </p>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  );
}
