import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Users, Trash2, Search, ArrowLeft, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminGovernance() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const navigate = useNavigate();

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/groups/list.php`);
            if (res.data.status === 'success') {
                setGroups(res.data.groups);
            }
        } catch (e) { console.error("Governance fetch failed"); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleDeleteGroup = async (groupId) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/groups/manage.php`, {
                action: 'DELETE_GROUP',
                group_id: groupId
            });
            if (res.data.status === 'success') {
                setDeleteConfirm(null);
                fetchGroups();
            }
        } catch (e) { alert("Termination protocol failed."); }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#020617]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Accessing Campus Registry...</p>
        </div>
    );

    const filteredGroups = groups.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) || 
        g.creator_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#020617] p-8 lg:p-12 overflow-y-auto custom-scrollbar">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        <Shield size={14} className="animate-pulse" /> Global Governance Protocol
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">CAMPUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-400">GOVERNANCE</span></h1>
                    <p className="text-slate-500 text-lg font-medium tracking-tight mt-4">Administrative overrides for all academic research groups and transmission nodes.</p>
                </div>
                <div className="relative group min-w-[300px]">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        placeholder="SEARCH CAMPUS NODES..." 
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold text-white uppercase tracking-widest focus:outline-none focus:border-indigo-500/50 transition-all shadow-2xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {filteredGroups.map(group => (
                    <div key={group.id} className="group p-8 bg-white/[0.02] border border-white/5 rounded-[40px] hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/5 shadow-2xl">
                                    {group.avatar_url ? (
                                        <img src={group.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xl font-black text-white">{group.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1">{group.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Initiator: <span className="text-indigo-400">{group.creator_name || 'Legacy Student'}</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setDeleteConfirm(group.id)}
                                className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                title="Terminate Group Node"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed italic border-l-2 border-indigo-500/20 pl-4">{group.description || 'No academic bio provided for this transmission node.'}</p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <Users size={14} className="text-slate-500" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{group.member_count} Registered Members</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">Synchronized</span>
                            </div>
                        </div>

                        {deleteConfirm === group.id && (
                            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 z-20">
                                <AlertTriangle className="text-red-500 mb-4" size={48} />
                                <h4 className="text-lg font-black text-white uppercase tracking-wider mb-2">Confirm Termination</h4>
                                <p className="text-xs text-slate-400 mb-8 max-w-[280px]">Warning: This action will permanently disband the research group and purge all associated collaboration history.</p>
                                <div className="flex gap-4 w-full px-4">
                                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all transform hover:scale-[1.02]">Cancel</button>
                                    <button onClick={() => handleDeleteGroup(group.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-600/30 transform hover:scale-[1.02]">Disband Node</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredGroups.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-40">
                    <Shield size={64} className="text-slate-800 mb-8" />
                    <p className="text-sm font-black text-slate-700 uppercase tracking-[0.4em]">No active group nodes found in the campus registry.</p>
                </div>
            )}
        </div>
    );
}
