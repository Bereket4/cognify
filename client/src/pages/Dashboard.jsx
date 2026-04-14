import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Kanban, 
  List as ListIcon, 
  Search as SearchIcon,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Layout,
  BarChart3,
  Sparkles,
  Activity,
  Circle,
  Monitor,
  Play,
  Trash2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import TaskModal from '../components/TaskModal';

const localizer = momentLocalizer(moment);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [search, setSearch] = useState('');
  const [view, setView] = useState('kanban'); // 'kanban', 'list', 'calendar'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [researchHistory, setResearchHistory] = useState([]);
  
  const getAvatarUrl = (url) => url ? `${BASE_URL}/${url}?t=${Date.now()}` : null;

  const fetchData = async () => {
    try {
      const [tRes, sRes, pRes, rRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tasks/read.php`),
        axios.get(`${API_BASE_URL}/tasks/dashboard.php`),
        axios.get(`${API_BASE_URL}/projects/read.php?stats=1`),
        axios.get(`${API_BASE_URL}/notes/read.php?type=research`)
      ]);
      if (tRes.data.status === 'success') setTasks(tRes.data.data);
      if (sRes.data.status === 'success') setStats(sRes.data.data);
      if (pRes.data.status === 'success') setProjects(pRes.data.data.slice(0, 3));
      if (rRes.data.status === 'success') setResearchHistory(rRes.data.data.slice(0, 3));
    } catch (err) { console.error('Error fetching dashboard data'); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openForm = (task = null) => {
    setCurrentTask(task || { 
      id: null, title: '', description: '', priority: 'medium', status: 'pending', 
      deadline: '', recurring_type: 'none', project_id: null, tag_ids: [], subtasks: [], comments: [], attachments: [] 
    });
    setIsModalOpen(true);
  };

  const toggleTaskStatus = async (e, task) => {
    e.stopPropagation();
    const statusOrder = ['pending', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    
    try {
      await axios.put(`${API_BASE_URL}/tasks/update.php?id=${task.id}`, {
        ...task,
        status: nextStatus,
        tag_ids: task.tags?.map(t => t.id) || []
      });
      fetchData(); 
    } catch (err) {
      fetchData();
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      const task = tasks.find(t => t.id == draggableId);
      setTasks(tasks.map(t => t.id == draggableId ? {...t, status: newStatus} : t));
      try {
        await axios.put(`${API_BASE_URL}/tasks/update.php?id=${draggableId}`, { ...task, status: newStatus });
      } catch (e) { fetchData(); }
    }
  };

  const filteredTasks = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const columns = {
    'pending': { title: 'Pending', icon: <Clock size={16} />, color: 'bg-amber-500', items: filteredTasks.filter(t => t.status === 'pending') },
    'in-progress': { title: 'In Progress', icon: <AlertCircle size={16} />, color: 'bg-indigo-500', items: filteredTasks.filter(t => t.status === 'in-progress') },
    'completed': { title: 'Completed', icon: <CheckCircle2 size={16} />, color: 'bg-emerald-500', items: filteredTasks.filter(t => t.status === 'completed') }
  };

  const events = tasks.filter(t => t.deadline).map(t => ({
    id: t.id, title: t.title, 
    start: new Date(t.deadline), end: new Date(new Date(t.deadline).getTime() + 60*60*1000), 
    resource: t
  }));

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / (stats.total || 1)) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 bg-slate-950 pb-20 pt-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="flex flex-col gap-3">
           <div className="flex items-center gap-3 text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 animate-pulse">
              <Sparkles size={14} /> System Operational
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter leading-none italic">
             CORE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">DASHBOARD</span>
           </h1>
           <p className="text-slate-500 text-lg font-medium tracking-tight">Managing global objectives with precision architecture.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => openForm()} className="notion-btn flex items-center gap-3 px-8 py-4 shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={22} strokeWidth={2.5}/>
            NEW OBJECTIVE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <div className="glass glass-card p-6 bg-slate-900 border-none relative group overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><TrendingUp size={12}/> EFFICIENCY</p>
           <div className="flex items-end justify-between mb-4">
              <span className="text-5xl font-black text-white tracking-tighter">{progressPercent}%</span>
           </div>
           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>
        
        <div className="glass glass-card p-6 bg-indigo-600 border-none relative overflow-hidden group shadow-2xl shadow-indigo-500/10">
           <div className="absolute top-0 right-0 p-4 text-white/10 group-hover:scale-110 transition-transform"><Clock size={96} strokeWidth={1} /></div>
           <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-4">PENDING ACTIONS</p>
           <span className="text-5xl font-black text-white tracking-tighter italic">{stats.pending}</span>
        </div>

        <div className="glass glass-card p-6 bg-slate-900 border-none col-span-1 md:col-span-2">
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><BarChart3 size={12}/> SYSTEM ANALYTICS</p>
           <div className="grid grid-cols-2 gap-8">
              <div>
                 <p className="text-3xl font-black text-white tracking-tighter">{(stats.total - stats.completed) || 0}</p>
                 <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Global Queue</p>
              </div>
              <div>
                 <p className="text-3xl font-black text-emerald-400 tracking-tighter">{stats.completed}</p>
                 <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Archived</p>
              </div>
           </div>
        </div>
      </div>

      {/* ─── Neural Research Link Card ─── */}
      <div className="mb-16">
        <button
          onClick={() => navigate('/research-history')}
          className="w-full group flex items-center justify-between px-8 py-6 bg-slate-900/50 hover:bg-slate-900 border border-white/[0.04] hover:border-indigo-500/25 rounded-3xl transition-all shadow-xl"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
              <Monitor size={20} className="text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Neural Research</p>
              <p className="text-base font-black text-white tracking-tight">Research History</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {researchHistory.length > 0 ? `${researchHistory.length} saved academic resource${researchHistory.length !== 1 ? 's' : ''}` : 'No research saved yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest hidden md:block">View All</span>
            <ArrowRight size={18} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-white/[0.03] pb-8">
        <div className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shadow-inner shadow-black/20">
           <button onClick={() => setView('kanban')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view==='kanban'?'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30':'text-slate-600 hover:text-white hover:bg-white/5'}`}>
             <Kanban size={14}/> BOARD
           </button>
           <button onClick={() => setView('list')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view==='list'?'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30':'text-slate-600 hover:text-white hover:bg-white/5'}`}>
             <ListIcon size={14}/> LIST
           </button>
           <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view==='calendar'?'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30':'text-slate-600 hover:text-white hover:bg-white/5'}`}>
             <CalendarIcon size={14}/> CALENDAR
           </button>
        </div>
        
        <div className="flex items-center gap-4 flex-1 md:flex-none">
           <div className="relative group flex-1 md:flex-none">
              <SearchIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" placeholder="FILTER GLOBAL REGISTRY..." 
                className="w-full md:w-96 bg-slate-900/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase tracking-widest"
                value={search} onChange={e => setSearch(e.target.value)}
              />
           </div>
           <button className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-700 hover:text-white hover:bg-slate-800 transition-all shadow-xl"><Filter size={20}/></button>
        </div>
      </div>

      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto pb-10 -mx-4 px-4 custom-scrollbar">
            {Object.entries(columns).map(([id, col]) => (
              <div key={id} className="flex-1 flex flex-col min-w-[340px]">
                 <div className="flex items-center justify-between mb-6 px-4">
                    <div className="flex items-center gap-3">
                       <div className={`w-2.5 h-2.5 rounded-full ${col.color} ring-4 ring-white/[0.02] shadow-[0_0_15px_rgba(255,255,255,0.1)]`} />
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] italic">{col.title}</span>
                    </div>
                    <span className="text-[10px] font-black bg-white/[0.03] px-3 py-1 rounded-full text-slate-600 border border-white/5">{col.items.length}</span>
                 </div>
                 <Droppable droppableId={id}>
                   {(provided) => (
                      <div 
                        ref={provided.innerRef} {...provided.droppableProps}
                        className="flex-1 space-y-4 min-h-[600px] rounded-3xl"
                      >
                        {col.items.map((task, index) => (
                           <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  onClick={() => openForm(task)}
                                  className={`p-6 rounded-3xl bg-slate-900/40 border border-white/5 group cursor-pointer transition-all duration-300 shadow-xl ${snapshot.isDragging?'bg-indigo-600 border-indigo-500 shadow-indigo-500/20 scale-105':'hover:bg-slate-800 hover:border-white/10 hover:-translate-y-1'}`}
                                >
                                   <div className="flex justify-between items-center mb-6">
                                      <div 
                                         onClick={(e) => toggleTaskStatus(e, task)}
                                         className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                                           task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                           task.status === 'in-progress' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 
                                           'border-white/5 bg-slate-950 text-slate-700'
                                         }`}
                                      >
                                         {task.status === 'completed' ? <CheckCircle2 size={14} /> : 
                                          task.status === 'in-progress' ? <Activity size={14} className="animate-pulse" /> : 
                                          <Circle size={14} />}
                                      </div>
                                      {task.project_name && (
                                         <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest border-b border-white/[0.03] pb-1">{task.project_name}</span>
                                      )}
                                   </div>
                                   <h4 className={`text-base font-black mb-4 tracking-tight leading-tight ${task.status==='completed'?'line-through text-slate-700':'text-slate-100 group-hover:text-indigo-400'}`}>
                                      {task.title}
                                   </h4>
                                   <div className="flex flex-wrap gap-2 mb-6">
                                      {task.tags?.map(t => (
                                         <div key={t.id} className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.03] px-2 py-1 rounded-lg">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                            <span className="text-[9px] text-slate-500 font-black uppercase">{t.name}</span>
                                         </div>
                                      ))}
                                   </div>
                                   <div className="flex items-center justify-between pt-5 border-t border-white/[0.03]">
                                      <div className="text-[10px] text-slate-600 flex items-center gap-2 font-black uppercase tracking-tighter">
                                         <Clock size={14} className="text-slate-800" /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'NO DEADLINE'}
                                      </div>
                                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 border border-white/5">
                                         {user?.name.charAt(0)}
                                      </div>
                                   </div>
                                </div>
                              )}
                           </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                   )}
                 </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {view === 'list' && (
        <div className="glass bg-slate-900 border-none rounded-[32px] overflow-hidden shadow-2xl">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Global Objective</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Resolution</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Priority</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                 {filteredTasks.map(t => (
                   <tr key={t.id} onClick={() => openForm(t)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <td className="px-10 py-8">
                           <div className="flex items-center gap-5">
                              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 overflow-hidden flex items-center justify-center text-xs font-black text-slate-700">
                                 {user?.avatarUrl ? (
                                    <img src={getAvatarUrl(user.avatarUrl)} className="w-full h-full object-cover" />
                                 ) : (
                                    user?.name.charAt(0)
                                 )}
                              </div>
                              <div 
                                 onClick={(e) => toggleTaskStatus(e, t)}
                                 className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${
                                   t.status === 'completed' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 
                                   t.status === 'in-progress' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' :
                                   'border-slate-800 bg-slate-950 text-slate-700'
                                 }`}
                              >
                                 {t.status === 'completed' ? <CheckCircle2 size={14} /> : 
                                  t.status === 'in-progress' ? <Activity size={12} className="animate-pulse" /> : 
                                  <Circle size={12} />}
                              </div>
                                <div>
                               <p className={`text-base font-black tracking-tight leading-none mb-1 ${t.status==='completed'?'text-slate-700 line-through':'text-white group-hover:text-indigo-400'}`}>{t.title}</p>
                               {t.project_name && <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest underline decoration-indigo-500/30 underline-offset-4">{t.project_name}</p>}
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8"><span className="text-[10px] font-black text-slate-500 border border-white/5 bg-slate-950 px-3 py-1.5 rounded-xl uppercase tracking-widest">{t.status}</span></td>
                      <td className="px-10 py-8 text-[11px] text-slate-600 font-black uppercase tracking-widest italic">{t.deadline ? new Date(t.deadline).toLocaleDateString() : 'PENDING'}</td>
                      <td className="px-10 py-8">
                         <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${t.priority==='high'?'bg-red-500/10 text-red-500 border border-red-500/20':'bg-white/[0.03] text-slate-700 border border-white/5'}`}>
                           {t.priority}
                         </span>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {view === 'calendar' && (
        <div className="notion-calendar-container animate-in zoom-in duration-500 shadow-3xl">
           <div className="glass bg-slate-900 border-none rounded-[40px] p-8 h-[850px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-400 opacity-50" />
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start" endAccessor="end"
                onSelectEvent={(event) => openForm(event.resource)}
                className="text-slate-300"
                views={['month', 'week', 'day']}
              />
           </div>
        </div>
      )}

      {isModalOpen && <TaskModal task={currentTask} onClose={() => setIsModalOpen(false)} onRefresh={fetchData} />}

      <style>{`
        /* HIGH-END CALENDAR OVERHAUL */
        .notion-calendar-container .rbc-calendar { font-family: 'Inter', sans-serif; }
        .notion-calendar-container .rbc-month-view { border: none !important; background: transparent; }
        .notion-calendar-container .rbc-month-row { border: none !important; border-bottom: 1px solid rgba(255,255,255,0.03) !important; min-height: 120px; }
        .notion-calendar-container .rbc-day-bg { border: none !important; border-right: 1px solid rgba(255,255,255,0.03) !important; }
        .notion-calendar-container .rbc-off-range-bg { background: transparent; }
        .notion-calendar-container .rbc-today { background: rgba(99,102,241,0.03) !important; }
        .notion-calendar-container .rbc-header { border: none !important; padding: 20px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #475569; }
        .notion-calendar-container .rbc-date-cell { padding: 15px; font-size: 11px; font-weight: 800; color: #64748b; text-align: left; }
        .notion-calendar-container .rbc-now .rbc-button-link { background: #6366f1; color: white !important; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 4px 12px rgba(99,102,241,0.4); }
        .notion-calendar-container .rbc-event { background: #6366f1 !important; border: none !important; border-radius: 10px !important; padding: 6px 12px !important; font-size: 10px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; box-shadow: 0 8px 20px rgba(99,102,241,0.2) !important; margin-bottom: 4px !important; }
        .notion-calendar-container .rbc-event:hover { transform: scale(1.05); filter: brightness(1.1); transition: all 0.2s; }
        .notion-calendar-container .rbc-toolbar { margin-bottom: 40px; }
        .notion-calendar-container .rbc-toolbar-label { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: white; padding: 0 40px; }
        .notion-calendar-container .rbc-toolbar button { background: rgba(255,255,255,0.02); color: #64748b; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .notion-calendar-container .rbc-toolbar button:hover { background: rgba(255,255,255,0.08); color: white; border-color: rgba(99,102,241,0.5); }
        .notion-calendar-container .rbc-toolbar button.rbc-active { background: #6366f1; color: white; border-color: #6366f1; box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
        .notion-calendar-container ::-webkit-scrollbar { width: 4px; }
        .notion-calendar-container ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
