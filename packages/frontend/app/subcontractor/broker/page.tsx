'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import BrokerAutocomplete from '../../components/BrokerAutocomplete';

type BrokerType = 'GLOBAL' | 'PER_POLICY';

interface BrokerInfo {
  brokerType: BrokerType;
  // Global broker
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  // Per-policy brokers
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

export default function SubcontractorBrokerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(true);
  const [brokerType, setBrokerType] = useState<BrokerType | null>(null);
  const [brokerInfo, setBrokerInfo] = useState<BrokerInfo>({
    brokerType: 'GLOBAL',
  });

  useEffect(() => {
    fetchBrokerInfo();
  }, []);

  const fetchBrokerInfo = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch existing broker info
      // const response = await apiClient.get('/api/subcontractor/broker');
      // setBrokerInfo(response.data);
      // setBrokerType(response.data.brokerType || null);
      // if (response.data.brokerType) {
      //   setShowChoiceDialog(false);
      // }
    } catch (error) {
      console.error('Failed to fetch broker info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrokerTypeChoice = (type: BrokerType) => {
    setBrokerType(type);
    setBrokerInfo({ ...brokerInfo, brokerType: type });
    setShowChoiceDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Implement API call to save broker info
      // const response = await apiClient.post('/api/subcontractor/broker', {
      //   ...brokerInfo,
      //   brokerType,
      // });
      
      alert('Broker information saved successfully! Your broker(s) will receive account credentials via email.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save broker info:', error);
      alert('Failed to save broker information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateBrokerInfo = (field: string, value: string) => {
    setBrokerInfo({ ...brokerInfo, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Broker Information</h1>
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

      {/* Prominent Broker Type Choice Dialog */}
      {showChoiceDialog && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 transform transition-all">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Choose Your Broker Setup
              </h2>
              <p className="text-lg text-gray-600">
                Before we continue, please select how you manage your insurance brokers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Single Broker Option */}
              <button
                type="button"
                onClick={() => handleBrokerTypeChoice('GLOBAL')}
                className="group relative bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 hover:border-purple-500 rounded-xl p-6 text-left transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700">
                      Single Broker
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      One broker handles all your insurance policies
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Simple and streamlined
                      </p>
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        One point of contact
                      </p>
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Easier management
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Multiple Brokers Option */}
              <button
                type="button"
                onClick={() => handleBrokerTypeChoice('PER_POLICY')}
                className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 hover:border-blue-500 rounded-xl p-6 text-left transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700">
                      Multiple Brokers
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Different brokers for each policy type
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Specialized coverage
                      </p>
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Policy-specific expertise
                      </p>
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Flexible management
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Not sure which to choose?</p>
                  <p className="text-xs text-gray-600">
                    Most subcontractors use a <strong>Single Broker</strong> for simplicity. Choose <strong>Multiple Brokers</strong> only if you have different brokers handling different types of insurance policies (GL, Auto, Umbrella, WC).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {brokerType && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Insurance Broker Information</h2>
                    <p className="text-gray-600">
                      Provide your insurance broker information. Your broker will be automatically notified and will upload COI documents on your behalf.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChoiceDialog(true);
                      setBrokerType(null);
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Change Broker Type
                  </button>
                </div>
                <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <svg className="h-5 w-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-purple-900">
                    {brokerType === 'GLOBAL' ? 'Single Broker for All Policies' : 'Different Brokers per Policy'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Global Broker Form */}
              {brokerType === 'GLOBAL' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Broker Details</h3>
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Start typing the broker name to search if they're already in the system. You can modify the details after selection.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <BrokerAutocomplete
                        value={brokerInfo.brokerName || ''}
                        onChange={(value) => updateBrokerInfo('brokerName', value)}
                        onSelect={(broker) => {
                          updateBrokerInfo('brokerName', broker.name);
                          updateBrokerInfo('brokerEmail', broker.email);
                          updateBrokerInfo('brokerPhone', broker.phone || '');
                          updateBrokerInfo('brokerCompany', broker.company || '');
                        }}
                        label="Broker Name *"
                        placeholder="Start typing broker name..."
                        policyType="GLOBAL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={brokerInfo.brokerCompany || ''}
                        onChange={(e) => updateBrokerInfo('brokerCompany', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="ABC Insurance Brokers"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={brokerInfo.brokerEmail || ''}
                        onChange={(e) => updateBrokerInfo('brokerEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="broker@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={brokerInfo.brokerPhone || ''}
                        onChange={(e) => updateBrokerInfo('brokerPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Per-Policy Broker Form */}
              {brokerType === 'PER_POLICY' && (
                <div className="border-t pt-6 space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Start typing each broker's name to search if they're already in the system. You can modify the details after selection.
                    </p>
                  </div>

                  {/* General Liability Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">General Liability (GL) Broker</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <BrokerAutocomplete
                        value={brokerInfo.brokerGlName || ''}
                        onChange={(value) => updateBrokerInfo('brokerGlName', value)}
                        onSelect={(broker) => {
                          updateBrokerInfo('brokerGlName', broker.name);
                          updateBrokerInfo('brokerGlEmail', broker.email);
                          updateBrokerInfo('brokerGlPhone', broker.phone || '');
                        }}
                        label="Broker Name *"
                        placeholder="Start typing GL broker name..."
                        policyType="GL"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={brokerInfo.brokerGlEmail || ''}
                            onChange={(e) => updateBrokerInfo('brokerGlEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={brokerInfo.brokerGlPhone || ''}
                            onChange={(e) => updateBrokerInfo('brokerGlPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto Liability Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto Liability Broker</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <BrokerAutocomplete
                        value={brokerInfo.brokerAutoName || ''}
                        onChange={(value) => updateBrokerInfo('brokerAutoName', value)}
                        onSelect={(broker) => {
                          updateBrokerInfo('brokerAutoName', broker.name);
                          updateBrokerInfo('brokerAutoEmail', broker.email);
                          updateBrokerInfo('brokerAutoPhone', broker.phone || '');
                        }}
                        label="Broker Name *"
                        placeholder="Start typing Auto broker name..."
                        policyType="AUTO"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={brokerInfo.brokerAutoEmail || ''}
                            onChange={(e) => updateBrokerInfo('brokerAutoEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={brokerInfo.brokerAutoPhone || ''}
                            onChange={(e) => updateBrokerInfo('brokerAutoPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Umbrella Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Umbrella Policy Broker</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <BrokerAutocomplete
                        value={brokerInfo.brokerUmbrellaName || ''}
                        onChange={(value) => updateBrokerInfo('brokerUmbrellaName', value)}
                        onSelect={(broker) => {
                          updateBrokerInfo('brokerUmbrellaName', broker.name);
                          updateBrokerInfo('brokerUmbrellaEmail', broker.email);
                          updateBrokerInfo('brokerUmbrellaPhone', broker.phone || '');
                        }}
                        label="Broker Name *"
                        placeholder="Start typing Umbrella broker name..."
                        policyType="UMBRELLA"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={brokerInfo.brokerUmbrellaEmail || ''}
                            onChange={(e) => updateBrokerInfo('brokerUmbrellaEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={brokerInfo.brokerUmbrellaPhone || ''}
                            onChange={(e) => updateBrokerInfo('brokerUmbrellaPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workers Compensation Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Workers Compensation (WC) Broker</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <BrokerAutocomplete
                        value={brokerInfo.brokerWcName || ''}
                        onChange={(value) => updateBrokerInfo('brokerWcName', value)}
                        onSelect={(broker) => {
                          updateBrokerInfo('brokerWcName', broker.name);
                          updateBrokerInfo('brokerWcEmail', broker.email);
                          updateBrokerInfo('brokerWcPhone', broker.phone || '');
                        }}
                        label="Broker Name *"
                        placeholder="Start typing WC broker name..."
                        policyType="WC"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={brokerInfo.brokerWcEmail || ''}
                            onChange={(e) => updateBrokerInfo('brokerWcEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={brokerInfo.brokerWcPhone || ''}
                            onChange={(e) => updateBrokerInfo('brokerWcPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      📧 Your broker(s) will automatically receive email notifications with login credentials and instructions to upload COI documents on your behalf.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Broker Information'}
                </button>
              </div>
            </form>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
