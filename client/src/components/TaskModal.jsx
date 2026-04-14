import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { 
  X, Send, Paperclip, Trash2, CheckCircle2, 
  Circle, Tag as TagIcon, Plus, Calendar as CalendarIcon,
  Flag, FolderOpen, RefreshCcw, Type, ExternalLink, Download, Image as ImageIcon,
  Check, Activity
} from 'lucide-react';

export default function TaskModal({ task, onClose, onRefresh }) {
  const { user } = useContext(AuthContext);
  const [currentTask, setCurrentTask] = useState(task);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [file, setFile] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [projects, setProjects] = useState([]);

  const isNew = !currentTask.id;

  const fetchData = async () => {
    try {
      const [tagRes, projRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tags/read.php`),
        axios.get(`${API_BASE_URL}/projects/read.php`)
      ]);
      setAllTags(tagRes.data.data || []);
      setProjects(projRes.data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const payload = {
      ...currentTask,
      tag_ids: currentTask.tags?.map(t => t.id) || []
    };
    try {
      if (isNew) {
        await axios.post(`${API_BASE_URL}/tasks/create.php`, payload);
      } else {
        await axios.put(`${API_BASE_URL}/tasks/update.php?id=${currentTask.id}`, payload);
      }
      onRefresh();
      onClose();
    } catch (err) { console.error('Save failed', err); }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask) return;
    try {
      await axios.post(`${API_BASE_URL}/subtasks/create.php`, { task_id: currentTask.id, title: newSubtask });
      setNewSubtask('');
      onRefresh();
      setCurrentTask({
        ...currentTask,
        subtasks: [...(currentTask.subtasks || []), { id: Date.now(), title: newSubtask, status: 'pending' }]
      });
    } catch { }
  };

  const toggleSubtask = async (sub) => {
    const newStatus = sub.status === 'pending' ? 'completed' : 'pending';
    try {
      await axios.put(`${API_BASE_URL}/subtasks/update.php?id=${sub.id}`, { status: newStatus });
      setCurrentTask({
        ...currentTask,
        subtasks: currentTask.subtasks.map(s => s.id === sub.id ? { ...s, status: newStatus } : s)
      });
      onRefresh();
    } catch {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/comments/create.php`, { task_id: currentTask.id, comment: newComment });
      setNewComment('');
      onRefresh();
      setCurrentTask({ ...currentTask, comments: [...(currentTask.comments || []), res.data.comment] });
    } catch {}
  };

  const toggleTag = (tag) => {
    const exists = currentTask.tags?.some(t => t.id === tag.id);
    if (exists) {
      setCurrentTask({ ...currentTask, tags: (currentTask.tags || []).filter(t => t.id !== tag.id) });
    } else {
      setCurrentTask({ ...currentTask, tags: [...(currentTask.tags || []), tag] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('task_id', currentTask.id);
    try {
      const res = await axios.post(`${API_BASE_URL}/attachments/upload.php`, formData);
      setFile(null);
      setCurrentTask({ ...currentTask, attachments: [...(currentTask.attachments || []), res.data.attachment] });
      onRefresh();
    } catch {}
  };

  const isImage = (filename) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  const getAssetUrl = (path) => `${BASE_URL}/${path}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-[#0f0f0f] w-full max-w-4xl rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col max-h-[92vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-10 py-8 border-b border-white/[0.03]">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <CheckCircle2 size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">OBJECTIVE ANALYSIS</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            {!isNew && <button className="p-3 text-slate-800 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={20} /></button>}
            <button onClick={onClose} className="p-3 bg-white/[0.03] text-slate-600 hover:text-white hover:bg-white/[0.08] rounded-2xl transition-all"><X size={20} /></button>
          </div>
        </div>

        <form className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-950/20">
          <input 
            type="text" placeholder="WORKSPACE OBJECTIVE..." 
            className="w-full bg-transparent border-none outline-none text-5xl font-black text-white mb-12 placeholder-white/[0.02] focus:placeholder-white/[0.05] transition-all tracking-tighter"
            required value={currentTask.title} onChange={e => setCurrentTask({ ...currentTask, title: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-8">
               <div className="flex items-center gap-10">
                  <div className="w-24 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2"><Activity size={14}/> STATUS</div>
                  <select 
                    className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                    value={currentTask.status} onChange={e => setCurrentTask({ ...currentTask, status: e.target.value })}
                  >
                    <option value="pending" className="bg-slate-900">PENDING SYNC</option>
                    <option value="in-progress" className="bg-slate-900">WORK IN PROGRESS</option>
                    <option value="completed" className="bg-slate-900">OBJECTIVE SUCCESS</option>
                  </select>
               </div>
               <div className="flex items-center gap-10">
                  <div className="w-24 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2"><Flag size={14}/> PRIORITY</div>
                  <select 
                    className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                    value={currentTask.priority} onChange={e => setCurrentTask({ ...currentTask, priority: e.target.value })}
                  >
                    <option value="low" className="bg-slate-900">LOW INTENSITY</option>
                    <option value="medium" className="bg-slate-900">MEDIUM INTENSITY</option>
                    <option value="high" className="bg-slate-900">CRITICAL TARGET</option>
                  </select>
               </div>
               <div className="flex items-center gap-10">
                  <div className="w-24 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2"><FolderOpen size={14}/> REGISTRY</div>
                  <select 
                    className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                    value={currentTask.project_id || ''} onChange={e => setCurrentTask({ ...currentTask, project_id: e.target.value || null })}
                  >
                    <option value="" className="bg-slate-900">UNASSIGNED NODE</option>
                    {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                  </select>
               </div>
            </div>
            <div className="space-y-8">
               <div className="flex items-center gap-10">
                  <div className="w-24 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2"><CalendarIcon size={14}/> RESOLUTION</div>
                  <input 
                    type="datetime-local" className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white focus:outline-none focus:border-indigo-500/50"
                    value={currentTask.deadline ? currentTask.deadline.substring(0, 16) : ''} onChange={e => setCurrentTask({ ...currentTask, deadline: e.target.value })}
                  />
               </div>
               <div className="flex items-center gap-10">
                  <div className="w-24 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2"><RefreshCcw size={14}/> RECURRENCE</div>
                  <select 
                    className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                    value={currentTask.recurring_type} onChange={e => setCurrentTask({ ...currentTask, recurring_type: e.target.value })}
                  >
                    <option value="none" className="bg-slate-900">LINEAR PATH</option>
                    <option value="daily" className="bg-slate-900">DAILY CYCLE</option>
                    <option value="weekly" className="bg-slate-900">WEEKLY CYCLE</option>
                    <option value="monthly" className="bg-slate-900">MONTHLY CYCLE</option>
                  </select>
               </div>
            </div>
          </div>

          <div className="mb-16">
             <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]"><TagIcon size={14} /> CLASSIFICATION TAGS</div>
             <div className="flex flex-wrap gap-3">
                {allTags.map(tag => {
                   const isSelected = currentTask.tags?.some(t => t.id === tag.id);
                   return (
                    <button 
                      key={tag.id} type="button" onClick={() => toggleTag(tag)}
                      className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 flex items-center gap-2 ${isSelected ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.03]'}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? tag.color : '#334155' }} />
                      {tag.name}
                      {isSelected && <Check size={10} />}
                    </button>
                   );
                })}
                {allTags.length === 0 && <p className="text-[10px] text-slate-800 italic uppercase">Initializing global tags...</p>}
             </div>
          </div>

          <div className="mb-16">
             <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]"><Type size={14} /> INTELLIGENCE OVERLAY</div>
             <textarea 
               className="w-full bg-white/[0.01] border border-white/5 rounded-[32px] p-8 text-sm leading-relaxed text-slate-300 focus:outline-none focus:border-indigo-500/30 min-h-[180px] transition-all placeholder-slate-900"
               placeholder="ENTER SYSTEM DOCUMENTATION AND ARCHITECTURE DETAILS..."
               value={currentTask.description || ''} onChange={e => setCurrentTask({ ...currentTask, description: e.target.value })}
             />
          </div>

          {!isNew && (
            <div className="space-y-20 mt-20 pt-20 border-t border-white/[0.03]">
               <div>
                  <div className="flex items-center justify-between mb-8">
                     <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] flex items-center gap-3"><CheckCircle2 size={16} /> SUB-NODE TASKS</div>
                     <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic tracking-wider">ENTER TO APPEND</span>
                  </div>
                  <div className="space-y-4 mb-8">
                     {currentTask.subtasks?.map(sub => (
                        <div key={sub.id} className="flex items-center gap-5 group bg-white/[0.01] p-4 rounded-3xl border border-white/[0.02] hover:border-indigo-500/20 transition-all cursor-default">
                           <button type="button" onClick={() => toggleSubtask(sub)} className={`text-slate-800 hover:text-indigo-500 transition-all ${sub.status === 'completed' ? 'text-indigo-500 scale-110' : ''}`}>
                              {sub.status === 'completed' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                           </button>
                           <span className={`text-base font-bold flex-1 tracking-tight ${sub.status === 'completed' ? 'text-slate-700 line-through' : 'text-slate-200'}`}>{sub.title}</span>
                        </div>
                     ))}
                  </div>
                  <form onSubmit={handleAddSubtask} className="relative group">
                     <Plus size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-indigo-500 transition-all" />
                     <input 
                       type="text" placeholder="APPEND NEW SUB-TASK..." 
                       className="w-full bg-slate-900/40 border border-white/5 rounded-3xl pl-14 pr-6 py-5 text-sm text-white focus:outline-none focus:border-indigo-500/30 transition-all uppercase font-bold tracking-widest"
                       value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                     />
                  </form>
               </div>

               <div>
                  <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] flex items-center gap-3 mb-8"><Paperclip size={16} /> ASSET REPOSITORY</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                     {currentTask.attachments?.map(att => (
                        <div key={att.id} className="group relative bg-white/[0.01] border border-white/[0.03] rounded-3xl overflow-hidden hover:border-indigo-500/40 transition-all p-5">
                           <div className="flex gap-5">
                              <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-indigo-500/30 transition-all">
                                 {isImage(att.filename) ? (
                                   <img src={getAssetUrl(att.filepath)} alt="preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                 ) : (
                                   <Paperclip size={32} className="text-slate-800 group-hover:text-indigo-500 transition-colors" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0 pr-10">
                                 <p className="text-sm font-black text-white truncate mb-2 uppercase tracking-tighter">{att.filename}</p>
                                 <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest mb-4">
                                    {isImage(att.filename) ? 'VISUAL ASSET' : 'SYSTEM DOCUMENT'}
                                 </p>
                                 <div className="flex gap-2">
                                    <a href={getAssetUrl(att.filepath)} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-white/5 text-slate-600 hover:text-white hover:bg-indigo-600 transition-all" title="VIEW SOURCE"><ExternalLink size={14}/></a>
                                    <a href={getAssetUrl(att.filepath)} download={att.filename} className="p-2.5 rounded-xl bg-white/5 text-slate-600 hover:text-white hover:bg-emerald-600 transition-all" title="FORCE DOWNLOAD"><Download size={14}/></a>
                                 </div>
                              </div>
                           </div>
                           <button className="absolute top-4 right-4 p-2 bg-red-500/5 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white rounded-xl"><Trash2 size={14}/></button>
                        </div>
                     ))}
                  </div>
                  <form onSubmit={handleUpload} className="flex flex-col gap-6 p-12 bg-white/[0.01] rounded-[40px] border-2 border-dashed border-white/[0.03] items-center justify-center group hover:border-indigo-500/40 transition-all shadow-inner shadow-black/40">
                     <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xl scale-110">
                        <Paperclip size={28} />
                     </div>
                     <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" id="task-file" />
                     <label htmlFor="task-file" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">
                        {file ? file.name : "INITIATE FILE STREAM UPLOAD"}
                     </label>
                     {file && (
                        <button type="submit" className="px-10 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl">
                           SYNC ASSET
                        </button>
                      )}
                  </form>
               </div>

               <div>
                  <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] flex items-center gap-3 mb-10"><Send size={16} /> COLLABORATION STREAM</div>
                  <div className="space-y-10 mb-10 max-h-[500px] overflow-y-auto pr-8 custom-scrollbar">
                     {currentTask.comments?.map(cmt => (
                        <div key={cmt.id} className="flex gap-6 group">
                           <div className="w-12 h-12 rounded-[20px] bg-indigo-600/10 border border-indigo-500/20 flex flex-shrink-0 items-center justify-center text-sm font-black text-indigo-400 shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {cmt.user_name?.charAt(0)}
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">{cmt.user_name}</span>
                                 <span className="text-[9px] text-slate-800 font-black uppercase tracking-tighter">{new Date(cmt.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="bg-white/[0.02] p-5 rounded-[28px] rounded-tl-none border border-white/[0.03] text-sm text-slate-300 leading-relaxed shadow-2xl">
                                 {cmt.comment}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-4 bg-slate-900/60 p-3 rounded-[32px] border border-white/[0.03] focus-within:border-indigo-500/40 transition-all shadow-2xl">
                     <input 
                       type="text" placeholder="WRITE GLOBAL TRANSMISSION..." 
                       className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-xs font-bold text-white placeholder-slate-900 tracking-wider"
                       value={newComment} onChange={e => setNewComment(e.target.value)}
                     />
                     <button type="submit" className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] shadow-2xl shadow-indigo-500/20 transition-all active:scale-95"><Send size={22} /></button>
                  </form>
               </div>
            </div>
          )}

          <div className="mt-24 pt-12 border-t border-white/[0.03] flex gap-6">
             <button type="button" onClick={onClose} className="flex-1 py-5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] rounded-3xl transition-all border border-white/[0.03]">ABORT RESOLUTION</button>
             <button 
                type="button" 
                onClick={handleSave}
                className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[32px] shadow-[0_20px_50px_rgba(99,102,241,0.4)] transition-all hover:-translate-y-1 active:translate-y-0"
              >
                COMMIT SYSTEM UPDATES
             </button>
          </div>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.01); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.04); }
      `}</style>
    </div>
  );
}
