import apiClient from './client';
import type { Contractor, CreateContractorDto, UpdateContractorDto, PaginatedResponse } from '@compliant/shared';

export const contractorsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Contractor>> => {
    const response = await apiClient.get('/contractors', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Contractor> => {
    const response = await apiClient.get(`/contractors/${id}`);
    return response.data;
  },

  create: async (data: CreateContractorDto): Promise<Contractor> => {
    const response = await apiClient.post('/contractors', data);
    return response.data;
  },

  update: async (id: string, data: UpdateContractorDto): Promise<Contractor> => {
    const response = await apiClient.patch(`/contractors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contractors/${id}`);
  },

  getInsuranceStatus: async (id: string) => {
    const response = await apiClient.get(`/contractors/${id}/insurance-status`);
    return response.data;
  },
};
