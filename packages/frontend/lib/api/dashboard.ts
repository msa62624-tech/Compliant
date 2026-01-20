import { apiClient } from './client';

export interface DashboardItem {
  id: string;
  name: string;
  type: 'gc' | 'project' | 'coi' | 'compliance';
  status: string;
  date: string;
  description: string;
}

export interface DashboardStats {
  generalContractors: number;
  activeProjects: number;
  pendingCOIReviews: number;
  complianceRate: number;
}

export interface DashboardFilterParams {
  type?: 'all' | 'gc' | 'project' | 'coi' | 'compliance';
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const dashboardApi = {
  getItems: async (filters: DashboardFilterParams = {}): Promise<DashboardItem[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await apiClient.get(`/dashboard/items?${params.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
};
