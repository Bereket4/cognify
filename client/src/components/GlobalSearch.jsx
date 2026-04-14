import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { Search, FileText, CheckSquare, FolderOpen, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/search.php?q=${query}`);
      if (res.data.status === 'success') {
        setResults(res.data.data);
      }
    } catch (e) { console.error("Search failed"); }
    setIsLoading(false);
  };

  const handleSelect = (item) => {
    if (item.type === 'task') navigate('/dashboard'); // Need deep linking for tasks later? 
    else if (item.type === 'project') navigate(`/project/${item.id}`);
    else if (item.type === 'note') navigate(`/note/${item.id}`);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <Search size={18} className="text-slate-400 mr-3" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search tasks, notes, projects..." 
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
                  onClick={() => handleSelect(item)}
                >
                  <div className="text-slate-400">
                    {item.type === 'task' && <CheckSquare size={16} />}
                    {item.type === 'note' && <FileText size={16} />}
                    {item.type === 'project' && <FolderOpen size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 uppercase">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <p className="text-center py-8 text-slate-500">No results found for "{query}"</p>
          ) : (
            <p className="text-center py-8 text-slate-500">Type at least 2 characters to search...</p>
          )}
        </div>
      </div>
    </div>
  );
}
