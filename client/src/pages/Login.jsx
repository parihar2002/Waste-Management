import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure, clearError } from '../store/slices/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('citizen'); // Controls quick account autofills

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(loginStart());
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        dispatch(loginSuccess({ user: data.user, token: data.token }));
        // Route to dashboard
        const dashboardRoutes = {
          citizen: '/citizen-dashboard',
          driver: '/driver-dashboard',
          admin: '/admin-dashboard'
        };
        navigate(dashboardRoutes[data.user.role] || '/');
      } else {
        dispatch(loginFailure(data.message || 'Login credentials invalid'));
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Server connection error'));
    }
  };

  // Prepopulate standard demo accounts for recruiter clicks!
  const autofillDemoAccount = (role) => {
    dispatch(clearError());
    setActiveTab(role);
    const demoAccounts = {
      citizen: { email: 'citizen@ecosync.com', pass: 'password123' },
      driver: { email: 'driver@ecosync.com', pass: 'password123' },
      admin: { email: 'admin@ecosync.com', pass: 'password123' }
    };
    setEmail(demoAccounts[role].email);
    setPassword(demoAccounts[role].pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background radial effects */}
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-eco-400/10 blur-[100px] dark:bg-eco-900/5 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-[100px] dark:bg-emerald-900/5 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-100 dark:border-slate-800/80 dark:bg-slate-900/40 p-8 rounded-3xl shadow-xl backdrop-blur-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block text-4xl mb-2 hover:scale-105 transition-transform">♻️</Link>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white">Welcome to EcoSync</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Log in to sync waste requests and review rewards</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Email Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-eco-600 hover:bg-eco-500 font-semibold text-white shadow-lg text-sm transition-all flex items-center justify-center gap-2 hover:shadow-xl disabled:bg-slate-300 dark:disabled:bg-slate-800"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-eco-600 hover:underline dark:text-eco-400 font-bold">
            Create account
          </Link>
        </p>

        {/* Dynamic Recruiter quick-autofills */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block text-center mb-3">
            ⚡ Quick-Demo Recruiter Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            {['citizen', 'driver', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => autofillDemoAccount(role)}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                  activeTab === role 
                    ? 'bg-eco-50 border-eco-500 text-eco-700 dark:bg-eco-950/20 dark:border-eco-800 dark:text-eco-400' 
                    : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
