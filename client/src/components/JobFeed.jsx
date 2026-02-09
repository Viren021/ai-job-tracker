import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import { useFilters } from '../context/FilterContext';
import { Loader, AlertCircle, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

const JobFeed = () => {
  const { jobs = [], loading, error } = useFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [jobs]);

  // --- PAGINATION LOGIC ---
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(jobs.length / jobsPerPage);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-pulse">
        <Loader className="w-10 h-10 mb-4 text-blue-500 animate-spin" />
        <p>AI is matching jobs to your resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>Failed to load jobs. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <Briefcase className="text-blue-600"/> Recommended Jobs 
           <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
             {jobs.length} found
           </span>
        </h2>
        <span className="text-sm text-gray-500 font-medium">
          Page {currentPage} of {totalPages || 1}
        </span>
      </div>

      {/* JOB GRID */}
      {currentJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              // No props needed! JobCard handles logic itself now.
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-lg">No jobs found matching your filters.</p>
          <button 
             onClick={() => window.location.reload()} 
             className="mt-4 text-blue-600 font-medium hover:underline"
          >
            Clear Filters & Reload
          </button>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="hidden sm:flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobFeed;