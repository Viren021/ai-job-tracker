import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Briefcase, Building, CheckCircle } from 'lucide-react';

// 🌍 GLOBAL CONFIG: Backend URL
const API_BASE_URL = "https://ai-job-tracker-api-e85o.onrender.com";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        // 👇 FIX: Use the Render URL here!
        const res = await axios.get(`${API_BASE_URL}/applications`);
        setApplications(res.data);
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading your dashboard...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="text-blue-600" /> My Applications
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
          {applications.length} Jobs
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="p-10 text-center text-gray-400">
          You haven't applied to any jobs yet. Go click "Apply" on some!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Date Applied</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{app.jobTitle}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Building size={16} className="text-gray-400 group-hover:text-blue-500" />
                    {app.company}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle size={12} />
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyApplications;