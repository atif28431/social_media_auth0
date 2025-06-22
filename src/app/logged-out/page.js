"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoggedOut() {
  useEffect(() => {
    const clearAllData = async () => {
      // Create Supabase client
      const supabase = createClient();
      
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
      }
      
      // Redirect to home after clearing
      window.location.href = "/";
    };
    
    clearAllData();
  }, []);

  return <p>Logging you out...</p>;
}
