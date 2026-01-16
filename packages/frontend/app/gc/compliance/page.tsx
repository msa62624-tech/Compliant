'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GCCompliancePage() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<'all' | 'compliant' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch compliance data
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/contractors?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-API-Version': '1',
        },
      })
        .then(res => res.json())
        .then(data => {
          setComplianceData(data.contractors || data || []);
          setLoadingData(false);
        })
        .catch(err => {
          console.error('Error fetching compliance data:', err);
          setLoadingData(false);
        });
    }
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredData = complianceData.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'compliant') return item.insuranceStatus === 'COMPLIANT';
    if (filter === 'expired') return item.insuranceStatus === 'EXPIRED';
    if (filter === 'expiring') return item.insuranceStatus === 'PENDING' || item.insuranceStatus === 'NON_COMPLIANT';
    return true;
  });

  const stats = {
    total: complianceData.length,
    compliant: complianceData.filter(i => i.insuranceStatus === 'COMPLIANT').length,
    expiring: complianceData.filter(i => i.insuranceStatus === 'PENDING' || i.insuranceStatus === 'NON_COMPLIANT').length,
    expired: complianceData.filter(i => i.insuranceStatus === 'EXPIRED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Status</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-blue-600 rounded">
                {user?.role}
              </span>
              <button
                onClick={logout}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Subcontractors</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Compliant</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.compliant}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Needs Attention</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.expiring}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Expired</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.expired}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('compliant')}
              className={`px-4 py-2 rounded ${filter === 'compliant' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Compliant ({stats.compliant})
            </button>
            <button
              onClick={() => setFilter('expiring')}
              className={`px-4 py-2 rounded ${filter === 'expiring' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Needs Attention ({stats.expiring})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded ${filter === 'expired' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Expired ({stats.expired})
            </button>
          </div>

          {/* Compliance List */}
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading compliance data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No subcontractors found for this filter.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.companyName}</div>
                        <div className="text-sm text-gray-500">{item.contactName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.insuranceStatus === 'COMPLIANT' ? 'bg-green-100 text-green-800' :
                          item.insuranceStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                          item.insuranceStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.insuranceStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.insuranceDocuments?.length || 0} documents
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/gc/subcontractors/${item.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
