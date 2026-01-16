'use client';

import { useState } from 'react';

const COMMON_TRADES = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Masonry',
  'Roofing',
  'Painting',
  'Drywall',
  'Flooring',
  'Concrete',
  'Steel/Iron Work',
  'Landscaping',
  'Demolition',
  'Insulation',
  'Windows/Doors',
  'Siding',
  'Tile Setting',
  'Waterproofing',
  'Fire Protection',
  'Asphalt/Paving',
];

interface TradesManagerProps {
  contractorId: string;
  currentTrades: string[];
  onUpdate: (trades: string[]) => Promise<void>;
  readOnly?: boolean;
}

export default function TradesManager({ contractorId, currentTrades, onUpdate, readOnly = false }: TradesManagerProps) {
  const [trades, setTrades] = useState<string[]>(currentTrades || []);
  const [customTrade, setCustomTrade] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAddTrade = (trade: string) => {
    if (!trades.includes(trade)) {
      const newTrades = [...trades, trade];
      setTrades(newTrades);
      if (!isEditing) {
        // Auto-save if not in edit mode
        handleSave(newTrades);
      }
    }
    setCustomTrade('');
    setShowDropdown(false);
  };

  const handleRemoveTrade = (trade: string) => {
    const newTrades = trades.filter(t => t !== trade);
    setTrades(newTrades);
    if (!isEditing) {
      // Auto-save if not in edit mode
      handleSave(newTrades);
    }
  };

  const handleSave = async (tradesToSave = trades) => {
    setSaving(true);
    try {
      await onUpdate(tradesToSave);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating trades:', error);
      alert('Failed to update trades. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTrades(currentTrades || []);
    setIsEditing(false);
    setCustomTrade('');
  };

  const availableTrades = COMMON_TRADES.filter(t => !trades.includes(t));

  if (readOnly && trades.length === 0) {
    return <div className="text-sm text-gray-500">No trades specified</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current Trades Display */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Trade Specialties</label>
          {!readOnly && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit Trades
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {trades.length === 0 ? (
            <span className="text-sm text-gray-500 italic">No trades selected</span>
          ) : (
            trades.map((trade) => (
              <span
                key={trade}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {trade}
                {(isEditing || !readOnly) && (
                  <button
                    onClick={() => handleRemoveTrade(trade)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    disabled={saving}
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Edit Mode Controls */}
      {(isEditing || !readOnly) && (
        <div className="space-y-3">
          {/* Common Trades Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:bg-gray-50"
            >
              <span className="text-sm text-gray-700">Add from common trades...</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
                {availableTrades.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    All common trades already added
                  </div>
                ) : (
                  availableTrades.map((trade) => (
                    <button
                      key={trade}
                      onClick={() => handleAddTrade(trade)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
                    >
                      {trade}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Custom Trade Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTrade}
              onChange={(e) => setCustomTrade(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && customTrade.trim()) {
                  handleAddTrade(customTrade.trim());
                }
              }}
              placeholder="Or enter custom trade..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={() => customTrade.trim() && handleAddTrade(customTrade.trim())}
              disabled={!customTrade.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              Add
            </button>
          </div>

          {/* Save/Cancel Buttons (only in edit mode) */}
          {isEditing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
