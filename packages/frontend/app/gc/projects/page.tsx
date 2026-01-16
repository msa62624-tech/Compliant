'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GCProjectsPage() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch projects for this GC
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-API-Version': '1',
        },
      })
        .then(res => res.json())
        .then(data => {
          setProjects(data.projects || data || []);
          setLoadingProjects(false);
        })
        .catch(err => {
          console.error('Error fetching projects:', err);
          setLoadingProjects(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
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
          {loadingProjects ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects found.</p>
              <p className="text-sm text-gray-400 mt-2">Contact your admin to be assigned to projects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project: any) => (
                <div key={project.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      project.status === 'PLANNING' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  
                  {project.address && (
                    <p className="text-sm text-gray-500 mb-2">
                      📍 {project.address}
                    </p>
                  )}
                  
                  {project.startDate && (
                    <p className="text-sm text-gray-500 mb-4">
                      📅 Start: {new Date(project.startDate).toLocaleDateString()}
                      {project.endDate && ` - End: ${new Date(project.endDate).toLocaleDateString()}`}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/gc/projects/${project.id}`}
                      className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/gc/projects/${project.id}/subcontractors`}
                      className="flex-1 text-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                      Manage Subs
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
