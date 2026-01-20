'use client';

import { useAuth } from '../../../../lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../../../lib/api/client';

interface Program {
  id: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  glMinimum?: number;
  wcMinimum?: number;
  autoMinimum?: number;
  umbrellaMinimum?: number;
  requiresHoldHarmless: boolean;
  requiresAdditionalInsured: boolean;
  requiresWaiverSubrogation: boolean;
  holdHarmlessTemplateUrl?: string;
  tierRequirements?: any;
  tradeRequirements?: any;
  autoApprovalRules?: any;
  createdAt: string;
  updatedAt: string;
  projects?: Array<{
    id: string;
    project: {
      id: string;
      name: string;
      status: string;
    };
  }>;
}

export default function ProgramDetailPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    try {
      setLoadingProgram(true);
      const response = await apiClient.get(`/programs/${programId}`);
      setProgram(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load program');
    } finally {
      setLoadingProgram(false);
    }
  }, [programId]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && programId) {
      loadProgram();
    }
  }, [isAuthenticated, programId, loadProgram]);

  const formatCurrency = (value?: number) => {
    if (!value) return 'Not set';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || loadingProgram) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error || 'Program not found'}</p>
            <button
              onClick={() => router.push('/admin/programs')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Programs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push('/admin/programs')}
              className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center"
            >
              ← Back to Programs
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            {program.description && (
              <p className="text-gray-600 mt-2">{program.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/admin/programs/${programId}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Program
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coverage Minimums */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Coverage Minimums</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">General Liability</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(program.glMinimum)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Workers Comp</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(program.wcMinimum)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Auto Liability</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(program.autoMinimum)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Umbrella</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(program.umbrellaMinimum)}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Hold Harmless Agreement</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    program.requiresHoldHarmless 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {program.requiresHoldHarmless ? 'Required' : 'Not Required'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Additional Insured</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    program.requiresAdditionalInsured 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {program.requiresAdditionalInsured ? 'Required' : 'Not Required'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Waiver of Subrogation</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    program.requiresWaiverSubrogation 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {program.requiresWaiverSubrogation ? 'Required' : 'Not Required'}
                  </span>
                </div>
                {program.holdHarmlessTemplateUrl && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-gray-700 mb-1">Hold Harmless Template:</div>
                    <a
                      href={program.holdHarmlessTemplateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View Template
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Projects */}
            {program.projects && program.projects.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Assigned Projects ({program.projects.length})
                </h2>
                <div className="space-y-2">
                  {program.projects.map((pp) => (
                    <div key={pp.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{pp.project.name}</div>
                        <div className="text-sm text-gray-600">ID: {pp.project.id}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pp.project.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {pp.project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Program Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Info</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Type</div>
                  <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    program.isTemplate 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {program.isTemplate ? 'Template' : 'Active Program'}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="text-gray-900">{formatDate(program.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="text-gray-900">{formatDate(program.updatedAt)}</div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            {(program.tierRequirements || program.tradeRequirements || program.autoApprovalRules) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
                <div className="space-y-2 text-sm">
                  {program.tierRequirements && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">Tier Requirements Configured</span>
                    </div>
                  )}
                  {program.tradeRequirements && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">Trade Requirements Configured</span>
                    </div>
                  )}
                  {program.autoApprovalRules && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">Auto-Approval Rules Configured</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
