import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronUp, Type, Hash, CheckSquare, Calendar, Tag, Copy, ArrowUp, ArrowDown } from 'lucide-react';

// ─── Column type registry ─────────────────────────────────────────────────────
const CELL_TYPES = {
  text:     { label: 'Text',     icon: Type,        color: '#94a3b8' },
  number:   { label: 'Number',   icon: Hash,        color: '#818cf8' },
  checkbox: { label: 'Checkbox', icon: CheckSquare, color: '#34d399' },
  date:     { label: 'Date',     icon: Calendar,    color: '#fb923c' },
  select:   { label: 'Select',   icon: Tag,         color: '#f472b6' },
};
const SELECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444','#84cc16'];

let _ctr = Date.now();
const genId = () => `id_${++_ctr}`;

// ─── Default table factory ────────────────────────────────────────────────────
export const createDefaultTable = () => ({
  columns: [
    { id: genId(), name: 'Name',   type: 'text',     width: 220, options: [] },
    { id: genId(), name: 'Status', type: 'select',   width: 150, options: [
      { id: genId(), label: 'Todo',  color: '#6366f1' },
      { id: genId(), label: 'Doing', color: '#f59e0b' },
      { id: genId(), label: 'Done',  color: '#10b981' },
    ]},
    { id: genId(), name: 'Due',    type: 'date',     width: 150, options: [] },
    { id: genId(), name: 'Done',   type: 'checkbox', width: 90,  options: [] },
  ],
  rows: [
    { id: genId(), cells: {}, height: 36 },
    { id: genId(), cells: {}, height: 36 },
    { id: genId(), cells: {}, height: 36 },
  ],
});

// ─── SelectCell ───────────────────────────────────────────────────────────────
function SelectCell({ value, column, onChange }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const selected        = column.options?.find(o => o.id === value);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', minHeight: '100%', display: 'flex', alignItems: 'center', padding: '0 8px', cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
      {selected
        ? <span className="nt-tag" style={{ background: selected.color + '22', color: selected.color, border: `1px solid ${selected.color}44` }}>{selected.label}</span>
        : <span className="nt-ph">Select…</span>}
      {open && (
        <div className="nt-dropdown">
          {column.options?.map(opt => (
            <button key={opt.id} className={`nt-drop-opt${value === opt.id ? ' active' : ''}`}
              onMouseDown={e => { e.preventDefault(); onChange(opt.id); setOpen(false); }}>
              <span className="nt-dot" style={{ background: opt.color }} />{opt.label}
            </button>
          ))}
          {!column.options?.length && <p className="nt-ph" style={{ padding: 8, fontSize: 11 }}>No options yet</p>}
        </div>
      )}
    </div>
  );
}

// ─── Cell ─────────────────────────────────────────────────────────────────────
function Cell({ value, column, rowId, focused, onNavigate, onChange }) {
  const [local, setLocal] = useState(value ?? '');
  const inputRef          = useRef(null);

  useEffect(() => { setLocal(value ?? ''); }, [value]);
  useEffect(() => {
    if (focused && inputRef.current && column.type !== 'checkbox' && column.type !== 'select')
      inputRef.current.focus();
  }, [focused, column.type]);

  const commit = () => { if (local !== (value ?? '')) onChange(local); };
  const nav = (e) => {
    if (e.key === 'Tab')    { e.preventDefault(); commit(); onNavigate(e.shiftKey ? 'prev' : 'next', rowId, column.id); }
    if (e.key === 'Enter')  { e.preventDefault(); commit(); onNavigate('nextRow', rowId, column.id); }
    if (e.key === 'Escape') { setLocal(value ?? ''); inputRef.current?.blur(); }
  };

  if (column.type === 'checkbox') return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
      <button className={`nt-cb${value ? ' checked' : ''}`} onClick={() => onChange(!value)}>
        {value && <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="2,6 5,9 10,3" /></svg>}
      </button>
    </div>
  );
  if (column.type === 'select') return <SelectCell value={value} column={column} onChange={onChange} />;
  if (column.type === 'date') return (
    <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
      <input ref={inputRef} type="date" className="nt-input" style={{ colorScheme: 'dark', fontSize: 12 }}
        value={local} onChange={e => setLocal(e.target.value)} onBlur={() => onChange(local)} onKeyDown={nav} />
    </div>
  );
  return (
    <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
      <input ref={inputRef} type={column.type === 'number' ? 'number' : 'text'} className="nt-input"
        style={column.type === 'number' ? { textAlign: 'right' } : {}}
        value={local} placeholder="—"
        onChange={e => setLocal(e.target.value)} onBlur={commit} onKeyDown={nav} />
    </div>
  );
}

