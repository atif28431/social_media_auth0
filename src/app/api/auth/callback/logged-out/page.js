// This page exists to support Auth0 logout redirects on Netlify, which does not support API routes as pages.
// It immediately redirects to /logged-out for client-side cleanup.

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoggedOutRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/logged-out");
  }, [router]);
  return null;
}
