import { useState, useEffect, useRef } from 'react';
import { X, UserMinus, UserPlus, Shield, Info, Trash2, Camera, Loader2, LogOut } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import PromptModal from './PromptModal';

export default function GroupSettingsModal({ group, user, onClose, onRefresh }) {
    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');
    const [avatarUrl, setAvatarUrl] = useState(group?.avatar_url || '');
    const [members, setMembers] = useState([]);
    const [searchName, setSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('members'); // 'info', 'members'
    const [isUploading, setIsUploading] = useState(false);
    const [prompt, setPrompt] = useState(null);
    const fileInputRef = useRef(null);

    const isOwner = parseInt(group?.created_by) === parseInt(user?.id);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/groups/members.php?group_id=${group.id}`);
            if (res.data.status === 'success') setMembers(res.data.members || []);
        } catch (e) {}
    };

    useEffect(() => {
        fetchMembers();
    }, [group.id]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/groups/manage.php`, {
                group_id: group.id,
                action: 'UPDATE_PROFILE',
                name,
                description,
                avatar_url: avatarUrl
            });
            if (res.data.status === 'success') onRefresh();
        } catch (e) { 
            setPrompt({ type: 'alert', title: 'Protocol Failure', message: 'Protocol update failed due to a server disruption.' });
        }
        finally { setLoading(false); }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/upload.php`, formData);
            if (res.data.status === 'success' && res.data.file_url) {
                setAvatarUrl(res.data.file_url);
            }
        } catch (err) { 
            setPrompt({ type: 'alert', title: 'Upload Failed', message: 'Image upload failed. Ensure the file is not corrupted.' });
        }
        finally { setIsUploading(false); }
    };

    const handleSearch = async (q) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/groups/search_students.php?group_id=${group.id}&q=${q}`);
            if (res.data.status === 'success') setSearchResults(res.data.users);
        } catch (e) {}
    };

    const handleMemberAction = async (targetId, action) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/groups/manage.php`, {
                group_id: group.id,
                action,
                target_user_id: targetId
            });
            if (res.data.status === 'success') {
                fetchMembers();
                if (action === 'ADD_MEMBER') {
                    setSearchResults([]);
                    setSearchName('');
                }
            } else {
                setPrompt({ type: 'alert', title: 'Error', message: res.data.message || 'Action restricted.' });
            }
        } catch (e) { 
            setPrompt({ type: 'alert', title: 'Verification Failed', message: `Could not execute ${action}.` });
        }
    };

    const handleDeleteGroup = () => {
        setPrompt({
            type: 'danger',
            title: 'Disband Group',
            message: 'CRITICAL: Disband this entire academic group? This cannot be undone and all data will be lost.',
            confirmText: 'Eradicate Protocol',
            onConfirm: async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/chat/groups/manage.php`, {
                        group_id: group.id,
                        action: 'DELETE_GROUP'
                    });
                    if (res.data.status === 'success') window.location.reload();
                    else setPrompt({ type: 'alert', title: 'Error', message: res.data.message });
                } catch (e) { setPrompt({ type: 'alert', title: 'System Block', message: 'Dissolution sequence failed.' }); }
            }
        });
    };

    const handleLeaveGroup = () => {
        setPrompt({
            type: 'danger',
            title: 'Leave Group',
            message: 'Are you sure you want to leave this group? You will permanently lose access to all messages.',
            confirmText: 'Leave',
            onConfirm: async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/chat/groups/leave.php`, {
                        group_id: group.id
                    });
                    if (res.data.status === 'success') {
                        window.location.reload();
                    } else {
                        setPrompt({ type: 'alert', title: 'Exit Denied', message: res.data.message || "Failed to leave group." });
                    }
                } catch (e) { setPrompt({ type: 'alert', title: 'Error', message: 'Action failed due to network disruption.' }); }
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Group Governance</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isOwner ? 'Creator Privileges Active' : 'Member View'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}>General Info</button>
                    <button onClick={() => setActiveTab('members')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}>Member List ({members.length})</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'info' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group cursor-pointer" onClick={() => { if(isOwner) fileInputRef.current?.click(); }}>
                                    <div className={`w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center border-2 border-white/5 overflow-hidden ${isUploading ? 'opacity-50' : ''}`}>
                                        {isUploading ? (
                                            <Loader2 className="animate-spin text-white" size={32} />
                                        ) : avatarUrl ? (
                                            <img src={`${BASE_URL}/${avatarUrl}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={32} className="text-slate-600" />
                                        )}
                                    </div>
                                    {isOwner && !isUploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-3xl">
                                            <p className="text-[10px] font-bold text-white uppercase">Change</p>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                    />
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Group Designation</label>
                                    <input 
                                        disabled={!isOwner}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Research Field / Bio</label>
                                    <textarea 
                                        disabled={!isOwner}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] resize-none transition-all disabled:opacity-50"
                                    />
                                </div>
                                {isOwner && (
                                    <div className="pt-4 flex gap-4">
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                                        >
                                            {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Commit Profile Changes'}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleDeleteGroup}
                                            className="px-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                            title="Disband Group"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}
                                {!isOwner && (
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="button"
                                            onClick={handleLeaveGroup}
                                            className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={16} /> Leave Group
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {isOwner && (
                                <div className="mb-8 space-y-4">
                                    <div className="relative">
                                        <input 
                                            placeholder="Discover new students by name..."
                                            className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-5 py-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            value={searchName}
                                            onChange={(e) => {
                                                setSearchName(e.target.value);
                                                if (e.target.value.length > 2) handleSearch(e.target.value);
                                                else setSearchResults([]);
                                            }}
                                        />
                                        <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-2 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {searchResults.map(res => (
                                                <div key={res.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                                                            {res.name.charAt(0)}
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-200">{res.name}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleMemberAction(res.id, 'ADD_MEMBER')}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-500 transition-all"
                                                    >
                                                        Invite
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.04]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 text-xs font-bold uppercase">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{member.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{member.student_role || 'Academic Peer'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {member.group_role === 'owner' ? (
                                                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-[9px] font-black uppercase rounded-full tracking-tighter">Creator</span>
                                            ) : (
                                                isOwner && (
                                                    <button 
                                                        onClick={() => handleMemberAction(member.id, 'REMOVE_MEMBER')}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <UserMinus size={18} />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {prompt && (
                <PromptModal prompt={prompt} onClose={() => setPrompt(null)} />
            )}
        </div>
    );
}
