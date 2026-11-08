import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, PropsWithChildren } from 'react';
import { forwardRef } from 'react';

const controlClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-torque-graphite shadow-sm outline-none transition placeholder:text-slate-400 focus:border-torque-red focus:ring-2 focus:ring-torque-red/15 disabled:bg-slate-100';

interface FieldShellProps extends PropsWithChildren {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

function FieldShell({ label, htmlFor, required, error, hint, children }: FieldShellProps) {
  return <div className="min-w-0">
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">{label}{required && <span className="ml-1 text-torque-red" aria-hidden="true">*</span>}</label>
    {children}
    {error ? <p className="mt-1 text-sm text-red-700" role="alert">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>;
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, required, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <FieldShell label={label} htmlFor={inputId} required={required} error={error} hint={hint}>
    <input ref={ref} id={inputId} required={required} className={`${controlClass} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`} aria-invalid={Boolean(error)} {...props} />
  </FieldShell>;
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, required, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <FieldShell label={label} htmlFor={inputId} required={required} error={error}>
    <textarea ref={ref} id={inputId} required={required} className={`${controlClass} min-h-28 resize-y ${error ? 'border-red-400' : ''} ${className}`} aria-invalid={Boolean(error)} {...props} />
  </FieldShell>;
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function SelectField({ label, error, required, className = '', id, children, ...props }: SelectFieldProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <FieldShell label={label} htmlFor={inputId} required={required} error={error}>
    <select id={inputId} required={required} className={`${controlClass} ${error ? 'border-red-400' : ''} ${className}`} aria-invalid={Boolean(error)} {...props}>{children}</select>
  </FieldShell>;
}
