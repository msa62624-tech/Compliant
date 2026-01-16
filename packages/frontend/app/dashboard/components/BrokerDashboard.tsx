'use client';

import { User } from '@compliant/shared';

interface BrokerDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function BrokerDashboard({ user, onLogout }: BrokerDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Broker Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-emerald-600 rounded">
                {user?.role}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Broker Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Active Policies</h3>
              <p className="text-3xl font-bold text-emerald-600 mt-2">42</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Clients</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">18</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Expiring Soon</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">5</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/clients"
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Client Management</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Manage contractors and subcontractors
                </p>
              </a>
              <a
                href="/policies"
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Insurance Policies</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage all insurance policies
                </p>
              </a>
              <a
                href="/renewals"
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Policy Renewals</h4>
                <p className="text-sm text-gray-600 mt-1">Track and process policy renewals</p>
              </a>
              <a
                href="/reports"
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Reports & Analytics</h4>
                <p className="text-sm text-gray-600 mt-1">Generate compliance and policy reports</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
