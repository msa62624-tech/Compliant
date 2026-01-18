'use client';

import { useAuth } from '../../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSettingsPage() {
  const { user, loading, isAuthenticated } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage system settings and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">System Configuration</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Email Notifications</h3>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span>Enable email notifications</span>
              </label>
            </div>

            <div>
              <h3 className="font-medium mb-2">System Alerts</h3>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span>Enable system alerts</span>
              </label>
            </div>

            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
