import React, { useState } from 'react';
import axios from 'axios';
// (Unused import removed for cleanliness)

// 🌍 GLOBAL CONFIG: Backend URL
// We use the live Render URL so login works on Mobile & Vercel
const API_BASE_URL = "https://ai-job-tracker-api-e85o.onrender.com";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 👇 FIX: Use the Render URL here!
      const res = await axios.post(`${API_BASE_URL}/login`, { email, password });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        window.location.href = "/"; 
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold">Job Tracker Login</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full border p-2 rounded"
            placeholder="test@gmail.com"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full border p-2 rounded"
            placeholder="test@123"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;