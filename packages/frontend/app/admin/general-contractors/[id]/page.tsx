'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  insuranceStatus: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  address?: string;
  startDate: string;
  endDate?: string;
  status: string;
  location?: string;
}

export default function ContractorDetailPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contractorId = params.id as string;

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && contractorId) {
      fetchContractorDetails();
      fetchContractorProjects();
    }
  }, [isAuthenticated, contractorId]);

  const fetchContractorDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3001/api/v1/contractors/${contractorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContractor(data);
      } else {
        setError('Failed to load contractor details');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching contractor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContractorProjects = async () => {
    // Mock projects for now - in real implementation, would fetch from API
    setProjects([
      {
        id: '1',
        name: 'Downtown Office Building',
        description: 'New commercial office building',
        address: '123 Main St',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'ACTIVE',
        location: 'New York, NY',
      },
    ]);
  };

  if (loading || !isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin/general-contractors')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Contractors
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error || 'Contractor not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsuranceStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800';
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/general-contractors')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Contractors
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{contractor.company || contractor.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-blue-600 rounded">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Contractor Information Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{contractor.name}</h2>
                {contractor.company && (
                  <p className="text-lg text-gray-600 mt-1">{contractor.company}</p>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(contractor.status)}`}>
                  {contractor.status}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getInsuranceStatusColor(contractor.insuranceStatus)}`}>
                  Insurance: {contractor.insuranceStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{contractor.email}</p>
              </div>
              {contractor.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900 font-medium">{contractor.phone}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
                Edit Contractor
              </button>
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">
                Manage Insurance
              </button>
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition">
                View Contact Person(s)
              </button>
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Projects</h3>
                <p className="text-sm text-gray-600 mt-1">
                  All projects where {contractor.company || contractor.name} is the General Contractor
                </p>
              </div>
              <button
                onClick={() => router.push(`/admin/general-contractors/${contractorId}/projects/new`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Add New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-4 text-gray-500">No projects yet</p>
                <button
                  onClick={() => router.push(`/admin/general-contractors/${contractorId}/projects/new`)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">{project.name}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getProjectStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-gray-600 mt-1">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {project.address && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {project.address}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(project.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">
                          View Details
                        </button>
                        <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">
                          Manage Subs
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Persons Section (Future Enhancement) */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Coming Soon:</strong> Contact person management with project-specific assignments and individual dashboards for each contact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
