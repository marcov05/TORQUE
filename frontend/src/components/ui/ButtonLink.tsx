import type { PropsWithChildren, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-torque-red text-white shadow-sm hover:bg-red-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

export function ButtonLink({ to, variant = 'primary', icon, children, className = '', ...props }: PropsWithChildren<LinkProps & { variant?: Variant; icon?: ReactNode; className?: string }>) {
  return <Link to={to} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-torque-red focus-visible:ring-offset-2 ${variants[variant]} ${className}`} {...props}>{icon}{children}</Link>;
}
