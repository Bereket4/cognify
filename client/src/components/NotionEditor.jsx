import { useState, useRef, useCallback, useEffect } from 'react'; // useCallback used in insertAfter, deleteBlock, moveBlock, etc.
import { Plus, Table2, Type, Heading1, Heading2, List, CheckSquare, Minus, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import NotionTableBlock, { createDefaultTable } from './NotionTableBlock';

// ─── Block type registry ──────────────────────────────────────────────────────
const BLOCK_TYPES = {
  paragraph: { label: 'Text',       icon: Type,        shortcut: 'p'     },
  h1:        { label: 'Heading 1',  icon: Heading1,    shortcut: 'h1'    },
  h2:        { label: 'Heading 2',  icon: Heading2,    shortcut: 'h2'    },
  h3:        { label: 'Heading 3',  icon: Heading2,    shortcut: 'h3'    },
  bullet:    { label: 'Bullet',     icon: List,        shortcut: '-'     },
  todo:      { label: 'To-Do',      icon: CheckSquare, shortcut: '[]'    },
  divider:   { label: 'Divider',    icon: Minus,       shortcut: '---'   },
  table:     { label: 'Table',      icon: Table2,      shortcut: 'table' },
};

// Types that "continue" the same type on Enter
const CONTINUING_TYPES = new Set(['bullet', 'todo']);

let _bid = Date.now();
const genBlockId = () => `blk_${++_bid}`;

// ─── Content serialization ────────────────────────────────────────────────────
export function contentToBlocks(content) {
  if (!content) return [{ id: genBlockId(), type: 'paragraph', content: '' }];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [{ id: genBlockId(), type: 'paragraph', content }];
}
export function blocksToContent(blocks) { return JSON.stringify(blocks); }

// ─── Slash Command Menu ───────────────────────────────────────────────────────
function SlashMenu({ query, onSelect, onClose }) {
  const menuRef = useRef(null);
  const options = Object.entries(BLOCK_TYPES).filter(([key, cfg]) =>
    !query || cfg.label.toLowerCase().startsWith(query.toLowerCase()) || key.startsWith(query.toLowerCase())
  );

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  if (!options.length) return null;

  return (
    <div className="ne-slash-menu" ref={menuRef}>
      <p className="ne-slash-title">Block Types</p>
      {options.map(([key, cfg]) => {
        const Icon = cfg.icon;
        return (
          <button key={key} className="ne-slash-opt" onMouseDown={e => { e.preventDefault(); onSelect(key); }}>
            <span className="ne-slash-icon"><Icon size={13} /></span>
            <span className="ne-slash-label">{cfg.label}</span>
            <kbd className="ne-slash-hint">/{cfg.shortcut}</kbd>
          </button>
        );
      })}
    </div>
  );
}

// ─── Text Block ───────────────────────────────────────────────────────────────
function TextBlock({ block, focused, onChange, onKeyDown, onFocus }) {
  const ref = useRef(null);

  // Auto-resize textarea height
  const resize = () => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (focused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [focused]);

  useEffect(() => { resize(); }, [block.content]);

  const placeholder = {
    paragraph: "Write something, or type '/' for commands…",
    h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3',
    bullet: 'List item', todo: 'To-do item',
  }[block.type] || '';

  const textClass = {
    paragraph: 'ne-input',
    h1: 'ne-input ne-h1', h2: 'ne-input ne-h2', h3: 'ne-input ne-h3',
    bullet: 'ne-input', todo: 'ne-input',
  }[block.type] || 'ne-input';

  return (
    <div className="ne-text-row">
      {block.type === 'bullet' && <span className="ne-bullet-dot" aria-hidden="true">•</span>}
      {block.type === 'todo' && (
        <button
          type="button"
          className={`ne-checkbox${block.checked ? ' checked' : ''}`}
          onClick={() => onChange({ checked: !block.checked })}
          aria-label={block.checked ? 'Mark incomplete' : 'Mark complete'}
        >
          {block.checked && (
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
              <polyline points="2,6 5,9 10,3" />
            </svg>
          )}
        </button>
      )}
      <textarea
        ref={ref}
        className={textClass + (block.checked ? ' ne-done' : '')}
        value={block.content || ''}
        placeholder={placeholder}
        rows={1}
        onChange={e => { onChange({ content: e.target.value }); resize(); }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onInput={resize}
      />
    </div>
  );
}

// ─── Block Row (hover controls absolutely positioned) ─────────────────────────
function BlockRow({ 
  block, isTypeMenu, onSetTypeMenu, onInsert, onDelete, onMoveUp, onMoveDown, onTypeChange,
  isDragged, isDragOver, canDrag, setCanDrag, onDragStart, onDragOver, onDrop, onDragEnd,
  children 
}) {
  return (
    <div 
      className={`ne-row${isDragOver ? ' drag-over' : ''}${isDragged ? ' dragging' : ''}`} 
      data-block-id={block.id}
      draggable={canDrag}
      onDragStart={() => onDragStart(block.id)}
      onDragOver={(e) => onDragOver(e, block.id)}
      onDrop={(e) => onDrop(e, block.id)}
      onDragEnd={onDragEnd}
    >
      {/* Gutter: absolutely positioned, outside text flow */}
      <div className="ne-gutter">
        <div style={{ position: 'relative' }}>
          <button className="ne-g-btn" title="Block options" onClick={onSetTypeMenu}><Plus size={12} /></button>
          {isTypeMenu && (
            <div className="ne-type-menu">
              <p className="ne-slash-title">Actions</p>
              <button className="ne-slash-opt" onMouseDown={e => { e.preventDefault(); onInsert(); }}>
                <span className="ne-slash-icon"><Plus size={13} /></span>
                <span className="ne-slash-label">Insert block below</span>
              </button>
              <button className="ne-slash-opt" onMouseDown={e => { e.preventDefault(); onMoveUp(); }}>
                <span className="ne-slash-icon"><ArrowUp size={13} /></span>
                <span className="ne-slash-label">Move up</span>
              </button>
              <button className="ne-slash-opt" onMouseDown={e => { e.preventDefault(); onMoveDown(); }}>
                <span className="ne-slash-icon"><ArrowDown size={13} /></span>
                <span className="ne-slash-label">Move down</span>
              </button>
              
              <p className="ne-slash-title" style={{ marginTop: 8 }}>Turn into</p>
              {Object.entries(BLOCK_TYPES).filter(([k]) => k !== 'table' && k !== 'divider').map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} className="ne-slash-opt" onMouseDown={e => { e.preventDefault(); onTypeChange(key); }}>
                    <span className="ne-slash-icon"><Icon size={13} /></span>
                    <span className="ne-slash-label">{cfg.label}</span>
                  </button>
                );
              })}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4, paddingTop: 4 }}>
                <button className="ne-slash-opt ne-opt-del" onMouseDown={e => { e.preventDefault(); onDelete(); }}>
                  <span className="ne-slash-icon" style={{ color: '#ef4444' }}>✕</span>
                  <span className="ne-slash-label">Delete block</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <button 
          className="ne-g-btn" 
          style={{ cursor: 'grab' }} 
          title="Drag to reorder"
          onMouseDown={() => setCanDrag(true)}
          onMouseUp={() => setCanDrag(false)}
        >
          <GripVertical size={12} />
        </button>
      </div>
      {/* Content */}
      <div className="ne-row-content">{children}</div>
    </div>
  );
}

