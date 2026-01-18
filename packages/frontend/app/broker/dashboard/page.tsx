'use client';

import { useAuth } from '../../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BrokerDashboard from '../../dashboard/components/BrokerDashboard';

export default function BrokerDashboardPage() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return <BrokerDashboard user={user} onLogout={logout} />;
}
