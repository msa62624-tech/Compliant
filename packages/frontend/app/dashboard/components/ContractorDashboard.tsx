'use client';

import { User } from '@compliant/shared';

interface ContractorDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function ContractorDashboard({ user, onLogout }: ContractorDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Contractor Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-blue-600 rounded">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Contractor Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">My Projects</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Insurance Status</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">✓ Active</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Documents Due</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">2</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/projects"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">My Projects</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View projects you're assigned to
                </p>
              </a>
              <a
                href="/insurance"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Insurance Documents</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Upload and manage your insurance certificates
                </p>
              </a>
              <a
                href="/compliance"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Compliance Status</h4>
                <p className="text-sm text-gray-600 mt-1">View your compliance requirements</p>
              </a>
              <a
                href="/profile"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Company Profile</h4>
                <p className="text-sm text-gray-600 mt-1">Update your company information</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
