import type { ReactNode } from 'react';

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm"><thead><tr>{headers.map((header) => <th key={header} scope="col" className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 first:pl-5">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>;
}

export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 first:pl-5 ${className}`}>{children}</td>;
}
