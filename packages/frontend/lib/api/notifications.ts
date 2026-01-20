import apiClient from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  parentId?: string;
  threadId?: string;
  fromUserId?: string;
  fromUserName?: string;
}

export interface ReplyToNotificationDto {
  message: string;
}

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  getAll: async (params?: { unreadOnly?: boolean }): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get a single notification by ID
   */
  getById: async (id: string): Promise<Notification> => {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.post(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  /**
   * Reply to a notification (creates a threaded conversation)
   */
  reply: async (id: string, data: ReplyToNotificationDto): Promise<Notification> => {
    const response = await apiClient.post(`/notifications/${id}/reply`, data);
    return response.data;
  },

  /**
   * Get all notifications in a thread
   */
  getThread: async (threadId: string): Promise<Notification[]> => {
    const response = await apiClient.get(`/notifications/thread/${threadId}`);
    return response.data;
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
