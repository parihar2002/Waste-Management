import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Setup Map events to pick coords click on map
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function PickupRequestForm() {
  const navigate = useNavigate();

  const [wasteType, setWasteType] = useState('mixed');
  const [urgency, setUrgency] = useState('medium');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(28.6139); // Default Delhi lat
  const [longitude, setLongitude] = useState(77.2090); // Default Delhi lon
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState(7.0); // Waste weight in kilograms (Min 7.0 kg)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle image selector
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMapClick = (lat, lng) => {
    setLatitude(parseFloat(lat.toFixed(6)));
    setLongitude(parseFloat(lng.toFixed(6)));
    setAddress(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // Client-side Haversine helper to calculate distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address || !scheduledTime) {
      setError('Please provide pickup address and date-time schedule.');
      return;
    }

    if (weight < 7.0) {
      setError('Waste collection requests are only dispatched for quantities of at least 7.0 kg.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Native GPS verification logic
    if (!navigator.geolocation) {
      setError('Browser does not support GPS geolocation. Location verification failed.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const actualLat = position.coords.latitude;
        const actualLon = position.coords.longitude;

        // Verify if selected coordinates are within 10m of device actual GPS (0.01 km)
        const dist = getDistance(actualLat, actualLon, latitude, longitude);

        if (dist > 0.01) { // 10 meters operating radius limit
          setError(`You can only schedule pickup requests at your current physical location. Your pinned map coordinates are ${(dist * 1000).toFixed(0)}m away from your GPS location (Limit: 10m).`);
          setLoading(false);
          return;
        }

        // Distance verified! Proceed with submission payload
        const token = localStorage.getItem('eco_token');
        const payload = {
          wasteType,
          urgency,
          weight,
          location: {
            address,
            latitude,
            longitude
          },
          notes,
          scheduledTime,
          image: imagePreview
        };

        try {
          const res = await fetch('/api/pickups', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          setLoading(false);
          if (data.success) {
            setSuccess('Smart pickup scheduled! Points will credit on completion.');
            setTimeout(() => navigate('/citizen-dashboard'), 1500);
          } else {
            setError(data.message || 'Submission error');
          }
        } catch (err) {
          setLoading(false);
          setError('Failed to contact server api.');
        }
      },
      (err) => {
        setLoading(false);
        setError(`Location verification failed: ${err.message}. Please enable GPS location permissions to schedule a pickup.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Get current lat lon of device
  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lon = parseFloat(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lon);
          setAddress(`Current Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        },
        (err) => {
          console.error(err);
        }
      );
    }
  };

  const isDark = document.documentElement.classList.contains('dark');
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full transition-colors duration-300">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
          Request Waste Pickup ♻️
        </h2>
        <p className="text-xs text-slate-400 font-medium">Pin collection locations, upload images of garbage, and earn coins</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-eco-50 dark:bg-eco-950/20 border border-eco-200 dark:border-eco-800 text-eco-600 dark:text-eco-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        
        {/* Left Side: Parameters Inputs */}
        <div className="flex flex-col gap-4 bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm">
          
          <div className="grid grid-cols-3 gap-3">
            {/* Waste Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waste Material</label>
              <select 
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
              >
                <option value="organic">Organic Waste (🍎)</option>
                <option value="plastic">Plastic Content (🥤)</option>
                <option value="electronic">Electronic/Battery (💻)</option>
                <option value="metal">tin/Aluminum (🥫)</option>
                <option value="medical">clinical Syringes (💉)</option>
                <option value="mixed">Mixed Garbage (🗑️)</option>
              </select>
            </div>

            {/* Weight (in kg) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weight (in kg)</label>
              <input 
                type="number"
                step="0.1"
                min="7.0"
                required
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 7.0)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
              />
              <span className="text-[8px] text-slate-400 block dark:text-slate-500 mt-0.5">Min quantity required: 7.0 kg</span>
            </div>

            {/* Urgency */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Urgency Level</label>
              <select 
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
              >
                <option value="low">Low (Standard)</option>
                <option value="medium">Medium (Next-day)</option>
                <option value="high">High (Express)</option>
                <option value="critical">Critical (Immediate)</option>
              </select>
            </div>
          </div>

          {/* Location details */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pickup Address Location</label>
              <button 
                type="button"
                onClick={fetchCurrentLocation}
                className="text-[9px] font-bold text-eco-600 hover:underline dark:text-eco-400"
              >
                GPS Auto-Detect
              </button>
            </div>
            <input 
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House Number, Street Name, Block City"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
            />
          </div>

          {/* Latitude & Longitude displays */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latitude Pin</label>
              <input 
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none dark:text-white transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Longitude Pin</label>
              <input 
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Schedule Dates */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Schedule Collection Date/Time</label>
            <input 
              type="datetime-local"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes / Landmarker remarks</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Near green society gate #2, blue recycling bin"
              rows="2"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold focus:outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 dark:text-white transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-eco-600 hover:bg-eco-500 font-semibold text-white shadow-lg text-xs transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-800"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Dispatch Pickup Request'}
          </button>
        </div>

        {/* Right Side: Map Coordinates selector + image upload */}
        <div className="flex flex-col gap-4">
          
          {/* Leaflet map pinning viewport */}
          <div className="h-64 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative z-10">
            <MapContainer
              center={[latitude, longitude]}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer url={tileUrl} />
              <MapEventsHandler onMapClick={handleMapClick} />
              <Marker position={[latitude, longitude]} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl z-20 text-[9px] text-white">
              📍 Click map coordinates to set pins
            </div>
          </div>

          {/* Photo Upload dropzone */}
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-emerald-500" /> Garbage Photo Upload
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-eco-500 rounded-2xl p-4 cursor-pointer relative overflow-hidden transition-all group min-h-[160px]">
              {imagePreview ? (
                <div className="relative w-full h-36 flex items-center justify-center rounded-xl overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">Replace image</span>
                  </div>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center gap-2">
                  <span className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-xl group-hover:text-eco-500 transition-colors">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Upload garbage image</span>
                  <span className="text-[8px] text-slate-400">JPEG, PNG up to 5MB</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>

          </div>

        </div>

      </form>

    </div>
  );
}
