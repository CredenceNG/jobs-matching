'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Logout Page
 *
 * Handles user logout by clearing session cookie and redirecting to home
 */
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        // Call logout API to clear session cookie
        await fetch('/api/auth/logout', { method: 'POST' });

        // Redirect to home page
        router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        router.push('/');
      }
    };

    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you out...</p>
      </div>
    </div>
  );
}
