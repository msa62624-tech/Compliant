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
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">My Projects</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
              <p className="text-sm text-gray-500 mt-1">Active jobs</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Total Subcontractors</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">18</p>
              <p className="text-sm text-gray-500 mt-1">Across all projects</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-green-700">✓ Compliant</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">16</p>
              <p className="text-sm text-green-600 mt-1">Verified & active</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-red-700">⚠ Issues</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">2</p>
              <p className="text-sm text-red-600 mt-1">Need attention now</p>
            </div>
          </div>

          {/* Non-Compliant Alert - Most Prominent */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-3">⚠️ Non-Compliant Subcontractors - Action Required</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-red-300">
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Smith & Sons HVAC</p>
                      <p className="text-sm text-gray-700">Project: Downtown Office Building</p>
                      <p className="text-xs text-red-600 mt-1 font-medium">⏰ Insurance EXPIRED 5 days ago</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="inline-block px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg">
                        EXPIRED
                      </span>
                      <p className="text-xs text-gray-600 mt-2">Email sent to GC, Sub, Broker</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-yellow-300">
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">BuildRight Contractors</p>
                      <p className="text-sm text-gray-700">Project: Residential Complex Phase 2</p>
                      <p className="text-xs text-yellow-600 mt-1 font-medium">📋 Documents pending review</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="inline-block px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded-lg">
                        PENDING
                      </span>
                      <p className="text-xs text-gray-600 mt-2">Reminder sent to GC, Sub, Broker</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <a href="/gc/compliance?filter=issues" className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
                    View All Issues →
                  </a>
                  <button className="px-6 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition font-semibold">
                    Send Reminders
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recently Compliant Subcontractors */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-green-900">✓ Recently Verified Compliant</h3>
                  <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">Last 2 days</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-300">
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">ABC Electrical Services</p>
                      <p className="text-sm text-gray-700">Project: Downtown Office Building</p>
                      <p className="text-xs text-green-600 mt-1 font-medium">✓ All insurance documents verified</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg">
                        COMPLIANT
                      </span>
                      <p className="text-xs text-gray-600 mt-2">Confirmed 1 day ago</p>
                      <p className="text-xs text-green-600 font-medium">✉ Confirmation sent to all parties</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-300">
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">XYZ Plumbing Co.</p>
                      <p className="text-sm text-gray-700">Project: Residential Complex Phase 2</p>
                      <p className="text-xs text-green-600 mt-1 font-medium">✓ Insurance renewed and verified</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg">
                        COMPLIANT
                      </span>
                      <p className="text-xs text-gray-600 mt-2">Confirmed 2 days ago</p>
                      <p className="text-xs text-green-600 font-medium">✉ Confirmation sent to all parties</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <a href="/gc/compliance?filter=compliant" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold inline-block">
                    View All Compliant Subs →
                  </a>
                </div>
              </div>
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
