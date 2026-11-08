import { CircleAlert, CircleCheck, LoaderCircle, SearchX } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export function Alert({ children, tone = 'error' }: PropsWithChildren<{ tone?: 'error' | 'success' | 'info' }>) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}><Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{children}</span></div>;
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-slate-500" role="status"><LoaderCircle className="animate-spin text-torque-red" size={21} />{label}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
    <span className="mb-4 rounded-2xl bg-slate-100 p-3 text-slate-500"><SearchX size={22} /></span>
    <h3 className="font-semibold text-torque-graphite">{title}</h3>
    <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
  </div>;
}
