'use client';

import { useAuth } from '@/context/AuthContext';

export default function FacebookLoginButton() {
  const { login, loading } = useAuth();

  const handleLogin = () => {
    login();
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#1877F2] text-white gap-2 hover:bg-[#0e6edf] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
    >
      {loading ? 'Loading...' : 'Connect with Facebook'}
    </button>
  );
}