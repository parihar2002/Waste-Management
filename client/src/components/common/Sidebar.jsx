import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  LayoutDashboard, 
  MapPin, 
  Navigation, 
  Trophy, 
  TrendingUp, 
  Users, 
  X,
  Compass,
  FileCheck2
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  // Base navigation lists categorized by roles
  const navItems = {
    citizen: [
      { to: '/citizen-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { to: '/pickup-request', label: 'Request Pickup', icon: MapPin },
      { to: '/live-tracking', label: 'Live Tracking', icon: Navigation },
      { to: '/leaderboard', label: 'Green Leaderboard', icon: Trophy }
    ],
    driver: [
      { to: '/driver-dashboard', label: 'Assigned Pickups', icon: LayoutDashboard },
      { to: '/route-optimization', label: 'Optimize Route', icon: Compass }
    ],
    admin: [
      { to: '/admin-dashboard', label: 'Admin Panel', icon: LayoutDashboard },
      { to: '/analytics', label: 'Waste Analytics', icon: TrendingUp },
      { to: '/user-management', label: 'User Operations', icon: Users }
    ]
  };

  const currentNav = navItems[user.role] || [];

  const activeClass = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-eco-600 text-white font-semibold shadow-md transition-all duration-300';
  const inactiveClass = 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-eco-600 dark:hover:text-eco-400 font-medium transition-all duration-200';

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Primary Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-45 w-64 border-r border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-darkBg transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-slate-100 dark:border-slate-800 lg:hidden mb-4">
          <span className="font-bold text-lg text-slate-800 dark:text-slate-200">Menu Navigation</span>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card inside Sidebar */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3 mt-4 lg:mt-6">
          <img 
            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
            alt={user.name} 
            className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800 shadow object-cover"
          />
          <div className="truncate">
            <span className="font-bold text-sm block text-slate-800 dark:text-slate-200 truncate">{user.name}</span>
            <span className="text-[10px] text-slate-400 capitalize block font-medium">{user.role} workspace</span>
          </div>
        </div>

        {/* Nav Link Listings */}
        <nav className="flex flex-col gap-2">
          {currentNav.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={index} 
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Brand/Version info at bottom */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-600">EcoSync Environment v1.0</p>
        </div>
      </aside>
    </>
  );
}
