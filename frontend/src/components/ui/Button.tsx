import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  busy?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-torque-red text-white shadow-sm hover:bg-red-700 focus-visible:ring-torque-red',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400',
};

export function Button({ children, variant = 'primary', busy = false, icon, className = '', disabled, type = 'button', ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button type={type} disabled={disabled || busy} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`} {...props}>
      {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
