import { useState, useEffect, useRef } from 'react';
import { Send, MoreHorizontal, Smile, Paperclip, Check, CheckCheck, Loader2, X, Plus, Settings, Trash2, Eraser, LogOut } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import GroupSettingsModal from './GroupSettingsModal';
import PromptModal from './PromptModal';

export default function ConversationView({ user, partnerId, type }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const scrollRef = useRef(null);
    const [lastId, setLastId] = useState(0);
    const lastIdRef = useRef(0);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [stagedFile, setStagedFile] = useState(null);
    const [stagedPreview, setStagedPreview] = useState(null);
    const [stagedCaption, setStagedCaption] = useState('');
    const [showReactions, setShowReactions] = useState(null); // msgId
    const [isUploading, setIsUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [prompt, setPrompt] = useState(null);
    const fileInputRef = useRef(null);

    const fetchHistory = async (full = false) => {
        try {
            const currentLastId = full ? 0 : lastIdRef.current;
            const url = type === 'private' 
                ? `${API_BASE_URL}/chat/get_messages.php?other_id=${partnerId}&last_id=${currentLastId}`
                : `${API_BASE_URL}/chat/groups/messages.php?group_id=${partnerId}&last_id=${currentLastId}`;
            
            const res = await axios.get(url);
            if (res.data?.status === 'success') {
                const newMsgs = res.data?.messages || [];
                if (newMsgs?.length > 0) {
                    setMessages(prev => full ? newMsgs : [...prev, ...newMsgs]);
                    const latestId = newMsgs[newMsgs.length - 1].id;
                    lastIdRef.current = latestId;
                    setLastId(latestId);
                }
            }
        } catch (e) { console.error("Error fetching history"); }
    };

    const fetchPartner = async () => {
        try {
            const url = type === 'private'
                ? `${API_BASE_URL}/users/read_single.php?id=${partnerId}`
                : `${API_BASE_URL}/chat/groups/read.php?id=${partnerId}`;
            const res = await axios.get(url);
            if (res.data?.status === 'success') setPartner(res.data?.data);
        } catch (e) {}
    };

    useEffect(() => {
        setMessages([]);
        setPartner(null);
        lastIdRef.current = 0;
        setLastId(0);
        setLoading(true);
        fetchPartner();
        fetchHistory(true).then(() => setLoading(false));
        
        const interval = setInterval(() => {
            fetchHistory();
        }, 2000);
        return () => clearInterval(interval);
    }, [partnerId, type]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setStagedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setStagedPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setStagedPreview('file');
        }
    };

    const confirmFileSend = async () => {
        if (!stagedFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', stagedFile);
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/upload.php`, formData);
            if (res.data.status === 'success') {
                await handleSend(null, {
                    file_url: res.data.file_url,
                    file_type: res.data.file_type,
                    caption: stagedCaption
                });
                setStagedFile(null);
                setStagedPreview(null);
                setStagedCaption('');
            } else {
                setPrompt({ type: 'alert', title: 'Error', message: res.data.message || 'Media node disconnected.'});
            }
        } catch (e) { setPrompt({ type: 'alert', title: 'Error', message: 'Media node disconnected.'}); }
        finally { setIsUploading(false); }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editValue.trim() || !editingMessage) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/edit.php`, {
                message_id: editingMessage.id,
                message: editValue,
                type
            });
            if (res.data.status === 'success') {
                setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, message: editValue, is_edited: 1 } : m));
                setEditingMessage(null);
            }
        } catch (e) { setPrompt({ type: 'alert', title: 'Error', message: 'Modification failed.'}); }
    };

    const handleDelete = (msgId) => {
        setPrompt({
            type: 'danger',
            title: 'Delete Message',
            message: 'Permanent Purge: Remove this message from academic history?',
            confirmText: 'Purge',
            onConfirm: async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/chat/delete.php`, {
                        message_id: msgId,
                        type
                    });
                    if (res.data.status === 'success') {
                        setMessages(prev => prev.filter(m => m.id !== msgId));
                    }
                } catch (e) { setPrompt({ type: 'alert', title: 'Error', message: 'Purge failed.'}); }
            }
        });
    };

    const toggleReaction = async (msgId, emoji) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/chat/react.php`, {
                message_id: msgId,
                emoji,
                type
            });
            if (res.data.status === 'success') fetchHistory();
        } catch (e) {}
    };

    const handleClearHistory = () => {
        setPrompt({
            type: 'danger',
            title: 'Clear History',
            message: 'Warning: This will permanently erase all message history between you and this user for BOTH of you. Proceed?',
            confirmText: 'Obliterate',
            onConfirm: async () => {
                try {
                    const res = await axios.post(`${API_BASE_URL}/chat/clear_history.php`, {
                        partner_id: partnerId
                    });
                    if (res.data.status === 'success') {
                        setMessages([]);
                        setShowMenu(false);
                    }
                } catch (e) { setPrompt({ type: 'alert', title: 'Error', message: 'Action failed.'}); }
            }
        });
    };

    const handleDeleteChat = () => {
        setPrompt({
            type: 'danger',
            title: 'Delete Chat',
            message: 'CRITICAL WARNING: This will permanently delete your message history AND remove this user from your connections. Proceed?',
            confirmText: 'Purge Connection',
            onConfirm: async () => {
                try {
                    await axios.post(`${API_BASE_URL}/chat/clear_history.php`, {
                        partner_id: partnerId
                    });
                    const res = await axios.post(`${API_BASE_URL}/friends/remove.php`, {
                        friend_id: partnerId
                    });
                    if (res.data.status === 'success') {
                        window.location.reload();
                    } else {
                        setPrompt({ type: 'alert', title: 'Error', message: res.data.message || 'Action failed.'});
                    }
                } catch (e) { setPrompt({ type: 'alert', title: 'Error', message: 'Action failed.'}); }
            }
        });
    };

    const handleSend = async (e, attachment = null) => {
        if (e) e.preventDefault();
        const msgText = attachment?.caption !== undefined ? attachment.caption : newMessage;
        if (!msgText.trim() && !attachment) return;

        try {
            const url = type === 'private'
                ? `${API_BASE_URL}/chat/send_message.php`
                : `${API_BASE_URL}/chat/groups/send_message.php`;
            
            const payload = {
                [type === 'private' ? 'receiver_id' : 'group_id']: partnerId,
                message: msgText,
                reply_to_id: replyTo?.id,
                file_url: attachment?.file_url,
                file_type: attachment?.file_type
            };
            
            if (!attachment) setNewMessage('');
            setReplyTo(null);
            const res = await axios.post(url, payload);
            if (res.data.status === 'success') {
                fetchHistory();
            }
        } catch (e) {}
    };

    if (loading && !messages.length) return (
        <div className="flex-1 flex items-center justify-center bg-[#050b18]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050b18]">
            {/* Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-xl">
                <div 
                    className={`flex items-center gap-4 ${type === 'group' ? 'cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-2xl transition-all' : ''}`}
                    onClick={() => {
                        if (type === 'group') setShowGroupSettings(true);
                    }}
                >
                    <div className="relative">
                        {partner?.profile_picture ? (
                            <img src={`${BASE_URL}/${partner.profile_picture}`} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white uppercase">{partner?.name?.charAt(0)}</div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{partner?.name}</h3>
                            {type === 'group' && partner && (parseInt(partner.created_by) === parseInt(user?.id) || user?.role === 'admin') && (
                                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded tracking-widest border border-indigo-500/20">Creator</span>
                            )}
                        </div>
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    {type === 'group' && partner && (parseInt(partner.created_by) === parseInt(user?.id) || user?.role === 'admin') && (
                        <button 
                            onClick={() => setShowGroupSettings(true)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-all shadow-lg"
                            title="Group Settings"
                        >
                            <Settings size={18} />
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if(type === 'group') setShowGroupSettings(true);
                            else setShowMenu(!showMenu);
                        }} 
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all focus:outline-none"
                    >
                        <MoreHorizontal size={18} />
                    </button>

                    {showMenu && type === 'private' && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                            <div className="absolute top-14 right-0 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <button 
                                    onClick={handleClearHistory}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-orange-400 hover:bg-white/5 transition-all"
                                >
                                    <Eraser size={14} /> Clear History
                                </button>
                                <button 
                                    onClick={handleDeleteChat}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-white/5 hover:bg-red-500/10 transition-all"
                                >
                                    <Trash2 size={14} /> Delete Chat & Unfriend
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {(messages || []).map((msg, i) => {
                    const isMe = msg?.sender_id && user?.id && String(msg.sender_id) === String(user.id);
                    
                    let reactions = {};
                    try {
                        if (msg?.reactions && msg.reactions.trim() !== '') {
                            reactions = JSON.parse(msg.reactions);
                            if (typeof reactions !== 'object' || reactions === null) reactions = {};
                        }
                    } catch (e) {
                        console.error("Reaction parse error", e);
                        reactions = {};
                    }

                    return (
                        <div key={msg?.id || i} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-300`}>
                            {/* Sender Avatar in Groups */}
                            {type === 'group' && !isMe && (
                                <div className="flex-shrink-0 mb-6">
                                    {msg?.sender_avatar ? (
                                        <img src={`${BASE_URL}/${msg.sender_avatar}`} alt="" className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/5" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-white/5 uppercase">
                                            {msg?.sender_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                                {/* Sender Name in Groups */}
                                {type === 'group' && !isMe && (
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{msg?.sender_name}</span>
                                )}

                                <div className="relative">
                                    <div className={`px-5 py-3.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-lg ${
                                        isMe 
                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                        : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'
                                    }`}>
                                        {/* Reply Quote Content */}
                                        {msg?.reply_to_id && (
                                            <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-indigo-400/50 text-[11px] opacity-80 backdrop-blur-sm">
                                                <p className="font-bold text-indigo-300 mb-0.5 uppercase tracking-tighter">Reference</p>
                                                <p className="italic truncate">
                                                    {(() => {
                                                        const replied = (messages || []).find(m => String(m.id) === String(msg.reply_to_id));
                                                        return replied ? replied.message : 'Original message context unavailable';
                                                    })()}
                                                </p>
                                            </div>
                                        )}

                                        {/* File Attachment */}
                                        {msg?.file_url && (
                                            <div className="mb-3">
                                                {['jpg', 'jpeg', 'png', 'gif'].includes(msg.file_type) ? (
                                                    <img src={`${BASE_URL}/${msg.file_url}`} alt="Attachment" className="max-w-full rounded-lg border border-white/10" />
                                                ) : (
                                                    <a href={`${BASE_URL}/${msg.file_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                                                        <Paperclip size={14} className="text-indigo-400" />
                                                        <span className="text-xs truncate">{msg.file_url.split('/').pop()}</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Inline Editing vs Normal Message */}
                                        {editingMessage?.id === msg.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <textarea 
                                                    autoFocus
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) handleEdit(e);
                                                        if (e.key === 'Escape') setEditingMessage(null);
                                                    }}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setEditingMessage(null)} className="text-[10px] text-slate-400 font-bold uppercase hover:text-white transition-all">Cancel</button>
                                                    <button type="button" onClick={handleEdit} className="text-[10px] text-indigo-400 font-bold uppercase hover:text-indigo-300 transition-all">Save Protocols</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {msg?.message}
                                                {msg?.is_edited === 1 && (
                                                    <span className="ml-2 text-[9px] text-slate-500 font-bold italic opacity-60 uppercase tracking-tighter">Edited</span>
                                                )}
                                            </>
                                        )}

                                        {/* Interaction Triggers (Hover) */}
                                        <div className={`absolute -top-4 ${isMe ? '-left-20' : '-right-16'} hidden group-hover:flex items-center gap-1 bg-slate-800 border border-white/10 p-1 rounded-lg shadow-xl z-20`}>
                                            <button onClick={() => setReplyTo(msg)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Reply"><MoreHorizontal size={14} /></button>
                                            <button onClick={() => toggleReaction(msg.id, '🎓')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">🎓</button>
                                            <button onClick={() => toggleReaction(msg.id, '🔥')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">🔥</button>
                                            {isMe && (
                                                <>
                                                    <button onClick={() => { setEditingMessage(msg); setEditValue(msg.message); }} className="p-1.5 hover:bg-white/10 rounded text-indigo-400 hover:text-indigo-300" title="Edit"><Plus size={14} /></button>
                                                    <button onClick={() => handleDelete(msg.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300" title="Delete"><X size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions Overlay (with user tracking logic) */}
                                    {Object.keys(reactions).length > 0 && (
                                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {Object.entries(reactions).map(([emoji, userIds]) => {
                                                const hasReacted = Array.isArray(userIds) && userIds.includes(user?.id);
                                                const count = Array.isArray(userIds) ? userIds.length : (typeof userIds === 'number' ? userIds : 0);
                                                return (
                                                    <button 
                                                        key={emoji} 
                                                        onClick={() => toggleReaction(msg.id, emoji)}
                                                        className={`border rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1.5 transition-all ${
                                                            hasReacted 
                                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                                                            : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="font-bold">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2 px-1">
                                    <span className="text-[10px] text-slate-600 font-bold">
                                        {(() => {
                                            try {
                                                const d = new Date(msg?.created_at);
                                                return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            } catch(e) { return ''; }
                                        })()}
                                    </span>
                                    {isMe && (
                                        msg?.is_read === 1 || msg?.is_read === true
                                        ? <CheckCheck size={12} className="text-indigo-400" />
                                        : <Check size={12} className="text-slate-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Input */}
            <div className="p-6 bg-slate-950/50 backdrop-blur-xl border-t border-white/5">
                {/* Media Staging Area */}
                {stagedFile && (
                    <div className="mb-4 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex gap-4">
                            {stagedPreview === 'file' ? (
                                <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5 text-slate-500"><Paperclip size={24} /></div>
                            ) : (
                                <img src={stagedPreview} className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow-lg" alt="" />
                            )}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{stagedFile.name}</p>
                                    <button onClick={() => { setStagedFile(null); setStagedPreview(null); }} className="text-slate-500 hover:text-white"><X size={16} /></button>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Add optional caption context..."
                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                    value={stagedCaption}
                                    onChange={(e) => setStagedCaption(e.target.value)}
                                />
                                <button 
                                    onClick={confirmFileSend}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Initiate Transmission
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {replyTo && !stagedFile && (
                    <div className="mb-3 p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-indigo-500 rounded-full" />
                            <div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Replying to {replyTo.sender_name || 'Academic Message'}</p>
                                <p className="text-xs text-slate-400 truncate max-w-md">{replyTo.message}</p>
                            </div>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/5 rounded-lg text-slate-500"><X size={14} /></button>
                    </div>
                )}

                <form onSubmit={handleSend} className={`flex items-center gap-4 bg-slate-900/80 border border-white/5 rounded-2xl p-2 transition-all ${stagedFile ? 'opacity-20 pointer-events-none grayscale' : 'focus-within:ring-2 focus-within:ring-indigo-500/20'}`}>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2.5 text-slate-500 hover:text-white transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <button type="button" className="p-2.5 text-slate-500 hover:text-white transition-colors"><Smile size={20} /></button>
                    <input 
                        type="text" 
                        placeholder="Type high-fidelity response..."
                        className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none py-2 placeholder-slate-600"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:grayscale"><Send size={20} /></button>
                </form>
            </div>
            {showGroupSettings && (
                <GroupSettingsModal 
                    group={partner} 
                    user={user} 
                    onClose={() => setShowGroupSettings(false)} 
                    onRefresh={() => { fetchPartner(); fetchHistory(true); }}
                />
            )}
            
            {prompt && (
                <PromptModal prompt={prompt} onClose={() => setPrompt(null)} />
            )}
        </div>
    );
}
