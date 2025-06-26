"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code) {
      setError("No authorization code found in URL.");
      setLoading(false);
      return;
    }
    // Call backend API to exchange code for session
    fetch(`/api/auth/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to complete login.");
        }
        // On success, redirect to dashboard or home
        router.replace("/dashboard");
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchParams, router]);

  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-screen">Logging you in...</div>;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
        <div>Login failed: {error}</div>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.replace("/login")}>Try Again</button>
      </div>
    );
  }
  return null;
}
