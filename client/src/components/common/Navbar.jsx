import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, Award, Menu } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

export default function Navbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark'
  );
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch alerts from backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      if (!token) return;
      const res = await fetch('/api/rewards/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Poll every 20s as socket fallback
      return () => clearInterval(interval);
    }
  }, [user]);

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      await fetch('/api/rewards/notifications/read', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle theme class
  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-darkBg/80 transition-colors duration-300">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left section: Hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">♻️</span>
            <span className="font-sans font-bold text-xl tracking-tight bg-gradient-to-r from-eco-600 to-emerald-500 bg-clip-text text-transparent">
              EcoSync
            </span>
          </Link>
        </div>

        {/* Right Section: Stats, Notifications, DarkMode, LogOut */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Gamification Points Widget */}
            {user.role === 'citizen' && (
              <div 
                onClick={() => navigate('/leaderboard')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-eco-50 border border-eco-200 dark:bg-eco-950/20 dark:border-eco-800 rounded-full cursor-pointer hover:shadow-sm transition-all"
              >
                <Award className="h-4 w-4 text-emerald-500 animate-bounce" />
                <span className="text-xs font-semibold text-eco-700 dark:text-eco-400">
                  Lv. {user.level} | {user.points} pts
                </span>
              </div>
            )}

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            {/* Notifications panel dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) handleMarkAllRead();
                }}
                className="p-2 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-darkBg">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 p-3 dark:border-slate-800">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Alert Center</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                        No recent notifications.
                      </div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className={`p-3 text-xs transition-colors ${n.read ? 'bg-white dark:bg-slate-900' : 'bg-eco-50/20 dark:bg-eco-950/5'}`}>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex justify-between items-center">
                            <span>{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-eco-500"></span>}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <img 
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                alt={user.name} 
                className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
              />
              <span className="hidden md:block text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                {user.name.split(' ')[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>

          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-eco-600 dark:text-slate-300 dark:hover:text-eco-400"
            >
              Sign In
            </Link>
            <Link 
              to="/register"
              className="rounded-full bg-eco-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-eco-500 hover:shadow transition-all"
            >
              Get Started
            </Link>
          </div>
        )}

      </div>
    </header>
  );
}
