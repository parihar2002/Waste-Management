import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Compass, Navigation, AlertCircle, Play } from 'lucide-react';
import MapContainer from '../components/maps/MapContainer';

export default function RouteOptimization() {
  const { user } = useSelector((state) => state.auth);
  
  const [pickups, setPickups] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [driverLat, setDriverLat] = useState(28.6080);
  const [driverLon, setDriverLon] = useState(77.2000);
  
  const [loading, setLoading] = useState(true);
  const [transitMode, setTransitMode] = useState(false);

  const fetchPickups = async (lat = driverLat, lon = driverLon) => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch(`/api/pickups?latitude=${lat}&longitude=${lon}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const activeTasks = data.pickups.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
        setPickups(activeTasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          console.warn('[GPS] Device location denied. Using default coordinates.');
          fetchPickups(28.6080, 77.2000);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchPickups(28.6080, 77.2000);
    }
  }, []);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate active movement along paths
  useEffect(() => {
    if (!transitMode || optimizedRoute.length === 0) return;

    let targetIdx = 0;
    const interval = setInterval(() => {
      if (targetIdx >= optimizedRoute.length) {
        clearInterval(interval);
        setTransitMode(false);
        return;
      }

      const targetCoords = optimizedRoute[targetIdx].location;
      setDriverLat(prev => {
        const dest = targetCoords.latitude;
        const diff = Math.abs(dest - prev);
        if (diff < 0.0005) {
          return dest;
        }
        return prev + (dest - prev) * 0.2;
      });

      setDriverLon(prev => {
        const dest = targetCoords.longitude;
        const diff = Math.abs(dest - prev);
        if (diff < 0.0005) {
          // Reached checkpoint, shift to next node
          targetIdx += 1;
          return dest;
        }
        return prev + (dest - prev) * 0.2;
      });

    }, 3000);

    return () => clearInterval(interval);
  }, [transitMode, optimizedRoute]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  const isDarkMode = document.documentElement.classList.contains('dark');

  // Convert coords list to polyline overlays
  const routeOverlayLines = optimizedRoute.length > 0
    ? [[driverLat, driverLon], ...optimizedRoute.map(item => [item.location.latitude, item.location.longitude])]
    : pickups.map(p => [p.location.latitude, p.location.longitude]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300 h-[calc(100vh-4rem)]">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
            Geographic Route Optimization 🧭
          </h2>
          <p className="text-xs text-slate-400 font-medium font-sans">Maximize fuel economy and emissions indices using our Traveling Salesperson sequence optimizer</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleOptimizeRoutes}
            disabled={pickups.length === 0 || transitMode}
            className="flex items-center gap-2 rounded-xl bg-eco-600 hover:bg-eco-500 disabled:bg-slate-200 text-white px-4 py-2.5 text-xs font-semibold shadow transition-all"
          >
            <Compass className="h-4 w-4" /> Calculate Shortest Sequence
          </button>
          
          {optimizedRoute.length > 0 && (
            <button 
              onClick={() => setTransitMode(true)}
              disabled={transitMode}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white px-4 py-2.5 text-xs font-semibold shadow transition-all animate-pulse"
            >
              <Play className="h-4 w-4" /> Start Route Simulation
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 relative">
        
        {/* Left Side: Sequence view */}
        <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto shrink-0">
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">
              Sequence List
            </h3>

            {optimizedRoute.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-400 font-medium">
                Tap "Calculate Shortest Sequence" above to aggregate and compute the greedy Traveling Salesperson paths.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {optimizedRoute.map((item, idx) => (
                  <div key={item._id} className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border dark:border-slate-800 rounded-xl text-[10px] flex items-center gap-3">
                    <span className="h-5 w-5 bg-eco-600 text-white rounded-full flex items-center justify-center font-bold font-sans">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize block truncate max-w-[150px]">
                        {item.wasteType} Waste | {item.weight || 1.0} kg | {item.urgency}
                      </span>
                      <span className="text-slate-400 block truncate max-w-[150px] mt-0.5">📍 {item.location.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map frame */}
        <div className="flex-1 rounded-3xl overflow-hidden shadow-sm relative z-10 border border-slate-100 dark:border-slate-800 h-64 md:h-auto">
          <MapContainer 
            center={[driverLat, driverLon]}
            zoom={13}
            markers={pickups.map(p => ({
              latitude: p.location.latitude,
              longitude: p.location.longitude,
              type: p.wasteType,
              address: p.location.address,
              urgency: p.urgency
            }))}
            activeTruck={{
              latitude: driverLat,
              longitude: driverLon,
              driverName: user.name
            }}
            route={routeOverlayLines}
            isDarkMode={isDarkMode}
          />
        </div>

      </div>

    </div>
  );
}
