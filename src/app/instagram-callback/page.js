"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InstagramCallback() {
  const router = useRouter();

  useEffect(() => {
    // Parse authorization code from URL query parameters
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");
      
      if (code) {
        console.log("Instagram authorization code received:", code);
        // In a real app, you would exchange this code for an access token via a backend API call
        // For now, we'll store the code and handle it later or implement a proper token exchange
        localStorage.setItem("instagram_auth_code", code);
        
        // TODO: Exchange code for access token via backend API
        // For demo purposes, we'll just redirect to dashboard
        router.replace("/dashboard");
      } else if (error) {
        console.error("Instagram authorization error:", error);
        // Handle error case
        alert("Error connecting to Instagram: " + error);
        router.replace("/dashboard");
      } else {
        // If no code or error found, redirect to dashboard after a delay
        const timer = setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Connecting Instagram...</h1>
      <p className="mb-6 text-center">Please wait while we connect your Instagram account.</p>
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}