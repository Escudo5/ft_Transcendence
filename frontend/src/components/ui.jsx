import { useEffect } from 'react';


/* Los 12 componentes que pide el subject, son reutilizables*/

export function Button({ children, className = '', ...props }) {
  return (
    <button className={`ui-button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button className={`ui-button ui-button-secondary ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', as: Component = 'section', ...props }) {
  return (
    <Component className={`ui-card ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export function TextField({
  id,
  label,
  error,
  as: Component = 'input',
  className = '',
  ...props
}) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>{label}</label>
      <Component
        id={id}
        className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`.trim()}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  children,
  className = '',
  ...props
}) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`.trim()}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {children}
      </select>
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  );
}

export function Alert({ children, tone = 'error', className = '', ...props }) {
  return (
    <div className={`ui-alert ui-alert-${tone} ${className}`.trim()} role="alert" {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'default', className = '', ...props }) {
  return (
    <span className={`ui-badge ui-badge-${tone} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function Avatar({ src, alt = '', size = 'medium', className = '', children = '👤' }) {
  return (
    <span className={`ui-avatar ui-avatar-${size} ${className}`.trim()}>
      {src ? <img src={src} alt={alt} /> : children}
    </span>
  );
}

export function ProgressBar({ value = 0, className = '', ...props }) {
  const percentage = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={`ui-progress ${className}`.trim()}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin="0"
      aria-valuemax="100"
      {...props}
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

export function Modal({ children, open = true, onClose, labelledBy, className = '' }) {
  useEffect(() => {
    if (!open || !onClose) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div className={`ui-modal ${className}`.trim()} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function StatusDot({ status = 'offline', label, className = '' }) {
  return (
    <span className={`ui-status ui-status-${status} ${className}`.trim()}>
      <span className="ui-status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function IconButton({ children, label, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`ui-button ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
