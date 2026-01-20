'use client';

import { useAuth } from '../../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '../../../lib/api/client';
import { useToast } from '../../../components';

interface ProgramTier {
  id: string;
  name: string;
  glPerOccurrence: string;
  glAggregate: string;
  umbrellaMinimum: string;
  trades: string[];
}

interface Program {
  id: string;
  name: string;
  description: string;
  isTemplate: boolean;
  requiresHoldHarmless: boolean;
  requiresAdditionalInsured: boolean;
  requiresWaiverSubrogation: boolean;
  glPerOccurrence: string;
  glAggregate: string;
  wcMinimum: string;
  autoMinimum: string;
  tiers: ProgramTier[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminProgramsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPrograms();
    }
  }, [isAuthenticated]);

  const loadPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const response = await apiClient.get('/programs');
      setPrograms(response.data);
    } catch (error: any) {
      console.error('Failed to load programs:', error);
      showToast('Failed to load programs', 'error');
    } finally {
      setLoadingPrograms(false);
    }
  };

  const toggleProgramExpansion = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  if (loading || !isAuthenticated || !user) {
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insurance Programs</h1>
              <p className="text-gray-600 mt-2">Manage insurance programs and tier requirements</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/programs/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                + Create New Program
              </button>
            </div>
          </div>
        </div>

        {/* Programs List */}
        <div className="bg-white rounded-lg shadow">
          {loadingPrograms ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading programs...</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first insurance program</p>
              <button
                onClick={() => router.push('/admin/programs/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Create Program
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {programs.map((program) => (
                <div key={program.id} className="p-6">
                  {/* Program Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                        {program.isTemplate && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Template
                          </span>
                        )}
                        {program.tiers && program.tiers.length > 0 && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {program.tiers.length} Tier{program.tiers.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {program.description && (
                        <p className="text-gray-600 mt-2">{program.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleProgramExpansion(program.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                      >
                        {expandedPrograms.has(program.id) ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => router.push(`/admin/programs/${program.id}/edit`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedPrograms.has(program.id) && (
                    <div className="mt-6 space-y-6">
                      {/* Basic Requirements */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Basic Requirements</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">GL Per Occurrence</p>
                            <p className="text-sm font-semibold text-gray-900">${parseInt(program.glPerOccurrence).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">GL Aggregate</p>
                            <p className="text-sm font-semibold text-gray-900">${parseInt(program.glAggregate).toLocaleString()}</p>
                          </div>
                          {program.wcMinimum && (
                            <div className="p-3 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">Workers Comp</p>
                              <p className="text-sm font-semibold text-gray-900">${parseInt(program.wcMinimum).toLocaleString()}</p>
                            </div>
                          )}
                          {program.autoMinimum && (
                            <div className="p-3 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">Auto Minimum</p>
                              <p className="text-sm font-semibold text-gray-900">${parseInt(program.autoMinimum).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Requirements */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Additional Requirements</h4>
                        <div className="flex flex-wrap gap-2">
                          {program.requiresHoldHarmless && (
                            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              ✓ Hold Harmless Required
                            </span>
                          )}
                          {program.requiresAdditionalInsured && (
                            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              ✓ Additional Insured Required
                            </span>
                          )}
                          {program.requiresWaiverSubrogation && (
                            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              ✓ Waiver of Subrogation Required
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tier System */}
                      {program.tiers && program.tiers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">📊 Full Tier Program</h4>
                          <div className="space-y-4">
                            {program.tiers.map((tier, index) => (
                              <div key={tier.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-white">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">
                                        {index + 1}
                                      </span>
                                      {tier.name}
                                    </h5>
                                  </div>
                                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                    {tier.trades.length} Trade{tier.trades.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                
                                {/* Tier Requirements */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                  <div className="p-2 bg-white rounded border border-purple-200">
                                    <p className="text-xs text-gray-600">GL Per Occurrence</p>
                                    <p className="text-sm font-semibold text-purple-900">${parseInt(tier.glPerOccurrence).toLocaleString()}</p>
                                  </div>
                                  <div className="p-2 bg-white rounded border border-purple-200">
                                    <p className="text-xs text-gray-600">GL Aggregate</p>
                                    <p className="text-sm font-semibold text-purple-900">${parseInt(tier.glAggregate).toLocaleString()}</p>
                                  </div>
                                  {tier.umbrellaMinimum && (
                                    <div className="p-2 bg-white rounded border border-purple-200">
                                      <p className="text-xs text-gray-600">Umbrella</p>
                                      <p className="text-sm font-semibold text-purple-900">${parseInt(tier.umbrellaMinimum).toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Assigned Trades */}
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-2">Assigned Trades:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {tier.trades.map((trade) => (
                                      <span
                                        key={trade}
                                        className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800"
                                      >
                                        {trade}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
