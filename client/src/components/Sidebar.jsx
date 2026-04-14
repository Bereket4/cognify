import { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Layout, 
  FileText, 
  Settings, 
  LogOut, 
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  Check,
  User as UserIcon,
  Trophy,
  Monitor,
  MessageCircle,
  BarChart3,
  Users,
  Brain
} from 'lucide-react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';

export default function Sidebar({ onSearchOpen }) {
  const { user, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/projects/read.php`);
      if (res.data.status === 'success') {
        setProjects(res.data.data);
      }
    } catch (e) { console.error("Error fetching projects"); }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim()) {
      setIsAddingProject(false);
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/projects/create.php`, { 
        name: newProjectName 
      });
      if (res.data.status === 'success') {
        setNewProjectName('');
        setIsAddingProject(false);
        fetchProjects();
        navigate(`/project/${res.data.project_id}`);
      }
    } catch (e) {}
  };

  // Robust Avatar URL Helper
  const getAvatarUrl = () => {
    if (!user?.avatarUrl) return null;
    // Clean potential double slashes or missing server prefix
    const path = user.avatarUrl.replace(/^\//, ''); // Remove leading slash if any
    return `${BASE_URL}/${path}?t=${Date.now()}`;
  };

  const avatarSrc = getAvatarUrl();

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-slate-900 border-r border-white/5 flex flex-col items-center py-4 gap-6 transition-all duration-300">
        <button onClick={() => setIsCollapsed(false)} className="text-slate-400 hover:text-white"><PanelLeftOpen size={20} /></button>
        <button onClick={onSearchOpen} className="text-slate-400 hover:text-white"><Search size={20} /></button>
        <NavLink to="/dashboard" className="text-slate-400 hover:text-white"><Layout size={20} /></NavLink>
        <NavLink to="/leaderboard" className="text-slate-400 hover:text-white"><Trophy size={20} /></NavLink>
        <NavLink to="/ai-tutor" className="text-slate-400 hover:text-white"><Brain size={20} /></NavLink>
        <NavLink to="/profile" className="text-slate-400 hover:text-white">
           {avatarSrc ? (
             <img src={avatarSrc} alt="P" className="w-6 h-6 rounded-lg object-cover" />
           ) : (
             <UserIcon size={20} />
           )}
        </NavLink>
        <button onClick={logout} className="mt-auto text-slate-400 hover:text-white"><LogOut size={20} /></button>
      </aside>
    );
  }

  return (
    <aside className="notion-sidebar transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">T</div>
          <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em]">TaskFlow</h1>
        </div>
        <button onClick={() => setIsCollapsed(true)} className="text-slate-600 hover:text-white transition-all"><PanelLeftClose size={18} /></button>
      </div>

      <div className="space-y-1 mb-8">
        <button onClick={onSearchOpen} className="sidebar-item w-full group">
          <Search size={16} className="group-hover:text-indigo-400 transition-colors" />
          <span className="flex-1 text-left">Quick Search</span>
          <span className="text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Ctrl K</span>
        </button>
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Layout size={16} />
          Full Dashboard
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Trophy size={16} />
          Intelligence Podium
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Monitor size={16} />
          Nexus Research
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <MessageCircle size={16} />
          Collaboration
        </NavLink>
        <NavLink to="/ai-tutor" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <Brain size={16} />
          AI Tutor
        </NavLink>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between px-3 mb-3">
          <div className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] hover:text-slate-300" onClick={() => setIsProjectsOpen(!isProjectsOpen)}>
            {isProjectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            My Workspace
          </div>
          <button onClick={() => setIsAddingProject(true)} className="p-1 hover:bg-white/5 rounded text-slate-600 hover:text-white transition-all"><Plus size={14} /></button>
        </div>
        
        {isProjectsOpen && (
          <div className="space-y-0.5">
            {isAddingProject && (
              <form onSubmit={handleCreateProject} className="px-3 py-1 animate-in slide-in-from-top-1 duration-200">
                <div className="relative group">
                   <input 
                    autoFocus
                    type="text" 
                    placeholder="Project name..." 
                    className="w-full bg-slate-800/80 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-600"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onBlur={() => !newProjectName && setIsAddingProject(false)}
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300">
                    <Check size={14} />
                  </button>
                </div>
              </form>
            )}

            {projects.map(p => (
              <NavLink 
                key={p.id} 
                to={`/project/${p.id}`} 
                className={({ isActive }) => `sidebar-item mx-1 ${isActive ? 'active' : ''}`}
              >
                <div className="w-4 h-4 flex items-center justify-center text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
                <span className="truncate flex-1">{p.name}</span>
              </NavLink>
            ))}
            {projects.length === 0 && !isAddingProject && (
              <p className="px-7 py-2 text-[11px] text-slate-600 italic">No workspaces created yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="px-3 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Admin Area</div>
        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-item mx-1 ${isActive ? 'active' : ''}`}>
               <BarChart3 size={16} />
               Analytics Hub
            </NavLink>
            <NavLink to="/governance" className={({ isActive }) => `sidebar-item mx-1 ${isActive ? 'active' : ''}`}>
               <Users size={16} />
               Campus Governance
            </NavLink>
          </>
        )}
        <NavLink to="/profile" className={({ isActive }) => `sidebar-item mx-1 ${isActive ? 'active' : ''}`}>
          <Settings size={16} />
          Account & Settings
        </NavLink>
      </div>

      <div className="mt-auto border-t border-white/5 pt-4">
        <div onClick={() => navigate('/profile')} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4 group cursor-pointer hover:bg-white/[0.05] transition-all">
          <div className="relative">
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 shadow-lg" key={avatarSrc} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">{user?.name?.charAt(0)}</div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate uppercase tracking-[0.1em]">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">Active Node</p>
          </div>
        </div>
        <button onClick={logout} className="sidebar-item mx-1 w-[calc(100%-8px)] text-red-500 hover:text-white hover:bg-red-500/20 transition-all font-bold uppercase tracking-widest text-[9px]">
          <LogOut size={16} />
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
