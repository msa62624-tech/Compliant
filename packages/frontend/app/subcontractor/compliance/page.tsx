'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';

interface ComplianceStatus {
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED';
  lastUpdated?: string;
  policies: {
    generalLiability: PolicyStatus;
    autoLiability: PolicyStatus;
    umbrella: PolicyStatus;
    workersComp: PolicyStatus;
  };
  notifications: Notification[];
}

interface PolicyStatus {
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED';
  expirationDate?: string;
  documentUrl?: string;
  broker?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  sentTo: string[];
}

export default function SubcontractorCompliancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceStatus();
  }, []);

  const fetchComplianceStatus = async () => {
    setLoading(true);
    try {
      const { subcontractorApi } = await import('../../../lib/api/subcontractor');
      const data = await subcontractorApi.getComplianceStatus();
      setCompliance(data);
    } catch (error) {
      console.error('Failed to fetch compliance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'green';
      case 'NON_COMPLIANT': return 'red';
      case 'EXPIRED': return 'red';
      case 'PENDING': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'NON_COMPLIANT':
      case 'EXPIRED':
        return (
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'PENDING':
        return (
          <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderPolicyCard = (title: string, policy: PolicyStatus | undefined) => {
    if (!policy) {
      return (
        <div className="bg-white rounded-lg shadow border-l-4 border-gray-300 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 mt-1">
                  No Data
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Policy information not available</p>
        </div>
      );
    }
    
    const color = getStatusColor(policy.status);
    return (
      <div className={`bg-white rounded-lg shadow border-l-4 border-${color}-500 p-6`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(policy.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800 mt-1`}>
                {policy.status}
              </span>
            </div>
          </div>
        </div>
        
        {policy.expirationDate && (
          <div className="mb-3">
            <p className="text-sm text-gray-600">Expiration Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(policy.expirationDate).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {policy.broker && (
          <div className="mb-3">
            <p className="text-sm text-gray-600">Broker</p>
            <p className="text-sm font-medium text-gray-900">{policy.broker.name}</p>
            <p className="text-xs text-gray-500">{policy.broker.email}</p>
            {policy.broker.phone && (
              <p className="text-xs text-gray-500">{policy.broker.phone}</p>
            )}
          </div>
        )}
        
        {policy.documentUrl && (
          <a
            href={policy.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Document
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Compliance Status</h1>
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
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading compliance status...</p>
            </div>
          ) : !compliance ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Compliance Data</h3>
                <p className="mt-1 text-sm text-gray-500 mb-4">
                  You need to add your broker information to get started.
                </p>
                <button
                  onClick={() => router.push('/subcontractor/broker')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                >
                  Add Broker Information
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Overall Status Card */}
              <div className={`bg-white rounded-lg shadow border-l-4 border-${getStatusColor(compliance.overallStatus)}-500 p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(compliance.overallStatus)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Overall Compliance Status</h2>
                      <p className={`text-lg font-semibold text-${getStatusColor(compliance.overallStatus)}-600 mt-1`}>
                        {compliance.overallStatus}
                      </p>
                      {compliance.lastUpdated && (
                        <p className="text-sm text-gray-500 mt-1">
                          Last Updated: {new Date(compliance.lastUpdated).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={fetchComplianceStatus}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Policy Cards */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Insurance Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderPolicyCard('General Liability', compliance.policies?.generalLiability)}
                  {renderPolicyCard('Auto Liability', compliance.policies?.autoLiability)}
                  {renderPolicyCard('Umbrella Policy', compliance.policies?.umbrella)}
                  {renderPolicyCard('Workers Compensation', compliance.policies?.workersComp)}
                </div>
              </div>

              {/* Email Notifications */}
              {compliance.notifications && compliance.notifications.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📧 Recent Email Notifications</h3>
                  <div className="space-y-4">
                    {compliance.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border-l-4 p-4 ${
                          notification.type === 'success'
                            ? 'border-green-400 bg-green-50'
                            : notification.type === 'warning'
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-red-400 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Sent to: {notification.sentTo.join(', ')}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
