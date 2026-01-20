'use client';

import { useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  options: FilterOption[];
  selectedValue: string;
  onFilterChange: (value: string) => void;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function FilterBar({
  options,
  selectedValue,
  onFilterChange,
  searchEnabled = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        {searchEnabled && onSearchChange && (
          <div className="w-full md:w-96">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`px-4 py-2 rounded-md transition ${
                selectedValue === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AdvancedFilterProps {
  filters: {
    label: string;
    type: 'select' | 'date-range' | 'multi-select';
    options?: { value: string; label: string }[];
    value?: any;
    onChange: (value: any) => void;
  }[];
  onApply: () => void;
  onReset: () => void;
}

export function AdvancedFilter({ filters, onApply, onReset }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-700 transition"
        >
          {isOpen ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {filters.map((filter, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {filter.label}
              </label>
              
              {filter.type === 'select' && (
                <select
                  value={filter.value || ''}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select {filter.label}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {filter.type === 'date-range' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filter.value?.start || ''}
                    onChange={(e) => filter.onChange({ ...filter.value, start: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filter.value?.end || ''}
                    onChange={(e) => filter.onChange({ ...filter.value, end: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End date"
                  />
                </div>
              )}

              {filter.type === 'multi-select' && (
                <div className="space-y-2">
                  {filter.options?.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filter.value?.includes(opt.value) || false}
                        onChange={(e) => {
                          const currentValues = filter.value || [];
                          const newValues = e.target.checked
                            ? [...currentValues, opt.value]
                            : currentValues.filter((v: string) => v !== opt.value);
                          filter.onChange(newValues);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={onApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Apply Filters
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
