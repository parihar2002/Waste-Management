import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon issues in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Custom Premium Marker Color Generators using Leaflet DivIcons
const createCustomIcon = (color, emoji) => {
  return new L.DivIcon({
    html: `<div class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer transform hover:scale-110 transition-transform" style="background-color: ${color}; font-size: 1.25rem;">
            ${emoji}
           </div>`,
    className: 'custom-leaflet-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const iconMap = {
  plastic: createCustomIcon('#3b82f6', '🥤'), // Blue
  organic: createCustomIcon('#22c55e', '🍎'), // Green
  electronic: createCustomIcon('#a855f7', '💻'), // Purple
  medical: createCustomIcon('#ef4444', '💉'), // Red
  metal: createCustomIcon('#f59e0b', '🥫'), // Amber
  mixed: createCustomIcon('#64748b', '🗑️'), // Slate
  truck: createCustomIcon('#10b981', '🚚'), // Emerald Truck
  citizen: createCustomIcon('#ec4899', '🏠') // Pink Home
};

// Component to dynamically update map views
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveMap({
  center = [28.6139, 77.2090], // Default New Delhi coordinates
  zoom = 13,
  markers = [],
  route = [],
  heatmap = [],
  activeTruck = null,
  isDarkMode = false
}) {
  // Select premium map skins depending on light/dark modes
  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const attribution = isDarkMode
    ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
    : '&copy; OpenStreetMap contributors';

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 relative z-10">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={activeTruck ? [activeTruck.latitude, activeTruck.longitude] : center} zoom={zoom} />
        
        <TileLayer url={tileUrl} attribution={attribution} />

        {/* 1. Dynamic Pickup Markers */}
        {markers.map((m, idx) => {
          const icon = iconMap[m.type] || iconMap.mixed;
          return (
            <Marker key={idx} position={[m.latitude, m.longitude]} icon={icon}>
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {m.type ? m.type.toUpperCase() : 'Waste Pickup'}
                  </div>
                  <div className="text-slate-500 mt-0.5">{m.address || 'Pickup Pin'}</div>
                  {m.urgency && (
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${
                      m.urgency === 'critical' ? 'bg-red-500' : m.urgency === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}>
                      {m.urgency.toUpperCase()}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Real-Time Moving Truck Marker */}
        {activeTruck && (
          <Marker
            position={[activeTruck.latitude, activeTruck.longitude]}
            icon={iconMap.truck}
          >
            <Popup>
              <div className="p-1 text-xs">
                <span className="font-semibold block text-emerald-600">♻️ Driver Truck Active</span>
                <span>Driver: {activeTruck.driverName || 'En route'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. Driver Routing Polylines */}
        {route && route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: '#10b981',
              weight: 5,
              opacity: 0.8,
              dashArray: '8, 8',
              lineJoin: 'round'
            }}
          />
        )}

        {/* 4. Admin Dynamic Heatmap circles */}
        {heatmap && heatmap.map((h, idx) => {
          // Color ranges based on urgency weights
          const color = h.weight > 0.8 ? '#ef4444' : h.weight > 0.5 ? '#f59e0b' : '#3b82f6';
          return (
            <Circle
              key={idx}
              center={[h.latitude, h.longitude]}
              radius={200}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 1
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
