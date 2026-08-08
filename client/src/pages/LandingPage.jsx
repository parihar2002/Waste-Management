import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Compass, Zap, HelpCircle, ArrowRight, CheckCircle2, Upload } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Waste Photo Upload',
      desc: 'Upload photos of garbage requests to help collection drivers identify and locate items quickly prior to dispatch.',
      icon: Upload,
      badge: 'Photo Upload'
    },
    {
      title: 'Real-Time Telemetry Tracking',
      desc: 'Watch dispatch trucks coordinate live map updates. Enabled with responsive Socket.io pipelines and active driver geolocation movement simulators.',
      icon: ShieldCheck,
      badge: 'WebSockets'
    },
    {
      title: 'Route optimization Engine',
      desc: 'Optimizes daily driver collections using Greedy Nearest Neighbor (TSP) coordinate calculations, conserving truck fuel and reducing town carbon footprints.',
      icon: Compass,
      badge: 'Path Algorithm'
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-darkBg dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-eco-400/20 blur-[120px] dark:bg-eco-900/10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-400/20 blur-[120px] dark:bg-emerald-900/10 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-100 dark:bg-eco-950/40 border border-eco-200 dark:border-eco-800 px-3 py-1 text-xs font-semibold text-eco-700 dark:text-eco-400 mb-6 animate-pulse">
          ♻️ Production-Grade Smart Waste Management
        </span>
        <h1 className="font-sans font-extrabold text-4xl sm:text-6xl tracking-tight leading-none bg-gradient-to-r from-slate-900 via-eco-700 to-emerald-600 bg-clip-text text-transparent dark:from-white dark:via-eco-400 dark:to-emerald-400 max-w-4xl mx-auto">
          Synchronizing Clean Cities with Recycling Rewards
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          EcoSync unites citizens, collection drivers, and city administrators into a highly connected, real-time waste recovery grid.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 rounded-full bg-eco-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-eco-500 hover:scale-102 hover:shadow-xl transition-all"
          >
            Create Free Account <ArrowRight className="h-4 w-4" />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            Access Dashboard
          </button>
        </div>

        {/* Hero Interactive UI Card Mockup */}
        <div className="mt-16 relative rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 p-2 shadow-2xl backdrop-blur-md max-w-5xl mx-auto group">
          <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/80 bg-slate-900 aspect-video flex flex-col items-center justify-center p-6 relative">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=1200')" }} />
            
            {/* Overlay Simulated Live Tracking Map */}
            <div className="z-10 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-left max-w-md shadow-2xl">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Live SIMULATION GPS Active
              </span>
              <h4 className="text-white font-bold text-sm">Truck #204 - In Transit</h4>
              <p className="text-white/70 text-[10px] mt-0.5">Optimizing 4 collections via Traveling Salesperson solver...</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                  ETA: 8 mins
                </span>
                <span className="text-xs bg-eco-500/20 text-eco-300 font-semibold px-2 py-0.5 rounded border border-eco-500/30">
                  Fuel Saved: +28%
                </span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-10 flex gap-2">
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/5 text-[9px] text-white">React 18</span>
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/5 text-[9px] text-white">NodeJS & Mongo</span>
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/5 text-[9px] text-white">Leaflet.js</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-center font-sans font-bold text-2xl sm:text-4xl text-slate-800 dark:text-slate-100 tracking-tight">
          Engineered for Modern Cities
        </h2>
        <p className="text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
          An interview-worthy technical system architecture focusing on zero-cost mapping, fast AI runtimes, and synchronized user layers.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div 
                key={idx} 
                className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/50 hover:dark:border-slate-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="p-3 bg-eco-50 dark:bg-eco-950/20 text-eco-600 dark:text-eco-400 rounded-xl">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Eco gamification system explanation */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 rounded-3xl backdrop-blur-sm border border-slate-200/40 dark:border-slate-800/60 mb-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-[10px] tracking-wider uppercase font-bold text-eco-600 dark:text-eco-400">Green Gamification Engine</span>
            <h3 className="font-sans font-bold text-2xl sm:text-3xl text-slate-800 dark:text-slate-100 mt-2">
              Rewarding Every Citizen Action
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 leading-relaxed font-medium">
              We incentivize environmental action. Citizens automatically receive recycling scores based on pickup volumes, level up, and unlock beautiful badges which put them on the global city leaderboard.
            </p>

            <ul className="mt-6 flex flex-col gap-2.5">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Dynamic Point Accruals matching waste levels
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Milestone Level Ups every 200 points
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Achievement Badge Awards (Eco Starter, Recycling Titan)
              </li>
            </ul>
          </div>

          {/* Interactive Badges mockup */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
              <span className="text-3xl block mb-1">🌱</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Eco Starter</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Assigned at 1st successful waste pickup</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
              <span className="text-3xl block mb-1">⚡</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Green Warrior</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Acquired on clearing 250 rewards points</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
              <span className="text-3xl block mb-1">🏅</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Recycling Titan</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Granted on 5 completed collection items</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm">
              <span className="text-3xl block mb-1">👑</span>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Waste Legend</span>
              <p className="text-[9px] text-slate-400 mt-0.5">Acquired on earning 600+ reward points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Landing page simple footer */}
      <footer className="relative z-10 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-darkBg text-center py-6 text-xs text-slate-400 font-medium">
        <p>© 2026 EcoSync. Built as a resume-worthy developer asset. Powered by MERN + Socket.io</p>
      </footer>
    </div>
  );
}
