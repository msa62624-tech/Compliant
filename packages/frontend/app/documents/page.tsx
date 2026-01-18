'use client';

import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DocumentsPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        // Redirect based on role
        if (user?.role === 'SUBCONTRACTOR') {
          router.replace('/subcontractor/documents');
        } else if (user?.role === 'BROKER') {
          router.replace('/broker/documents');
        } else if (user?.role === 'CONTRACTOR') {
          router.replace('/contractor/documents');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
