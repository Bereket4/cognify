import { Trophy, CheckCircle2, Settings, Loader2, Sparkles, Target, Award, RefreshCw, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiQuiz({ 
    quizTopic, 
    setQuizTopic, 
    quiz, 
    setQuiz, 
    quizCount,
    setQuizCount,
    loading, 
    onGenerate,
    userAnswers,
    setUserAnswers,
    quizSubmitted,
    setQuizSubmitted,
    currentQuizIndex,
    setCurrentQuizIndex 
}) {

    const handleAnswerSelect = (opt) => {
        if (quizSubmitted) return;
        
        setUserAnswers(prev => ({ ...prev, [currentQuizIndex]: opt }));
        
        if (currentQuizIndex < quiz.length - 1) {
            setTimeout(() => setCurrentQuizIndex(prev => prev + 1), 600);
        } else {
            setTimeout(() => setQuizSubmitted(true), 800);
        }
    };

    const startNew = () => {
        setQuiz([]);
        setQuizSubmitted(false);
        setUserAnswers({});
        setCurrentQuizIndex(0);
        setQuizTopic('');
    };

    const calculateScore = () => {
        if (quiz.length === 0) return 0;
        let correct = 0;
        quiz.forEach((q, idx) => {
            if (userAnswers[idx] === q.answer) correct++;
        });
        return Math.round((correct / quiz.length) * 100);
    };

    return (
        <div className="max-w-4xl mx-auto h-full w-full pt-4 pb-10">
            {!quiz.length && !loading && (
                <div className="flex flex-col items-center justify-center h-4/5 text-center px-4">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.15)]"
                    >
                        <Target size={40} />
                    </motion.div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">AI Knowledge Checking</h2>
                    <p className="text-slate-400 max-w-md mb-10 leading-relaxed">Generate targeted multiple-choice quizzes on any topic instantly to test your retention and uncover knowledge gaps.</p>
                    
                    <form onSubmit={onGenerate} className="w-full max-w-lg relative flex flex-col gap-4">
                        <div className="relative group w-full">
                            <Sparkles size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors z-10" />
                            <input 
                                value={quizTopic}
                                onChange={e => setQuizTopic(e.target.value)}
                                placeholder="E.g., The Cold War..."
                                className="w-full bg-slate-900/80 glass border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[15px] text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-xl relative z-0"
                            />
                        </div>
                        
                        <div className="flex bg-slate-900/60 glass rounded-2xl p-1.5 border border-white/5 shadow-inner w-full h-[52px]">
                            {[3, 5, 10, 15].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setQuizCount(num)}
                                    className={`flex-1 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative ${quizCount === num ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                >
                                    {quizCount === num && (
                                        <motion.div 
                                            layoutId="quizCountIndicator"
                                            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center justify-center gap-1.5"><Hash size={12} className={quizCount === num ? "text-indigo-200" : "opacity-30"} /> {num} Qs</span>
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={loading || !quizTopic.trim()} 
                            type="submit" 
                            className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-2"
                        >
                            Generate Assessment
                        </button>
                    </form>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center h-4/5 gap-6">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white tracking-wide">Designing Assessment</h3>
                        <p className="text-sm text-slate-400 mt-2">Analyzing topic and generating targeted questions...</p>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {quiz.length > 0 && !quizSubmitted && !loading && (
                    <motion.div 
                        key={currentQuizIndex}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-full max-w-2xl mx-auto mt-8"
                    >
                        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-10 glass relative overflow-hidden shadow-2xl">
                            {/* Animated Progress bar */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                                    initial={{ width: `${((currentQuizIndex) / quiz.length) * 100}%` }}
                                    animate={{ width: `${((currentQuizIndex + 1) / quiz.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            
                            <div className="flex justify-between items-center mb-10">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-xl">
                                    Question {currentQuizIndex + 1} of {quiz.length}
                                </span>
                                <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2">
                                    <Award size={14} /> Live
                                </span>
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-10 leading-tight">{quiz[currentQuizIndex].q}</h3>

                            <div className="grid grid-cols-1 gap-4">
                                {quiz[currentQuizIndex].options.map((opt, oIdx) => {
                                    const isSelected = userAnswers[currentQuizIndex] === opt;
                                    return (
                                        <button 
                                            key={oIdx}
                                            onClick={() => handleAnswerSelect(opt)}
                                            className={`p-6 rounded-2xl text-left transition-all duration-300 font-medium flex items-center justify-between group overflow-hidden relative ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 transform scale-[1.02]' : 'bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/50 text-slate-300 hover:scale-[1.01]'}`}
                                        >
                                            <span className="relative z-10 text-[16px] pr-8">{opt}</span>
                                            {isSelected && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-6 z-10">
                                                    <CheckCircle2 size={24} className="text-white" />
                                                </motion.div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {quizSubmitted && !loading && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-2xl mx-auto mt-8"
                    >
                        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-12 glass text-center relative overflow-hidden shadow-2xl">
                            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${calculateScore() >= 80 ? 'from-emerald-400 to-teal-400' : calculateScore() >= 60 ? 'from-yellow-400 to-amber-500' : 'from-rose-500 to-orange-500'}`} />
                            
                            <motion.div 
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 border-4 shadow-2xl ${calculateScore() >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : calculateScore() >= 60 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.2)]' : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.2)]'}`}
                            >
                                <Trophy size={48} />
                            </motion.div>
                            
                            <h2 className="text-5xl font-black text-white mb-3 tracking-tight">
                                {calculateScore()}% Score
                            </h2>
                            <p className="text-slate-400 mb-12 text-[15px]">
                                {calculateScore() >= 80 ? 'Outstanding! You have a strong grasp of this topic.' : calculateScore() >= 60 ? 'Good job, but there is room for improvement.' : 'Keep studying! Review the answers below to learn more.'}
                            </p>

                            <div className="space-y-4 text-left border-t border-white/10 pt-8 mt-8">
                                {quiz.map((qItem, idx) => {
                                    const isCorrect = userAnswers[idx] === qItem.answer;
                                    return (
                                        <div key={idx} className={`p-6 rounded-2xl transition-all duration-300 ${isCorrect ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/20'}`}>
                                            <div className="flex gap-4 mb-4">
                                                {isCorrect ? <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" /> : <Settings size={24} className="text-rose-500 shrink-0 mt-0.5" />}
                                                <p className="text-[16px] font-bold text-white leading-relaxed">{qItem.q}</p>
                                            </div>
                                            <div className="pl-10 flex flex-col gap-2 text-[15px]">
                                                <span className={isCorrect ? 'text-emerald-400/90 font-medium' : 'text-slate-500 font-medium line-through decoration-rose-500/50'}>You answered: {userAnswers[idx] || "Skipped"}</span>
                                                {!isCorrect && <span className="text-emerald-400 font-semibold flex items-center gap-2"><CheckCircle2 size={16}/> Correct answer: {qItem.answer}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <button onClick={startNew} className="mt-12 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-black text-white tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-3 mx-auto">
                                <RefreshCw size={16} /> Start New Assessment
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
