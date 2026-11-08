import { useEffect, useState } from 'react';
import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import type { Page } from '../../types/api';
import type { ListParams } from '../../services/api';

export function AsyncSearchSelect<T extends { id: number }>({
  label, placeholder, selectedId, selectedLabel, onSelect, load, getLabel, error, disabled = false, required = false,
}: {
  label: string;
  placeholder: string;
  selectedId: number | null;
  selectedLabel: string;
  onSelect: (item: T | null) => void;
  load: (params: ListParams) => Promise<Page<T>>;
  getLabel: (item: T) => string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(selectedLabel);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setText(selectedLabel), [selectedLabel]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void load({ page: 1, limit: 10, ...(text.trim() ? { search: text.trim() } : {}) })
        .then((result) => { if (active) setItems(result.data); })
        .catch(() => { if (active) setItems([]); })
        .finally(() => { if (active) setLoading(false); });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, text, load]);

  const choose = (item: T) => { onSelect(item); setText(getLabel(item)); setOpen(false); };
  const clear = () => { onSelect(null); setText(''); setOpen(true); };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, items.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === 'Enter' && open && activeIndex >= 0 && items[activeIndex]) { event.preventDefault(); choose(items[activeIndex]); }
  };

  return <div className="relative min-w-0">
    <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="ml-1 text-torque-red" aria-hidden="true">*</span>}</label>
    <div className="relative mt-1.5">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input role="combobox" aria-expanded={open} aria-controls={`select-${label}`} aria-activedescendant={activeIndex >= 0 ? `option-${label}-${items[activeIndex]?.id}` : undefined} aria-autocomplete="list" aria-invalid={Boolean(error)} value={text} disabled={disabled} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onChange={(event) => { setText(event.target.value); if (selectedId !== null) onSelect(null); setOpen(true); setActiveIndex(-1); }} onKeyDown={handleKeyDown} placeholder={placeholder} className={`min-h-11 w-full rounded-xl border bg-white pl-10 pr-16 text-sm outline-none transition placeholder:text-slate-400 focus:border-torque-red focus:ring-2 focus:ring-torque-red/15 disabled:bg-slate-100 ${error ? 'border-red-400' : 'border-slate-300'}`} />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">{selectedId !== null && <button type="button" onClick={clear} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label={`Limpar ${label}`}><X size={15} /></button>}<button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label={`${open ? 'Fechar' : 'Abrir'} opções de ${label}`}><ChevronDown size={16} /></button></div>
    </div>
    {error && <p className="mt-1 text-sm text-red-700" role="alert">{error}</p>}
    {open && <div id={`select-${label}`} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      {loading ? <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Buscando…</div> : items.length === 0 ? <p className="px-3 py-3 text-sm text-slate-500">Nenhum registro encontrado.</p> : items.map((item, index) => <button type="button" role="option" id={`option-${label}-${item.id}`} aria-selected={selectedId === item.id} key={item.id} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)} className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${activeIndex === index ? 'bg-slate-50' : 'hover:bg-slate-50'}`}><span className="min-w-0 truncate">{getLabel(item)}</span>{selectedId === item.id && <Check size={16} className="shrink-0 text-torque-red" />}</button>)}
    </div>}
  </div>;
}
