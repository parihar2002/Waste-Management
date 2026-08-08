import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Award, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useSelector((state) => state.auth);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch('/api/rewards/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRankings(data.leaderboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  // Find personal rank
  const personalRank = rankings.findIndex(r => r._id === user.id) + 1 || '--';

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full transition-colors duration-300">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
          Green Citizens Leaderboard 🏆
        </h2>
        <p className="text-xs text-slate-400 font-medium">Global rankings of citizens participating in town recycling drives</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left pane: Personal Stats Summary */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-eco-600 to-emerald-500 text-white shadow-lg flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] h-24 w-24 rounded-full bg-white/10 blur-lg pointer-events-none" />
            
            <div>
              <span className="text-[10px] tracking-wider uppercase font-bold text-white/80 block">My Rank Position</span>
              <h3 className="text-3xl font-extrabold font-sans mt-1">#{personalRank}</h3>
              <span className="text-[10px] text-white/90 block mt-1 font-semibold">Ranked among top city recyclers</span>
            </div>

            <div className="border-t border-white/10 pt-3 flex flex-col gap-1.5">
              <span className="text-[9px] uppercase font-bold text-white/70">Level Progress</span>
              <div className="flex justify-between text-[10px] font-semibold">
                <span>Level {user.level}</span>
                <span>{user.points % 200}/200 pts</span>
              </div>
              {/* Custom Level progress bar */}
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white" 
                  style={{ width: `${((user.points % 200) / 200) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Points logic explanation box */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-500" /> Reward Point Multiplier
            </h3>
            <div className="flex flex-col gap-2.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex justify-between items-center py-1 border-b dark:border-slate-800">
                <span>Plastic item recycle</span>
                <span className="font-bold text-eco-600 dark:text-eco-400">+50 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b dark:border-slate-800">
                <span>Electronic/e-waste recycle</span>
                <span className="font-bold text-eco-600 dark:text-eco-400">+80 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b dark:border-slate-800">
                <span>tin cans/Metal items</span>
                <span className="font-bold text-eco-600 dark:text-eco-400">+60 pts</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Medical hazardous waste</span>
                <span className="font-bold text-eco-600 dark:text-eco-400">+100 pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Global Leaderboard rankings list */}
        <div className="md:col-span-2 bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Global Eco Rankings</h3>

          <div className="flex flex-col gap-3">
            {rankings.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">No citizens ranked yet.</div>
            ) : (
              rankings.map((r, idx) => {
                const rank = idx + 1;
                const isSelf = r._id === user.id;

                const medalColors = {
                  1: 'bg-amber-100 text-amber-600 ring-amber-300 dark:bg-amber-950/20 dark:ring-amber-900 dark:text-amber-400',
                  2: 'bg-slate-100 text-slate-500 ring-slate-300 dark:bg-slate-900/50 dark:ring-slate-800 dark:text-slate-400',
                  3: 'bg-orange-100 text-orange-600 ring-orange-300 dark:bg-orange-950/20 dark:ring-orange-900 dark:text-orange-400'
                };

                return (
                  <div 
                    key={r._id || idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isSelf 
                        ? 'bg-eco-50/20 border-eco-200 dark:bg-eco-950/5 dark:border-eco-800' 
                        : 'bg-slate-50/20 border-slate-50 dark:bg-slate-900/10 dark:border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Position */}
                      {rank <= 3 ? (
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${medalColors[rank]}`}>
                          {rank}
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs text-slate-400 dark:text-slate-600">
                          {rank}
                        </span>
                      )}

                      <img 
                        src={r.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                      />

                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {r.name}
                          {isSelf && (
                            <span className="inline-block text-[8px] bg-eco-500 text-white font-bold px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </span>
                        
                        {/* Badges preview row */}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {r.badges && r.badges.slice(0, 2).map(b => (
                            <span key={b} className="inline-block text-[7px] font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.1 rounded text-slate-400 dark:text-slate-500 capitalize">
                              {b.replace('Badge', '')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">{r.points} pts</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">Level {r.level}</span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
