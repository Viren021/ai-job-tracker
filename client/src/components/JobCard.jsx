import React from 'react';
import { MapPin, Building, Briefcase, ExternalLink } from 'lucide-react'; 
import { useApplications } from '../context/ApplicationContext'; 

const JobCard = ({ job }) => {
  const { setPendingJob } = useApplications(); 

  const handleApplyClick = () => {
    console.log("👆 User clicked Apply. Waiting for return...");
    setPendingJob(job); 
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1">
            <Building size={14} /> {job.company}
          </p>
        </div>
        {/* Match Badge (Existing code) */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          job.matchScore >= 80 ? 'bg-green-100 text-green-700' :
          job.matchScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {job.matchScore}% Match
        </div>
      </div>

      {/* ... (Existing Description & Meta tags) ... */}
      
      <div className="mt-4 flex gap-2 text-sm text-gray-500">
        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><MapPin size={14}/> {job.location}</span>
        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><Briefcase size={14}/> {job.type}</span>
      </div>

      {/* AI Reason */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-100">
        <strong>✨ AI Analysis:</strong> {job.matchReason}
      </div>

      {/* THE "SMART" APPLY BUTTON */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
        <a 
          href={job.jobUrl || "#"}
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleApplyClick} // <--- The Trigger
          className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          Apply Now <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default JobCard;