// ─── Main NotionEditor ────────────────────────────────────────────────────────
export default function NotionEditor({ value, onChange }) {
  const [blocks, setBlocks]         = useState(() => contentToBlocks(value));
  const [focusedId, setFocusedId]   = useState(blocks[0]?.id ?? null);
  const [slashState, setSlashState] = useState(null); // { blockId, query }
  const [typeMenuId, setTypeMenuId] = useState(null);

  const [draggedId, setDraggedId]     = useState(null);
  const [dragOverId, setDragOverId]   = useState(null);
  const [canDrag, setCanDrag]         = useState(false);

  // Sync when value prop changes from outside (note load)
  const prevVal = useRef(value);
  useEffect(() => {
    if (prevVal.current !== value) {
      prevVal.current = value;
      setBlocks(contentToBlocks(value));
    }
  }, [value]);

  const push = useCallback((next) => {
    setBlocks(next);
    onChange(blocksToContent(next));
  }, [onChange]);

  const updateBlock = useCallback((id, patch) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...patch } : b);
      onChange(blocksToContent(next));
      return next;
    });
  }, [onChange]);

  const insertAfter = useCallback((afterId, type = 'paragraph', extra = {}) => {
    const nb = { id: genBlockId(), type, content: '', ...extra };
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === afterId);
      const next = i === -1
        ? [...prev, nb]
        : [...prev.slice(0, i + 1), nb, ...prev.slice(i + 1)];
      onChange(blocksToContent(next));
      return next;
    });
    setTimeout(() => setFocusedId(nb.id), 20);
    return nb.id;
  }, [onChange]);

  const deleteBlock = useCallback((id) => {
    setBlocks(prev => {
      if (prev.length <= 1) return prev;
      const i = prev.findIndex(b => b.id === id);
      const next = prev.filter(b => b.id !== id);
      onChange(blocksToContent(next));
      setTimeout(() => setFocusedId(next[Math.max(0, i - 1)]?.id), 20);
      return next;
    });
  }, [onChange]);

  const moveBlock = useCallback((id, dir) => {
    setBlocks(prev => {
      const a = [...prev], i = a.findIndex(b => b.id === id);
      if (dir === 'up' && i > 0) [a[i], a[i-1]] = [a[i-1], a[i]];
      if (dir === 'down' && i < a.length - 1) [a[i], a[i+1]] = [a[i+1], a[i]];
      onChange(blocksToContent(a));
      return a;
    });
  }, [onChange]);

  // ── Drag and Drop Logic ──
  const handleDragStart = (id) => {
    setDraggedId(id);
  };
  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { cleanupDrag(); return; }
    
    setBlocks(prev => {
      const next = [...prev];
      const from = next.findIndex(b => b.id === draggedId);
      const to = next.findIndex(b => b.id === targetId);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(blocksToContent(next));
      return next;
    });
    cleanupDrag();
  };
  const cleanupDrag = () => {
    setDraggedId(null);
    setDragOverId(null);
    setCanDrag(false);
  };

  const duplicateBlock = useCallback((id) => {
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === id);
      const clone = { ...prev[i], id: genBlockId(),
        tableData: prev[i].tableData ? JSON.parse(JSON.stringify(prev[i].tableData)) : undefined };
      const next = [...prev.slice(0, i + 1), clone, ...prev.slice(i + 1)];
      onChange(blocksToContent(next));
      return next;
    });
  }, [onChange]);

  // Apply slash command
  const applySlash = useCallback((blockId, type) => {
    setSlashState(null);
    if (type === 'table') {
      updateBlock(blockId, { type: 'table', content: '', slashQuery: null, tableData: createDefaultTable() });
    } else {
      updateBlock(blockId, { type, content: '', slashQuery: null });
    }
  }, [updateBlock]);

  // Keydown handler per block
  const makeKeyDown = useCallback((block) => (e) => {
    const hasSlash = slashState?.blockId === block.id;

    // While slash menu is open
    if (hasSlash) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashState(null);
        updateBlock(block.id, { content: block.content.replace(/\/\w*$/, ''), slashQuery: null });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // Auto-apply: find all matching options and pick first
        const q = slashState.query || '';
        const matches = Object.keys(BLOCK_TYPES).filter(key =>
          !q || BLOCK_TYPES[key].label.toLowerCase().startsWith(q.toLowerCase()) || key.startsWith(q.toLowerCase())
        );
        if (matches.length > 0) {
          applySlash(block.id, matches[0]);
        }
        return;
      }
      // Keep updating the slash query as they type
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const isContinuing = CONTINUING_TYPES.has(block.type);
      // Empty continuing block → revert to paragraph
      if (isContinuing && !block.content?.trim()) {
        updateBlock(block.id, { type: 'paragraph', content: '' });
        return;
      }
      // Continuing type → new block of same type
      const nextType = isContinuing ? block.type : 'paragraph';
      insertAfter(block.id, nextType);
    }

    if (e.key === 'Backspace' && !block.content) {
      e.preventDefault();
      // Demote list/todo to paragraph first
      if (CONTINUING_TYPES.has(block.type)) {
        updateBlock(block.id, { type: 'paragraph' });
      } else {
        deleteBlock(block.id);
      }
    }

    if (e.key === 'ArrowUp'   && e.altKey) { e.preventDefault(); moveBlock(block.id, 'up'); }
    if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); moveBlock(block.id, 'down'); }
  }, [slashState, updateBlock, insertAfter, deleteBlock, moveBlock, applySlash]);

  // Handle text change — detect slash command (plain function, not a hook)
  const makeChange = (block) => (patch) => {
    const newContent = patch.content ?? block.content ?? '';
    const slashMatch = newContent.match(/\/(\w*)$/);
    if (slashMatch !== null) {
      setSlashState({ blockId: block.id, query: slashMatch[1] });
      updateBlock(block.id, { ...patch, slashQuery: slashMatch[1] });
    } else {
      if (slashState?.blockId === block.id) setSlashState(null);
      updateBlock(block.id, { ...patch, slashQuery: null });
    }
  };

  // Close type menu on outside click
  useEffect(() => {
    const h = () => setTypeMenuId(null);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="ne-root">
      {blocks.map((block) => {
        const isFocused = focusedId === block.id;
        const hasSlash  = slashState?.blockId === block.id;

        if (block.type === 'divider') {
          return (
            <BlockRow key={block.id} block={block}
              isTypeMenu={typeMenuId === block.id}
              onSetTypeMenu={() => setTypeMenuId(v => v === block.id ? null : block.id)}
              onInsert={() => insertAfter(block.id)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, 'up')}
              onMoveDown={() => moveBlock(block.id, 'down')}
              onTypeChange={t => { updateBlock(block.id, { type: t }); setTypeMenuId(null); }}
              isDragged={draggedId === block.id}
              isDragOver={dragOverId === block.id}
              canDrag={canDrag}
              setCanDrag={setCanDrag}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={cleanupDrag}
            >
              <div className="ne-divider" />
            </BlockRow>
          );
        }

        if (block.type === 'table') {
          return (
            <BlockRow key={block.id} block={block}
              isTypeMenu={typeMenuId === block.id}
              onSetTypeMenu={() => setTypeMenuId(v => v === block.id ? null : block.id)}
              onInsert={() => insertAfter(block.id)}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, 'up')}
              onMoveDown={() => moveBlock(block.id, 'down')}
              onTypeChange={() => {}}
              isDragged={draggedId === block.id}
              isDragOver={dragOverId === block.id}
              canDrag={canDrag}
              setCanDrag={setCanDrag}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={cleanupDrag}
            >
              <NotionTableBlock
                data={block.tableData || createDefaultTable()}
                onChange={td => updateBlock(block.id, { tableData: td })}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
                onDuplicate={() => duplicateBlock(block.id)}
                onDelete={() => deleteBlock(block.id)}
              />
            </BlockRow>
          );
        }

        return (
          <BlockRow key={block.id} block={block}
            isTypeMenu={typeMenuId === block.id}
            onSetTypeMenu={() => setTypeMenuId(v => v === block.id ? null : block.id)}
            onInsert={() => insertAfter(block.id)}
            onDelete={() => deleteBlock(block.id)}
            onMoveUp={() => moveBlock(block.id, 'up')}
            onMoveDown={() => moveBlock(block.id, 'down')}
            onTypeChange={t => { updateBlock(block.id, { type: t }); setTypeMenuId(null); }}
            isDragged={draggedId === block.id}
            isDragOver={dragOverId === block.id}
            canDrag={canDrag}
            setCanDrag={setCanDrag}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={cleanupDrag}
          >
            <div style={{ position: 'relative' }}>
              <TextBlock
                block={block}
                focused={isFocused}
                onChange={makeChange(block)}
                onKeyDown={makeKeyDown(block)}
                onFocus={() => setFocusedId(block.id)}
              />
              {hasSlash && (
                <SlashMenu
                  query={slashState.query}
                  onSelect={type => applySlash(block.id, type)}
                  onClose={() => {
                    setSlashState(null);
                    updateBlock(block.id, { slashQuery: null });
                  }}
                />
              )}
            </div>
          </BlockRow>
        );
      })}

      {/* Trailing add-block hint */}
      <button
        className="ne-add-btn"
        onClick={() => insertAfter(blocks[blocks.length - 1]?.id)}
      >
        <Plus size={13} /> Add a block  <kbd className="ne-add-hint">/ for commands</kbd>
      </button>

      <style>{`
        .ne-root {
          padding-left: 52px;
          position: relative;
        }

        /* ── Row ── */
        .ne-row {
          position: relative;
          display: flex;
          align-items: flex-start;
          border-radius: 6px;
          min-height: 28px;
          /* Extend leftward so hover zone covers the gutter area */
          margin: 1px 0 1px -52px;
          padding-left: 52px;
          transition: background 0.1s;
        }
        .ne-row:hover { background: rgba(255,255,255,0.012); }
        .ne-row.dragging { opacity: 0.3; }
        .ne-row.drag-over { border-top: 2px solid #6366f1; }

        /* ── Gutter — sits in the left padding zone of .ne-row ── */
        .ne-gutter {
          position: absolute;
          left: 2px;   /* row now starts 52px left, so 2px = visual ~left edge */
          top: 4px;
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
          pointer-events: none;
        }
        /* Show when row OR gutter itself is hovered (mouse travels toward buttons) */
        .ne-row:hover .ne-gutter {
          opacity: 1;
          pointer-events: all;
        }
        .ne-g-btn {
          padding: 4px 5px;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.12s;
        }
        .ne-g-btn:hover { background: rgba(255,255,255,0.07); color: #94a3b8; }

        /* Type menu (turn-into) */
        .ne-type-menu {
          position: absolute;
          left: 100%;
          top: 0;
          min-width: 200px;
          background: #0c1628;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 8px;
          z-index: 300;
          box-shadow: 0 16px 48px rgba(0,0,0,0.7);
        }

        /* ── Content ── */
        .ne-row-content { flex: 1; min-width: 0; }

        /* ── Text ── */
        .ne-text-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
        }
        .ne-bullet-dot {
          font-size: 18px;
          line-height: 1.6;
          color: #475569;
          flex-shrink: 0;
          user-select: none;
          padding-top: 2px;
        }
        .ne-checkbox {
          width: 16px; height: 16px;
          border: 2px solid #334155;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          color: white;
          margin-top: 5px;
        }
        .ne-checkbox.checked { background: #6366f1; border-color: #6366f1; }

        .ne-input {
          flex: 1;
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #cbd5e1;
          font-size: 15px;
          font-family: inherit;
          line-height: 1.7;
          resize: none;
          overflow: hidden;
          padding: 3px 2px;
          min-height: 28px;
        }
        .ne-input::placeholder { color: rgba(100,116,139,0.35); }
        .ne-h1 { font-size: 30px; font-weight: 800; color: #f1f5f9; line-height: 1.25; letter-spacing: -0.02em; padding: 4px 2px; }
        .ne-h2 { font-size: 21px; font-weight: 700; color: #e2e8f0; line-height: 1.35; letter-spacing: -0.01em; padding: 3px 2px; }
        .ne-h3 { font-size: 16px; font-weight: 700; color: #cbd5e1; padding: 2px 2px; }
        .ne-done { text-decoration: line-through; color: #475569; }

        /* ── Divider ── */
        .ne-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          border-radius: 2px;
          margin: 10px 0;
          width: 100%;
        }

        /* ── Slash menu ── */
        .ne-slash-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 230px;
          background: #0c1628;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 8px;
          z-index: 300;
          box-shadow: 0 20px 50px rgba(0,0,0,0.75);
          animation: ne-pop 0.1s ease;
        }
        @keyframes ne-pop { from { opacity:0; transform: translateY(-4px); } to { opacity:1; transform: translateY(0); } }

        .ne-slash-title {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #334155;
          padding: 2px 8px 6px;
        }
        .ne-slash-opt {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 13px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.1s;
        }
        .ne-slash-opt:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
        .ne-slash-icon { color: #6366f1; flex-shrink: 0; }
        .ne-slash-label { flex: 1; }
        .ne-slash-hint { font-size: 10px; color: #334155; font-family: monospace; background: transparent; border: none; }
        .ne-opt-del:hover { background: rgba(239,68,68,0.1); }

        /* ── Add block button ── */
        .ne-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          padding: 7px 10px;
          background: transparent;
          border: 1px dashed rgba(255,255,255,0.05);
          border-radius: 8px;
          color: #2d3a4a;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
        }
        .ne-add-btn:hover { border-color: rgba(99,102,241,0.3); color: #6366f1; background: rgba(99,102,241,0.04); }
        .ne-add-hint { font-family: monospace; font-size: 10px; color: #1e293b; margin-left: 4px; }
        .ne-add-btn:hover .ne-add-hint { color: rgba(99,102,241,0.5); }
      `}</style>
    </div>
  );
}
