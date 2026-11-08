import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export function DetailsDialog({ open, title, children, onClose }: PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="details-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><h2 id="details-title" className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar detalhes"><X size={19} /></button></div>
      <div className="mt-5">{children}</div>
    </section>
  </div>;
}
