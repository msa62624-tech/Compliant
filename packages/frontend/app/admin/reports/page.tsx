'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { formatToEasternTime } from '../../../lib/utils';

type ReportType = 'compliance' | 'expiring' | 'deficient' | 'contractors' | 'projects';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportType>('compliance');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generating, setGenerating] = useState(false);

  const reports = [
    {
      id: 'compliance' as ReportType,
      name: 'Compliance Status Report',
      description: 'Overview of all contractors compliance status',
      icon: '📊'
    },
    {
      id: 'expiring' as ReportType,
      name: 'Expiring Policies Report',
      description: 'Insurance policies expiring within 30/60/90 days',
      icon: '⏰'
    },
    {
      id: 'deficient' as ReportType,
      name: 'Deficient COIs Report',
      description: 'All COIs marked as deficient and pending correction',
      icon: '⚠️'
    },
    {
      id: 'contractors' as ReportType,
      name: 'Contractors Summary',
      description: 'Complete list of all contractors and subcontractors',
      icon: '👷'
    },
    {
      id: 'projects' as ReportType,
      name: 'Projects Report',
      description: 'All projects with compliance status',
      icon: '🏗️'
    }
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { adminApi } = await import('../../../lib/api/admin');
      await adminApi.generateReport({
        reportType: selectedReport || 'compliance',
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      
      alert(`${reports.find(r => r.id === selectedReport)?.name} generated successfully!`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportDetails = reports.find(r => r.id === selectedReport);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
                <div className="space-y-2">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`w-full text-left p-4 rounded-lg transition ${
                        selectedReport === report.id
                          ? 'bg-emerald-50 border-2 border-emerald-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{report.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{report.name}</h3>
                          <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Contractors</span>
                    <span className="font-semibold text-gray-900">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Projects</span>
                    <span className="font-semibold text-gray-900">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compliant</span>
                    <span className="font-semibold text-green-600">134</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deficient</span>
                    <span className="font-semibold text-red-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Configuration & Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-4xl">{selectedReportDetails?.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedReportDetails?.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedReportDetails?.description}</p>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Export Format */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input type="radio" name="format" value="pdf" defaultChecked className="mr-2" />
                        <span className="text-sm text-gray-700">PDF</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="format" value="excel" className="mr-2" />
                        <span className="text-sm text-gray-700">Excel</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="format" value="csv" className="mr-2" />
                        <span className="text-sm text-gray-700">CSV</span>
                      </label>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
                  >
                    {generating ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <span>📄</span>
                        Generate Report
                      </>
                    )}
                  </button>
                </div>

                {/* Report Preview/Info */}
                <div className="border-t mt-6 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Includes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedReport === 'compliance' && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>✓ Overall compliance rate</li>
                        <li>✓ Breakdown by contractor type (GC vs Subcontractor)</li>
                        <li>✓ Breakdown by trade type</li>
                        <li>✓ List of all non-compliant contractors</li>
                        <li>✓ Expiring policies within 30 days</li>
                      </ul>
                    )}
                    {selectedReport === 'expiring' && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>✓ Policies expiring in next 30 days</li>
                        <li>✓ Policies expiring in 31-60 days</li>
                        <li>✓ Policies expiring in 61-90 days</li>
                        <li>✓ Contractor contact information</li>
                        <li>✓ Broker contact information</li>
                      </ul>
                    )}
                    {selectedReport === 'deficient' && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>✓ All COIs marked as deficient</li>
                        <li>✓ Deficiency reasons and notes</li>
                        <li>✓ Date deficiency was marked</li>
                        <li>✓ Contractor and broker contact info</li>
                        <li>✓ Related project information</li>
                      </ul>
                    )}
                    {selectedReport === 'contractors' && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>✓ Complete contractor list</li>
                        <li>✓ Contact information</li>
                        <li>✓ Trade type and specialization</li>
                        <li>✓ Insurance status</li>
                        <li>✓ Assigned projects</li>
                        <li>✓ Broker information</li>
                      </ul>
                    )}
                    {selectedReport === 'projects' && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>✓ All active and completed projects</li>
                        <li>✓ Project details and timeline</li>
                        <li>✓ Assigned contractors</li>
                        <li>✓ Compliance status per project</li>
                        <li>✓ GC information</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Compliance Status Report</p>
                        <p className="text-xs text-gray-600">Generated {formatToEasternTime(new Date(Date.now() - 2 * 60 * 60 * 1000))}</p>
                      </div>
                    </div>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      Download
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏰</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Expiring Policies Report</p>
                        <p className="text-xs text-gray-600">Generated {formatToEasternTime(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))}</p>
                      </div>
                    </div>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      Download
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👷</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contractors Summary</p>
                        <p className="text-xs text-gray-600">Generated {formatToEasternTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))}</p>
                      </div>
                    </div>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
