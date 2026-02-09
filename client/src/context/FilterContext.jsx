import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const FilterContext = createContext();

// 🌍 GLOBAL CONFIG: Backend URL
const API_BASE_URL = "https://ai-job-tracker-api-e85o.onrender.com";

export function FilterProvider({ children }) {
  // 1. Filter State
  const [filters, setFilters] = useState({
    location: '',
    remote: false,
    jobType: '', 
    query: ''    
  });

  // 2. Data State (Needed for JobFeed)
  const [jobs, setJobs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetching Logic
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // 👇 FIX: Use the Render URL here!
      const res = await axios.get(`${API_BASE_URL}/jobs`);
      setJobs(res.data || []); 
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // 4. Update filters (Existing logic)
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters
    }));
  };

  // 5. Client-side Filtering Logic
  // This takes the real jobs and filters them based on UI/AI selections 
  const filteredJobs = jobs.filter(job => {
    // If job or location is undefined, skip to avoid crashes
    if (!job || !job.location) return false;

    const matchesLocation = !filters.location || job.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesType = !filters.jobType || job.type === filters.jobType;
    const matchesQuery = !filters.query || 
      (job.title && job.title.toLowerCase().includes(filters.query.toLowerCase())) || 
      (job.company && job.company.toLowerCase().includes(filters.query.toLowerCase()));
  
    const isRemoteJob = job.location.toLowerCase().includes('remote');
    const matchesRemote = !filters.remote || isRemoteJob;

    return matchesLocation && matchesType && matchesQuery && matchesRemote;
  });

  return (
    <FilterContext.Provider value={{ 
      filters, 
      updateFilters, 
      jobs: filteredJobs,
      loading, 
      error,
      refreshJobs: fetchJobs 
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}