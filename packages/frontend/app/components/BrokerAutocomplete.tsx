'use client';

import { useState, useEffect, useRef } from 'react';

interface Broker {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  brokerType?: 'GLOBAL' | 'PER_POLICY';
}

interface BrokerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (broker: Broker) => void;
  placeholder?: string;
  label?: string;
  policyType?: 'GL' | 'AUTO' | 'UMBRELLA' | 'WC' | 'GLOBAL';
}

export default function BrokerAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Type broker name or email...",
  label,
  policyType = 'GLOBAL'
}: BrokerAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contractors/search-brokers?q=${encodeURIComponent(value)}&policyType=${policyType}&limit=10`,
          {
            headers: {
              'X-API-Version': '1',
            },
            credentials: 'include', // Send cookies with the request
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.brokers || data || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error fetching brokers:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, policyType]);

  const handleSelect = (broker: Broker) => {
    onSelect(broker);
    onChange(broker.name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          </div>
        )}
        {value.length >= 2 && !loading && (
          <div className="absolute right-3 top-2.5 text-xs text-gray-500">
            {suggestions.length > 0 ? `${suggestions.length} found` : 'Type to search'}
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
          <div className="px-3 py-2 bg-purple-50 border-b border-purple-200 text-xs font-semibold text-purple-700 uppercase flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Brokers in System
          </div>
          {suggestions.map((broker) => (
            <button
              key={broker.id}
              onClick={() => handleSelect(broker)}
              className="w-full px-3 py-2.5 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 flex items-center">
                    {broker.name}
                    {broker.brokerType === 'GLOBAL' && (
                      <span className="ml-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Global
                      </span>
                    )}
                    {broker.brokerType === 'PER_POLICY' && (
                      <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Per-Policy
                      </span>
                    )}
                  </div>
                  {broker.company && (
                    <div className="text-sm text-gray-600">{broker.company}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {broker.email}
                    {broker.phone && ` • ${broker.phone}`}
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            💡 Click to autofill. You can modify the information after selection.
          </div>
        </div>
      )}
    </div>
  );
}
