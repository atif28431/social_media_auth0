import Link from 'next/link';

export default function LoggedOut() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            You&apos;ve been logged out
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thanks for using our social media manager!
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <Link
              href="/auth/login"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in again
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
