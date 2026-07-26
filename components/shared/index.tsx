'use client';
import { cn, gpaColor } from '@/lib/utils';
import { type LucideIcon, TrendingUp, TrendingDown, Minus, Loader2, SearchX, Plus } from 'lucide-react';
import Link from 'next/link';

export function StatCard({ title, value, icon: Icon, description, trend, iconClass='text-primary-500', href }: {
  title:string; value:string|number; icon:LucideIcon; description?:string;
  trend?:{pct:number;label?:string}; iconClass?:string; href?:string;
}) {
  const Wrap = (href ? Link : 'div') as any;
  return (
    <Wrap href={href} className={cn('stat-card', href && 'hover:shadow-elevated transition-shadow cursor-pointer')}>
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl bg-gray-50')}>
          <Icon className={cn('w-5 h-5', iconClass)} />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend.pct>0?'text-green-600':trend.pct<0?'text-red-500':'text-gray-400')}>
            {trend.pct>0 ? <TrendingUp className="w-3 h-3"/> : trend.pct<0 ? <TrendingDown className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
            {Math.abs(trend.pct)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </Wrap>
  );
}

export function PageHeader({ title, description, actions, breadcrumbs }: {
  title:string; description?:string; actions?:React.ReactNode;
  breadcrumbs?:{label:string;href?:string}[];
}) {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((b,i) => (
              <span key={i} className="flex items-center gap-1">
                {i>0 && <span>/</span>}
                {b.href ? <Link href={b.href} className="hover:text-gray-600">{b.label}</Link> : b.label}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon:Icon=SearchX, title, description, action }: {
  icon?:LucideIcon; title:string; description?:string;
  action?:{label:string;href?:string;onClick?:()=>void};
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-500 max-w-xs">{description}</p>}
      {action && (
        <div className="mt-5">
          {action.href
            ? <Link href={action.href} className="btn-primary text-sm px-4 py-2"><Plus className="w-4 h-4"/> {action.label}</Link>
            : <button onClick={action.onClick} className="btn-primary text-sm px-4 py-2"><Plus className="w-4 h-4"/> {action.label}</button>
          }
        </div>
      )}
    </div>
  );
}

export function Skeleton({ rows=5 }: { rows?:number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length:rows }).map((_,i) => (
        <div key={i} className="h-11 rounded-lg bg-gray-100" style={{ opacity: 1-i*0.15 }} />
      ))}
    </div>
  );
}

export function Spinner({ size='md' }: { size?:'sm'|'md'|'lg' }) {
  const s = { sm:'w-4 h-4', md:'w-5 h-5', lg:'w-7 h-7' }[size];
  return <Loader2 className={cn(s,'animate-spin text-primary-500')} />;
}

export function Badge({ label, className }: { label:string; className?:string }) {
  return <span className={cn('badge', className)}>{label}</span>;
}

export function GPABadge({ gpa }: { gpa:number }) {
  const color = gpa>=3.7?'badge-green':gpa>=2.0?'badge-blue':gpa>=1.0?'badge-yellow':'badge-red';
  return <span className={cn('badge font-bold', color)}>{gpa.toFixed(2)}</span>;
}

export function ConfirmModal({ open, title, desc, confirmLabel='تأكيد', onConfirm, onCancel, loading, danger=true }: {
  open:boolean; title:string; desc:string; confirmLabel?:string;
  onConfirm:()=>void; onCancel:()=>void; loading?:boolean; danger?:boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-box p-6 max-w-sm" onClick={e=>e.stopPropagation()}>
        <h2 className="text-base font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{desc}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>إلغاء</button>
          <button onClick={onConfirm} disabled={loading} className={cn('btn flex-1', danger?'btn-danger':'btn-primary')}>
            {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: {
  value:string; onChange:(v:string)=>void; placeholder?:string; className?:string;
}) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} className="input ps-9" />
    </div>
  );
}
