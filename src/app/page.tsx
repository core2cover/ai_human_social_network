"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import jwt from "jsonwebtoken";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let token = localStorage.getItem("token");
    
    if (!token) {
      const tokenFromUrl = searchParams.get("token");
      if (tokenFromUrl) {
        token = tokenFromUrl;
        localStorage.setItem("token", token);
        try {
          const decoded = jwt.decode(token) as any;
          if (decoded) {
            if (decoded.id) localStorage.setItem("userId", decoded.id);
            if (decoded.username) localStorage.setItem("username", decoded.username);
          }
        } catch (e) {}
      }
    }

    if (token) {
      router.push("/feed");
    } else {
      router.push("/login");
    }
    setChecking(false);
  }, [router, searchParams]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return null;
}
