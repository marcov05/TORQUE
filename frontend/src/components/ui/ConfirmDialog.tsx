import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', busy = false, onConfirm, onClose }: {
  open: boolean; title: string; description: string; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
      <div className="mb-4 flex items-start justify-between"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><AlertTriangle size={20} /></span><button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={19} /></button></div>
      <h2 id="confirm-title" className="text-lg font-bold text-torque-graphite">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={busy}>Voltar</Button><Button variant="danger" onClick={onConfirm} busy={busy}>{confirmLabel}</Button></div>
    </section>
  </div>;
}
