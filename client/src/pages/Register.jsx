import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, Phone, User, AlertCircle, Key } from 'lucide-react';
import { loginSuccess } from '../store/slices/authSlice';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP verification state variables
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [systemOtp, setSystemOtp] = useState(''); // Simulated backend code

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, phone })
      });
      const data = await res.json();

      setLoading(false);
      if (data.success) {
        setSystemOtp(data.otpCode); // Capture backend simulated OTP
        setShowOtpScreen(true); // Open the verification screen
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Server connection failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });
      const data = await res.json();

      setLoading(false);
      if (data.success) {
        // Log in immediately
        dispatch(loginSuccess({ user: data.user, token: data.token }));
        const homeRoutes = {
          citizen: '/citizen-dashboard',
          driver: '/driver-dashboard',
          admin: '/admin-dashboard'
        };
        navigate(homeRoutes[data.user.role] || '/');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-eco-400/10 blur-[100px] dark:bg-eco-900/5 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-[100px] dark:bg-emerald-900/5 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-100 dark:border-slate-800/80 dark:bg-slate-900/40 p-8 rounded-3xl shadow-xl backdrop-blur-md relative z-10">
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!showOtpScreen ? (
          <>
            {/* 1. Standard Register Form */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-block text-4xl mb-2 hover:scale-105 transition-transform">♻️</Link>
              <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white">Create EcoSync Account</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">Join the sustainable waste management recovery cycle</p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9999999999"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="password"
                    required
                    minlength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all font-semibold"
                >
                  <option value="citizen">Citizen (Schedule Pickups & Earn Points)</option>
                  <option value="driver">Driver (Navigate Optimized Routes)</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-eco-600 hover:bg-eco-500 font-semibold text-white shadow-lg text-xs transition-all flex items-center justify-center gap-2 hover:shadow-xl disabled:bg-slate-300 dark:disabled:bg-slate-800"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-eco-600 hover:underline dark:text-eco-400 font-bold">
                Log In
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* 2. Interactive OTP Verification Screen */}
            <div className="text-center mb-6">
              <span className="p-3 bg-eco-50 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400 rounded-2xl inline-block mb-3">
                <Key className="h-6 w-6 animate-pulse" />
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">Verify Verification Code</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                We sent a simulated 6-digit validation code to your email <span className="font-semibold text-slate-600 dark:text-slate-200">{email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Verification Code
                </label>
                <input 
                  type="text"
                  required
                  maxlength="6"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-40 mx-auto text-center py-3 text-lg tracking-widest font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
                />
              </div>

              {/* Recruiter helper box */}
              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 dark:bg-amber-950/10 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs text-center font-medium">
                <span>SIMULATED SMS CODE: </span>
                <span className="font-bold tracking-wider text-sm select-all">{systemOtp}</span>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-eco-600 hover:bg-eco-500 font-semibold text-white shadow-lg text-xs transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-800"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : 'Verify Code & Launch'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
