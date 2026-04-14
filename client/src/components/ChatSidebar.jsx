import { useState, useEffect } from 'react';
import { Search, User, MessageCircle, MoreVertical, Plus, Users, Shield, UserPlus, Video } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';

export default function ChatSidebar({ onSelect, selectedId, selectedType, onOpenFriends, onOpenCreateGroup }) {
    const [chats, setChats] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeCalls, setActiveCalls] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    const fetchChats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/list_chats.php`);
            if (res.data.status === 'success') setChats(res.data.chats || []);
        } catch (e) { setChats([]); }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/groups/list.php`);
            if (res.data.status === 'success') setGroups(res.data.groups || []);
        } catch (e) { setGroups([]); }
    };

    const fetchActiveCalls = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/calls/active_calls.php`);
            if (res.data.status === 'success') setActiveCalls(res.data.active_calls || []);
        } catch (e) { setActiveCalls([]); }
    };

    const fetchPendingRequests = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/friends/pending_requests.php`);
            if (res.data.status === 'success') {
                setPendingCount(res.data.data ? res.data.data.length : 0);
            }
        } catch (e) {}
    };

    useEffect(() => {
        fetchChats();
        fetchGroups();
        fetchActiveCalls();
        fetchPendingRequests();
        const interval = setInterval(() => {
            fetchChats();
            fetchGroups();
            fetchActiveCalls();
            fetchPendingRequests();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredChats = (chats || []).filter(c => c?.name?.toLowerCase().includes(search.toLowerCase()));
    const filteredGroups = (groups || []).filter(g => g?.name?.toLowerCase().includes(search.toLowerCase()));

    const getAvatar = (url) => {
        if (url) return `${BASE_URL}/${url}`;
        return null;
    };

    return (
        <div className="w-80 h-full flex flex-col bg-slate-950 border-r border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
                    <div className="flex gap-2 relative">
                        <button onClick={onOpenFriends} title="Friends & Requests" className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                            <UserPlus size={18} />
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[10px] font-black text-white border-2 border-slate-950 shadow-sm leading-none">
                                    {pendingCount}
                                  </span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search conversations..." 
                        className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Active Research Streams */}
            {activeCalls.length > 0 && (
                <div className="px-6 mb-8 mt-2 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Research Streams</span>
                    </div>
                    <div className="space-y-3">
                        {activeCalls.map(call => (
                            <button 
                                key={call.session_id}
                                onClick={() => onSelect(call.group_id, 'group')}
                                className="w-full p-3.5 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-between group hover:bg-indigo-600 hover:border-indigo-600 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg">
                                        {call.avatar_url ? <img src={call.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 uppercase">{call.group_name.charAt(0)}</div>}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-black text-white uppercase truncate max-w-[100px] group-hover:text-white tracking-tighter">{call.group_name}</p>
                                        <p className="text-[9px] text-slate-500 group-hover:text-indigo-100 font-bold uppercase">{call.participant_count} Peers Active</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-indigo-600 group-hover:bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl shadow-indigo-600/20">
                                    <Video size={16} className="animate-pulse" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
                {/* Groups */}
                <div className="mb-6">
                    <div className="flex items-center justify-between px-3 mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Collab Groups</span>
                        <button onClick={onOpenCreateGroup} className="text-indigo-400 hover:text-indigo-300 transition-colors"><Plus size={14} /></button>
                    </div>
                    {filteredGroups.map(group => (
                        <button 
                            key={`group-${group.id}`}
                            onClick={() => onSelect(group.id, 'group')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                selectedId === group.id && selectedType === 'group' 
                                ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' 
                                : 'hover:bg-white/[0.03]'
                            }`}
                        >
                            <div className="relative">
                                {group?.avatar_url ? (
                                    <img src={`${BASE_URL}/${group.avatar_url}`} alt="" className="w-10 h-10 rounded-lg object-cover ring-2 ring-white/5 shadow-lg" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
                                        <Users size={20} />
                                    </div>
                                )}
                                {group.active_call_id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                        <Video size={8} className="text-white fill-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-sm font-bold truncate ${selectedId === group.id && selectedType === 'group' ? 'text-white' : 'text-slate-200'}`}>{group?.name || 'Academic Group'}</p>
                                    {group?.unread > 0 && (
                                        <span className="bg-indigo-400 text-white text-[10px] h-4 min-w-[1rem] flex items-center justify-center px-1 rounded-full font-bold">{group.unread}</span>
                                    )}
                                </div>
                                <p className={`text-[11px] truncate ${selectedId === group.id && selectedType === 'group' ? 'text-indigo-100' : 'text-slate-500'}`}>
                                    {group?.last_message || 'Collaboration hub'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Private Chats */}
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-3">Direct Messages</span>
                    {(filteredChats || []).map(chat => (
                        <button 
                            key={`user-${chat.id}`}
                            onClick={() => onSelect(chat.id, 'private')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                selectedId === chat.id && selectedType === 'private' 
                                ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' 
                                : 'hover:bg-white/[0.03]'
                            }`}
                        >
                            <div className="relative">
                                {chat?.profile_picture ? (
                                    <img src={getAvatar(chat.profile_picture)} alt={chat?.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${selectedId === chat.id && selectedType === 'private' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                                        {chat?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                {chat.active_call_id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                        <Video size={8} className="text-white fill-white" />
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-sm font-bold truncate ${selectedId === chat.id && selectedType === 'private' ? 'text-white' : 'text-slate-200'}`}>{chat?.name || 'Student'}</p>
                                    <span className={`text-[10px] ${selectedId === chat.id && selectedType === 'private' ? 'text-indigo-200' : 'text-slate-600'}`}>
                                        {(() => {
                                            if (!chat?.last_time) return '';
                                            const d = new Date(chat.last_time);
                                            return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        })()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[11px] truncate ${selectedId === chat.id && selectedType === 'private' ? 'text-indigo-100' : 'text-slate-500'}`}>
                                        {chat?.last_message || 'Active profile'}
                                    </p>
                                    {chat?.unread_count > 0 && (
                                        <span className="bg-indigo-500 text-white text-[10px] h-4 min-w-[1rem] flex items-center justify-center px-1 rounded-full font-bold">{chat.unread_count}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                    {filteredChats.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-xs text-slate-600 italic">No friends found.</p>
                            <button onClick={onOpenFriends} className="mt-3 text-xs text-indigo-400 font-bold hover:text-indigo-300">Invite someone</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
