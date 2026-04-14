import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { 
  Trophy, 
  Flame, 
  Circle, 
  Search, 
  ArrowUp, 
  Zap, 
  Mail, 
  User as UserIcon,
  Crown,
  Medal,
  Star,
  Activity
} from 'lucide-react';

export default function Leaderboard() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/leaderboard/read.php`);
      setUsers(res.data.data || []);
      setLoading(false);
    } catch (e) {
      console.error("Failed to sync leaderboard");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 15s for "Real-time" effect
    return () => clearInterval(interval);
  }, []);

  const getAvatarUrl = (url) => url ? `${BASE_URL}/${url}?t=${Date.now()}` : null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = filteredUsers.slice(0, 3);
  const remaining = filteredUsers.slice(3);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[60vh]">
       <div className="w-16 h-16 rounded-[24px] border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
       <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] mt-8">Synchronizing Performance Grid...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-32 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-32 pointer-events-none select-none">
        <div>
           <div className="flex items-center gap-3 text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-4 drop-shadow-2xl">
              <Activity size={14} className="animate-pulse" /> Live Global Intelligence
           </div>
           <h1 className="text-8xl font-black text-white tracking-tighter italic uppercase leading-none italic">ACHIEVEMENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PODIUM</span></h1>
           <p className="text-slate-500 text-lg font-medium tracking-tight mt-6 max-w-2xl">Collective Personnel intelligence ranking based on objective resolution complexity and consistent synchronization streaks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24 items-end">
         {/* Second Place */}
         {topThree[1] && (
            <div className="order-2 md:order-1 h-fit p-10 bg-slate-900/40 rounded-[50px] border border-white/[0.03] text-center relative group hover:bg-slate-800 transition-all duration-700 shadow-2xl">
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-4 bg-slate-100/10 backdrop-blur-xl rounded-full text-slate-400 border border-slate-100/20 group-hover:scale-110 transition-transform">
                  <Medal size={32} />
               </div>
               <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-slate-400/20 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                     {topThree[1].avatarUrl ? (
                        <img src={getAvatarUrl(topThree[1].avatarUrl)} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black">{topThree[1].name.charAt(0)}</div>
                     )}
                  </div>
               </div>
               <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{topThree[1].name}</h3>
               <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-xl border border-white/10">
                     <Zap size={14} className="text-amber-400" />
                     <span className="text-sm font-black tracking-tight">{topThree[1].achievement_points} AAP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-500/60">
                     <Flame size={14} />
                     <span className="text-xs font-bold">{topThree[1].streak_count}</span>
                  </div>
               </div>
               {topThree[1].is_online && <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">ONLINE NOW</div>}
            </div>
         )}

         {/* First Place */}
         {topThree[0] && (
            <div className="order-1 md:order-2 h-fit p-14 bg-indigo-600 rounded-[60px] text-center relative group z-10 shadow-[0_40px_100px_rgba(79,70,229,0.4)] scale-110 hover:-translate-y-4 transition-all duration-700">
               <div className="absolute -top-16 left-1/2 -translate-x-1/2 p-6 bg-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] rounded-full text-indigo-900 animate-bounce">
                  <Crown size={48} />
               </div>
               <div className="w-32 h-32 mx-auto mb-8 rounded-full border-4 border-white/20 p-1.5 shadow-3xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-indigo-900 border-2 border-white/10">
                     {topThree[0].avatarUrl ? (
                        <img src={getAvatarUrl(topThree[0].avatarUrl)} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">{topThree[0].name.charAt(0)}</div>
                     )}
                  </div>
               </div>
               <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-white">{topThree[0].name}</h3>
               <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="px-6 py-3 bg-white/10 rounded-[24px] border border-white/20 flex items-center gap-3">
                     <Zap size={24} className="text-amber-300 animate-pulse" />
                     <span className="text-3xl font-black text-white tracking-widest italic">{topThree[0].achievement_points}</span>
                  </div>
                   <div className="flex items-center gap-2 text-orange-300">
                     <Flame size={20} />
                     <span className="text-xl font-black">{topThree[0].streak_count}</span>
                  </div>
               </div>
               <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] inline-block">APEX DISCIPLINE</div>
            </div>
         )}

         {/* Third Place */}
         {topThree[2] && (
            <div className="order-3 h-fit p-10 bg-slate-900/40 rounded-[50px] border border-white/[0.03] text-center relative group hover:bg-slate-800 transition-all duration-700 shadow-2xl">
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-4 bg-orange-900/10 backdrop-blur-xl rounded-full text-orange-600 border border-orange-500/20 group-hover:scale-110 transition-transform">
                  <Star size={32} />
               </div>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-orange-900/20 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                     {topThree[2].avatarUrl ? (
                        <img src={getAvatarUrl(topThree[2].avatarUrl)} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black">{topThree[2].name.charAt(0)}</div>
                     )}
                  </div>
               </div>
               <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{topThree[2].name}</h3>
               <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-xl border border-white/10">
                     <Zap size={14} className="text-amber-400" />
                     <span className="text-sm font-black tracking-tight">{topThree[2].achievement_points} AAP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-500/60">
                     <Flame size={14} />
                     <span className="text-xs font-bold">{topThree[2].streak_count}</span>
                  </div>
               </div>
               {topThree[2].is_online && <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">ONLINE NOW</div>}
            </div>
         )}
      </div>

      <div className="max-w-4xl mx-auto">
         <div className="flex items-center justify-between mb-12 border-b border-white/[0.03] pb-6">
             <div className="flex items-center gap-4">
                <Medal size={24} className="text-slate-600" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Personnel Intelligence Directory</h2>
             </div>
             <div className="group relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" />
                <input 
                  type="text" placeholder="FILTER NODES..." 
                  className="bg-transparent border border-white/5 rounded-2xl pl-10 pr-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] focus:outline-none focus:border-indigo-500/50 transition-all italic text-white"
                  value={search} onChange={e => setSearch(e.target.value)}
                />
             </div>
         </div>

         <div className="bg-slate-900/40 rounded-[40px] border border-white/[0.03] overflow-hidden shadow-2xl backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                     <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] w-20">Rank</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Personnel</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Points (AAP)</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Streak</th>
                     <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {remaining.map((u, i) => (
                     <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-6">
                           <span className="text-xl font-black italic text-slate-800 group-hover:text-amber-500/50 transition-colors">#{i + 4}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-5">
                              <div className="relative">
                                 <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-white/5 ring-4 ring-black/20">
                                    {u.avatarUrl ? <img src={getAvatarUrl(u.avatarUrl)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-500">{u.name.charAt(0)}</div>}
                                 </div>
                                 {u.is_online && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                              </div>
                              <div>
                                 <p className="text-base font-black italic uppercase tracking-tighter text-slate-200 group-hover:text-indigo-400 transition-colors">{u.name}</p>
                                 <p className="text-[10px] text-slate-600 font-bold lowercase tracking-tighter italic opacity-60">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-xl border border-white/[0.03] group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                              <Zap size={14} className="text-amber-400" />
                              <span className="text-lg font-black italic tracking-tighter text-white">{u.achievement_points}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Flame size={16} className={u.streak_count > 0 ? "text-orange-500" : "text-slate-800"} />
                              <span className="text-lg font-black italic tracking-tighter text-slate-400">{u.streak_count}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           {u.is_online ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" />
                           ) : (
                              <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic">Offline</span>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {remaining.length === 0 && filteredUsers.length >= 3 && (
               <div className="py-20 text-center">
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] italic">No further intelligence registered in this sector.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
