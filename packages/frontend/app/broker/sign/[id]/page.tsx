'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/AuthContext';

interface COI {
  id: string;
  projectName: string;
  subcontractorName: string;
  gcName: string;
  status: string;
  policies: {
    generalLiability: { expirationDate: string; policyUrl: string };
    autoLiability: { expirationDate: string; policyUrl: string };
    umbrella: { expirationDate: string; policyUrl: string };
    workersComp: { expirationDate: string; policyUrl: string };
  };
  generatedCoiUrl?: string;
}

export default function BrokerSignPage() {
  const router = useRouter();
  const params = useParams();
  const coiId = params.id as string;
  const { user } = useAuth();
  
  const [coi, setCoi] = useState<COI | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string>('');

  const fetchCOI = useCallback(async () => {
    setLoading(true);
    try {
      const { coiApi } = await import('../../../../lib/api/coi');
      const data = await coiApi.getById(coiId);
      setCoi(data);
    } catch (error) {
      console.error('Failed to fetch COI:', error);
    } finally {
      setLoading(false);
    }
  }, [coiId]);

  useEffect(() => {
    if (coiId) {
      fetchCOI();
    }
  }, [coiId, fetchCOI]);

  const handleSign = async (policyType: string) => {
    if (!signature.trim()) {
      alert('Please enter your signature');
      return;
    }

    setSigning(true);
    try {
      const { coiApi } = await import('../../../../lib/api/coi');
      await coiApi.signCOI(coiId, {
        policyType,
        signature,
      });
      
      alert(`${policyType} signed successfully! Notifications sent to GC, Subcontractor, and Admin.`);
      fetchCOI();
    } catch (error) {
      console.error('Failed to sign COI:', error);
      alert('Failed to sign. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sign Renewal COI</h1>
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

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading COI...</p>
            </div>
          ) : !coi ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900">COI Not Found</h3>
              <p className="text-sm text-gray-500 mt-2">The requested COI does not exist or you don't have access to it.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Certificate of Insurance - Renewal</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subcontractor</p>
                    <p className="font-semibold text-gray-900">{coi.subcontractorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Project</p>
                    <p className="font-semibold text-gray-900">{coi.projectName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">General Contractor</p>
                    <p className="font-semibold text-gray-900">{coi.gcName}</p>
                  </div>
                </div>

                {coi.generatedCoiUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={coi.generatedCoiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View System-Generated COI
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      This is a <strong>renewal</strong>. The system has generated the COI using existing policy information. 
                      Please review and digitally sign each policy section below. 📧 Email notifications will be sent after signing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h3>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name as signature"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  By typing your name, you are electronically signing this document
                </p>
              </div>

              {Object.entries(coi.policies).map(([policyType, policy]) => {
                const policyNames: Record<string, string> = {
                  generalLiability: 'General Liability',
                  autoLiability: 'Auto Liability',
                  umbrella: 'Umbrella Policy',
                  workersComp: 'Workers Compensation',
                };

                return (
                  <div key={policyType} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{policyNames[policyType]}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Expires: {new Date(policy.expirationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending Signature
                      </span>
                    </div>

                    {policy.policyUrl && (
                      <a
                        href={policy.policyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 mb-4"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Policy Document
                      </a>
                    )}

                    <button
                      onClick={() => handleSign(policyNames[policyType])}
                      disabled={signing || !signature.trim()}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signing ? 'Signing...' : `Sign ${policyNames[policyType]}`}
                    </button>
                  </div>
                );
              })}

              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <p className="text-sm text-green-700">
                  ✓ After signing all policies, the COI will be marked as complete and email notifications will be sent to the GC, Subcontractor, and Admin.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
