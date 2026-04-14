import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader2, Copy, RefreshCw, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiChat({ chatHistory, loading, onSendMessage, onRegenerate }) {
    const [chatInput, setChatInput] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, loading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || loading) return;
        onSendMessage(chatInput);
        setChatInput('');
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col relative w-full">
            <div className="flex-1 overflow-y-auto space-y-8 pr-4 mb-6 custom-scrollbar pb-10 mt-4">
                <AnimatePresence>
                    {chatHistory.map((msg, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-slate-900 border border-white/10 text-indigo-400 glass mt-1'}`}>
                                {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                            </div>

                            {/* Message Bubble container */}
                            <div className={`group flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-3xl px-6 py-5 text-[15px] leading-loose shadow-xl overflow-hidden ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-900/80 border border-white/5 text-slate-200 glass relative'}`}>
                                    {msg.role === 'model' ? (
                                        <div className="markdown-content">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    )}
                                </div>
                                
                                {/* Message Toolbar for Model */}
                                {msg.role === 'model' && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                        <button 
                                            onClick={() => handleCopy(msg.text, i)}
                                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                            title="Copy response"
                                        >
                                            {copiedIndex === i ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                        
                                        {/* Only show regenerate on the very last model message */}
                                        {i === chatHistory.length - 1 && (
                                            <button 
                                                onClick={onRegenerate}
                                                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                                title="Regenerate answer"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                        
                                        <div className="w-px h-3 bg-white/10 mx-1"></div>
                                        <button className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"><ThumbsUp size={14} /></button>
                                        <button className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"><ThumbsDown size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 text-indigo-400 glass flex items-center justify-center shrink-0 shadow-lg mt-1">
                            <Sparkles size={18} />
                        </div>
                        <div className="rounded-3xl px-6 py-5 bg-slate-900/80 border border-white/5 text-slate-200 glass flex items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-500" size={18} /> 
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Synthesizing response...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="sticky bottom-0 bg-gradient-to-t from-[#050b18] via-[#050b18] to-transparent pt-6 pb-2">
                <form onSubmit={handleSubmit} className="bg-slate-900/90 glass border border-white/10 rounded-3xl flex items-center p-2 mx-2 shadow-2xl relative">
                    <input 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Ask your AI tutor anything..."
                        className="flex-1 bg-transparent px-6 py-3 text-[15px] text-white focus:outline-none placeholder-slate-500"
                    />
                    <button 
                        disabled={loading || !chatInput.trim()} 
                        type="submit" 
                        className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:shadow-none mr-1"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <div className="text-center mt-3">
                    <span className="text-[10px] text-slate-600 font-medium">AI generated answers can contain inaccuracies. Verify critical information.</span>
                </div>
            </div>
        </div>
    );
}
