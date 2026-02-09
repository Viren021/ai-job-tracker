import React from 'react';
import { useFilters } from '../context/FilterContext';
import { MapPin, Briefcase, Globe, Filter, X } from 'lucide-react'; 

const Sidebar = () => {
  const { filters, updateFilters } = useFilters();

  // Handle Location Input
  const handleLocationChange = (e) => {
    updateFilters({ location: e.target.value });
  };

  // Handle Remote Checkbox
  const handleRemoteChange = (e) => {
    if (e.target.checked) {
       updateFilters({ remote: true, location: '' });
    } else {
       updateFilters({ remote: false });
    }
  };

  // Handle Job Type Toggle (Radio behavior but toggleable)
  const handleTypeChange = (type) => {
    const newType = filters.jobType === type ? '' : type; 
    updateFilters({ jobType: newType });
  };

  // Reset All Filters
  const resetFilters = () => {
    updateFilters({ location: '', remote: false, jobType: '' });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Filter size={20} className="text-blue-600"/> Filters
        </h2>
        
        {/* Clear Button (Only show if filters are active) */}
        {(filters.location || filters.remote || filters.jobType) && (
          <button 
            onClick={resetFilters}
            className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* 1. Location Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" /> Location
        </label>
        <input
          type="text"
          placeholder="e.g. Mumbai, Pune..."
          value={filters.location}
          onChange={handleLocationChange}
          disabled={filters.remote} 
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
            filters.remote ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300'
          }`}
        />
      </div>

      {/* 2. Remote Filter */}
      <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.remote}
            onChange={handleRemoteChange}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
          <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Globe size={16} /> Remote Only
          </span>
        </label>
      </div>

      {/* 3. Job Type Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
           <Briefcase size={16} className="text-gray-400"/> Job Type
        </h3>
        <div className="space-y-2">
          {['Full-time', 'Contract', 'Internship', 'Part-time'].map((type) => (
            <label 
              key={type} 
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                filters.jobType === type 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-transparent'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                filters.jobType === type ? 'border-blue-600' : 'border-gray-300'
              }`}>
                {filters.jobType === type && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
              </div>
              
              <input
                type="radio"
                name="jobType"
                checked={filters.jobType === type}
                onChange={() => handleTypeChange(type)}
                className="hidden" 
              />
              <span className={`text-sm ${filters.jobType === type ? 'text-blue-800 font-medium' : 'text-gray-600'}`}>
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;