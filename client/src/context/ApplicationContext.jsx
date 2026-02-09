import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const ApplicationContext = createContext();

export function ApplicationProvider({ children }) {
  const [pendingJob, setPendingJob] = useState(null); 
  const [showModal, setShowModal] = useState(false);  

  // --- THE SMART UX: Detect when user returns to the tab ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingJob) {
        setShowModal(true); 
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pendingJob]);

  // YES: User Applied
  const confirmApplication = async () => {
    if (!pendingJob) return;
    try {
      const companyName = pendingJob.company.display_name || pendingJob.company || "Unknown Company";

      await axios.post('http://localhost:3000/applications', {
        jobId: pendingJob.id,
        jobTitle: pendingJob.title,
        company: companyName, 
        status: "Applied"
      });
      alert("✅ Application Saved!");
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      
      setPendingJob(null);
      setShowModal(false);
    }
  };

  // NO: User Cancelled
  const cancelApplication = () => {
    setPendingJob(null);
    setShowModal(false);
  };

  return (
    <ApplicationContext.Provider value={{ setPendingJob, showModal, pendingJob, confirmApplication, cancelApplication }}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  return useContext(ApplicationContext);
}