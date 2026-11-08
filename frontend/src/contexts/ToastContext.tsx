import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; tone: ToastTone }
interface ToastContextValue { showToast: (message: string, tone?: ToastTone) => void }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  const icons = { success: CheckCircle2, error: CircleAlert, info: Info };
  const styles = { success: 'border-emerald-200 text-emerald-800', error: 'border-red-200 text-red-800', info: 'border-blue-200 text-blue-800' };
  return <ToastContext.Provider value={value}>
    {children}
    <div aria-live="polite" aria-relevant="additions removals" className="fixed bottom-4 right-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => { const Icon = icons[toast.tone]; return <div key={toast.id} role={toast.tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-xl ${styles[toast.tone]}`}><Icon size={18} className="mt-0.5 shrink-0" /><p className="flex-1 leading-5">{toast.message}</p><button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Fechar notificação"><X size={15} /></button></div>; })}
    </div>
  </ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser utilizado dentro de ToastProvider.');
  return context;
}
