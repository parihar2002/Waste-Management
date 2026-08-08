import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  ShieldAlert, 
  Users, 
  Truck, 
  Map, 
  TrendingUp, 
  Ban, 
  UserCheck, 
  FileSpreadsheet, 
  Send
} from 'lucide-react';
import MapContainer from '../components/maps/MapContainer';

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);

  // Administrative KPI lists
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDrivers: 0,
    pendingPickups: 0,
    completedPickups: 0,
    cleanlinessScore: 90,
    heatmapCoordinates: []
  });
  
  const [usersList, setUsersList] = useState([]);
  const [pickupsList, setPickupsList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual dispatch state fields
  const [dispatchPickupId, setDispatchPickupId] = useState('');
  const [dispatchDriverId, setDispatchDriverId] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      
      // 1. Fetch dashboard KPIs
      const statsRes = await fetch('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Fetch Users lists
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsersList(usersData.users);
        setDriversList(usersData.users.filter(u => u.role === 'driver'));
      }

      // 3. Fetch pickups list
      const pickupsRes = await fetch('/api/pickups?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pickupsData = await pickupsRes.json();
      if (pickupsData.success) {
        setPickupsList(pickupsData.pickups);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Ban or Unban toggle
  const handleToggleUserBan = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'banned' : 'active';
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispatch assignment trigger
  const handleAssignDriverSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchPickupId || !dispatchDriverId) return;

    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/admin/pickups/${dispatchPickupId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ driverId: dispatchDriverId })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchPickupId('');
        setDispatchDriverId('');
        fetchDashboardStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  // Set default center of Delhi for map heatmaps
  const delhiCenter = [28.6139, 77.2090];
  const isDark = document.documentElement.classList.contains('dark');

  // Convert active complaints coordinates to markers
  const activeMarkers = pickupsList
    .filter(p => p.status !== 'completed' && p.status !== 'cancelled')
    .map(p => ({
      latitude: p.location.latitude,
      longitude: p.location.longitude,
      type: p.wasteType,
      address: p.location.address,
      urgency: p.urgency
    }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Header section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
          System Control Dashboard 👑
        </h2>
        <p className="text-xs text-slate-400 font-medium">Core administrative panel to verify cleanliness indices, manual dispatches, and accounts</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-4 shrink-0">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-eco-50 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400 rounded-xl">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Citizens</span>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.totalUsers}</h4>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Truck className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Drivers</span>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.activeDrivers}</h4>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Pending Pickups</span>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.pendingPickups}</h4>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl animate-pulse">
            <TrendingUp className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Cleanliness Score</span>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{stats.cleanlinessScore}%</h4>
          </div>
        </div>

      </div>

      {/* Main Grid: Heatmaps Map View vs Dispatches Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Heatmap overlay map view */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="h-96 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative z-10">
            <MapContainer 
              center={delhiCenter}
              zoom={12}
              markers={activeMarkers}
              heatmap={stats.heatmapCoordinates}
              isDarkMode={isDark}
            />
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2.5 py-1.5 rounded-xl z-20 text-[9px] font-bold flex items-center gap-1.5 shadow">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Town active Waste Complaint Heatmap
            </div>
          </div>
        </div>

        {/* Dispatch Controls Form */}
        <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-xs text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Send className="h-4 w-4 text-eco-500" /> Manual Fleet Dispatch
          </h3>

          <form onSubmit={handleAssignDriverSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Pending Pickup</label>
              <select 
                value={dispatchPickupId}
                onChange={(e) => setDispatchPickupId(e.target.value)}
                required
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 dark:text-white transition-all"
              >
                <option value="">-- Choose request --</option>
                {pickupsList.filter(p => p.status === 'pending').map(p => (
                  <option key={p._id} value={p._id}>
                    {p.wasteType.toUpperCase()} - {p.location.address.slice(0, 20)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Field Driver</label>
              <select 
                value={dispatchDriverId}
                onChange={(e) => setDispatchDriverId(e.target.value)}
                required
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 dark:text-white transition-all"
              >
                <option value="">-- Choose driver --</option>
                {driversList.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              disabled={!dispatchPickupId || !dispatchDriverId}
              className="w-full py-2.5 rounded-xl bg-eco-600 hover:bg-eco-500 font-bold text-white text-xs transition-all shadow hover:shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800"
            >
              Dispatch Collector Truck
            </button>

          </form>
        </div>

      </div>

      {/* User operations and banned controls list */}
      <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-xs text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">User Operations Control Center</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-medium text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                <th className="py-2.5">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map(item => (
                <tr key={item._id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                    <img src={item.avatar} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
                    {item.name}
                  </td>
                  <td>{item.email}</td>
                  <td className="capitalize">{item.role}</td>
                  <td>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      item.status === 'active' ? 'bg-eco-50 text-eco-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    {item.status === 'active' ? (
                      <button 
                        onClick={() => handleToggleUserBan(item._id, item.status)}
                        className="py-1 px-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-[9px] font-bold transition-all"
                      >
                        <Ban className="h-3 w-3 inline mr-1" /> Ban Account
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleUserBan(item._id, item.status)}
                        className="py-1 px-2.5 rounded-xl border border-eco-200 text-eco-500 hover:bg-eco-50 dark:hover:bg-eco-950/20 text-[9px] font-bold transition-all"
                      >
                        <UserCheck className="h-3 w-3 inline mr-1" /> Unban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
