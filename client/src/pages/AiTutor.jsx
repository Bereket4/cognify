import { useState, useEffect } from 'react';
import { Settings, Brain, Layers, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../api/config';

// Import our new sub-components
import AiChat from '../components/ai-tutor/AiChat';
import AiFlashcards from '../components/ai-tutor/AiFlashcards';
import AiQuiz from '../components/ai-tutor/AiQuiz';

export default function AiTutor() {
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'flashcards', 'quiz'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Chat State
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', text: "Hello! I'm your AI Study Assistant. What would you like to learn today? You can ask me to explain concepts, generate structured study guides, or format data into tables!" }
    ]);

    // Flashcards State
    const [flashcardTopic, setFlashcardTopic] = useState('');
    const [flashcards, setFlashcards] = useState([]);
    const [flashcardCount, setFlashcardCount] = useState(10);

    // Quiz State
    const [quizTopic, setQuizTopic] = useState('');
    const [quiz, setQuiz] = useState([]);
    const [quizCount, setQuizCount] = useState(5);
    const [userAnswers, setUserAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

    const callGemini = async (prompt) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_BASE_URL}/ai.php`,
                { prompt },
                { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
            );
            if (res.data.status === 'success') {
                return res.data.reply;
            } else {
                throw new Error(res.data.message || "AI provider returned an error.");
            }
        } catch (err) {
            throw new Error(err.response?.data?.message || err.message || "Failed to connect to the AI Provider.");
        }
    };

    const handleSendMessage = async (userMsg) => {
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);
        setError('');

        try {
            const context = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
            const prompt = `You are a helpful academic AI tutor. Be concise but highly educational. 
IMPORTANT FORMATTING RULES:
1. Always use Markdown heavily (e.g. # H1, ## H2, ### H3).
2. For lists, use - or * bullet points.
3. If there is code, wrap it in markdown code blocks.
4. Bold important terms using **bold**.
5. Use tables where comparisons are needed.
History:\n${context}\nuser: ${userMsg}\nmodel:`;
            
            const reply = await callGemini(prompt);
            setChatHistory(prev => [...prev, { role: 'model', text: reply }]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        // Find the last user message
        const lastUserMsgIdx = [...chatHistory].reverse().findIndex(m => m.role === 'user');
        if (lastUserMsgIdx === -1) return;
        
        const realIdx = chatHistory.length - 1 - lastUserMsgIdx;
        const userMsg = chatHistory[realIdx].text;
        
        // Remove the old response that we're regenerating
        const newHistory = chatHistory.slice(0, realIdx);
        
        setChatHistory(newHistory);
        handleSendMessage(userMsg);
    };

    const generateFlashcards = async (e) => {
        if (e) e.preventDefault();
        if (!flashcardTopic.trim() || loading) return;
        
        setLoading(true);
        setError('');
        setFlashcards([]);

        try {
            const prompt = `Create ${flashcardCount} educational flashcards about "${flashcardTopic}". 
            Respond ONLY with a valid JSON array of objects. Do not use markdown blocks or formatting outside the JSON array.
            Format: [{"q": "Question here", "a": "Answer here"}]`;
            
            const reply = await callGemini(prompt);
            const cleaned = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleaned);
            if (Array.isArray(data)) setFlashcards(data);
            else throw new Error("Invalid format received");
        } catch (err) {
            setError("Failed to generate flashcards. Please try another topic.");
        } finally {
            setLoading(false);
        }
    };

    const generateQuiz = async (e) => {
        if (e) e.preventDefault();
        if (!quizTopic.trim() || loading) return;

        setLoading(true);
        setError('');
        setQuiz([]);
        setUserAnswers({});
        setQuizSubmitted(false);
        setCurrentQuizIndex(0);

        try {
            const prompt = `Create a ${quizCount}-question multiple choice quiz about "${quizTopic}". 
            Respond ONLY with a valid JSON array of objects. Do not use markdown blocks or formatting outside the JSON array.
            Format: [{"q": "Question text?", "options": ["First full option", "Second full option", "Third option", "Fourth option"], "answer": "Second full option"}]`;
            
            const reply = await callGemini(prompt);
            const cleaned = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleaned);
            if (Array.isArray(data)) setQuiz(data);
            else throw new Error("Invalid format received");
        } catch (err) {
            setError("Failed to generate quiz. Please try another topic.");
        } finally {
            setLoading(false);
        }
    };

    const navTabs = [
        { id: 'chat', label: 'AI Chat', icon: <MessageCircle size={15} /> },
        { id: 'flashcards', label: 'Flashcards', icon: <Layers size={15} /> },
        { id: 'quiz', label: 'Knowledge Check', icon: <CheckCircle2 size={15} /> }
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050b18] overflow-hidden">
            {/* Header */}
            <div className="h-[88px] border-b border-white/5 flex flex-col justify-end px-10 bg-slate-950/80 backdrop-blur-2xl z-10 relative shadow-xl">
                <div className="flex items-center justify-between pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Brain size={22} className="drop-shadow-md" />
                        </div>
                        <div>
                            <h2 className="text-[22px] font-black text-white tracking-tight">AI Intelligence Hub</h2>
                            <div className="flex flex-col">
                                <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Automated Learning Infrastructure</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Navigation Tabs inside header */}
                <div className="flex gap-8 relative px-2">
                    {navTabs.map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            className={`pb-4 text-[13px] font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 relative ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" 
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mx-8 mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold uppercase tracking-wide flex items-center gap-3">
                    <Settings size={18} /> {error}
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                {/* Content Area uses AnimatePresence for smooth tab switching */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="h-full overflow-y-auto px-8 custom-scrollbar pt-2"
                    >
                        {activeTab === 'chat' && (
                            <AiChat 
                                chatHistory={chatHistory} 
                                loading={loading} 
                                onSendMessage={handleSendMessage}
                                onRegenerate={handleRegenerate}
                            />
                        )}

                        {activeTab === 'flashcards' && (
                            <AiFlashcards 
                                flashcardTopic={flashcardTopic}
                                setFlashcardTopic={setFlashcardTopic}
                                flashcards={flashcards}
                                setFlashcards={setFlashcards}
                                flashcardCount={flashcardCount}
                                setFlashcardCount={setFlashcardCount}
                                loading={loading}
                                onGenerate={generateFlashcards}
                            />
                        )}

                        {activeTab === 'quiz' && (
                            <AiQuiz 
                                quizTopic={quizTopic}
                                setQuizTopic={setQuizTopic}
                                quiz={quiz}
                                setQuiz={setQuiz}
                                quizCount={quizCount}
                                setQuizCount={setQuizCount}
                                loading={loading}
                                onGenerate={generateQuiz}
                                userAnswers={userAnswers}
                                setUserAnswers={setUserAnswers}
                                quizSubmitted={quizSubmitted}
                                setQuizSubmitted={setQuizSubmitted}
                                currentQuizIndex={currentQuizIndex}
                                setCurrentQuizIndex={setCurrentQuizIndex}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
