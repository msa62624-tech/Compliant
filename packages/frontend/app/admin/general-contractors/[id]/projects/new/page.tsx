'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Contractor {
  id: string;
  name: string;
  email: string;
  company?: string;
}

export default function NewProjectForGCPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contractorId = params.id as string;

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    borough: '',
    block: '',
    lot: '',
    buildingHeight: '',
    structureType: '',
    entity: '',
    additionalInsureds: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && contractorId) {
      fetchContractorDetails();
    }
  }, [isAuthenticated, contractorId]);

  const fetchContractorDetails = async () => {
    try {
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
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      const projectData = {
        ...formData,
        gcId: contractorId,
        gcName: contractor?.company || contractor?.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      const response = await fetch('http://localhost:3001/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/admin/general-contractors/${contractorId}`);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create project');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error creating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/admin/general-contractors/${contractorId}`)}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to {contractor?.company || contractor?.name}
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Add New Project</h1>
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* GC Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>General Contractor:</strong> {contractor?.company || contractor?.name}
                  <br />
                  This project will be automatically associated with this GC.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Information</h2>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <p className="text-sm text-green-700">
                  Project created successfully! Redirecting...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      placeholder="123 Main Street Residential Building"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Project Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      placeholder="Brief description of the construction project..."
                    />
                  </div>
                </div>
              </div>

              {/* Property Details from ACRIS */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details (ACRIS Data)</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Property Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      placeholder="123 Main Street, New York, NY 10001"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="borough" className="block text-sm font-medium text-gray-700">
                        Borough
                      </label>
                      <select
                        id="borough"
                        name="borough"
                        value={formData.borough}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      >
                        <option value="">Select...</option>
                        <option value="Manhattan">Manhattan</option>
                        <option value="Brooklyn">Brooklyn</option>
                        <option value="Queens">Queens</option>
                        <option value="Bronx">Bronx</option>
                        <option value="Staten Island">Staten Island</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="block" className="block text-sm font-medium text-gray-700">
                        Block
                      </label>
                      <input
                        type="text"
                        id="block"
                        name="block"
                        value={formData.block}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                        placeholder="1234"
                      />
                    </div>

                    <div>
                      <label htmlFor="lot" className="block text-sm font-medium text-gray-700">
                        Lot
                      </label>
                      <input
                        type="text"
                        id="lot"
                        name="lot"
                        value={formData.lot}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                        placeholder="56"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="entity" className="block text-sm font-medium text-gray-700">
                      Entity (from ACRIS Latest Deed)
                    </label>
                    <input
                      type="text"
                      id="entity"
                      name="entity"
                      value={formData.entity}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      placeholder="Property Owner LLC"
                    />
                    <p className="mt-1 text-xs text-gray-500">Pull from ACRIS deed records</p>
                  </div>
                </div>
              </div>

              {/* Building Details */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="buildingHeight" className="block text-sm font-medium text-gray-700">
                      Building Height (stories)
                    </label>
                    <input
                      type="number"
                      id="buildingHeight"
                      name="buildingHeight"
                      value={formData.buildingHeight}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      placeholder="12"
                    />
                  </div>

                  <div>
                    <label htmlFor="structureType" className="block text-sm font-medium text-gray-700">
                      Structure Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="structureType"
                      name="structureType"
                      required
                      value={formData.structureType}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                    >
                      <option value="">Select type...</option>
                      <option value="Condos">Condos</option>
                      <option value="Rentals">Rentals</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Mixed-Use">Mixed-Use</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Insureds */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Insureds</h3>
                
                <div>
                  <label htmlFor="additionalInsureds" className="block text-sm font-medium text-gray-700">
                    Neighbors from Adjacent Lots (from ACRIS)
                  </label>
                  <textarea
                    id="additionalInsureds"
                    name="additionalInsureds"
                    rows={4}
                    value={formData.additionalInsureds}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                    placeholder="List neighbors from ACRIS deeds on touching lots (one per line)..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    These will be automatically pulled from ACRIS deeds for adjacent lots
                  </p>
                </div>
              </div>

              {/* Contact Person */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GC Contact Person for This Project</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                      Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="contactPerson"
                      name="contactPerson"
                      required
                      value={formData.contactPerson}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                      placeholder="John Smith"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        required
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                        placeholder="john@gccompany.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                        placeholder="+1-555-0123"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-xs text-yellow-700">
                      <strong>Note:</strong> This contact will receive a dashboard showing only projects they are assigned to. You can add additional contacts later.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Timeline */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      required
                      value={formData.startDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      Expected End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                    />
                  </div>
                </div>
              </div>

              {/* Project Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Initial Project Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Creating Project...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/general-contractors/${contractorId}`)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
