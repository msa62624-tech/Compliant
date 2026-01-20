'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useToast, FilterBar } from '../../../components';

interface COIReview {
  id: string;
  projectName: string;
  subcontractorName: string;
  subcontractorCompany: string;
  gcName: string;
  brokerName: string;
  brokerEmail: string;
  status: string;
  uploadedDate: string;
  firstCOI: boolean;
  documents: {
    coiUrl?: string;
    glPolicyUrl?: string;
    autoPolicyUrl?: string;
    umbrellaPolicyUrl?: string;
    wcPolicyUrl?: string;
    holdHarmlessUrl?: string;
  };
  policies: {
    gl: { expirationDate: string; signed: boolean };
    auto: { expirationDate: string; signed: boolean };
    umbrella: { expirationDate: string; signed: boolean };
    wc: { expirationDate: string; signed: boolean };
  };
}

export default function AdminCOIReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<COIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<COIReview | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch COI reviews
      // const response = await apiClient.get('/api/admin/coi-reviews');
      // setReviews(response.data);
      
      // Mock data
      setReviews([]);
    } catch (error) {
      console.error('Failed to fetch COI reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: 'approve' | 'reject') => {
    if (!selectedReview) return;

    if (action === 'reject' && !rejectionNotes.trim()) {
      showToast('Please provide rejection notes', 'warning');
      return;
    }

    setProcessing(true);
    try {
      // TODO: Implement API call to approve/reject COI
      // const response = await apiClient.post(`/api/admin/coi-reviews/${selectedReview.id}/${action}`, {
      //   notes: rejectionNotes,
      // });
      
      showToast(
        `COI ${action === 'approve' ? 'approved' : 'rejected'} successfully! Email notifications sent to GC, Subcontractor, and Broker.`,
        'success'
      );
      setSelectedReview(null);
      setReviewAction(null);
      setRejectionNotes('');
      fetchReviews();
    } catch (error) {
      console.error(`Failed to ${action} COI:`, error);
      showToast(`Failed to ${action} COI. Please try again.`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      AWAITING_ADMIN_REVIEW: 'bg-orange-100 text-orange-800',
      ACTIVE: 'bg-green-100 text-green-800',
      DEFICIENCY_PENDING: 'bg-red-100 text-red-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredReviews = reviews.filter((review) => {
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'pending') matchesFilter = review.status === 'AWAITING_ADMIN_REVIEW';
    if (filter === 'approved') matchesFilter = review.status === 'ACTIVE';
    if (filter === 'rejected') matchesFilter = review.status === 'DEFICIENCY_PENDING' || review.status === 'REJECTED';
    
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      review.subcontractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.subcontractorCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.gcName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'pending', label: 'Pending Review', count: reviews.filter((r) => r.status === 'AWAITING_ADMIN_REVIEW').length },
    { value: 'approved', label: 'Approved', count: reviews.filter((r) => r.status === 'ACTIVE').length },
    { value: 'rejected', label: 'Rejected', count: reviews.filter((r) => r.status === 'DEFICIENCY_PENDING' || r.status === 'REJECTED').length },
    { value: 'all', label: 'All', count: reviews.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">COI Reviews</h1>
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
          {/* Filters */}
          <FilterBar
            options={filterOptions}
            selectedValue={filter}
            onFilterChange={setFilter}
            searchEnabled={true}
            searchPlaceholder="Search by subcontractor, company, project, or GC..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading COI reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No COI Reviews Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'pending'
                  ? 'No COIs awaiting review at this time.'
                  : 'No COI reviews match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{review.subcontractorName}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(review.status)}`}>
                          {review.status}
                        </span>
                        {review.firstCOI && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            First-Time COI
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{review.subcontractorCompany}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded: {new Date(review.uploadedDate).toLocaleString()}
                      </p>
                    </div>
                    {review.status === 'AWAITING_ADMIN_REVIEW' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setReviewAction('approve');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setReviewAction('reject');
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Project Details</h4>
                      <p className="text-sm text-gray-900">{review.projectName}</p>
                      <p className="text-xs text-gray-500">GC: {review.gcName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Broker Information</h4>
                      <p className="text-sm text-gray-900">{review.brokerName}</p>
                      <p className="text-xs text-gray-500">{review.brokerEmail}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Documents</h4>
                      <div className="space-y-1">
                        {review.documents.coiUrl && (
                          <a
                            href={review.documents.coiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline"
                          >
                            📄 COI Document
                          </a>
                        )}
                        {review.documents.glPolicyUrl && (
                          <a
                            href={review.documents.glPolicyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline"
                          >
                            📄 GL Policy
                          </a>
                        )}
                        {review.documents.autoPolicyUrl && (
                          <a
                            href={review.documents.autoPolicyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline"
                          >
                            📄 Auto Policy
                          </a>
                        )}
                        {review.documents.umbrellaPolicyUrl && (
                          <a
                            href={review.documents.umbrellaPolicyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline"
                          >
                            📄 Umbrella Policy
                          </a>
                        )}
                        {review.documents.wcPolicyUrl && (
                          <a
                            href={review.documents.wcPolicyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline"
                          >
                            📄 WC Policy
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Policy Expiration Dates */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Policy Expiration Dates</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(review.policies).map(([key, policy]) => {
                        const policyNames: Record<string, string> = {
                          gl: 'General Liability',
                          auto: 'Auto Liability',
                          umbrella: 'Umbrella',
                          wc: 'Workers Comp',
                        };
                        return (
                          <div key={key} className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs font-medium text-gray-700">{policyNames[key]}</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(policy.expirationDate).toLocaleDateString()}
                            </p>
                            {policy.signed && (
                              <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 mt-1">
                                ✓ Signed
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Review Action Modal */}
      {selectedReview && reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve COI' : 'Reject COI'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {reviewAction === 'approve'
                ? 'Are you sure you want to approve this COI? Email notifications will be sent to the GC, Subcontractor, and Broker.'
                : 'Please provide a reason for rejecting this COI. The broker will need to resubmit with corrections.'}
            </p>

            {reviewAction === 'reject' && (
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Enter rejection reason and required corrections..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                rows={4}
                required
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setReviewAction(null);
                  setRejectionNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewAction(reviewAction)}
                disabled={processing || (reviewAction === 'reject' && !rejectionNotes.trim())}
                className={`px-4 py-2 rounded-md text-white transition disabled:opacity-50 ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing
                  ? 'Processing...'
                  : reviewAction === 'approve'
                  ? 'Approve COI'
                  : 'Reject COI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
