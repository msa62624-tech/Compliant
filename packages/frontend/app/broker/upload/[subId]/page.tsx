'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { ErrorMessage, LoadingSpinner } from '../../../../components/ErrorMessage';

interface Subcontractor {
  id: string;
  name: string;
  company: string;
  email: string;
  projects: Array<{ id: string; name: string; gcName: string }>;
}

interface PolicyUpload {
  file: File | null;
  expirationDate: string;
  uploaded: boolean;
}

export default function BrokerUploadSubPage() {
  const router = useRouter();
  const params = useParams();
  const subId = params.subId as string;
  const { user } = useAuth();
  
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [policies, setPolicies] = useState({
    generalLiability: { file: null, expirationDate: '', uploaded: false } as PolicyUpload,
    autoLiability: { file: null, expirationDate: '', uploaded: false } as PolicyUpload,
    umbrella: { file: null, expirationDate: '', uploaded: false } as PolicyUpload,
    workersComp: { file: null, expirationDate: '', uploaded: false } as PolicyUpload,
  });

  const [coiDocument, setCoiDocument] = useState<File | null>(null);
  const [holdHarmless, setHoldHarmless] = useState<File | null>(null);

  useEffect(() => {
    if (subId) {
      fetchSubcontractor();
    }
  }, [subId]);

  const fetchSubcontractor = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch specific subcontractor
      // const response = await apiClient.get(`/api/broker/subcontractors/${subId}`);
      // setSubcontractor(response.data);
      
      // Mock data for now
      setSubcontractor({
        id: subId,
        name: 'John Smith',
        company: 'Smith Electric Co.',
        email: 'john@smithelectric.com',
        projects: [
          { id: '1', name: 'Downtown Office Tower', gcName: 'ABC Construction' },
          { id: '2', name: 'Riverside Apartments', gcName: 'XYZ Builders' }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch subcontractor:', error);
      alert('Failed to load subcontractor information');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    policyType: keyof typeof policies,
    file: File | null
  ) => {
    setPolicies({
      ...policies,
      [policyType]: { ...policies[policyType], file, uploaded: false },
    });
  };

  const handleExpirationChange = (
    policyType: keyof typeof policies,
    date: string
  ) => {
    setPolicies({
      ...policies,
      [policyType]: { ...policies[policyType], expirationDate: date },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coiDocument) {
      alert('Please upload the COI document');
      return;
    }

    // Check if all required policies are uploaded
    const requiredPolicies = Object.entries(policies);
    const missingPolicies = requiredPolicies.filter(([_, policy]) => !policy.file || !policy.expirationDate);
    
    if (missingPolicies.length > 0) {
      alert('Please upload all required policy documents with expiration dates');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('subcontractorId', subId);
      formData.append('coiDocument', coiDocument);
      if (holdHarmless) {
        formData.append('holdHarmless', holdHarmless);
      }

      // Append policy files and expiration dates
      Object.entries(policies).forEach(([type, policy]) => {
        if (policy.file) {
          formData.append(`${type}File`, policy.file);
          formData.append(`${type}Expiration`, policy.expirationDate);
        }
      });

      // TODO: Implement API call to upload documents
      // const response = await apiClient.post('/api/broker/upload-coi', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      alert('Documents uploaded successfully! Email notifications sent to GC, Subcontractor, and Admin.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to upload documents:', error);
      alert('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading subcontractor information..." />;
  }

  if (!subcontractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            message="Subcontractor not found. The subcontractor may have been deleted or the ID is incorrect."
            statusCode={404}
            onRetry={fetchSubcontractor}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Upload COI for {subcontractor.name}</h1>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload ACORD 25 (COI) and Insurance Policies</h2>
              <p className="text-gray-600">
                Upload all required insurance policies and ACORD 25 (Certificate of Insurance) document for this subcontractor.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    📧 After uploading, email notifications will be sent to the GC, Subcontractor, and Admin for review and approval.
                  </p>
                </div>
              </div>
            </div>

            {/* Subcontractor Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Subcontractor Information</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {subcontractor.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Company:</span> {subcontractor.company}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {subcontractor.email}
              </p>
              {subcontractor.projects.length > 0 && (
                <>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Assigned Projects:</p>
                  <ul className="ml-4 mt-1">
                    {subcontractor.projects.map((project) => (
                      <li key={project.id} className="text-sm text-gray-600">
                        • {project.name} (GC: {project.gcName})
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* COI Document */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ACORD 25 (Certificate of Insurance) <span className="text-red-500">*</span>
                </h3>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCoiDocument(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload the ACORD 25 form (PDF, JPG, or PNG)
                </p>
              </div>

              {/* Hold Harmless Agreement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hold Harmless Agreement (Optional)
                </h3>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setHoldHarmless(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Upload hold harmless agreement if required
                </p>
              </div>

              {/* Individual Policies */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Policy Documents</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload individual policy documents for each coverage type.
                </p>

                {/* General Liability */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    General Liability (GL) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Policy Document</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('generalLiability', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={policies.generalLiability.expirationDate}
                        onChange={(e) => handleExpirationChange('generalLiability', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Liability */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Auto Liability <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Policy Document</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('autoLiability', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={policies.autoLiability.expirationDate}
                        onChange={(e) => handleExpirationChange('autoLiability', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Umbrella Policy */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Umbrella Policy <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Policy Document</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('umbrella', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={policies.umbrella.expirationDate}
                        onChange={(e) => handleExpirationChange('umbrella', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Workers Compensation */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workers Compensation (WC) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Policy Document</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('workersComp', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={policies.workersComp.expirationDate}
                        onChange={(e) => handleExpirationChange('workersComp', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    'Upload All Documents'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
