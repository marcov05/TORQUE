import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return <p className="text-sm text-slate-500">{total} {total === 1 ? 'registro' : 'registros'}</p>;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
    <p className="text-sm text-slate-500">{total} registros · página {page} de {totalPages}</p>
    <div className="flex gap-2">
      <Button variant="secondary" className="min-h-10 px-3" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior"><ChevronLeft size={17} />Anterior</Button>
      <Button variant="secondary" className="min-h-10 px-3" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">Próxima<ChevronRight size={17} /></Button>
    </div>
  </div>;
}
