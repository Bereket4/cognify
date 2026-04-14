import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import {
  History,
  ArrowLeft,
  Trash2,
  ExternalLink,
  Play,
  Clock,
  Cpu,
  Search,
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function ResearchHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/notes/read.php?type=research`);
      if (res.data.status === 'success') setHistory(res.data.data || []);
    } catch (err) {
      showToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const deleteItem = async (id) => {
    setDeletingId(id);
    try {
      await axios.delete(`${API_BASE_URL}/notes/delete.php?id=${id}`);
      setHistory(prev => prev.filter(h => h.id !== id));
      showToast('Research item deleted.');
    } catch (err) {
      showToast('Failed to delete item.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const parseContent = (content = '') => {
    const parts = content.split('||');
    return {
      url: parts[0] || '#',
      thumbnail: parts[1] || '',
      description: parts[2] || '',
      topic: parts[3] || ''
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen bg-slate-950">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 p-4 rounded-2xl flex items-center gap-3 border shadow-2xl animate-in slide-in-from-right duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <CheckCircle2 size={16} />
          <span className="text-sm font-bold uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/search')}
            className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              <Cpu size={12} className="animate-pulse" /> Neural Archive
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">
              RESEARCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">HISTORY</span>
            </h1>
            <p className="text-slate-500 text-base mt-2">All saved academic research resources. Click thumbnails to watch.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{history.length} items saved</span>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search size={14} /> New Research
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <Loader2 size={64} className="text-indigo-500 animate-spin opacity-20" />
            <Cpu size={24} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
          </div>
          <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[11px] animate-pulse">Loading Neural Archive...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && (
        <div className="text-center py-32 bg-slate-900/20 rounded-[50px] border border-dashed border-white/[0.04]">
          <History size={56} className="mx-auto text-slate-800 mb-6" />
          <h2 className="text-2xl font-black text-slate-600 uppercase tracking-widest mb-3">No Research Saved Yet</h2>
          <p className="text-slate-700 text-sm mb-8">Go to Nexus Research Hub to search and save academic videos.</p>
          <button
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/30"
          >
            <Search size={16} /> Go to Nexus Hub
          </button>
        </div>
      )}

      {/* History Grid */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {history.map((item, idx) => {
            const { url, thumbnail, description, topic } = parseContent(item.content);
            const title = item.title.replace('Research: ', '');
            return (
              <div
                key={item.id}
                className="group bg-slate-900/40 border border-white/[0.05] hover:border-indigo-500/25 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-2xl"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.parentNode.classList.add('hidden'); }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={32} className="text-slate-800" />
                    </div>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                  >
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-4 ring-white/10 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </a>
                  {idx < 3 && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                      <Sparkles size={10} /> Top Pick
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  {topic && (
                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-2">
                      Topic: {topic}
                    </p>
                  )}
                  <h3 className="text-sm font-black text-white leading-snug mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-4">
                      {description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                    <p className="text-[9px] text-slate-600 flex items-center gap-1.5">
                      <Clock size={10} /> {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
                      >
                        <ExternalLink size={10} /> Watch
                      </a>
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={deletingId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 hover:bg-red-500/15 text-red-500/50 hover:text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/10 disabled:opacity-40"
                      >
                        {deletingId === item.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : <Trash2 size={10} />
                        }
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
