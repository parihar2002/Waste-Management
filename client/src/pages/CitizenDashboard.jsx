import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  Trash2, 
  Leaf, 
  PlusCircle, 
  ChevronRight, 
  Trophy, 
  Navigation,
  CheckCircle,
  Clock,
  Car,
  User
} from 'lucide-react';
import MapContainer from '../components/maps/MapContainer';

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active tracking state
  const [activePickup, setActivePickup] = useState(null);
  const [truckCoords, setTruckCoords] = useState(null);

  const fetchPickups = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch('/api/pickups?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPickups(data.pickups);
        
        // Find if there is an in-transit pickup
        const active = data.pickups.find(p => p.status === 'in-transit' || p.status === 'assigned');
        if (active) {
          setActivePickup(active);
          // Set initial truck position to pickup coordinates offsetted slightly to represent origin
          setTruckCoords({
            latitude: active.location.latitude - 0.005,
            longitude: active.location.longitude - 0.005,
            driverName: active.driver ? active.driver.name : 'Eco Driver'
          });
        } else {
          setActivePickup(null);
          setTruckCoords(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
    const interval = setInterval(fetchPickups, 15000); // refresh lists every 15s
    return () => clearInterval(interval);
  }, []);

  // Simulate dynamic truck geolocation updates locally if socket stream is pending!
  // Creates an incredibly active and beautiful visual experience.
  useEffect(() => {
    if (!truckCoords || !activePickup || activePickup.status !== 'in-transit') return;

    const interval = setInterval(() => {
      setTruckCoords(prev => {
        const destLat = activePickup.location.latitude;
        const destLon = activePickup.location.longitude;
        const currentLat = prev.latitude;
        const currentLon = prev.longitude;

        // Move 10% closer to destination at each step
        const newLat = currentLat + (destLat - currentLat) * 0.15;
        const newLon = currentLon + (destLon - currentLon) * 0.15;

        // Check if extremely close and complete loop
        const diff = Math.abs(newLat - destLat) + Math.abs(newLon - destLon);
        if (diff < 0.0001) {
          clearInterval(interval);
          return { ...prev, latitude: destLat, longitude: destLon };
        }

        return {
          ...prev,
          latitude: newLat,
          longitude: newLon
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [truckCoords, activePickup]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  // Derived metrics
  const completedCount = pickups.filter(p => p.status === 'completed').length;
  // Carbon Saved index: 1.2 kg CO2 saved per recycled point
  const carbonSaved = (user.points * 1.2).toFixed(1);

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-amber-500" />,
    assigned: <User className="h-4 w-4 text-blue-500" />,
    'in-transit': <Car className="h-4 w-4 text-emerald-500 animate-bounce" />,
    completed: <CheckCircle className="h-4 w-4 text-eco-500" />,
    cancelled: <Trash2 className="h-4 w-4 text-slate-400" />
  };

  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400',
    assigned: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400',
    'in-transit': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400',
    completed: 'bg-eco-50 text-eco-600 border-eco-200 dark:bg-eco-950/20 dark:border-eco-900 dark:text-eco-400',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400'
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Dynamic welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
            Welcome back, {user.name.split(' ')[0]}! 🌱
          </h2>
          <p className="text-xs text-slate-400 font-medium">Here is your recycling impact summary and status trackers</p>
        </div>
        <button 
          onClick={() => navigate('/pickup-request')}
          className="flex items-center gap-2 rounded-xl bg-eco-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-eco-500 hover:scale-102 transition-all self-start sm:self-center"
        >
          <PlusCircle className="h-4 w-4" /> Request Waste Pickup
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Points */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-eco-50 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400 rounded-xl">
            <Award className="h-6 w-6 animate-pulse" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Points</span>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{user.points}</h4>
            <span className="text-[9px] text-eco-600 dark:text-eco-400 font-semibold block mt-0.5">Green Level: {user.level}</span>
          </div>
        </div>

        {/* Card 2: Pickups Count */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Trash2 className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Completed Pickups</span>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{completedCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Active requests: {pickups.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length}</span>
          </div>
        </div>

        {/* Card 3: Carbon Offset */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Leaf className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Carbon Offset Saved</span>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{carbonSaved} kg</h4>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">CO2 emissions mitigated</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Trackers vs Badges */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Recent pickup requests list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Active Live Geolocation Tracking widget */}
          {activePickup && activePickup.status === 'in-transit' && truckCoords && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/10 dark:border-emerald-950/50 dark:bg-emerald-950/5 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Garbage Collector In-Transit (Live Tracking)
                  </span>
                </div>
                <Link to="/live-tracking" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center">
                  Full Screen Map <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Leaflet map frame */}
              <div className="h-64 w-full rounded-xl overflow-hidden relative">
                <MapContainer 
                  center={[activePickup.location.latitude, activePickup.location.longitude]}
                  zoom={14}
                  markers={[{
                    latitude: activePickup.location.latitude,
                    longitude: activePickup.location.longitude,
                    type: activePickup.wasteType,
                    address: activePickup.location.address
                  }]}
                  activeTruck={truckCoords}
                  route={[
                    [truckCoords.latitude, truckCoords.longitude],
                    [activePickup.location.latitude, activePickup.location.longitude]
                  ]}
                  isDarkMode={document.documentElement.classList.contains('dark')}
                />
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4">Recent Pickup Collections</h3>
            
            {pickups.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">♻️</span>
                <span className="text-xs font-bold text-slate-400 block">No collections scheduled yet</span>
                <button 
                  onClick={() => navigate('/pickup-request')}
                  className="mt-3 text-xs font-bold text-eco-600 hover:underline dark:text-eco-400"
                >
                  Schedule your first pickup
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pickups.map((p, index) => (
                  <div 
                    key={p._id || index}
                    className="p-3.5 rounded-2xl border border-slate-50 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        {p.wasteType === 'plastic' ? '🥤' : p.wasteType === 'organic' ? '🍎' : p.wasteType === 'electronic' ? '💻' : p.wasteType === 'medical' ? '💉' : p.wasteType === 'metal' ? '🥫' : '🗑️'}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 capitalize block">
                          {p.wasteType} collection ({p.weight || 1.0} kg | {p.urgency} urgency)
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate max-w-sm">
                          📍 {p.location.address}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-2 sm:pt-0">
                      <span className="text-[10px] font-bold text-eco-600 dark:text-eco-400 bg-eco-50 dark:bg-eco-950/20 px-2 py-0.5 rounded-lg">
                        +{p.rewardPoints} pts
                      </span>
                      <span className={`flex items-center gap-1 px-2.5 py-1 border rounded-full text-[10px] font-bold ${statusColors[p.status]}`}>
                        {statusIcons[p.status]}
                        <span className="capitalize">{p.status}</span>
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Badges & Rewards */}
        <div className="flex flex-col gap-4">
          {/* Badge inventory box */}
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Achievements</h3>
              <Link to="/leaderboard" className="text-[10px] font-bold text-eco-600 dark:text-eco-400 hover:underline flex items-center">
                Leaderboard <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Eco Starter', 'Green Warrior', 'Recycling Titan', 'Zero Waste Legend'].map((badge) => {
                const acquired = user.badges && user.badges.includes(badge);
                const badgeEmojis = {
                  'Eco Starter': '🌱',
                  'Green Warrior': '⚡',
                  'Recycling Titan': '🏅',
                  'Zero Waste Legend': '👑'
                };
                return (
                  <div 
                    key={badge} 
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      acquired 
                        ? 'bg-eco-50/30 border-eco-200 dark:bg-eco-950/10 dark:border-eco-800' 
                        : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/40 opacity-40'
                    }`}
                  >
                    <span className="text-2xl block mb-0.5">{badgeEmojis[badge]}</span>
                    <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 block">{badge}</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">
                      {acquired ? 'Acquired' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick AI scanning zone card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-eco-600 to-emerald-500 text-white shadow-lg flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
            <div>
              <h4 className="font-bold text-sm">Quick AI waste analysis</h4>
              <p className="text-[10px] text-white/80 mt-1 leading-relaxed">
                Analyze recyclable contents instantenously using client-side deep neural classifiers before requesting collections.
              </p>
            </div>
            <button 
              onClick={() => navigate('/pickup-request')}
              className="mt-1 w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-eco-700 font-bold text-xs transition-all shadow hover:shadow-md"
            >
              Analyze Waste Image
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
