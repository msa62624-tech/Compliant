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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">General Contractor Dashboard</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  As a General Contractor, you add subcontractors to your projects and monitor their insurance compliance.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">My Projects</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
              <p className="text-sm text-gray-500 mt-1">Active jobs</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">My Subcontractors</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">18</p>
              <p className="text-sm text-gray-500 mt-1">Across all projects</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Compliance Issues</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">2</p>
              <p className="text-sm text-gray-500 mt-1">Need attention</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/gc/projects"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">My Projects</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage your construction projects
                </p>
              </a>
              <a
                href="/gc/subcontractors"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Add Subcontractors</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add subcontractors to your projects
                </p>
              </a>
              <a
                href="/gc/compliance"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Compliance Status</h4>
                <p className="text-sm text-gray-600 mt-1">Monitor subcontractor insurance compliance</p>
              </a>
              <a
                href="/gc/reports"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Project Reports</h4>
                <p className="text-sm text-gray-600 mt-1">Generate project compliance reports</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
