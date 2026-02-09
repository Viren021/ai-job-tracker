import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, Layout, FileText, LogOut, Upload, CheckCircle } from 'lucide-react'; 
import { FilterProvider } from './context/FilterContext';
import { ApplicationProvider } from './context/ApplicationContext'; 

// Components
import Login from './components/Login';
import JobFeed from './components/JobFeed';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import MyApplications from './components/MyApplications';
import ApplicationModal from './components/ApplicationModal';     

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('feed');
  const [hasResume, setHasResume] = useState(false); 
  const fileInputRef = useRef(null);

  // Check Login & Resume Status on Load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        try {
          const res = await axios.get('http://localhost:3000/profile');
          setHasResume(res.data.hasResume);
        } catch (e) { console.error("Profile check failed", e); }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    try {
      alert("Uploading and analyzing resume... Please wait.");
      const response = await axios.post('http://localhost:3000/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Success! " + response.data.message);
      
      setHasResume(true); 
      window.location.reload(); 

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Make sure Backend is running.");
    }
  };

  if (!isAuthenticated) {
    return <Login setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <FilterProvider>
      <ApplicationProvider> {/* <--- 4. WRAP EVERYTHING IN PROVIDER */}
        
        <div className="min-h-screen bg-gray-50 relative font-sans">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            accept=".pdf,.txt" 
          />

          {/* --- HEADER --- */}
          <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
              
              {/* Logo */}
              <h1 
                onClick={() => setCurrentView('feed')} 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer flex items-center gap-2"
              >
                <Briefcase size={24} className="text-blue-600" />
                JobTracker AI
              </h1>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentView('feed')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    currentView === 'feed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Layout size={16} /> Find Jobs
                </button>
                
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    currentView === 'dashboard' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={16} /> My Applications
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Dynamic Resume Button */}
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 shadow-lg flex items-center gap-2 ${
                    hasResume 
                      ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200" 
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-blue-500/20"
                  }`}
                >
                  {hasResume ? <CheckCircle size={16}/> : <Upload size={16}/>}
                  {hasResume ? "Resume Uploaded" : "Upload Resume"}
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>

            </div>
          </header>

          {/* --- MAIN CONTENT --- */}
          <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {currentView === 'feed' && (
              <aside className="hidden lg:block col-span-1 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto">
                <Sidebar /> 
              </aside>
            )}

            <section className={currentView === 'feed' ? "col-span-1 lg:col-span-3" : "col-span-1 lg:col-span-4"}>
              {currentView === 'feed' ? <JobFeed /> : <MyApplications />}
            </section>
          </main>

          {/* --- GLOBAL WIDGETS --- */}
          <ChatWidget />
          <ApplicationModal /> {/* <--- 5. RENDER THE POPUP HERE */}

        </div>
      </ApplicationProvider>
    </FilterProvider>
  );
}

export default App;