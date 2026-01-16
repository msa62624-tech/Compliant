'use client';

import { useState, useEffect, useRef } from 'react';

interface Contractor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  trades?: string[];
  insuranceStatus?: string;
}

interface SubcontractorAutocompleteProps {
  projectId: string;
  onSelect: (contractor: Contractor) => void;
  onCreateNew: (name: string) => void;
}

export default function SubcontractorAutocomplete({ projectId, onSelect, onCreateNew }: SubcontractorAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Contractor[]>([]);
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
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contractors/search?q=${encodeURIComponent(searchTerm)}&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'X-API-Version': '1',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.contractors || data || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelect = (contractor: Contractor) => {
    onSelect(contractor);
    setSearchTerm('');
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleCreateNew = () => {
    onCreateNew(searchTerm);
    setSearchTerm('');
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
          placeholder="Type contractor name or company..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showDropdown && (suggestions.length > 0 || searchTerm.length >= 2) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                Existing Contractors
              </div>
              {suggestions.map((contractor) => (
                <button
                  key={contractor.id}
                  onClick={() => handleSelect(contractor)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{contractor.name}</div>
                      <div className="text-sm text-gray-600">{contractor.company}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {contractor.email} {contractor.phone && `• ${contractor.phone}`}
                      </div>
                      {contractor.trades && contractor.trades.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {contractor.trades.map((trade, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {trade}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          contractor.insuranceStatus === 'COMPLIANT'
                            ? 'bg-green-100 text-green-800'
                            : contractor.insuranceStatus === 'EXPIRED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {contractor.insuranceStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : null}
          
          {searchTerm.length >= 2 && (
            <button
              onClick={handleCreateNew}
              className="w-full px-4 py-3 text-left hover:bg-green-50 border-t-2 border-green-200 transition"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-green-900">Create New Subcontractor</div>
                  <div className="text-sm text-green-700">
                    Add "{searchTerm}" as a new subcontractor
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
