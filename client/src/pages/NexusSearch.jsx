import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { 
  Play, 
  Search, 
  Cpu, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  Bookmark,
  CheckCircle2,
  Video,
  History,
  ArrowRight
} from 'lucide-react';

export default function NexusSearch() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [historyCount, setHistoryCount] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistoryCount = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notes/read.php?type=research`);
      if (res.data.status === 'success') setHistoryCount((res.data.data || []).length);
    } catch {}
  };

  useEffect(() => { fetchHistoryCount(); }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const res = await axios.get(`${API_BASE_URL}/search/videos.php?q=${encodeURIComponent(query)}`);
      if (res.data.status === 'success') {
        setResults(res.data.data);
      } else {
        showToast('Could not retrieve results. Try again.', 'error');
      }
    } catch (err) {
      showToast('Neural Link failed. Check your connection.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const saveToWorkspace = async (video) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/notes/create.php`, {
        title: `Research: ${video.title}`,
        content: `${video.url}||${video.thumbnail}||${video.description}||${query}`,
        project_id: null,
        type: 'research'
      });
      if (res.data.status === 'success') {
        setSavedIds(prev => new Set([...prev, video.id]));
        setHistoryCount(c => c + 1);
        showToast('Saved to Research History!');
      }
    } catch (err) {
      showToast('Failed to save research', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen bg-slate-950">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-2xl flex items-center gap-3 border shadow-2xl animate-in slide-in-from-right duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <CheckCircle2 size={18} />
          <span className="text-sm font-bold tracking-wide uppercase">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
            <Cpu size={12} className="animate-pulse" /> Neural Link Active
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">
            NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">RESEARCH</span>
          </h1>
          <p className="text-slate-500 text-base mt-2">AI-powered academic video synthesis.</p>
        </div>

        {/* Research History Button */}
        <button
          onClick={() => navigate('/research-history')}
          className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all group shadow-xl"
        >
          <div className="relative">
            <History size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
            {historyCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-600 rounded-full text-[8px] font-black text-white flex items-center justify-center shadow-lg">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Research History</p>
            <p className="text-[9px] text-slate-600">{historyCount} item{historyCount !== 1 ? 's' : ''} saved</p>
          </div>
          <ArrowRight size={14} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-16 relative group">
        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-all" />
        <input
          type="text"
          placeholder="Search academic topics (e.g., Quantum Mechanics, Cell Biology)..."
          className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500/50 rounded-3xl pl-16 pr-32 py-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-2xl transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
        >
          ANALYZE
        </button>
      </form>

      {/* Searching Animation */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-28 space-y-6">
          <div className="relative">
            <Loader2 size={72} className="text-indigo-500 animate-spin opacity-10" />
            <Cpu size={28} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
          </div>
          <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[11px] animate-pulse">Scanning Academic Grid...</p>
          <p className="text-slate-700 text-xs">Synthesizing results for "<span className="text-slate-500 italic">{query}</span>"</p>
        </div>
      )}

      {/* Results Grid */}
      {!isSearching && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {results.map((video, idx) => (
            <div key={video.id} className="group relative nexus-card overflow-hidden flex flex-col hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-2xl">
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => e.target.style.display = 'none'} />
                <a href={video.url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-4 ring-white/10 scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                    <Play size={20} fill="currentColor" />
                  </div>
                </a>
                {idx < 3 && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                    <Sparkles size={10} /> Relatable
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Video size={10} /> {video.channel}
                </p>
                <h3 className="text-sm font-black text-white tracking-tight leading-snug mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">{video.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mb-4 font-medium flex-1">{video.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                  <a href={video.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                    <ExternalLink size={12} /> Watch
                  </a>
                  <button
                    onClick={() => saveToWorkspace(video)}
                    disabled={savedIds.has(video.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      savedIds.has(video.id)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 text-white border border-white/5'
                    }`}
                  >
                    {savedIds.has(video.id) ? <><CheckCircle2 size={10} /> Saved</> : <><Bookmark size={10} /> Save</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && (
        <div className="text-center py-28 bg-slate-900/20 rounded-[50px] border border-dashed border-white/[0.04]">
          <Cpu size={44} className="mx-auto text-slate-800 mb-4" />
          <h3 className="text-base font-black text-slate-600 uppercase tracking-widest mb-2">Awaiting Neural Input</h3>
          <p className="text-slate-700 text-xs">Search any academic or scientific topic to begin research synthesis.</p>
        </div>
      )}

      <style>{`
        .nexus-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
