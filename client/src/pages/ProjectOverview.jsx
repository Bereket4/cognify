import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { 
  ArrowLeft, 
  Layout, 
  CheckCircle2, 
  FileText, 
  Clock, 
  TrendingUp, 
  Target, 
  Zap, 
  ChevronRight,
  Monitor,
  Share2
} from 'lucide-react';

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  const fetchData = async () => {
    try {
      const [pRes, tRes, nRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/projects/read.php?id=${id}`),
        axios.get(`${API_BASE_URL}/tasks/read.php?project_id=${id}`),
        axios.get(`${API_BASE_URL}/notes/read.php?project_id=${id}`)
      ]);
      
      const projectData = Array.isArray(pRes.data.data) ? pRes.data.data.find(p => p.id == id) : pRes.data.data;
      setProject(projectData);
      setTasks(tRes.data.data || []);
      setNotes(nRes.data.data || []);
      
      const t = tRes.data.data || [];
      setStats({
        total: t.length,
        completed: t.filter(x => x.status === 'completed').length,
        pending: t.filter(x => x.status !== 'completed').length
      });
    } catch (e) {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!project) return (
     <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
     </div>
  );

  const completionRate = stats.total > 0 ? Math.round((stats.completed / (stats.total || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 animate-in fade-in duration-700">
      <div className="relative h-[450px] overflow-hidden border-b border-white/[0.03]">
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-500/5 to-transparent z-10" />
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale saturate-200" />
         
         <div className="relative z-20 max-w-7xl mx-auto px-8 lg:px-12 h-full flex flex-col justify-between py-12">
            <button 
              onClick={() => navigate(`/project/${id}`)}
              className="group flex items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl w-fit text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/5"
            >
               <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-all text-indigo-500" />
               BACK TO SYSTEM
            </button>

            <div className="max-w-4xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="px-4 py-1.5 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/40">SYSTEM OVERVIEW</div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-800 uppercase tracking-widest">
                     <Monitor size={12} /> READ ONLY PERSPECTIVE
                  </div>
               </div>
               <h1 className="text-8xl font-black tracking-tighter italic uppercase leading-none mb-8">
                  {project.name}
               </h1>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/5 pt-10">
                  <div>
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Maturity</p>
                     <p className="text-3xl font-black tracking-tighter text-indigo-400">{completionRate}%</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Capacity</p>
                     <p className="text-3xl font-black tracking-tighter">{stats.total}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Registry</p>
                     <p className="text-3xl font-black tracking-tighter">{notes.length}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Protocol</p>
                     <p className="text-3xl font-black tracking-tighter uppercase italic">V3 Core</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 mt-24">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
            <div className="lg:col-span-2 space-y-24">
               <section>
                  <div className="flex items-center justify-between mb-12 border-b border-white/[0.03] pb-6">
                     <div className="flex items-center gap-4">
                        <Target size={24} className="text-indigo-500" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Strategic Objectives</h2>
                     </div>
                     <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{stats.completed}/{stats.total} SUCCESS RATE</span>
                  </div>
                  
                  <div className="space-y-6">
                     {tasks.map(task => (
                        <div key={task.id} className="group p-8 bg-white/[0.01] border border-white/[0.03] rounded-[40px] hover:bg-white/[0.03] transition-all flex items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-900 border border-slate-800'}`} />
                              <div>
                                 <h4 className={`text-xl font-black tracking-tight ${task.status === 'completed' ? 'text-slate-800 line-through' : 'text-slate-100 italic uppercase'}`}>{task.title}</h4>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    {task.tags?.map(t => (
                                       <span key={t.id} className="text-[8px] font-black text-slate-700 uppercase px-2 py-0.5 border border-white/5 rounded-lg">{t.name}</span>
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${task.priority==='high'?'text-red-500':'text-slate-800'}`}>{task.priority}</p>
                              <p className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'NO SCHEDULE'}</p>
                           </div>
                        </div>
                     ))}
                     {tasks.length === 0 && <p className="text-slate-700 italic font-black uppercase tracking-[0.2em] text-center py-20 border-2 border-dashed border-white/[0.02] rounded-[40px]">Global Queue Empty</p>}
                  </div>
               </section>

               <section>
                  <div className="flex items-center gap-4 mb-12 border-b border-white/[0.03] pb-6">
                     <FileText size={24} className="text-emerald-500" />
                     <h2 className="text-2xl font-black uppercase tracking-tighter italic">Technical Archives</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     {notes.map(note => (
                        <div key={note.id} className="p-8 bg-white/[0.01] border border-white/[0.03] rounded-[40px] group hover:bg-indigo-600 transition-all cursor-default">
                           <div className="flex items-center justify-between mb-10">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:text-indigo-600 transition-all">
                                 <Zap size={22} />
                              </div>
                           </div>
                           <h3 className="text-2xl font-black tracking-tight text-white mb-2 italic uppercase">{note.title || "Untitled Record"}</h3>
                           <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest group-hover:text-white/60 transition-all">LOG ARCHIVED {new Date(note.updated_at).toLocaleDateString()}</p>
                        </div>
                     ))}
                  </div>
               </section>
            </div>

            <div className="space-y-12">
               <div className="p-10 bg-indigo-600 rounded-[50px] shadow-[0_40px_80px_rgba(99,102,241,0.3)] relative overflow-hidden group">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-110 transition-transform" />
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><TrendingUp size={16}/> EXECUTIVE PERFORMANCE</p>
                  <div className="text-7xl font-black text-white italic tracking-tighter mb-4">{completionRate}%</div>
                  <p className="text-white/80 text-xs font-bold leading-relaxed tracking-tight">System is currently operating with <span className="text-white underline">optimal resource allocation</span>. Objective resolution is within predicted margins.</p>
               </div>

               <div className="p-10 bg-slate-900/60 border border-white/[0.03] rounded-[50px]">
                  <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8">GLOBAL METRICS</p>
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Achieved Objectives</span>
                        </div>
                        <span className="text-lg font-black">{stats.completed}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-amber-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Queue Persistence</span>
                        </div>
                        <span className="text-lg font-black">{stats.pending}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-indigo-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registry</span>
                        </div>
                        <span className="text-lg font-black">{stats.total}</span>
                     </div>
                  </div>
               </div>

               <button className="w-full py-6 flex items-center justify-center gap-4 bg-white/[0.02] border border-white/5 rounded-[40px] text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] hover:text-white hover:bg-indigo-600 transition-all group">
                  <Share2 size={16} className="text-indigo-500 group-hover:text-white" />
                  INITIATE SYSTEM REPORT
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
