import apiClient from './client';

export interface UpdateBrokerInfoData {
  brokerType: 'GLOBAL' | 'PER_POLICY';
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  brokerGlName?: string;
  brokerGlEmail?: string;
  brokerGlPhone?: string;
  brokerAutoName?: string;
  brokerAutoEmail?: string;
  brokerAutoPhone?: string;
  brokerUmbrellaName?: string;
  brokerUmbrellaEmail?: string;
  brokerUmbrellaPhone?: string;
  brokerWcName?: string;
  brokerWcEmail?: string;
  brokerWcPhone?: string;
}

export interface UploadPoliciesData {
  glPolicyUrl?: string;
  umbrellaPolicyUrl?: string;
  autoPolicyUrl?: string;
  wcPolicyUrl?: string;
  coiUrl?: string;
  holdHarmlessUrl?: string;
  glExpirationDate?: string;
  umbrellaExpirationDate?: string;
  autoExpirationDate?: string;
  wcExpirationDate?: string;
}

export const coiApi = {
  // Get COI details by ID
  getById: async (id: string) => {
    const response = await apiClient.get(`/generated-coi/${id}`);
    return response.data;
  },

  // Get all COIs (filtered by user role)
  getAll: async () => {
    const response = await apiClient.get('/generated-coi');
    return response.data;
  },

  // Sign COI policies
  signCOI: async (id: string, data: { policyType: string; signature: string }) => {
    const response = await apiClient.patch(`/generated-coi/${id}/sign`, data);
    return response.data;
  },

  // Review COI (admin only)
  reviewCOI: async (id: string, data: { approved: boolean; notes?: string }) => {
    const response = await apiClient.patch(`/generated-coi/${id}/review`, data);
    return response.data;
  },

  // Update broker information
  updateBrokerInfo: async (id: string, data: UpdateBrokerInfoData) => {
    const response = await apiClient.patch(`/generated-coi/${id}/broker-info`, data);
    return response.data;
  },

  // Upload policies
  uploadPolicies: async (id: string, data: UploadPoliciesData) => {
    const response = await apiClient.patch(`/generated-coi/${id}/upload`, data);
    return response.data;
  },
};
