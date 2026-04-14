import { useState, useEffect } from 'react';
import { Search, X, Users, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../api/config';

export default function CreateGroupModal({ onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/friends/list.php`);
                if (res.data.status === 'success') setFriends(res.data.data || []);
            } catch (e) {}
        };
        fetchFriends();
    }, []);

    const toggleMember = (id) => {
        setSelectedMembers(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/groups/create.php`, {
                name,
                description,
                members: selectedMembers
            });
            if (res.data.status === 'success') {
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            }
        } catch (e) {
            alert("Error creating group");
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = (friends || []).filter(f => f?.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-[#0e172a] border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">New Study Group</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Establish your research circle</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Group Name</label>
                            <input 
                                type="text"
                                placeholder="Quantum Mechanics Hub..."
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mt-2"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Objectives</label>
                            <textarea 
                                placeholder="Explain group goals..."
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mt-2 h-24 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invite Members</label>
                            <span className="text-[10px] font-bold text-indigo-400">{selectedMembers.length} Selected</span>
                        </div>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Search friends..."
                                className="w-full bg-slate-900/80 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredFriends.map(friend => (
                                <button 
                                    key={friend.id}
                                    onClick={() => toggleMember(friend.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        selectedMembers.includes(friend.id) 
                                        ? 'bg-indigo-600/10 border-indigo-500/30' 
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 text-xs font-bold">
                                            {friend.name.charAt(0)}
                                        </div>
                                        <p className="text-sm font-bold text-slate-200">{friend.name}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        selectedMembers.includes(friend.id) 
                                        ? 'bg-indigo-500 border-indigo-500 text-white' 
                                        : 'border-white/10'
                                    }`}>
                                        {selectedMembers.includes(friend.id) && <Check size={12} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all">Cancel</button>
                    <button 
                        disabled={!name.trim() || loading}
                        onClick={handleCreate}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Initialize Group
                    </button>
                </div>
            </div>
        </div>
    );
}
