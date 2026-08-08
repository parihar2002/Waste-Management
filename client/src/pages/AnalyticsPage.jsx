import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { FileDown, FileCheck2, TrendingUp, Sparkles } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useSelector((state) => state.auth);
  
  const [analytics, setAnalytics] = useState({
    wasteDistribution: [],
    completionsTrend: [],
    driverPerformance: []
  });
  
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // PDF Download endpoint fetch
  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const response = await fetch('/api/admin/reports/pdf', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecosync_audit_report_${new Date().toLocaleDateString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('PDF Generation Failure:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-500"></div>
      </div>
    );
  }

  // Predefine beautiful hex color arrays for pie components
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#64748b'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
            System Analytics & Audits 📈
          </h2>
          <p className="text-xs text-slate-400 font-medium">Verify system aggregations, waste distributions, and export formatted PDF audits</p>
        </div>
        
        <button 
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 rounded-xl bg-eco-600 hover:bg-eco-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow transition-all self-start sm:self-center"
        >
          <FileDown className="h-4 w-4 animate-bounce" /> Export System PDF Audit
        </button>
      </div>

      {/* Primary Graphs Row */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Waste type distribution chart */}
        <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-xs text-slate-800 dark:text-white">Waste Material Densities</h3>
            <span className="text-[9px] text-slate-400">Total collections grouped by waste material category</span>
          </div>

          <div className="h-64 w-full">
            {analytics.wasteDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">No analytics data logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.wasteDistribution}>
                  <XAxis dataKey="name" fontSize={10} stroke="#64748b" tickLine={false} />
                  <YAxis fontSize={10} stroke="#64748b" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      fontSize: '10px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                    }} 
                  />
                  <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Completion Trends chart */}
        <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-xs text-slate-800 dark:text-white">Weekly Collections Volume Trends</h3>
            <span className="text-[9px] text-slate-400">Line graph tracking successfully collected waste orders</span>
          </div>

          <div className="h-64 w-full">
            {analytics.completionsTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">No timeline trends logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.completionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} stroke="#64748b" tickLine={false} />
                  <YAxis fontSize={10} stroke="#64748b" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      fontSize: '10px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                    }} 
                  />
                  <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Driver performance breakdown section */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Side: Driver Share allocation */}
        <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-xs text-slate-800 dark:text-white">Collection Fleet Shares</h3>
            <span className="text-[9px] text-slate-400">Percentage distribution of collection completions</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative">
            {analytics.driverPerformance.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">No driver logs in database.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.driverPerformance}
                    dataKey="totalCompleted"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {analytics.driverPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Side: Driver performance listings details table */}
        <div className="md:col-span-2 bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-xs text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Driver Collection Performance Ratings</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-left border-collapse font-semibold">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="py-2">Driver Name</th>
                  <th>Email</th>
                  <th>Completed Pickups</th>
                  <th className="text-right">Avg Rewards Granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.driverPerformance.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400">No driver tasks logged.</td>
                  </tr>
                ) : (
                  analytics.driverPerformance.map((d, index) => (
                    <tr key={index} className="text-slate-700 dark:text-slate-300">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{d.name}</td>
                      <td>{d.email}</td>
                      <td>{d.totalCompleted} Completed</td>
                      <td className="text-right font-bold text-eco-600 dark:text-eco-400">+{d.avgPointsEarned} pts</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
