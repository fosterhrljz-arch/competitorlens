import { t, getLanguage } from "../lib/i18n.js";
import { sourceLabel, isDemoSource } from '../lib/provenance.js';
import { useEffect, useRef, useId, cloneElement } from 'react';
import { X, ArrowUpRight, Info, Search, FileText } from 'lucide-react';
import { sourceFor, FIELD_LABELS } from '../lib/model.js';
export function Button({
  children,
  variant = '',
  icon: Icon,
  className = '',
  ...props
}) {
  return <button className={`btn ${variant} ${className}`} {...props}>{Icon && <Icon size={16} />} {children}</button>;
}
export function Badge({
  children,
  dark = false,
  tone
}) {
  const words = (Array.isArray(children) ? children : [children]).filter(x => typeof x === 'string').join(' ');
  const color = tone || (/demo|演示/i.test(words) ? 'orange' : /inferred|推断/i.test(words) ? 'purple' : /public|linked|已关联|页面文本/i.test(words) ? 'green' : 'neutral');
  return <span className={`badge ${color} ${dark ? 'dark' : ''}`}>{children}</span>;
}
export function Empty({
  title,
  children,
  action
}) {
  return <div className="empty"><div className="empty-icon"><Search size={24} /></div><h3>{t(title)}</h3><p>{children}</p>{action}</div>;
}
export function Notice({
  children
}) {
  return <div className="notice"><Info size={17} /><div>{children}</div></div>;
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false
}) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current,
      previous = document.activeElement;
    el.showModal();
    const close = e => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', close);
    document.body.style.overflow = 'hidden';
    return () => {
      el.removeEventListener('cancel', close);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} aria-labelledby="modal-title"><header className="modal-head"><div><h2 id="modal-title">{t(title)}</h2>{subtitle && <p>{t(subtitle)}</p>}</div><button className="icon-btn" onClick={onClose} aria-label={t("Close dialog")}><X size={20} /></button></header>{children}</dialog>;
}
export function Field({
  label,
  hint,
  children,
  wide = false
}) {
  const id = useId();
  return <div className={`field ${wide ? 'span-2' : ''}`}><label htmlFor={id}>{t(label)}</label>{cloneElement(children, {
      id,
      'aria-describedby': hint ? `${id}-hint` : undefined
    })}{hint && <small id={`${id}-hint`}>{t(hint)}</small>}</div>;
}
export function SourceList({
  competitor,
  field,
  segmentId
}) {
  const sources = segmentId || field ? sourceFor(competitor, field, segmentId) : competitor.sources;
  if (!sources.length) return <p className="muted small">{t("No supporting source linked")}{field ? t(' to this field') : ''}{t(". Treat this as an unverified manual entry.")}</p>;
  return <div className="source-list">{sources.map((s, i) => <article className="source" key={s.id}><div className="source-title"><FileText size={15} /><strong>{s.title}</strong><Badge>{t(sourceLabel(s))}</Badge></div><blockquote>{s.excerpt}</blockquote><div className="source-meta">{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.url}<ArrowUpRight size={12} /></a> : <span>{isDemoSource(s) ? t('Fictional sample — no live URL') : t('No source URL recorded')}</span>}<span>{s.collectedAt && !isNaN(Date.parse(s.collectedAt)) ? new Date(s.collectedAt).toLocaleDateString(getLanguage(), {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : t('Date not recorded')}</span></div><div className="source-fields">{t("Competitor-wide:")} {s.fields.map(f => t(FIELD_LABELS[f])).join(', ') || t('No field mapping')}{s.segmentMappings?.map(m => <div key={m.segmentId}>{t("Audience:")} {competitor.audienceResearch?.find(a => a.id === m.segmentId)?.label || m.segmentId} · {m.fields.map(f => t(FIELD_LABELS[f])).join(', ')}</div>)}</div></article>)}</div>;
}
export function PageTitle({
  title,
  subtitle,
  children
}) {
  return <div className="page-title"><div><h1>{t(title)}</h1><p>{t(subtitle)}</p></div><div className="actions">{children}</div></div>;
}
export function Avatar({
  name,
  index = 0
}) {
  return <span className={`brand-avatar shade-${index % 4}`}>{name.slice(0, 1).toUpperCase()}</span>;
}
