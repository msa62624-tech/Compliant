'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProjectSubcontractorsPage() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      // Fetch project details
      Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'X-API-Version': '1',
          },
        }).then(res => res.json()),
        
        // Fetch contractors for this project
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/contractors`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'X-API-Version': '1',
          },
        }).then(res => res.json()).catch(() => ({ contractors: [] }))
      ])
        .then(([projectData, contractorsData]) => {
          setProject(projectData);
          setSubcontractors(contractorsData.contractors || contractorsData || []);
          setLoadingData(false);
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setLoadingData(false);
        });
    }
  }, [isAuthenticated, projectId]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/gc/projects" className="text-blue-600 hover:text-blue-800">
                ← Back to Projects
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {project ? `${project.name} - Subcontractors` : 'Project Subcontractors'}
              </h1>
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
          {/* Project Info Card */}
          {project && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Project: {project.name}</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Location: {project.address || project.location}</p>
                    <p>Status: {project.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Subcontractors on This Project</h2>
              <p className="text-gray-600 mt-1">
                Manage subcontractors and monitor their insurance compliance for this specific project
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              + Add Subcontractor to Project
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading subcontractors...</p>
            </div>
          ) : subcontractors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 mt-2">No subcontractors assigned to this project yet.</p>
              <p className="text-sm text-gray-400 mt-2">Click "Add Subcontractor to Project" to get started.</p>
            </div>
          ) : (
            <>
              {/* Compliant Subcontractors Section */}
              {subcontractors.filter(s => s.insuranceStatus === 'COMPLIANT').length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Compliant Subcontractors
                    </h3>
                    <span className="text-sm text-gray-600">
                      {subcontractors.filter(s => s.insuranceStatus === 'COMPLIANT').length} subs
                    </span>
                  </div>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trade/Specialty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verified Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subcontractors.filter(s => s.insuranceStatus === 'COMPLIANT').map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span>
                                <div>
                                  <div className="font-medium text-gray-900">{sub.companyName}</div>
                                  <div className="text-sm text-gray-500">{sub.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{sub.contactName}</div>
                              <div className="text-sm text-gray-500">{sub.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sub.type || 'General Contractor'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString() : 'Recently'}
                              </div>
                              <div className="text-xs text-green-600">Email sent ✓</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/gc/projects/${projectId}/subcontractors/${sub.id}`}
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
                </div>
              )}

              {/* Non-Compliant Subcontractors Section */}
              {subcontractors.filter(s => s.insuranceStatus !== 'COMPLIANT').length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Non-Compliant / Pending Subcontractors
                    </h3>
                    <span className="text-sm text-red-600 font-semibold">
                      {subcontractors.filter(s => s.insuranceStatus !== 'COMPLIANT').length} need attention
                    </span>
                  </div>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trade/Specialty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subcontractors.filter(s => s.insuranceStatus !== 'COMPLIANT').map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠</span>
                                <div>
                                  <div className="font-medium text-gray-900">{sub.companyName}</div>
                                  <div className="text-sm text-gray-500">{sub.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{sub.contactName}</div>
                              <div className="text-sm text-gray-500">{sub.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sub.type || 'General Contractor'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                sub.insuranceStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                sub.insuranceStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sub.insuranceStatus || 'PENDING'}
                              </span>
                              {sub.insuranceDocuments && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {sub.insuranceDocuments.length} documents
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/gc/projects/${projectId}/subcontractors/${sub.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View Details
                              </Link>
                              <button className="text-red-600 hover:text-red-900">
                                Send Reminder
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Summary Stats */}
          {subcontractors.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Subs</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{subcontractors.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Compliant</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {subcontractors.filter(s => s.insuranceStatus === 'COMPLIANT').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {subcontractors.filter(s => s.insuranceStatus === 'PENDING').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Issues</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {subcontractors.filter(s => s.insuranceStatus === 'EXPIRED' || s.insuranceStatus === 'NON_COMPLIANT').length}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
