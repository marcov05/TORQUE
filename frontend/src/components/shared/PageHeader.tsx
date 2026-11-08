import type { ReactNode } from 'react';

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500">TORQUE · Gestão da oficina</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-torque-graphite sm:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p></div>{action}</div>;
}
