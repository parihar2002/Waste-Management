import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigation, Clock, User, Phone, Star, ShieldAlert } from 'lucide-react';
import MapContainer from '../components/maps/MapContainer';

export default function LiveTrackingPage() {
  const { user } = useSelector((state) => state.auth);
  
  const [pickups, setPickups] = useState([]);
  const [activePickup, setActivePickup] = useState(null);
  const [truckCoords, setTruckCoords] = useState(null);
  const [eta, setEta] = useState(15); // ETA in minutes
  const [loading, setLoading] = useState(true);

  const fetchPickups = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch('/api/pickups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setPickups(data.pickups);
        
        // Target an active pickup (in-transit, otherwise assigned)
        const active = data.pickups.find(p => p.status === 'in-transit') || 
                       data.pickups.find(p => p.status === 'assigned');
        
        if (active) {
          setActivePickup(active);
          // Set initial simulation position slightly offset from destination coordinates
          if (!truckCoords) {
            setTruckCoords({
              latitude: active.location.latitude - 0.008,
              longitude: active.location.longitude - 0.008,
              driverName: active.driver ? active.driver.name : 'Eco Driver'
            });
          }
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
    const interval = setInterval(fetchPickups, 12000);
    return () => clearInterval(interval);
  }, []);

  // active GPS simulation
  useEffect(() => {
    if (!activePickup || !truckCoords || activePickup.status !== 'in-transit') return;

    const interval = setInterval(() => {
      setTruckCoords(prev => {
        const destLat = activePickup.location.latitude;
        const destLon = activePickup.location.longitude;
        const currentLat = prev.latitude;
        const currentLon = prev.longitude;

        // Move 10% closer on each step
        const latStep = (destLat - currentLat) * 0.1;
        const lonStep = (destLon - currentLon) * 0.1;
        
        const newLat = currentLat + latStep;
        const newLon = currentLon + lonStep;

        const diff = Math.abs(newLat - destLat) + Math.abs(newLon - destLon);
        if (diff < 0.0001) {
          clearInterval(interval);
          setEta(0);
          return { ...prev, latitude: destLat, longitude: destLon };
        }

        // Decelerate ETA
        setEta(prevEta => Math.max(1, Math.round(prevEta - 1)));

        return {
          ...prev,
          latitude: newLat,
          longitude: newLon
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activePickup, truckCoords]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300 h-[calc(100vh-4rem)]">
      
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
            Live Collection Tracking Map 🚚
          </h2>
          <p className="text-xs text-slate-400 font-medium">Trace dynamic truck geolocations en route to scheduled coordinates</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 relative">
        
        {/* Left pane: Details box */}
        <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto shrink-0">
          
          {activePickup ? (
            <>
              {/* ETA Status banner */}
              <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex items-center gap-4 shrink-0">
                <span className="p-3 bg-eco-50 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400 rounded-xl animate-pulse">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Arrival (ETA)</span>
                  <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                    {activePickup.status === 'in-transit' ? `${eta} Minutes` : 'Waiting dispatch'}
                  </h4>
                  <span className="text-[9px] text-eco-600 dark:text-eco-400 font-semibold block mt-0.5">
                    Status: <span className="capitalize">{activePickup.status}</span>
                  </span>
                </div>
              </div>

              {/* Driver profile details */}
              {activePickup.driver ? (
                <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex flex-col gap-4">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-eco-500" /> Assigned Driver Profile
                  </h3>
                  
                  <div className="flex items-center gap-3">
                    <img 
                      src={activePickup.driver.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} 
                      alt="Driver" 
                      className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-white block">{activePickup.driver.name}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-slate-400 font-semibold">4.9 Collection Rating</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    <span>{activePickup.driver.phone || '+91 98888 88888'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm text-center">
                  <span className="text-2xl block mb-1">⏳</span>
                  <span className="text-xs font-bold text-slate-500 block">Awaiting Driver Assignment</span>
                  <span className="text-[9px] text-slate-400 block mt-1">Admins will assign a fleet collector shortly.</span>
                </div>
              )}

              {/* Waste item details card */}
              <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex flex-col gap-2 shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Waste Material Spec</span>
                <span className="font-bold text-xs text-slate-800 dark:text-white capitalize flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-eco-500"></span> {activePickup.wasteType} category
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal block">
                  📍 {activePickup.location.address}
                </span>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm text-center">
              <span className="text-3xl block mb-2">🚚</span>
              <h3 className="font-bold text-xs text-slate-800 dark:text-white">No active collection en route</h3>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Live maps tracking is triggered when a scheduled request moves to "in-transit" or "assigned" states.
              </p>
            </div>
          )}

        </div>

        {/* Right pane: Leaflet full viewport */}
        <div className="flex-1 rounded-3xl overflow-hidden shadow-sm relative z-10 border border-slate-100 dark:border-slate-800 h-64 md:h-auto">
          {activePickup && truckCoords ? (
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
              isDarkMode={isDarkMode}
            />
          ) : (
            <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-center p-6 gap-2">
              <span className="p-3.5 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-full">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Maps Offline</span>
              <span className="text-[10px] text-slate-400 max-w-sm leading-normal">
                Schedule a waste pickup request and wait for a driver to initiate collection transit to view real-time maps.
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
