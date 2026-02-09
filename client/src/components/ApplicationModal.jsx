import React from 'react';
import { useApplications } from '../context/ApplicationContext';
import { CheckCircle, XCircle } from 'lucide-react';

const ApplicationModal = () => {
  // Get logic from your new Context
  const { showModal, pendingJob, confirmApplication, cancelApplication } = useApplications();

  // If hidden, render nothing
  if (!showModal || !pendingJob) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 transform scale-100 transition-all">
        
        <div className="text-center">
          <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Did you apply?</h2>
          <p className="text-gray-500 mb-6">
            We noticed you visited the <strong>{pendingJob.company.display_name || pendingJob.company}</strong> career page. 
            <br/>Should we add this to your tracking list?
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={cancelApplication}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              <XCircle size={18} />
              No
            </button>
            
            <button 
              onClick={confirmApplication}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              <CheckCircle size={18} />
              Yes, Track It
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApplicationModal;