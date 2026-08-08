import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, Ban, UserCheck, ShieldAlert, Award, Star } from 'lucide-react';

export default function UserManagement() {
  const { user } = useSelector((state) => state.auth);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('eco_token');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        fetchUsers();
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-800 dark:text-white">
          User Operations Management 👥
        </h2>
        <p className="text-xs text-slate-400 font-medium">Search, monitor, and regulate citizen and field driver account permissions</p>
      </div>

      <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900/40 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-eco-500" /> Active System Members Catalog ({usersList.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-semibold">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                <th className="py-3">Name</th>
                <th>Email Address</th>
                <th>Role Identity</th>
                <th>User Stats</th>
                <th>Account Status</th>
                <th className="text-right">Safety Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map(item => (
                <tr key={item._id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-4 flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                    <img src={item.avatar} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                    {item.name}
                  </td>
                  <td>{item.email}</td>
                  <td className="capitalize font-bold text-slate-500">{item.role}</td>
                  <td>
                    {item.role === 'citizen' ? (
                      <span className="flex items-center gap-1 text-[10px] text-eco-600 dark:text-eco-400 font-bold bg-eco-50 dark:bg-eco-950/20 px-2 py-0.5 rounded-lg w-max">
                        <Award className="h-3 w-3" /> Lv. {item.level} | {item.points} pts
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-lg w-max">
                        <Star className="h-3 w-3 fill-blue-500" /> 4.9 Rating
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold ${
                      item.status === 'active' ? 'bg-eco-50 text-eco-600 border border-eco-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    {item.status === 'active' ? (
                      <button 
                        onClick={() => handleToggleUserBan(item._id, item.status)}
                        className="py-1.5 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-[10px] font-bold transition-all"
                      >
                        <Ban className="h-3 w-3 inline mr-1" /> Suspend Account
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleUserBan(item._id, item.status)}
                        className="py-1.5 px-3 rounded-xl border border-eco-200 text-eco-500 hover:bg-eco-50 dark:hover:bg-eco-950/20 text-[10px] font-bold transition-all"
                      >
                        <UserCheck className="h-3 w-3 inline mr-1" /> Restore Account
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
