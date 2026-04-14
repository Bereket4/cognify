import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { jsPDF } from 'jspdf';
import { 
  ArrowLeft, 
  Trash2, 
  Save, 
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Loader2,
  FileWarning,
  Download,
  FileText,
  Share2,
  ChevronDown,
  Table2,
  Type,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Minus,
  Hash
} from 'lucide-react';
import NotionEditor, { contentToBlocks, blocksToContent } from '../components/NotionEditor';
import { createDefaultTable } from '../components/NotionTableBlock';

export default function NoteEditor() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [note, setNote]               = useState(null);
  const [projects, setProjects]       = useState([]);
  const [isSaving, setIsSaving]       = useState(false);
  const [saveStatus, setSaveStatus]   = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showInsert, setShowInsert]     = useState(false);
  const editorRef                       = useRef(null);
  const insertRef                       = useRef(null);

  // ── Insert block externally via a ref callback ──
  const insertBlockRef = useRef(null);

  const fetchData = async () => {
    try {
      const [nRes, pRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/notes/read.php?id=${id}`),
        axios.get(`${API_BASE_URL}/projects/read.php`)
      ]);
      
      if (nRes.data.status === 'success') {
        setNote({
          ...nRes.data.data,
          content: nRes.data.data.content || ''
        });
      } else {
        setErrorDetails(nRes.data.message || "Failed to load synchronization data.");
      }
      
      if (pRes.data.status === 'success') {
        setProjects(pRes.data.data);
      }
    } catch (e) {
      console.error("Critical connection failure", e);
      setErrorDetails("Check your local environment connection.");
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // Auto-save debounce
  const saveTimerRef = useRef(null);
  const handleContentChange = useCallback((newContent) => {
    setNote(prev => ({ ...prev, content: newContent }));
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setNote(prev => {
        if (prev?.title) triggerSave({ ...prev, content: newContent });
        return prev;
      });
    }, 2000);
  }, []);

  const triggerSave = async (noteData) => {
    if (!noteData) return;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await axios.put(
        `${API_BASE_URL}/notes/update.php?id=${id}`,
        noteData
      );
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error');
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSave = () => {
    if (note?.title) triggerSave(note);
  };

  const handleDelete = async () => {
    if (!window.confirm("Terminate this document permanently?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/notes/delete.php?id=${id}`);
      navigate(note.project_id ? `/project/${note.project_id}` : '/dashboard');
    } catch (e) {}
  };

  // ── Export helpers ──
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(note.title || "Untitled Document", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 30);
    doc.line(20, 35, 190, 35);
    doc.setTextColor(0);
    doc.setFontSize(12);

    // Walk blocks and render them
    const blocks = contentToBlocks(note.content);
    let y = 45;
    for (const block of blocks) {
      if (y > 270) { doc.addPage(); y = 20; }
      if (block.type === 'divider') { doc.line(20, y, 190, y); y += 6; continue; }
      if (block.type === 'table') {
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text('[Table block — open in app to view]', 20, y);
        y += 8;
        continue;
      }

      const sizes = { h1: 20, h2: 16, h3: 13, paragraph: 11, bullet: 11, todo: 11 };
      doc.setFontSize(sizes[block.type] || 11);
      doc.setTextColor(block.type.startsWith('h') ? 0 : 50);
      const prefix = block.type === 'bullet' ? '• ' : block.type === 'todo' ? (block.checked ? '☑ ' : '☐ ') : '';
      const lines = doc.splitTextToSize(prefix + (block.content || ''), 170);
      doc.text(lines, 20, y);
      y += lines.length * (sizes[block.type] >= 16 ? 9 : 6) + 2;
    }
    doc.save(`${note.title || 'Note'}.pdf`);
    setIsExportOpen(false);
  };

  const exportToTXT = () => {
    const blocks = contentToBlocks(note.content);
    const lines = blocks.map(b => {
      if (b.type === 'divider') return '─'.repeat(40);
      if (b.type === 'table')   return '[Table Block]';
      return (b.type === 'bullet' ? '• ' : b.type === 'todo' ? (b.checked ? '☑ ' : '☐ ') : '') + (b.content || '');
    });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([`${note.title}\n\n${lines.join('\n')}`], { type: 'text/plain' }));
    el.download = `${note.title || 'Note'}.txt`;
    document.body.appendChild(el);
    el.click();
    setIsExportOpen(false);
  };

  // ── Word / char count ──
  const stats = (() => {
    if (!note?.content) return { chars: 0, words: 0, blocks: 0 };
    try {
      const blocks = contentToBlocks(note.content);
      const text = blocks.map(b => b.content || '').join(' ');
      return {
        chars: text.length,
        words: text.split(/\s+/).filter(Boolean).length,
        blocks: blocks.length,
      };
    } catch {
      return { chars: note.content.length, words: 0, blocks: 0 };
    }
  })();

  // ── Close menus on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (!insertRef.current?.contains(e.target)) setShowInsert(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (errorDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
        <FileWarning size={48} className="text-red-500/50" />
        <p className="font-bold text-white uppercase tracking-widest text-xs">{errorDetails}</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest">Back to Hub</button>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading Synchronization Layer...
      </div>
    );
  }

  const INSERT_BLOCKS = [
    { type: 'paragraph', label: 'Text',      icon: Type,        shortcut: 'p' },
    { type: 'h1',        label: 'Heading 1', icon: Heading1,    shortcut: 'h1' },
    { type: 'h2',        label: 'Heading 2', icon: Heading2,    shortcut: 'h2' },
    { type: 'bullet',    label: 'Bullet',    icon: List,        shortcut: '-' },
    { type: 'todo',      label: 'To-Do',     icon: CheckSquare, shortcut: '[]' },
    { type: 'divider',   label: 'Divider',   icon: Minus,       shortcut: '---' },
    { type: 'table',     label: 'Table',     icon: Table2,      shortcut: '/table', highlight: true },
  ];

  return (
    <div className="h-screen flex flex-col px-8 pt-4 pb-4" style={{ maxWidth: '100%' }}>
      {/* ── Toolbar: slim compact bar ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all"><ArrowLeft size={16} /></button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] rounded-lg border border-white/5">
            <FolderOpen size={11} className="text-indigo-400" />
            <select
              className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white cursor-pointer"
              value={note.project_id || ''}
              onChange={e => setNote({ ...note, project_id: e.target.value || null })}
            >
              <option value="" className="bg-slate-900">Personal Space</option>
              {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>
          <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">{stats.blocks}b · {stats.words}w · {stats.chars}c</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
            {saveStatus === 'saving' && <Loader2 size={11} className="animate-spin text-indigo-500" />}
            {saveStatus === 'saved'  && <CheckCircle size={11} className="text-green-500" />}
            {saveStatus === 'error'  && <AlertCircle size={11} className="text-red-500" />}
          </div>

          <div className="relative" ref={insertRef}>
            <button onClick={() => setShowInsert(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20 transition-all">
              <Table2 size={12} /> Insert <ChevronDown size={9} />
            </button>
            {showInsert && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-[#0c1628] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-0.5">
                <p className="px-3 py-1 text-[9px] font-black text-slate-700 uppercase tracking-[0.18em]">Insert Block</p>
                {INSERT_BLOCKS.map(({ type, label, icon: Icon, shortcut, highlight }) => (
                  <button key={type}
                    onMouseDown={e => {
                      e.preventDefault();
                      const blocks = contentToBlocks(note.content);
                      const newBlock = { id: `blk_${Date.now()}`, type, content: '', ...(type === 'table' ? { tableData: createDefaultTable() } : {}) };
                      setNote(prev => ({ ...prev, content: blocksToContent([...blocks, newBlock]) }));
                      setShowInsert(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-[11px] font-semibold ${highlight ? 'text-indigo-400 hover:bg-indigo-500/15 bg-indigo-500/5 border border-indigo-500/15' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Icon size={12} /><span className="flex-1 text-left">{label}</span><span className="font-mono text-[9px] text-slate-700">{shortcut}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all">
              <Share2 size={12} /> Export <ChevronDown size={9} />
            </button>
            {isExportOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-600 text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-all"><Download size={12} /> PDF</button>
                <button onClick={exportToTXT} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-all"><FileText size={12} /> TXT</button>
              </div>
            )}
          </div>

          <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-700 hover:text-red-400 transition-all"><Trash2 size={15} /></button>
          <button onClick={handleSave} className="notion-btn flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-extrabold"><Save size={12} /> Save</button>
        </div>
      </div>

      {/* ── Title ── */}
      <input
        type="text"
        placeholder="Untitled…"
        className="w-full bg-transparent border-none outline-none text-4xl font-extrabold text-white mb-3 placeholder-white/10 focus:placeholder-white/20 transition-all tracking-tight leading-tight flex-shrink-0"
        style={{ marginTop: 25 }}
        value={note.title || ''}
        onChange={e => setNote({ ...note, title: e.target.value })}
      />

      {/* ── Block Editor — takes all remaining space, no bounding box ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ minHeight: 0 }}>
        <NotionEditor
          value={note.content}
          onChange={handleContentChange}
        />
      </div>



      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.03); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}
