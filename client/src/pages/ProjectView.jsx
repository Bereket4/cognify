import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  FileText, 
  CheckSquare, 
  Trash2, 
  Settings,
  LayoutGrid,
  List as ListIcon,
  Calendar as CalendarIcon,
  Eye,
  ArrowRight,
  TrendingUp,
  Layout,
  Filter,
  MoreVertical,
  CheckCircle2,
  Circle,
  Activity,
  Clock,
  AlertCircle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import TaskModal from '../components/TaskModal';

const localizer = momentLocalizer(moment);

export default function ProjectView() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  
  const getAvatarUrl = (url) => url ? `${BASE_URL}/${url}?t=${Date.now()}` : null;
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [view, setView] = useState('list'); // 'list', 'kanban', 'calendar'
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

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
    } catch (e) {
      console.error("Failed to load project data");
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddNote = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/notes/create.php`, { 
        project_id: id, 
        title: 'UNCLASSIFIED TRANSMISSION' 
      });
      if (res.data.status === 'success') {
        navigate(`/note/${res.data.note_id}`);
      }
    } catch (e) {}
  };

  const columns = {
    'pending': { title: 'Pending', icon: <Clock size={16} />, color: 'bg-amber-500', items: tasks.filter(t => t.status === 'pending') },
    'in-progress': { title: 'In Progress', icon: <AlertCircle size={16} />, color: 'bg-indigo-500', items: tasks.filter(t => t.status === 'in-progress') },
    'completed': { title: 'Completed', icon: <CheckCircle2 size={16} />, color: 'bg-emerald-500', items: tasks.filter(t => t.status === 'completed') }
  };

  const events = tasks.filter(t => t.deadline).map(t => ({
    id: t.id, title: t.title, 
    start: new Date(t.deadline), end: new Date(new Date(t.deadline).getTime() + 60*60*1000), 
    resource: t
  }));

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
      fetchData(); // Refresh to ensure streak is updated if needed
    } catch (err) {
      console.error("Status toggle failed", err);
      fetchData();
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId !== destination.droppableId && view === 'kanban') {
       const newStatus = destination.droppableId;
       const task = tasks.find(t => t.id == draggableId);
       setTasks(tasks.map(t => t.id == draggableId ? { ...t, status: newStatus } : t));
       try {
          await axios.put(`${API_BASE_URL}/tasks/update.php?id=${draggableId}`, { ...task, status: newStatus });
          fetchData();
       } catch (e) { fetchData(); }
    } else {
       const items = Array.from(tasks);
       const [reorderedItem] = items.splice(result.source.index, 1);
       items.splice(result.destination.index, 0, reorderedItem);
       setTasks(items);
       try {
          await axios.put(`${API_BASE_URL}/tasks/update.php?id=${reorderedItem.id}`, {
             ...reorderedItem,
             list_order: result.destination.index,
             tag_ids: reorderedItem.tags?.map(t => t.id) || []
          });
       } catch (e) {}
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("DELETE THIS GLOBAL WORKSPACE? THIS ACTION IS IRREVERSIBLE.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/projects/delete.php?id=${id}`);
      window.location.href = '/dashboard';
    } catch (e) {}
  };

  if (!project) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[60vh]">
       <div className="w-16 h-16 rounded-[24px] border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
       <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] mt-8">Synchronizing Registry...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 group">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest">Global Node #{id}</span>
              <TrendingUp size={14} className="text-emerald-500 animate-pulse" />
           </div>
           <h1 className="text-6xl font-black text-white tracking-tighter mb-4 italic uppercase">{project.name}</h1>
           <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">{project.description || "NO SYSTEM DOCUMENTATION PROVIDED FOR THIS WORKSPACE."}</p>
        </div>
        <div className="flex items-center gap-4 mt-8 md:mt-0 opacity-20 group-hover:opacity-100 transition-all duration-500">
           <button 
             onClick={() => navigate(`/project/${id}/preview`)}
             className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:border-indigo-500/30 transition-all flex items-center gap-2"
           >
              <Eye size={16} /> QUICK LOOK
           </button>
           <button onClick={handleDeleteProject} className="p-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl border border-red-500/20 transition-all"><Trash2 size={20} /></button>
           <button className="p-3 bg-white/[0.03] text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all"><Settings size={20} /></button>
        </div>
      </div>

      <div className="flex items-center gap-10 border-b border-white/[0.03] mb-12">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-3 pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'tasks' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-700 hover:text-slate-400'}`}
        >
          <CheckSquare size={18} />
          SYSTEM OBJECTIVES
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-3 pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'notes' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-700 hover:text-slate-400'}`}
        >
          <FileText size={18} />
          RECORDS & LOGS
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex flex-wrap items-center justify-between mb-8 gap-6">
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/50 border border-white/5 rounded-2xl">
               <button onClick={() => setView('list')} className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-700 hover:text-white'}`}><ListIcon size={16} /></button>
               <button onClick={() => setView('kanban')} className={`p-2 rounded-xl transition-all ${view === 'kanban' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-700 hover:text-white'}`}><LayoutGrid size={16} /></button>
               <button onClick={() => setView('calendar')} className={`p-2 rounded-xl transition-all ${view === 'calendar' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-700 hover:text-white'}`}><CalendarIcon size={16} /></button>
            </div>
            <button 
              onClick={() => { setCurrentTask({ id: null, project_id: id, title: '', priority: 'medium', status: 'pending', tags: [] }); setIsTaskModalOpen(true); }}
              className="notion-btn flex items-center gap-3 px-8 py-3.5 shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Plus size={20} /> INITIALIZE TASK
            </button>
          </div>
 
          {view === 'list' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tasks-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {tasks.map((task, index) => (
                      <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            {...provided.dragHandleProps}
                            onClick={() => { setCurrentTask(task); setIsTaskModalOpen(true); }}
                            className={`flex items-center gap-6 p-6 rounded-[28px] border transition-all cursor-pointer group shadow-xl ${snapshot.isDragging ? 'bg-indigo-600 border-indigo-400 shadow-indigo-500/30' : 'bg-slate-900/40 border-white/[0.03] hover:border-white/10 hover:bg-slate-800'}`}
                          >
                            <div 
                              onClick={(e) => toggleTaskStatus(e, task)}
                              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                                task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20 text-white' : 
                                task.status === 'in-progress' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 
                                'border-slate-800 bg-slate-950 text-slate-700'
                              }`}
                            >
                              {task.status === 'completed' ? <CheckCircle2 size={16} /> : 
                               task.status === 'in-progress' ? <Activity size={16} className="animate-pulse" /> : 
                               <Circle size={16} />}
                            </div>
                            <div className="flex-1">
                               <p className={`text-base font-black tracking-tight mb-1 ${task.status === 'completed' ? 'text-slate-700 line-through' : 'text-slate-100 group-hover:text-indigo-400 transition-colors'}`}>
                                  {task.title}
                               </p>
                               <div className="flex flex-wrap gap-2">
                                  {task.tags?.map(t => (
                                    <div key={t.id} className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity">
                                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                       <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{t.name}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-700 overflow-hidden shadow-inner">
                                  {user?.avatarUrl ? (
                                     <img src={getAvatarUrl(user.avatarUrl)} className="w-full h-full object-cover" />
                                  ) : (
                                     user?.name.charAt(0)
                                  )}
                              </div>
                              {task.priority === 'high' && <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">CRITICAL</span>}
                              {task.deadline && (
                                 <div className="flex items-center gap-2 text-slate-700 text-[10px] font-black tracking-widest uppercase">
                                    <Clock size={12} /> {new Date(task.deadline).toLocaleDateString()}
                                 </div>
                              )}
                              <MoreVertical size={16} className="text-slate-900 group-hover:text-slate-600 transition-colors" />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {tasks.length === 0 && (
                      <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/[0.03] rounded-[40px] bg-white/[0.01]">
                        <Layout size={32} className="text-slate-900 mb-6" />
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] text-center">OBJECTIVE QUEUE EMPTY</p>
                        <p className="text-slate-900 text-[9px] font-bold uppercase mt-2">Initialize nodes to begin synchronization</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {view === 'kanban' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex flex-col lg:flex-row gap-8">
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
                                      onClick={() => { setCurrentTask(task); setIsTaskModalOpen(true); }}
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
                                          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 border border-white/5 overflow-hidden">
                                             {user?.avatarUrl ? (
                                                <img src={getAvatarUrl(user.avatarUrl)} className="w-full h-full object-cover" />
                                             ) : (
                                                user?.name.charAt(0)
                                             )}
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

          {view === 'calendar' && (
            <div className="notion-calendar-container animate-in zoom-in duration-500 shadow-3xl">
               <div className="glass bg-slate-900 border-none rounded-[40px] p-8 h-[700px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-400 opacity-50" />
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start" endAccessor="end"
                    onSelectEvent={(event) => { setCurrentTask(event.resource); setIsTaskModalOpen(true); }}
                    className="text-slate-300"
                    views={['month', 'week', 'day']}
                  />
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <button 
            onClick={handleAddNote}
            className="h-60 flex flex-col items-center justify-center gap-4 rounded-[40px] border-4 border-dashed border-white/[0.02] hover:border-indigo-500/20 hover:bg-indigo-500/5 text-slate-800 hover:text-indigo-500 transition-all shadow-inner shadow-black/20 group"
          >
            <div className="w-16 h-16 rounded-[24px] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
               <Plus size={32} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">INITIALIZE RECORD</span>
          </button>
          {notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => navigate(`/note/${note.id}`)}
              className="h-60 p-8 glass bg-slate-900/60 border border-white/[0.03] flex flex-col cursor-pointer group hover:bg-slate-800 hover:border-white/10 transition-all rounded-[40px] shadow-2xl hover:-translate-y-2"
            >
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg">
                <FileText size={24} />
              </div>
              <h3 className="font-black text-2xl text-white mb-2 line-clamp-1 italic uppercase tracking-tighter">{note.title || "UNTITLED LOG"}</h3>
              <div className="mt-auto flex items-center justify-between">
                 <span className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em] italic">Log Synchronized</span>
                 <ArrowRight size={18} className="text-slate-800 group-hover:text-white group-hover:translate-x-2 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isTaskModalOpen && (
        <TaskModal 
          task={currentTask} 
          onClose={() => setIsTaskModalOpen(false)} 
          onRefresh={fetchData} 
        />
      )}
      
      <style>{`
        /* HIGH-END CALENDAR OVERHAUL */
        .notion-calendar-container .rbc-calendar { font-family: 'Inter', sans-serif; }
        .notion-calendar-container .rbc-month-view { border: none !important; background: transparent; }
        .notion-calendar-container .rbc-month-row { border: none !important; border-bottom: 1px solid rgba(255,255,255,0.03) !important; min-height: 100px; }
        .notion-calendar-container .rbc-day-bg { border: none !important; border-right: 1px solid rgba(255,255,255,0.03) !important; }
        .notion-calendar-container .rbc-today { background: rgba(99,102,241,0.03) !important; }
        .notion-calendar-container .rbc-header { border: none !important; padding: 15px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #475569; }
        .notion-calendar-container .rbc-date-cell { padding: 10px; font-size: 11px; font-weight: 800; color: #64748b; text-align: left; }
        .notion-calendar-container .rbc-event { background: #6366f1 !important; border: none !important; border-radius: 8px !important; padding: 4px 10px !important; font-size: 9px !important; font-weight: 900 !important; text-transform: uppercase !important; }
        .notion-calendar-container .rbc-toolbar { margin-bottom: 20px; }
        .notion-calendar-container .rbc-toolbar-label { font-size: 18px; font-weight: 900; text-transform: uppercase; color: white; }
        .notion-calendar-container .rbc-toolbar button { background: rgba(255,255,255,0.02); color: #64748b; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 6px 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .notion-calendar-container .rbc-toolbar button.rbc-active { background: #6366f1; color: white; border-color: #6366f1; }
      `}</style>
    </div>
  );
}
