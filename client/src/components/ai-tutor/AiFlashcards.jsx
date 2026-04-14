import { useState } from 'react';
import { BookOpen, Loader2, ChevronLeft, ChevronRight, Check, X, Shuffle, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiFlashcards({ flashcardTopic, setFlashcardTopic, flashcards, setFlashcards, flashcardCount, setFlashcardCount, loading, onGenerate }) {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState(new Set());

    const handleGenerate = (e) => {
        e.preventDefault();
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setKnownCards(new Set());
        onGenerate(e);
    };

    const shuffleCards = () => {
        setIsFlipped(false);
        setTimeout(() => {
            const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
            setFlashcards(shuffled);
            setCurrentCardIndex(0);
            setKnownCards(new Set());
        }, 300);
    };

    const markKnowledge = (isKnown) => {
        setKnownCards(prev => {
            const newSet = new Set(prev);
            if (isKnown) newSet.add(currentCardIndex);
            else newSet.delete(currentCardIndex);
            return newSet;
        });
        
        // Auto advance after marking
        if (currentCardIndex < flashcards.length - 1) {
            setTimeout(() => {
                setIsFlipped(false);
                setTimeout(() => setCurrentCardIndex(prev => prev + 1), 200);
            }, 300);
        }
    };

    const nextCard = () => {
        if (currentCardIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev + 1), 200);
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev - 1), 200);
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center h-full pb-10 w-full pt-4">
            <form onSubmit={handleGenerate} className="w-full max-w-lg mb-12 flex flex-col gap-4">
                <div className="relative group w-full">
                    <BookOpen size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors z-10" />
                    <input 
                        value={flashcardTopic}
                        onChange={e => setFlashcardTopic(e.target.value)}
                        placeholder="What do you want to memorize? (e.g. French Verbs)"
                        className="w-full bg-slate-900/80 glass border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-[15px] text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl relative z-0"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-900/60 glass rounded-2xl p-1.5 border border-white/5 shadow-inner flex-1 h-[52px]">
                        {[5, 10, 15, 20].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setFlashcardCount(num)}
                                className={`flex-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative ${flashcardCount === num ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                {flashcardCount === num && (
                                    <motion.div 
                                        layoutId="flashcardCountIndicator"
                                        className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-1.5"><Hash size={12} className={flashcardCount === num ? "text-indigo-200" : "opacity-30"} /> {num}</span>
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        disabled={loading || !flashcardTopic.trim()} 
                        type="submit" 
                        className="h-[52px] px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin text-white" size={18} /> : 'Generate'}
                    </button>
                </div>
            </form>

            <AnimatePresence mode="wait">
                {flashcards.length > 0 && !loading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-2xl px-4"
                    >
                        {/* Progress and Toolbar */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-xl border border-white/5">
                                    Card {currentCardIndex + 1} of {flashcards.length}
                                </span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                    {knownCards.size} Known
                                </span>
                            </div>
                            <button 
                                onClick={shuffleCards}
                                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl border border-white/5"
                            >
                                <Shuffle size={14} /> Shuffle
                            </button>
                        </div>

                        {/* Flashcard 3D Container */}
                        <div className="relative w-full aspect-[1.6/1] perspective-1000 mb-8 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                            <motion.div 
                                className="w-full h-full preserve-3d relative"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {/* Front UI */}
                                <div className="absolute inset-0 backface-hidden bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl flex flex-col items-center justify-center p-10 text-center glass overflow-hidden group-hover:border-white/20 transition-colors">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
                                    <span className="absolute top-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">Front / Question</span>
                                    <h3 className="text-3xl font-bold text-white leading-tight">{flashcards[currentCardIndex].q}</h3>
                                    <span className="absolute bottom-8 text-sm text-slate-500 font-medium flex items-center gap-2">
                                        Click anywhere to reveal <ChevronRight size={16} />
                                    </span>
                                </div>

                                {/* Back UI */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] shadow-2xl flex flex-col items-center justify-center p-10 text-center border border-white/10 overflow-hidden">
                                    <span className="absolute top-8 text-[11px] font-black text-white/60 uppercase tracking-widest">Back / Answer</span>
                                    <p className="text-2xl font-bold text-white leading-relaxed">{flashcards[currentCardIndex].a}</p>
                                </div>
                            </motion.div>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={prevCard}
                                disabled={currentCardIndex === 0}
                                className="p-4 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            
                            <div className="flex-1 flex gap-4">
                                <button
                                    onClick={() => markKnowledge(false)}
                                    className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl flex items-center justify-center gap-2 transition-all text-rose-400 font-bold uppercase text-xs tracking-widest"
                                >
                                    <X size={18} /> Need Practice
                                </button>
                                <button
                                    onClick={() => markKnowledge(true)}
                                    className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all font-bold uppercase text-xs tracking-widest rounded-2xl border ${knownCards.has(currentCardIndex) ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-400 text-white' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'}`}
                                >
                                    <Check size={18} /> Got It
                                </button>
                            </div>

                            <button 
                                onClick={nextCard}
                                disabled={currentCardIndex === flashcards.length - 1}
                                className="p-4 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
