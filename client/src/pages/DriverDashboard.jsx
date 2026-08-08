import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Navigation, 
  MapPin, 
  CheckCircle, 
  Compass, 
  ShieldAlert, 
  CheckSquare, 
  TrendingUp,
  Image,
  Upload
} from 'lucide-react';
import MapContainer from '../components/maps/MapContainer';

export default function DriverDashboard() {
  const { user } = useSelector((state) => state.auth);
  
  const [pickups, setPickups] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  
  // Geolocation states
  const [driverLat, setDriverLat] = useState(28.6080); // Driver starting Delhi lat
  const [driverLon, setDriverLon] = useState(77.2000); // Driver starting Delhi lon
  
  const [loading, setLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [completingJob, setCompletingJob] = useState(false);

  const fetchPickups = async (lat = driverLat, lon = driverLon) => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/pickups?latitude=${lat}&longitude=${lon}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter out completed or cancelled items
        const pendingOrAssigned = data.pickups.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
        setPickups(pendingOrAssigned);

        // Check if there is an active job under transit
        const active = pendingOrAssigned.find(p => p.status === 'in-transit' || p.status === 'assigned');
        if (active) {
          setActiveJob(active);
        } else {
          setActiveJob(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const syncHardwareGps = () => {
    setRangeError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lon = parseFloat(position.coords.longitude.toFixed(6));
          setDriverLat(lat);
          setDriverLon(lon);
          fetchPickups(lat, lon);
        },
        (err) => {
          setRangeError(`Actual GPS access denied: ${err.message}`);
          setTimeout(() => setRangeError(''), 5000);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setRangeError('Browser does not support geolocation.');
      setTimeout(() => setRangeError(''), 5000);
    }
  };

  useEffect(() => {
    // Automatically attempt to sync hardware GPS on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lon = parseFloat(position.coords.longitude.toFixed(6));
          setDriverLat(lat);
          setDriverLon(lon);
          fetchPickups(lat, lon);
        },
        (err) => {
          console.warn('[GPS] Device location denied. Using mock default coordinates.');
          fetchPickups(28.6080, 77.2000);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchPickups(28.6080, 77.2000);
    }
  }, []);

  // Update mock driver location along optimized routes if active
  useEffect(() => {
    if (!activeJob || activeJob.status !== 'in-transit') return;

    const interval = setInterval(() => {
      setDriverLat(prev => {
        const dest = activeJob.location.latitude;
        return prev + (dest - prev) * 0.08;
      });
      setDriverLon(prev => {
        const dest = activeJob.location.longitude;
        return prev + (dest - prev) * 0.08;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeJob]);

  // TSP greedy optimize trigger
  const handleOptimizeRoutes = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch('/api/drivers/optimize-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: driverLat, longitude: driverLon })
      });
      const data = await res.json();
      if (data.success) {
        setOptimizedRoute(data.optimized);
        
        // Setup drawing lines
        const drawLines = data.optimized.map(o => [o.location.latitude, o.location.longitude]);
        setOptimizedRoute(data.optimized);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Job Actions
  const [rangeError, setRangeError] = useState('');

  const handleAcceptJob = async (jobId) => {
    setRangeError('');
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/drivers/pickups/${jobId}/accept`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ latitude: driverLat, longitude: driverLon })
      });
      const data = await res.json();
      if (data.success) {
        fetchPickups(driverLat, driverLon);
      } else {
        setRangeError(data.message || 'Range authorization failed.');
        // Auto-dismiss alert after 5s
        setTimeout(() => setRangeError(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setRangeError('Connection issue accepting job.');
    }
  };

  const handleStartTransit = async (jobId) => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/drivers/pickups/${jobId}/transit`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchPickups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProofImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteJobSubmit = async () => {
    if (!proofImage || !activeJob) return;

    setCompletingJob(true);
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/drivers/pickups/${activeJob._id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ proofImage })
      });
      const data = await res.json();
      if (data.success) {
        setShowProofModal(false);
        setProofImage(null);
        setActiveJob(null);
        fetchPickups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingJob(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  // Draw optimized coordinates map polyline path
  const routeOverlayLines = optimizedRoute.length > 0 
    ? [[driverLat, driverLon], ...optimizedRoute.map(item => [item.location.latitude, item.location.longitude])]
    : activeJob ? [[driverLat, driverLon], [activeJob.location.latitude, activeJob.location.longitude]] : [];

  const markersList = pickups.map(p => ({
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    type: p.wasteType,
    address: p.location.address,
    urgency: p.urgency
  }));

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
            Assigned Pickups Workspace 🚚
          </h2>
          <p className="text-xs text-slate-400 font-medium">Verify driver duty logs and complete collection operations</p>
        </div>
        <button 
          onClick={handleOptimizeRoutes}
          disabled={pickups.length === 0}
          className="flex items-center gap-2 rounded-xl bg-eco-600 hover:bg-eco-500 px-4 py-2.5 text-xs font-semibold text-white shadow transition-all disabled:bg-slate-200 dark:disabled:bg-slate-800"
        >
          <Compass className="h-4 w-4" /> Optimize Driving Route (TSP)
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3 shrink-0">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-eco-50 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400 rounded-xl">
            <CheckSquare className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Scheduled Jobs</span>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{pickups.length}</h4>
            <span className="text-[9px] text-slate-400 block mt-0.5">Assigned to truck fleet</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span 
            onClick={syncHardwareGps}
            title="Click to sync actual GPS"
            className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl animate-pulse cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            <Navigation className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Truck Geolocation</span>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
              {driverLat.toFixed(4)}, {driverLon.toFixed(4)}
            </h4>
            <button 
              onClick={syncHardwareGps}
              className="text-[9px] text-eco-600 dark:text-eco-400 hover:underline font-bold block mt-0.5"
            >
              📍 Sync Actual GPS
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <span className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">CO2 Emissions Saved</span>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">14.8 kg</h4>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">Greener route efficiency</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Task maps vs pickup lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Map View of route polyline overlays */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="h-96 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative z-10">
            <MapContainer 
              center={[driverLat, driverLon]}
              zoom={13}
              markers={markersList}
              activeTruck={{
                latitude: driverLat,
                longitude: driverLon,
                driverName: user.name
              }}
              route={routeOverlayLines}
              isDarkMode={isDark}
            />
            {optimizedRoute.length > 0 && (
              <div className="absolute top-2 left-2 bg-eco-600 text-white px-2.5 py-1.5 rounded-xl z-20 text-[9px] font-bold shadow animate-pulse">
                ⚡ Route TSP Optimized sequence active
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active job and lists details */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          
          {/* Active focus job card */}
          {activeJob ? (
            <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex flex-col gap-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-eco-500 animate-ping"></span> Active focus Collection Job
              </span>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  {activeJob.wasteType === 'plastic' ? '🥤' : activeJob.wasteType === 'organic' ? '🍎' : activeJob.wasteType === 'electronic' ? '💻' : '🗑️'}
                </span>
                <div>
                  <span className="font-bold text-xs capitalize text-slate-800 dark:text-white block">
                    {activeJob.wasteType} Waste Pickup
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[200px]">📍 {activeJob.location.address}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="grid gap-2 mt-2">
                {activeJob.status === 'assigned' && (
                  <button 
                    onClick={() => handleStartTransit(activeJob._id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
                  >
                    Start Transit Geolocation Simulation
                  </button>
                )}

                {activeJob.status === 'in-transit' && (
                  <button 
                    onClick={() => setShowProofModal(true)}
                    className="w-full py-2.5 rounded-xl bg-eco-600 hover:bg-eco-500 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
                  >
                    Mark Complete & Snap Proof Photo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center p-6 gap-2">
              <span className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-slate-500 block">No active collections in focus</span>
              <span className="text-[9px] text-slate-400 max-w-[200px] leading-normal block">
                Accept a pickup task from the checklist catalog below to begin route navigation.
              </span>
            </div>
          )}

          {/* Pending Job Lists */}
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Assigned Tasks Catalog</h3>
            
            {rangeError && (
              <div className="p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl text-[9px] font-bold dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
                ⚠️ {rangeError}
              </div>
            )}

            {pickups.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-400 font-medium">All collections cleared in database.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {pickups.map(p => (
                  <div key={p._id} className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/10 dark:border-slate-800 flex items-center justify-between gap-3 text-[10px]">
                    <div className="truncate">
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize block truncate max-w-[140px]">
                        {p.wasteType} Waste | {p.weight || 1.0} kg | {p.urgency}
                      </span>
                      <span className="text-slate-400 block truncate max-w-[140px] mt-0.5">📍 {p.location.address}</span>
                    </div>

                    {p.status === 'pending' ? (
                      <button 
                        onClick={() => handleAcceptJob(p._id)}
                        className="py-1.5 px-3 bg-eco-600 hover:bg-eco-500 rounded-xl text-white font-bold transition-all shadow-sm shrink-0"
                      >
                        Accept
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-semibold italic capitalize shrink-0">
                        {p.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Proof of Collection Uploader Modal popup */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-eco-500" /> Verify waste collection completion
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal mb-4">
              Upload a snapshot proof of completed waste collection. This credits citizen rewards points and completes database records.
            </p>

            <div className="flex flex-col gap-4">
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-eco-500 rounded-2xl p-4 cursor-pointer relative overflow-hidden transition-all group min-h-[140px]">
                {proofImage ? (
                  <img src={proofImage} alt="Proof" className="h-32 w-full object-cover rounded-xl" />
                ) : (
                  <div className="text-center flex flex-col items-center gap-1.5 text-slate-400">
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Click to upload completion photo</span>
                    <span className="text-[8px]">Upload proof picture</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProofImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button 
                  onClick={() => {
                    setShowProofModal(false);
                    setProofImage(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCompleteJobSubmit}
                  disabled={!proofImage || completingJob}
                  className="px-4 py-2 bg-eco-600 hover:bg-eco-500 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {completingJob ? 'Processing...' : 'Complete Collection'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
