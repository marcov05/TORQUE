import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({ children, className = '', ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025] ${className}`} {...props}>{children}</section>;
}