// ─── Column Header Menu ───────────────────────────────────────────────────────
function ColMenu({ column, onUpdate, onDelete, onClose }) {
  const [name, setName]     = useState(column.name);
  const [type, setType]     = useState(column.type);
  const [opts, setOpts]     = useState(column.options || []);
  const [newOpt, setNewOpt] = useState('');
  const ref                 = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, 80);
    return () => clearTimeout(timer);
  }, [onClose]);

  const addOpt = () => {
    if (!newOpt.trim()) return;
    setOpts(p => [...p, { id: genId(), label: newOpt.trim(), color: SELECT_COLORS[p.length % SELECT_COLORS.length] }]);
    setNewOpt('');
  };
  const save = () => { onUpdate({ ...column, name, type, options: opts }); onClose(); };

  return (
    <div className="nt-col-menu" ref={ref} onClick={e => e.stopPropagation()}>
      <p className="nt-col-title">Edit Column</p>
      <input className="nt-col-input" value={name} onChange={e => setName(e.target.value)} placeholder="Column name" autoFocus />
      <p className="nt-col-label">Type</p>
      <div className="nt-col-types">
        {Object.entries(CELL_TYPES).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={key} className={`nt-col-type${type === key ? ' active' : ''}`} onClick={() => setType(key)}>
              <Icon size={11} style={{ color: cfg.color }} /> {cfg.label}
            </button>
          );
        })}
      </div>
      {type === 'select' && (
        <>
          <p className="nt-col-label">Options</p>
          {opts.map((o, i) => (
            <div key={o.id} className="nt-opt-row">
              <span className="nt-dot" style={{ background: o.color }} />
              <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>{o.label}</span>
              <button className="nt-opt-del" onClick={() => setOpts(p => p.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input className="nt-col-input" style={{ flex: 1 }} placeholder="Add option…"
              value={newOpt} onChange={e => setNewOpt(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOpt()} />
            <button className="nt-opt-add" onClick={addOpt}><Plus size={12} /></button>
          </div>
        </>
      )}
      <div className="nt-col-actions">
        <button className="nt-col-save" onClick={save}>Save</button>
        <button className="nt-col-del" onClick={() => { onDelete(column.id); onClose(); }}><Trash2 size={11} /> Delete</button>
      </div>
    </div>
  );
}

// ─── Main NotionTableBlock ────────────────────────────────────────────────────
export default function NotionTableBlock({ data, onChange, onMoveUp, onMoveDown, onDuplicate, onDelete }) {
  const [table, setTable]       = useState(data);
  const [focused, setFocused]   = useState(null);    // { rowId, colId }
  const [colMenu, setColMenu]   = useState(null);    // colId

  // Column horizontal resize
  const [colResizing, setColResizing] = useState(null); // { colId, startX, startW }
  // Row vertical resize
  const [rowResizing, setRowResizing] = useState(null); // { rowId, startY, startH }
  // Column drag-to-swap
  const [dragCol, setDragCol]         = useState(null); // colId being dragged
  const [dragOverCol, setDragOverCol] = useState(null); // colId being hovered

  const tableRef = useRef(data);
  useEffect(() => { tableRef.current = table; }, [table]);
  useEffect(() => { 
    if (!colResizing && !rowResizing) {
      setTable(data); 
    }
  }, [data, colResizing, rowResizing]);

  const update = useCallback((next) => {
    setTable(next);
    tableRef.current = next;
    onChange(next);
  }, [onChange]);

  // ── Cell ──
  const setCellValue = (rowId, colId, value) => {
    update({ ...table, rows: table.rows.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r) });
  };

  // ── Keyboard navigation ──
  const navigate = (dir, rowId, colId) => {
    const cols = table.columns, rows = table.rows;
    const ci = cols.findIndex(c => c.id === colId), ri = rows.findIndex(r => r.id === rowId);
    if (dir === 'next') {
      if (ci < cols.length - 1) setFocused({ rowId, colId: cols[ci + 1].id });
      else if (ri < rows.length - 1) setFocused({ rowId: rows[ri + 1].id, colId: cols[0].id });
      else addRow();
    } else if (dir === 'prev') {
      if (ci > 0) setFocused({ rowId, colId: cols[ci - 1].id });
      else if (ri > 0) setFocused({ rowId: rows[ri - 1].id, colId: cols[cols.length - 1].id });
    } else if (dir === 'nextRow') {
      if (ri < rows.length - 1) setFocused({ rowId: rows[ri + 1].id, colId });
      else addRow();
    }
  };

  // ── Rows ──
  const addRow = (afterId = null) => {
    const nr = { id: genId(), cells: {}, height: 36 };
    const rows = afterId
      ? (() => { const i = table.rows.findIndex(r => r.id === afterId); return [...table.rows.slice(0,i+1), nr, ...table.rows.slice(i+1)]; })()
      : [...table.rows, nr];
    update({ ...table, rows });
    setTimeout(() => setFocused({ rowId: nr.id, colId: table.columns[0]?.id }), 20);
  };
  const deleteRow = id => { if (table.rows.length > 1) update({ ...table, rows: table.rows.filter(r => r.id !== id) }); };
  const moveRow = (id, dir) => {
    const rows = [...table.rows], i = rows.findIndex(r => r.id === id);
    if (dir === 'up' && i > 0) [rows[i], rows[i-1]] = [rows[i-1], rows[i]];
    if (dir === 'down' && i < rows.length - 1) [rows[i], rows[i+1]] = [rows[i+1], rows[i]];
    update({ ...table, rows });
  };

  // ── Columns ──
  const addColumn = () => {
    const col = { id: genId(), name: `Col ${table.columns.length + 1}`, type: 'text', width: 160, options: [] };
    const next = { ...table, columns: [...table.columns, col] };
    update(next);
    setTimeout(() => setColMenu(col.id), 80);
  };
  const updateColumn = col => update({ ...table, columns: table.columns.map(c => c.id === col.id ? col : c) });
  const deleteColumn = id => {
    if (table.columns.length <= 1) return;
    update({
      ...table,
      columns: table.columns.filter(c => c.id !== id),
      rows: table.rows.map(r => { const cells = { ...r.cells }; delete cells[id]; return { ...r, cells }; }),
    });
  };

  // ── Column swap (drag-and-drop) ──
  const handleColDragStart = (e, colId) => {
    setDragCol(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colId);
  };
  const handleColDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colId !== dragCol) setDragOverCol(colId);
  };
  const handleColDrop = (e, targetColId) => {
    e.preventDefault();
    if (!dragCol || dragCol === targetColId) { setDragCol(null); setDragOverCol(null); return; }
    const cols = [...table.columns];
    const from = cols.findIndex(c => c.id === dragCol);
    const to   = cols.findIndex(c => c.id === targetColId);
    const [moved] = cols.splice(from, 1);
    cols.splice(to, 0, moved);
    update({ ...table, columns: cols });
    setDragCol(null);
    setDragOverCol(null);
  };
  const handleColDragEnd = () => { setDragCol(null); setDragOverCol(null); };

  // ── Column horizontal resize ──
  const startColResize = (e, colId) => {
    e.preventDefault(); e.stopPropagation();
    const col = table.columns.find(c => c.id === colId);
    setColResizing({ colId, startX: e.clientX, startW: col.width || 160 });
  };

  useEffect(() => {
    if (!colResizing) return;
    const onMove = e => {
      const newW = Math.max(60, colResizing.startW + (e.clientX - colResizing.startX));
      setTable(prev => ({ ...prev, columns: prev.columns.map(c => c.id === colResizing.colId ? { ...c, width: newW } : c) }));
    };
    const onUp   = () => { onChange(tableRef.current); setColResizing(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [colResizing, onChange]);

  // ── Row vertical resize ──
  const startRowResize = (e, rowId) => {
    e.preventDefault(); e.stopPropagation();
    const row = table.rows.find(r => r.id === rowId);
    setRowResizing({ rowId, startY: e.clientY, startH: row.height || 36 });
  };

  useEffect(() => {
    if (!rowResizing) return;
    const onMove = e => {
      const newH = Math.max(28, rowResizing.startH + (e.clientY - rowResizing.startY));
      setTable(prev => ({ ...prev, rows: prev.rows.map(r => r.id === rowResizing.rowId ? { ...r, height: newH } : r) }));
    };
    const onUp   = () => { onChange(tableRef.current); setRowResizing(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [rowResizing, onChange]);

  return (
    <div className="nt-block">
      {/* Block toolbar (hover, above table) */}
      <div className="nt-toolbar">
        <button className="nt-tb-btn" title="Move up"    onClick={onMoveUp}><ArrowUp size={12} /></button>
        <button className="nt-tb-btn" title="Move down"  onClick={onMoveDown}><ArrowDown size={12} /></button>
        <button className="nt-tb-btn" title="Duplicate"  onClick={onDuplicate}><Copy size={12} /></button>
        <div className="nt-tb-sep" />
        <button className="nt-tb-btn nt-tb-del" title="Delete" onClick={onDelete}><Trash2 size={12} /></button>
      </div>

      <div className="nt-scroll">
        <table className="nt-table">
          <thead>
            <tr>
              <th className="nt-th nt-th-handle" />

              {table.columns.map((col) => {
                const Icon        = CELL_TYPES[col.type]?.icon || Type;
                const isDragOver  = dragOverCol === col.id;
                const isDragging  = dragCol === col.id;
                return (
                  <th key={col.id} className="nt-th"
                    style={{ width: col.width || 160, minWidth: col.width || 160, position: 'relative',
                      opacity: isDragging ? 0.4 : 1,
                      borderLeft: isDragOver ? '2px solid #6366f1' : undefined,
                    }}
                    onDragOver={e => handleColDragOver(e, col.id)}
                    onDrop={e => handleColDrop(e, col.id)}
                  >
                    {/* Draggable header button */}
                    <button
                      className="nt-th-btn"
                      draggable
                      onDragStart={e => handleColDragStart(e, col.id)}
                      onDragEnd={handleColDragEnd}
                      onClick={() => setColMenu(v => v === col.id ? null : col.id)}
                      title="Drag to reorder · Click to edit"
                    >
                      <Icon size={10} style={{ color: CELL_TYPES[col.type]?.color, flexShrink: 0 }} />
                      <span className="nt-th-name">{col.name}</span>
                    </button>

                    {/* Horizontal resize handle */}
                    <div className="nt-resize-h" onMouseDown={e => startColResize(e, col.id)} />

                    {/* Column menu */}
                    {colMenu === col.id && (
                      <ColMenu column={col} onUpdate={updateColumn} onDelete={deleteColumn} onClose={() => setColMenu(null)} />
                    )}
                  </th>
                );
              })}

              {/* Add column — sticky right */}
              <th className="nt-th nt-th-add">
                <button className="nt-add-col" onClick={addColumn} title="Add column"><Plus size={13} /></button>
              </th>
            </tr>
          </thead>

          <tbody>
            {table.rows.map((row) => {
              const rowH = row.height || 36;
              return (
                <tr key={row.id} className="nt-row" style={{ height: rowH }}>
                  {/* Row controls + vertical resize */}
                  <td className="nt-td nt-td-handle" style={{ position: 'relative' }}>
                    <div className="nt-row-ctrl">
                      <button className="nt-rc-btn" title="Move up"      onClick={() => moveRow(row.id, 'up')}><ChevronUp size={10} /></button>
                      <button className="nt-rc-btn" title="Insert below"  onClick={() => addRow(row.id)}><Plus size={10} /></button>
                      <button className="nt-rc-btn nt-rc-del" title="Delete row" onClick={() => deleteRow(row.id)}><Trash2 size={10} /></button>
                    </div>
                    {/* Vertical resize handle */}
                    <div className="nt-resize-v" onMouseDown={e => startRowResize(e, row.id)} title="Drag to resize row" />
                  </td>

                  {/* Data cells */}
                  {table.columns.map((col) => {
                    const isFocused = focused?.rowId === row.id && focused?.colId === col.id;
                    return (
                      <td key={col.id}
                        className={`nt-td${isFocused ? ' focused' : ''}`}
                        style={{ width: col.width || 160, height: rowH }}
                        onClick={() => setFocused({ rowId: row.id, colId: col.id })}
                      >
                        <Cell
                          value={row.cells[col.id]}
                          column={col}
                          rowId={row.id}
                          focused={isFocused}
                          onNavigate={navigate}
                          onChange={v => setCellValue(row.id, col.id, v)}
                        />
                      </td>
                    );
                  })}
                  <td className="nt-td" />
                </tr>
              );
            })}
          </tbody>
        </table>

        <button className="nt-add-row" onClick={() => addRow()}>
          <Plus size={12} /> Add row
        </button>
      </div>

      <style>{`
        .nt-block {
          position: relative;
          margin: 38px 0 6px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: visible;
        }
        .nt-block:hover { border-color: rgba(99,102,241,0.2); }

        /* Toolbar — above the table */
        .nt-toolbar {
          position: absolute;
          top: -34px; right: 0;
          display: flex; align-items: center; gap: 1px;
          padding: 3px 6px;
          background: #0c1628;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          opacity: 0; pointer-events: none;
          transition: opacity 0.15s;
          z-index: 50;
        }
        .nt-block:hover .nt-toolbar { opacity: 1; pointer-events: all; }
        .nt-tb-btn { padding: 4px; border-radius: 5px; border: none; background: transparent; color: #64748b; cursor: pointer; display: flex; align-items: center; transition: all 0.12s; }
        .nt-tb-btn:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
        .nt-tb-del:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
        .nt-tb-sep { width: 1px; height: 12px; background: rgba(255,255,255,0.06); margin: 0 2px; }

        /* Scrollable table wrapper */
        .nt-scroll { overflow-x: auto; border-radius: 10px; }
        .nt-table { 
          border-collapse: collapse; 
          width: max-content; 
          table-layout: fixed; /* CRITICAL for resizing */
        }

        /* Headers */
        .nt-th {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.04);
          padding: 0; position: relative;
          user-select: none; white-space: nowrap;
          transition: border-left 0.1s;
        }
        .nt-th-handle { width: 36px; min-width: 36px; }
        .nt-th-add {
          width: 44px; min-width: 44px; text-align: center;
          position: sticky; right: 0;
          background: #0e1a2e; z-index: 10;
          border-left: 1px solid rgba(255,255,255,0.05);
        }

        /* Column header button (draggable) */
        .nt-th-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 8px 10px; width: 100%; height: 100%;
          background: transparent; border: none;
          color: #64748b; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          cursor: grab; transition: all 0.12s; text-align: left;
        }
        .nt-th-btn:hover { background: rgba(255,255,255,0.03); color: #94a3b8; }
        .nt-th-btn:active { cursor: grabbing; }
        .nt-th-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Horizontal resize handle (right edge of each th) */
        .nt-resize-h {
          position: absolute; top: 0; right: 0;
          width: 4px; height: 100%;
          cursor: col-resize; z-index: 200;
          background: transparent;
          transition: background 0.2s;
        }
        .nt-resize-h:hover, .nt-resize-h:active { background: #6366f1; }

        /* Add column */
        .nt-add-col { display: flex; align-items: center; justify-content: center; width: 100%; padding: 8px 6px; background: transparent; border: none; color: #334155; cursor: pointer; border-radius: 5px; transition: all 0.12s; }
        .nt-add-col:hover { background: rgba(99,102,241,0.1); color: #818cf8; }

        /* Rows & cells */
        .nt-row { transition: background 0.1s; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .nt-row:hover { background: rgba(255,255,255,0.013); }
        .nt-td {
          border-right: 1px solid rgba(255,255,255,0.03);
          padding: 0; vertical-align: middle; transition: background 0.1s;
          overflow: hidden;
        }
        .nt-td.focused { background: rgba(99,102,241,0.07); outline: 1px solid rgba(99,102,241,0.45); outline-offset: -1px; }
        .nt-td-handle { width: 36px; min-width: 36px; background: rgba(255,255,255,0.01); }

        /* Row controls */
        .nt-row-ctrl { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 2px; opacity: 0; transition: opacity 0.12s; }
        .nt-row:hover .nt-row-ctrl { opacity: 1; }
        .nt-rc-btn { padding: 3px; border: none; background: transparent; color: #334155; cursor: pointer; border-radius: 4px; display: flex; align-items: center; transition: all 0.1s; }
        .nt-rc-btn:hover { background: rgba(255,255,255,0.06); color: #94a3b8; }
        .nt-rc-del:hover { background: rgba(239,68,68,0.12); color: #ef4444; }

        /* Vertical resize handle (bottom of row handle cell) */
        .nt-resize-v {
          position: absolute; bottom: -3px; left: 0; right: 0;
          height: 8px; cursor: row-resize;
          background: transparent; z-index: 100;
        }
        .nt-resize-v:hover, .nt-resize-v:active { background: rgba(99,102,241,0.5); }

        /* Cell inputs */
        .nt-input { width: 100%; background: transparent; border: none; outline: none; color: #e2e8f0; font-size: 13px; font-family: inherit; padding: 0; }
        .nt-input::placeholder { color: #1e293b; }

        /* Checkbox */
        .nt-cb { width: 16px; height: 16px; border: 2px solid #334155; border-radius: 4px; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.13s; color: white; }
        .nt-cb.checked { background: #6366f1; border-color: #6366f1; }

        /* Select */
        .nt-tag { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .nt-ph { color: #1e293b; font-size: 13px; }
        .nt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .nt-dropdown { position: absolute; top: calc(100% + 4px); left: 0; min-width: 180px; background: #0c1628; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px; z-index: 200; box-shadow: 0 16px 40px rgba(0,0,0,0.65); }
        .nt-drop-opt { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 7px; border: none; background: transparent; color: #94a3b8; font-size: 12px; cursor: pointer; width: 100%; text-align: left; transition: all 0.1s; }
        .nt-drop-opt:hover, .nt-drop-opt.active { background: rgba(255,255,255,0.05); color: #e2e8f0; }

        /* Column menu */
        .nt-col-menu { position: absolute; top: calc(100% + 4px); left: 0; min-width: 240px; background: #0c1628; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px; z-index: 300; box-shadow: 0 24px 60px rgba(0,0,0,0.75); display: flex; flex-direction: column; gap: 8px; }
        .nt-col-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #475569; }
        .nt-col-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #334155; margin-top: 2px; }
        .nt-col-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 7px 10px; font-size: 12px; color: #e2e8f0; outline: none; font-family: inherit; box-sizing: border-box; transition: border-color 0.13s; }
        .nt-col-input:focus { border-color: rgba(99,102,241,0.5); }
        .nt-col-types { display: flex; flex-wrap: wrap; gap: 5px; }
        .nt-col-type { display: flex; align-items: center; gap: 5px; padding: 5px 9px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.06); background: transparent; color: #64748b; font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.1s; }
        .nt-col-type:hover { background: rgba(255,255,255,0.05); color: #94a3b8; }
        .nt-col-type.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #818cf8; }
        .nt-opt-row { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 6px; background: rgba(255,255,255,0.02); }
        .nt-opt-del { font-size: 10px; color: #475569; background: none; border: none; cursor: pointer; padding: 2px 4px; border-radius: 4px; transition: all 0.1s; }
        .nt-opt-del:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        .nt-opt-add { padding: 7px 8px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.1); color: #818cf8; cursor: pointer; display: flex; align-items: center; transition: all 0.1s; }
        .nt-opt-add:hover { background: rgba(99,102,241,0.25); }
        .nt-col-actions { display: flex; gap: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); }
        .nt-col-save { flex: 1; padding: 7px; border-radius: 8px; background: #6366f1; color: white; font-size: 11px; font-weight: 700; border: none; cursor: pointer; transition: all 0.1s; }
        .nt-col-save:hover { background: #4f46e5; }
        .nt-col-del { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 8px; background: rgba(239,68,68,0.08); color: #ef4444; font-size: 11px; font-weight: 700; border: 1px solid rgba(239,68,68,0.15); cursor: pointer; transition: all 0.1s; }
        .nt-col-del:hover { background: rgba(239,68,68,0.18); }

        /* Add row */
        .nt-add-row { display: flex; align-items: center; gap: 7px; padding: 8px 12px; width: 100%; background: transparent; border: none; border-top: 1px solid rgba(255,255,255,0.04); color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.13s; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }
        .nt-add-row:hover { background: rgba(99,102,241,0.06); color: #818cf8; }
      `}</style>
    </div>
  );
}
