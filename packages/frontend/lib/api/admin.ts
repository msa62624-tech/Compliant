import apiClient from './client';

export const adminApi = {
  // Get all COI reviews pending approval
  getCOIReviews: async (params?: { status?: string }) => {
    const response = await apiClient.get('/generated-coi', { params });
    return response.data;
  },

  // Approve COI
  approveCOI: async (id: string, notes?: string) => {
    const response = await apiClient.patch(`/generated-coi/${id}/review`, {
      approved: true,
      notes,
    });
    return response.data;
  },

  // Reject COI
  rejectCOI: async (id: string, notes: string) => {
    const response = await apiClient.patch(`/generated-coi/${id}/review`, {
      approved: false,
      notes,
    });
    return response.data;
  },

  // Generate report (uses dashboard/contractors endpoint for data)
  generateReport: async (params: {
    reportType: string;
    startDate?: string;
    endDate?: string;
    projectId?: string;
    contractorId?: string;
  }) => {
    // Reports are generated from dashboard/contractors data with filters
    const response = await apiClient.get('/dashboard/contractors', { params });
    return response.data;
  },
};
