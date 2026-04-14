import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { 
  Users, 
  CheckSquare, 
  Download, 
  Send, 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Search,
  ChevronDown,
  Trash2,
  FileText,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';

export default function AdminPanel() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [assignForm, setAssignForm] = useState({ student_id: '', title: '', priority: 'medium', deadline: '' });
  const [message, setMessage] = useState('');
  const reportRef = useRef(null);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes, tasksRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/analytics.php`),
        axios.get(`${API_BASE_URL}/admin/users.php`),
        axios.get(`${API_BASE_URL}/admin/tasks.php`)
      ]);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data.users);
      setTasks(tasksRes.data.data);
    } catch (err) { console.error('Failed to fetch admin data'); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportPDF = async () => {
    if (!analytics) return;
    
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    // Header & Brand
    doc.setFillColor(15, 23, 42); // slate-950
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SYSTEM INTELLIGENCE REPORT', 15, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${timestamp} | V3 Core Architecture`, 15, 32);

    // Summary Metrics
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Global Capacity Summary', 15, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Students: ${analytics.overall.total_students}`, 15, 65);
    doc.text(`Total Tasks Tracked: ${analytics.overall.total_tasks}`, 15, 71);
    doc.text(`System Completion Rate: ${Math.round((analytics.overall.completed_tasks / analytics.overall.total_tasks) * 100)}%`, 15, 77);
    doc.text(`Critical Overdue Alert Count: ${analytics.overall.overdue_tasks}`, 15, 83);

    // Student Progress Table (Manual Drawing to avoid auto-table dep issues)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Performance Metrics', 15, 100);
    
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 105, 180, 8, 'F');
    doc.setFontSize(9);
    doc.text('STUDENT IDENTITY', 18, 110);
    doc.text('TOTAL TASKS', 80, 110);
    doc.text('COMPLETED', 130, 110);
    doc.text('RATIO', 170, 110);

    let y = 118;
    analytics.students.slice(0, 20).forEach(s => {
       doc.setFont('helvetica', 'normal');
       doc.text(s.name.toUpperCase(), 18, y);
       doc.text(s.task_count.toString(), 80, y);
       doc.text(s.completed_count.toString(), 130, y);
       const ratio = Math.round((s.completed_count / s.task_count) * 100) || 0;
       doc.text(`${ratio}%`, 170, y);
       doc.setDrawColor(241, 245, 249);
       doc.line(15, y+2, 195, y+2);
       y += 8;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Internal Use Only | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`System_Report_${Date.now()}.pdf`);
  };

  const exportCSV = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/export_csv.php`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { console.error('CSV Export failed', e); }
  };

  const handleBulkAction = async (action) => {
    if (selectedTasks.length === 0) return alert("Select tasks first");
    try {
      await axios.post(`${API_BASE_URL}/admin/bulk_actions.php`, { action, task_ids: selectedTasks });
      setSelectedTasks([]);
      fetchData();
    } catch(e) {}
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/admin/assign_task.php`, assignForm);
      setMessage("Objective successfully deployed to student node.");
      setAssignForm({ student_id: '', title: '', priority: 'medium', deadline: '' });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (e) { setMessage("Deployment failed."); }
  };

  if (!analytics) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[60vh]">
       <div className="w-16 h-16 rounded-[24px] border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
       <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] mt-8">Synthesizing Analytics...</p>
    </div>
  );

  const chartData = [
    { name: 'Completed', value: parseInt(analytics.overall.completed_tasks), color: '#10b981' },
    { name: 'Pending', value: parseInt(analytics.overall.total_tasks) - parseInt(analytics.overall.completed_tasks), color: '#6366f1' },
    { name: 'Overdue', value: parseInt(analytics.overall.overdue_tasks), color: '#ef4444' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-32 space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
           <div className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
              <Zap size={14} className="animate-pulse" /> Global Management Network
           </div>
           <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase leading-none">ADMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">CONTROL</span></h1>
           <p className="text-slate-500 text-lg font-medium tracking-tight mt-4">System-wide monitoring, auditing, and student node management.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportPDF} className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[24px] transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-2xl">
            <FileText size={20} /> GENERATE LOG REPORT (PDF)
          </button>
          <button onClick={exportCSV} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(99,102,241,0.3)] hover:-translate-y-1 active:translate-y-0">
            <FileSpreadsheet size={20} /> DATA STREAM EXPORT (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in duration-500 delay-100">
          <div className="glass glass-card p-8 bg-slate-900 border-none relative group transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><Users size={80}/></div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Active Capacity</p>
             <p className="text-5xl font-black text-white tracking-tighter uppercase italic">{analytics.overall.total_students} Nodes</p>
          </div>
          <div className="glass glass-card p-8 bg-slate-900 border-none relative group transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><CheckSquare size={80}/></div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Maturity Rate</p>
             <p className="text-5xl font-black text-emerald-400 tracking-tighter uppercase italic">{analytics.overall.completed_tasks} Units</p>
          </div>
          <div className="glass glass-card p-8 bg-slate-900 border-none relative group transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><TrendingUp size={80}/></div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Load</p>
             <p className="text-5xl font-black text-white tracking-tighter uppercase italic">{analytics.overall.total_tasks}</p>
          </div>
          <div className="glass glass-card p-8 bg-red-500/10 border-red-500/20 relative group transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><AlertCircle size={80}/></div>
             <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Critical Breaches</p>
             <p className="text-5xl font-black text-red-500 tracking-tighter uppercase italic">{analytics.overall.overdue_tasks}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="glass p-10 bg-slate-900/40 rounded-[40px] border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent" />
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-12 flex items-center gap-3 italic underline decoration-indigo-500/30 underline-offset-8">
                 <BarChart3 size={16}/> Comparative Performance Grid
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.students}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(' ')[0]} />
                    <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.01)'}} contentStyle={{backgroundColor: '#0f0f0f', borderColor: '#ffffff05', borderRadius: '24px', padding: '15px'}} />
                    <Bar dataKey="completed_count" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={30} />
                    <Bar dataKey="task_count" fill="#ffffff05" radius={[10, 10, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
           <div className="glass p-10 bg-slate-900/40 rounded-[40px] border-none shadow-2xl flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-12 w-full flex items-center gap-3 italic underline decoration-emerald-500/30 underline-offset-8">
                 <BarChart3 size={16}/> Global Health Allocation
              </h3>
              <div className="h-[280px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                       {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#0f0f0f', borderColor: '#ffffff05', borderRadius: '24px'}} />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex gap-8 mt-8">
                 {chartData.map(d => (
                   <div key={d.name} className="flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{backgroundColor: d.color}} /> {d.name}
                   </div>
                 ))}
              </div>
           </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8 border-t border-white/[0.03]">
         <div className="md:col-span-1 border-r border-white/5 pr-12">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3 italic">
               <Send size={18} className="text-indigo-400"/> Direct Objective Injection
            </h3>
            {message && <div className="mb-6 animate-in slide-in-from-left duration-300 text-[10px] font-black text-emerald-400 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest italic">{message}</div>}
            <form onSubmit={handleAssignTask} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] ml-2">Target Registry</label>
                  <select 
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-indigo-500/40"
                    value={assignForm.student_id} onChange={e => setAssignForm({...assignForm, student_id: e.target.value})} required
                  >
                    <option value="" className="bg-slate-950">SELECT NODE...</option>
                    {users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id} className="bg-slate-950 font-bold">{u.name.toUpperCase()}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] ml-2">Objective Context</label>
                  <input 
                    type="text" placeholder="TRANSMIT COMMAND..." 
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-indigo-500/40"
                    value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} required
                  />
               </div>
               <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all text-[11px] uppercase tracking-[0.3em] hover:-translate-y-1">INITIATE DEPLOYMENT</button>
            </form>
         </div>

         <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-10 px-4">
               <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                  <CheckSquare size={18} className="text-emerald-400"/> Global Surveillance View
               </h3>
               <div className="flex gap-3">
                  <button onClick={() => handleBulkAction('complete')} disabled={selectedTasks.length===0} className="px-5 py-2.5 bg-slate-900 hover:bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-xl disabled:opacity-20 border border-white/10 transition-all active:scale-95 shadow-xl">RESOLVE NODES</button>
                  <button onClick={() => handleBulkAction('delete')} disabled={selectedTasks.length===0} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl disabled:opacity-20 shadow-xl active:scale-95 transition-all">EXPUNGE DATA</button>
               </div>
            </div>
            
            <div className="glass bg-slate-900/60 rounded-[40px] border-none shadow-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-1000">
               <div className="px-10 py-6 border-b border-white/[0.03] relative bg-white/[0.01]">
                  <Search size={18} className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-700" />
                  <input 
                    type="text" placeholder="FILTER GLOBAL DATABASE..." 
                    className="bg-transparent border-none outline-none text-[11px] font-black text-white placeholder-slate-800 pl-10 w-full uppercase tracking-[0.2em]"
                    value={search} onChange={e=>setSearch(e.target.value)}
                  />
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.03]">
                           <th className="px-10 py-6"><input type="checkbox" onChange={e => setSelectedTasks(e.target.checked ? tasks.map(t=>t.id) : [])} className="rounded-lg w-5 h-5 accent-indigo-500 border-white/5 bg-slate-950" /></th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] italic">Identity</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] italic">Objective Command</th>
                           <th className="px-10 py-6 text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] italic text-center">Protocol Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.03]">
                        {tasks.filter(t => !search || t.user_name.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase())).map(t => (
                           <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-10 py-8"><input type="checkbox" checked={selectedTasks.includes(t.id)} onChange={() => setSelectedTasks(selectedTasks.includes(t.id)?selectedTasks.filter(x=>x!==t.id):[...selectedTasks, t.id])} className="rounded-lg w-4 h-4 accent-indigo-500 border-white/5 bg-slate-950" /></td>
                              <td className="px-10 py-8 font-black text-white text-[10px] tracking-widest uppercase italic">{t.user_name}</td>
                              <td className="px-10 py-8 text-[11px] text-slate-400 font-bold truncate max-w-[280px] uppercase group-hover:text-indigo-400 transition-colors tracking-tight">{t.title}</td>
                              <td className="px-10 py-8 text-center">
                                 <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${t.status==='completed'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]':'bg-slate-800 text-slate-600 border-white/5 opacity-50'}`}>{t.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
