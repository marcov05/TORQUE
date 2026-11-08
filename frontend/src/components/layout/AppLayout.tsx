import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bike, ClipboardList, Gauge, LogOut, Menu, Settings2, UserRound, Users, Wrench, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

const navigation = [
  { to: '/dashboard', label: 'Visão geral', icon: Gauge },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/motocicletas', label: 'Motocicletas', icon: Bike },
  { to: '/servicos', label: 'Serviços', icon: Wrench },
  { to: '/ordens-servico', label: 'Ordens de serviço', icon: ClipboardList },
];

function Brand() {
  return <div className="flex items-center gap-3 px-5 py-6">
    <span className="grid size-10 place-items-center rounded-xl bg-torque-red text-white shadow-lg shadow-red-950/20"><Settings2 size={21} strokeWidth={2.4} /></span>
    <span><strong className="block text-lg font-black tracking-[0.17em] text-white">TORQUE</strong><small className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Service management</small></span>
  </div>;
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTitle = navigation.find((item) => location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)))?.label ?? 'Perfil';

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [menuOpen]);

  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  const sidebar = <>
    <Brand />
    <nav aria-label="Navegação principal" className="mt-2 flex-1 space-y-1 px-3">
      {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        <Icon size={18} className="shrink-0" /><span>{label}</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-torque-red opacity-0 group-[.active]:opacity-100" />
      </NavLink>)}
    </nav>
    <div className="border-t border-white/10 p-3">
      <NavLink to="/perfil" onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><UserRound size={18} /><span>Meu perfil</span></NavLink>
      <button type="button" onClick={signOut} className="mt-1 flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><LogOut size={18} />Sair da conta</button>
    </div>
    <div className="px-5 pb-5 text-[11px] text-slate-500"><Activity size={13} className="mr-1 inline text-emerald-400" />Painel da oficina</div>
  </>;

  return <div className="min-h-screen bg-torque-offwhite lg:flex">
    <aside className="hidden h-screen w-64 shrink-0 flex-col bg-torque-graphite lg:sticky lg:top-0 lg:flex">{sidebar}</aside>
    {menuOpen && <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" aria-label="Fechar navegação" className="absolute inset-0 bg-slate-950/60" onClick={() => setMenuOpen(false)} />
      <aside className="relative flex h-full w-[min(19rem,88vw)] flex-col bg-torque-graphite shadow-2xl">{sidebar}<Button variant="ghost" className="absolute right-3 top-5 min-h-10 px-3 text-slate-200 hover:text-white" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></Button></aside>
    </div>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-9">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="-ml-2 px-2.5 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></Button>
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">TORQUE / OFICINA</p><h1 className="text-sm font-bold text-torque-graphite sm:text-base">{activeTitle}</h1></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3"><span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-800">{user?.nome}</span><span className="block text-xs text-slate-500">Equipe da oficina</span></span><span className="grid size-9 place-items-center rounded-full bg-torque-charcoal text-sm font-bold text-white" aria-hidden="true">{user?.nome.slice(0, 1).toUpperCase()}</span></div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-9"><Outlet /></main>
    </div>
  </div>;
}
