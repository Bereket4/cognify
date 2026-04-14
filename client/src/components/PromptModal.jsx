import { AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromptModal({ prompt, onClose }) {
    if (!prompt) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-center mb-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${prompt.type === 'danger' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                            {prompt.type === 'danger' ? <ShieldAlert size={28} /> : <AlertCircle size={28} />}
                        </div>
                    </div>
                    <h3 className="text-center text-lg font-black text-white uppercase tracking-widest mb-3">{prompt.title}</h3>
                    <p className="text-center text-[13px] text-slate-400 leading-relaxed mb-8">{prompt.message}</p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className={`flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${prompt.type === 'alert' ? 'w-full' : ''}`}
                        >
                            {prompt.type === 'alert' ? 'Dismiss Protocol' : 'Cancel'}
                        </button>
                        
                        {(prompt.type === 'danger' || prompt.type === 'confirm') && (
                            <button 
                                onClick={() => {
                                    if (prompt.onConfirm) prompt.onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    prompt.type === 'danger' 
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                                }`}
                            >
                                {prompt.confirmText || 'Proceed'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
