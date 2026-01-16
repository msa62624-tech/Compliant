'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@compliant/shared';
import AdminDashboard from './components/AdminDashboard';
import ContractorDashboard from './components/ContractorDashboard';
import SubcontractorDashboard from './components/SubcontractorDashboard';
import BrokerDashboard from './components/BrokerDashboard';

export default function DashboardPage() {
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

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case UserRole.CONTRACTOR:
      return <ContractorDashboard user={user} onLogout={logout} />;
    case UserRole.SUBCONTRACTOR:
      return <SubcontractorDashboard user={user} onLogout={logout} />;
    case UserRole.BROKER:
      return <BrokerDashboard user={user} onLogout={logout} />;
    case UserRole.ADMIN:
    case UserRole.MANAGER:
    case UserRole.USER:
    default:
      return <AdminDashboard user={user} onLogout={logout} />;
  }
}
