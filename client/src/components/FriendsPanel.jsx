import { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, User as UserIcon, Clock, Users } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../api/config';

export default function FriendsPanel({ onClose }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [activeTab, setActiveTab] = useState('add'); // 'add', 'requests', 'friends'

    const fetchPending = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/friends/pending_requests.php`);
            if (res.data.status === 'success') setPendingRequests(res.data.data || []);
        } catch (e) {}
    };

    const fetchFriends = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/friends/list.php`);
            if (res.data.status === 'success') setFriends(res.data.data || []);
        } catch (e) {}
    };

    useEffect(() => {
        fetchPending();
        fetchFriends();
        const interval = setInterval(() => {
            fetchPending();
            fetchFriends();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = async () => {
        if (searchQuery.length < 1) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/friends/search.php?q=${searchQuery}`);
            if (res.data?.status === 'success') {
                const results = res.data?.data || [];
                setSearchResults(results);
            }
        } catch (e) {}
    };

    useEffect(() => {
        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const sendRequest = async (id) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/friends/send_request.php`, { receiver_id: id });
            if (res.data.status === 'success') {
                setSearchResults(prev => prev.map(u => u.id === id ? { ...u, requested: true } : u));
            }
        } catch (e) { alert(e.response?.data?.message || "Error"); }
    };

    const respondRequest = async (requestId, action) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/friends/respond_request.php`, { request_id: requestId, action });
            if (res.data.status === 'success') {
                fetchPending();
                fetchFriends();
            }
        } catch (e) {}
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-[#0e172a] border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Tabs */}
                <div className="flex border-b border-white/5 p-2 gap-2">
                    <button onClick={() => setActiveTab('add')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>Add Student</button>
                    <button onClick={() => setActiveTab('requests')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all relative ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                        Requests
                        {pendingRequests.length > 0 && <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                    </button>
                    <button onClick={() => setActiveTab('friends')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>Friend List</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'add' && (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or email..." 
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                            {(searchResults || []).map(user => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400"><UserIcon size={20} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-white mb-0.5">{user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{user.role}</p>
                                        </div>
                                    </div>
                                    <button 
                                        disabled={user.requested}
                                        onClick={() => sendRequest(user.id)}
                                        className={`p-2.5 rounded-xl transition-all ${user.requested ? 'text-slate-600' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                                    >
                                        {user.requested ? <Clock size={18} /> : <UserPlus size={18} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-3">
                        {(pendingRequests || []).map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-orange-400"><Clock size={20} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-white mb-0.5">{req.name}</p>
                                        <p className="text-[10px] text-slate-500">Sent a friend request</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => respondRequest(req.id, 'accept')} className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"><Check size={18} /></button>
                                    <button onClick={() => respondRequest(req.id, 'reject')} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><X size={18} /></button>
                                </div>
                            </div>
                        ))}
                        {(pendingRequests || []).length === 0 && (
                            <div className="text-center py-12 opacity-30">
                                <Clock size={48} className="mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">No pending requests</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="space-y-3">
                        {(friends || []).map(friend => (
                            <div key={friend.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-green-400"><UserIcon size={20} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-white mb-0.5">{friend.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Connected Academic</p>
                                    </div>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50" />
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
