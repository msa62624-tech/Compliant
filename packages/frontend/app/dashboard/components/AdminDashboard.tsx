'use client';

import { User } from '@compliant/shared';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FilterBar, useToast } from '../../../components';
import { dashboardApi, DashboardItem, DashboardStats } from '../../../lib/api/dashboard';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filter, searchTerm]);

  const loadDashboardData = async () => {
    try {
      const [statsData, itemsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getItems({ type: filter as any, search: searchTerm }),
      ]);
      setStats(statsData);
      setItems(itemsData);
    } catch (error: any) {
      showToast('Failed to load dashboard data', 'error');
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const itemsData = await dashboardApi.getItems({ 
        type: filter === 'all' ? undefined : (filter as any), 
        search: searchTerm || undefined 
      });
      setItems(itemsData);
    } catch (error: any) {
      console.error('Error loading items:', error);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Items', count: items.length },
    { value: 'gc', label: 'General Contractors', count: items.filter(i => i.type === 'gc').length },
    { value: 'project', label: 'Projects', count: items.filter(i => i.type === 'project').length },
    { value: 'coi', label: 'COI Reviews', count: items.filter(i => i.type === 'coi').length },
    { value: 'compliance', label: 'Compliance', count: items.filter(i => i.type === 'compliance').length },
  ];

  const getTypeIcon = (type: string) => {
    const icons = {
      gc: '🏢',
      project: '🏗️',
      coi: '📄',
      compliance: '⚠️',
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-orange-100 text-orange-800',
      expiring: 'bg-red-100 text-red-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Compliant Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-gray-700 rounded">
                {user?.role}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  As an admin, you manage General Contractors (GCs), create projects, and review/approve COI documents submitted by brokers.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">General Contractors</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.generalContractors || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Active GCs</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Active Projects</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.activeProjects || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Ongoing jobs</p>
            </div>
            <button
              onClick={() => router.push('/admin/coi-reviews')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer text-left"
            >
              <h3 className="text-lg font-semibold text-gray-700">Pending COI Reviews</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.pendingCOIReviews || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
              <p className="text-xs text-blue-600 mt-2 hover:underline">Click to view all →</p>
            </button>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Compliance Rate</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.complianceRate || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Overall</p>
            </div>
          </div>

          {/* Filter Bar for Recent Activity */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h3>
            <FilterBar
              options={filterOptions}
              selectedValue={filter}
              onFilterChange={setFilter}
              searchEnabled={true}
              searchPlaceholder="Search items..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          {/* Recent Activity List */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items found matching your filters</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{getTypeIcon(item.type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/programs"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Programs</h4>
                <p className="text-sm text-gray-600 mt-1">Create and manage insurance programs</p>
              </Link>
              <Link
                href="/admin/general-contractors"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">General Contractors</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add and manage General Contractors (GCs)
                </p>
              </Link>
              <Link
                href="/admin/projects"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Projects</h4>
                <p className="text-sm text-gray-600 mt-1">Create and manage construction projects</p>
              </Link>
              <Link
                href="/admin/coi-reviews"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">COI Reviews</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve insurance documents submitted by brokers
                </p>
              </Link>
              <Link
                href="/admin/reports"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Reports</h4>
                <p className="text-sm text-gray-600 mt-1">Generate compliance and activity reports</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
