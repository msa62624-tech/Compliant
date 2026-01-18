'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';

interface Subcontractor {
  id: string;
  name: string;
  company: string;
  email: string;
  projects: Array<{ id: string; name: string; gcName: string }>;
  needsCOI: boolean;
  coiStatus: 'pending' | 'uploaded' | 'approved' | 'deficient';
}

export default function BrokerUploadListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  const fetchSubcontractors = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch subcontractors assigned to this broker
      // const response = await apiClient.get('/api/broker/subcontractors');
      // setSubcontractors(response.data);
      
      // Mock data - subcontractors that need COI uploads
      setSubcontractors([
        {
          id: '1',
          name: 'John Smith',
          company: 'Smith Electric Co.',
          email: 'john@smithelectric.com',
          projects: [
            { id: '1', name: 'Downtown Office Tower', gcName: 'ABC Construction' }
          ],
          needsCOI: true,
          coiStatus: 'pending'
        },
        {
          id: '2',
          name: 'Maria Garcia',
          company: 'Garcia Plumbing Services',
          email: 'maria@garciaplumbing.com',
          projects: [
            { id: '2', name: 'Riverside Apartments', gcName: 'XYZ Builders' }
          ],
          needsCOI: true,
          coiStatus: 'deficient'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch subcontractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      uploaded: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      deficient: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending Upload',
      uploaded: 'Under Review',
      approved: 'Approved',
      deficient: 'Needs Correction'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Upload COI Documents</h1>
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Subcontractors Requiring COI Upload</h2>
              <p className="mt-1 text-sm text-gray-600">
                Click on a subcontractor to upload their ACORD 25 (Certificate of Insurance) and policy documents.
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">Loading subcontractors...</p>
              </div>
            ) : subcontractors.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-gray-600">No subcontractors requiring COI uploads at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {subcontractors.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-6 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => router.push(`/broker/upload/${sub.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{sub.name}</h3>
                          {getStatusBadge(sub.coiStatus)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Company:</span> {sub.company}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Email:</span> {sub.email}
                        </p>
                        
                        {sub.projects.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Projects:</p>
                            <div className="flex flex-wrap gap-2">
                              {sub.projects.map((project) => (
                                <span key={project.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                  {project.name} (GC: {project.gcName})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/broker/upload/${sub.id}`);
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition text-sm font-medium"
                        >
                          {sub.coiStatus === 'deficient' ? 'Correct & Resubmit' : 'Upload COI'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About COI Uploads</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    • Click on any subcontractor to access their specific upload page
                  </p>
                  <p className="mt-1">
                    • Each link is unique to the subcontractor - no need to select from a dropdown
                  </p>
                  <p className="mt-1">
                    • Upload ACORD 25 form and all required policy documents (GL, Auto, Umbrella, WC)
                  </p>
                  <p className="mt-1">
                    • Email notifications will be sent automatically after upload
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
