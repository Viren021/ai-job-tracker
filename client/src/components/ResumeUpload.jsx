import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle } from 'lucide-react';

// 🌍 GLOBAL CONFIG: Backend URL
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      setUploading(true);
      // 👇 FIX: Use the Render URL here!
      await axios.post(`${API_BASE_URL}/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload resume. Make sure backend is running.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6 border border-gray-200">
      <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
        <FileText size={20} /> Upload Resume
      </h3>
      
      <div className="flex gap-2 items-center">
        <input 
          type="file" 
          accept=".pdf,.txt" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
            success ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : success ? <CheckCircle size={18}/> : <Upload size={18}/>}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Supports PDF or TXT. Used for AI matching.</p>
    </div>
  );
};

export default ResumeUpload;