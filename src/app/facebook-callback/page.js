"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FacebookCallback() {
  const router = useRouter();

  useEffect(() => {
    // Parse access_token from URL fragment
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      if (accessToken) {
        // Store token (for demo: localStorage, for production: send to backend or Supabase)
        localStorage.setItem("fb_access_token", accessToken);
        // Optionally: fetch pages here or in dashboard
        router.replace("/dashboard");
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Connecting Facebook...</h1>
      <p className="text-center">
        Please wait while we connect your Facebook account.
      </p>
    </div>
  );
}
