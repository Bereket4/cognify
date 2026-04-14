import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import ChatSidebar from '../components/ChatSidebar';
import ConversationView from '../components/ConversationView';
import FriendsPanel from '../components/FriendsPanel';
import CreateGroupModal from '../components/CreateGroupModal';
import { MessageSquare, Layout } from 'lucide-react';

export default function Chat() {
    const { user } = useContext(AuthContext);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedType, setSelectedType] = useState('private');
    const [showFriends, setShowFriends] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [componentError, setComponentError] = useState(null);


    const handleSelect = (id, type) => {
        setComponentError(null);
        setSelectedId(id);
        setSelectedType(type);
    };

    if (componentError) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#020617] text-white p-12 text-center h-screen">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500">
                <Layout size={32} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-2">View Reconstruction Required</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-8">{componentError}</p>
            <button 
                onClick={() => { setComponentError(null); setSelectedId(null); }} 
                className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all font-inter"
            >
                Reset Dashboard
            </button>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#020617] overflow-hidden font-inter font-secondary">
            <ChatSidebar 
                key={`sidebar-${refreshTrigger}`}
                selectedId={selectedId} 
                selectedType={selectedType}
                onSelect={handleSelect} 
                onOpenFriends={() => setShowFriends(true)}
                onOpenCreateGroup={() => setShowCreateGroup(true)}
            />

            <div className="flex-1 flex flex-col relative text-slate-200">
                {selectedId ? (
                    <ConversationView 
                        key={`conv-${selectedType}-${selectedId}`}
                        user={user}
                        partnerId={selectedId}
                        type={selectedType}
                        onError={(msg) => setComponentError(msg)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#050b18]">
                        <div className="animate-in fade-in duration-1000">
                            <div className="w-24 h-24 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                                <MessageSquare className="text-indigo-500" size={48} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Academic Nexus</h2>
                            <p className="text-slate-500 max-w-sm leading-relaxed mb-10 mx-auto">
                                Select a research group or peer to initiate high-fidelity collaboration.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setShowFriends(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                                    Global Search
                                </button>
                                <button onClick={() => setShowCreateGroup(true)} className="px-8 py-4 bg-white/5 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all border border-white/5">
                                    Protocol New Group
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showFriends && (
                <FriendsPanel onClose={() => setShowFriends(false)} />
            )}

            {showCreateGroup && (
                <CreateGroupModal 
                    onClose={() => setShowCreateGroup(false)} 
                    onSuccess={() => setRefreshTrigger(p => p + 1)}
                />
            )}
        </div>
    );
}
