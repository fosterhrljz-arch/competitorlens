import { t, getLanguage } from "../lib/i18n.js";
import ResearchFindings from './ResearchFindings.jsx';
import { useState } from 'react';
import { seriesColor } from '../lib/analytics.js';
import { PriceComparison, PositioningChart } from './Charts.jsx';
import { Plus, Search, ArrowRight, ArrowLeft, ArrowUpRight, Pencil, Trash2, FileText, Link2 } from 'lucide-react';
import { PageTitle, Button, Empty, Badge, SourceList, Avatar, Notice } from './UI.jsx';
import { priceLabel, domain, sourceFor, FIELD_LABELS } from '../lib/model.js';
import { researchStatus, CORE_FIELDS, fieldStatus, STATUS_LABEL } from '../lib/research.js';
import { DemoNotice, ProgressRow } from './Overview.jsx';
export function Competitors({
  project,
  add,
  view,
  edit,
  go
}) {
  const [query, setQuery] = useState(''),
    [sort, setSort] = useState('name'),
    [layout, setLayout] = useState('profiles');
  const cs = project.competitors.filter(c => [c.name, c.url, c.positioning, ...c.audiences].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'evidence' ? b.sources.length - a.sources.length : sort === 'gaps' ? researchStatus([b]).gaps.length - researchStatus([a]).gaps.length : a.name.localeCompare(b.name));
  return <><PageTitle title={t("Competitors")} subtitle={t("Understand each offer. See where your research needs work.")}><Button icon={Search} onClick={() => go('research')}>{t("Research websites")}</Button><Button onClick={() => go('data')}>{t("Import CSV")}</Button><Button variant="primary" icon={Plus} disabled={project.competitors.length >= 5} onClick={add}>{t("Add competitor")}</Button></PageTitle><DemoNotice demo={project.demo} />
    <div className="tabs page-tabs" aria-label={t("Competitor view")}><button className={layout === 'profiles' ? 'active' : ''} aria-pressed={layout === 'profiles'} onClick={() => setLayout('profiles')}>{t("Profiles")}</button><button className={layout === 'analytics' ? 'active' : ''} aria-pressed={layout === 'analytics'} onClick={() => setLayout('analytics')}>{t("Pricing & positioning")}</button></div><div className="toolbar"><label className="search-field"><Search size={17} /><input aria-label={t("Search competitors")} placeholder={t("Search names, audiences, or positioning")} value={query} onChange={e => setQuery(e.target.value)} /></label><div className="actions"><span className="muted small">{project.competitors.length} {t("of 5 competitors")}</span><select aria-label={t("Sort competitors")} value={sort} onChange={e => setSort(e.target.value)}><option value="name">{t("Name: A\u2013Z")}</option><option value="evidence">{t("Most evidence")}</option><option value="gaps">{t("Research gaps first")}</option></select></div></div>
    {layout === 'analytics' ? <div className="competitor-analytics"><PriceComparison competitors={cs} view={view} /><PositioningChart competitors={cs} onSelect={view} /></div> : cs.length ? <div className="competitor-cards">{cs.map((c, i) => {
        const status = researchStatus([c]);
        return <article className="panel competitor-card" key={c.id} style={{
          '--series': seriesColor(c)
        }}>
      <header><Avatar name={c.name} index={i} /><div><button className="card-name" onClick={() => view(c)}>{c.name}</button><span>{domain(c.url)}</span></div><Badge>{c.demo ? t('Demo') : t('Analyst record')}</Badge></header>
      <p className="card-positioning">{c.positioning || t('Positioning has not been recorded.')}</p>
      <div className="card-audiences">{c.audiences.length ? c.audiences.map(a => <span className="chip" key={a}>{a}</span>) : <span className="muted small">{t("No audience segments recorded")}</span>}</div>
      <dl className="card-facts"><div><dt>{t("Offer")}</dt><dd>{c.products || t('Not recorded')}</dd></div><div><dt>{t("Starting price")}</dt><dd>{t(priceLabel(c))}</dd></div></dl>
      <div className="card-research"><ProgressRow label={t("Core fields with linked evidence")} value={status.linked} total={status.total} /><button className="text-btn" onClick={() => view(c, 'Sources')}><FileText size={14} />{c.sources.length} {c.demo ? t('sample sources') : t('sources')} <ArrowUpRight size={12} /></button>{status.gaps.length > 0 && <button className="text-btn" onClick={() => edit(c, 'Evidence')}>{status.gaps.length} {t("fields to review")}</button>}</div>
      <footer><button className="text-btn" onClick={() => edit(c)}><Pencil size={14} />{t("Edit research")}</button><button className="text-btn" onClick={() => view(c)}>{t("View competitor")} <ArrowRight size={15} /></button></footer>
    </article>;
      })}</div> : <Empty title={query ? t('No matching competitors.') : t('Build your comparison, one competitor at a time.')} action={!query && <Button onClick={add} icon={Plus}>{t("Add your first competitor")}</Button>}>{query ? t('Try another name, audience, or positioning phrase.') : t('Start with a website or a manual record. Two to five competitors make a useful comparison.')}</Empty>}
    <Notice>{t("Pricing remains in its recorded currency, package size, and billing terms. A source link is supporting context, not independent verification.")}</Notice>
  </>;
}
export function CompetitorDetails({
  competitor: c,
  index = 0,
  initialTab = 'Overview',
  initialField = '',
  initialSegment = '',
  onBack,
  onEdit,
  onDelete
}) {
  const [tab, setTab] = useState(initialTab),
    [field, setField] = useState(initialField),
    [segmentId, setSegmentId] = useState(initialSegment);
  const status = researchStatus([c]);
  function showSources(key) {
    setSegmentId('');
    setField(key);
    setTab('Sources');
  }
  return <div className="competitor-detail" style={{
    '--series': seriesColor(c)
  }}><button className="text-btn back-link" onClick={onBack}><ArrowLeft size={15} />{t("All competitors")}</button>
    <div className="detail-heading"><Avatar name={c.name} index={index} /><div><h1>{c.name}</h1>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{domain(c.url)} <ArrowUpRight size={13} /></a> : <p>{t("Manual competitor research")}</p>}</div><div className="actions"><Badge>{c.demo ? t('Fictional demo record') : t('Analyst record')}</Badge><Button icon={Pencil} variant="primary" onClick={() => onEdit(c)}>{t("Edit competitor")}</Button></div></div>
    <p className="detail-positioning">{c.positioning || t('Positioning not recorded.')}</p>
    <nav className="tabs page-tabs" aria-label={t("Competitor sections")}>{['Overview', 'Audience', 'Sources'].map(itemLabel => <button key={itemLabel} aria-current={tab === itemLabel ? 'page' : undefined} className={tab === itemLabel ? 'active' : ''} onClick={() => setTab(itemLabel)}>{t(itemLabel)}{itemLabel === 'Sources' ? ` (${c.sources.length})` : ''}</button>)}</nav>
    <div className="detail-layout"><div className="detail-main">{tab === 'Sources' ? <section className="panel section-pad"><div className="horizontal source-heading"><div><h2>{t("Supporting evidence")}</h2><p className="muted small">{t("Read the context behind each recorded claim.")}</p></div><select aria-label={t("Filter sources by field")} value={field} onChange={e => setField(e.target.value)}><option value="">{t("All fields")}</option>{Object.entries(FIELD_LABELS).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></div><label className="field">{t("Evidence audience scope")}<select aria-label={t("Filter evidence audience scope")} value={segmentId} onChange={e => setSegmentId(e.target.value)}><option value="">{field ? t("Competitor-wide fields") : t("All evidence")}</option>{c.audienceResearch?.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label><SourceList competitor={c} field={field || undefined} segmentId={segmentId} /><Button icon={Plus} onClick={() => onEdit(c, 'Evidence')}>{t("Add or manage evidence")}</Button></section> : <section className="panel detail-fields">{tab === 'Audience' && <div className="detail-field"><h2>{t("Competitor-wide notes")}</h2><p>{t("General context, including unchanged legacy research. These notes are not automatically assigned to an audience.")}</p></div>}
      {(tab === 'Overview' ? [['products', 'Products & services'], ['pricing', 'Pricing'], ['features', 'Features'], ['advantages', 'Competitive advantages'], ['notes', 'Research notes']] : [['audiences', 'Audience segments'], ['needs', 'Customer needs'], ['motivations', 'Motivations'], ['interests', 'Interests'], ['behavior', 'Purchasing behavior']]).map(([key, label]) => <article className="detail-field" key={key}><div className="horizontal"><h2>{t(label)}</h2><button className="text-btn small" onClick={() => showSources(key)}><Link2 size={13} />{sourceFor(c, key).length} {t("linked sources")}</button></div>{Array.isArray(c[key]) ? <div className="chips">{c[key].length ? c[key].map(x => <span className="chip" key={x}>{x}</span>) : <span className="muted">{t("Not recorded")}</span>}</div> : <p>{key === 'pricing' ? priceLabel(c) : c[key] || t('Not recorded')}</p>}{key === 'pricing' && <p className="muted">{t("Pricing notes:")} {c.pricing || t('Not recorded')}</p>}{key === 'pricing' && c.priceNoteReview?.reason && <p>{t("Analyst pricing review:")} {c.priceNoteReview.reason}</p>}</article>)}
      {tab === 'Audience' && c.audienceResearch?.map(a => <section className="detail-field audience-detail" key={a.id}><h2>{t("Audience-specific:")} {a.label}</h2>{['needs', 'motivations', 'interests', 'behavior'].map(key => <div key={key}><h3>{t(FIELD_LABELS[key])}</h3><p>{a[key] || t('Not recorded for this audience.')}</p></div>)}<div className="actions"><Button onClick={() => onEdit(c, 'Audience', a.id)}>{t("Edit this audience")}</Button><Button onClick={() => {
                setSegmentId(a.id);
                setField('');
                setTab('Sources');
              }}>{t("Review audience evidence")}</Button></div></section>)}
      {tab === 'Overview' && <div className="detail-field"><h2>{t("Qualitative positioning")}</h2><div className="assessment-pair"><span>{t("Offering breadth")}<strong>{c.breadth === '' ? t('Not assessed') : `${c.breadth} / 5`}</strong></span><span>{t("Price positioning")}<strong>{c.tier === '' ? t('Not assessed') : `${c.tier} / 5`}</strong></span></div><p className="muted small">{t("Analyst assessments, not measured market metrics.")}</p></div>}
    </section>}<ResearchFindings competitor={c} /></div>
    <aside className="context-rail"><h2>{t("Research coverage")}</h2><ProgressRow label={t("Core fields linked")} value={status.linked} total={status.total} /><div className="coverage-checks">{CORE_FIELDS.map(([key, label]) => <button key={key} onClick={() => showSources(key)}><span className={`status-symbol ${fieldStatus(c, key)}`}>{fieldStatus(c, key) === 'missing' ? '—' : ''}</span><span>{t(label)}</span><small>{t(STATUS_LABEL[fieldStatus(c, key)])}</small></button>)}</div><p className="small muted">{t("Linked sources support review. They do not verify the claims.")}</p><div className="context-section"><h3>{t("Record context")}</h3><p>{c.demo ? t('All content in this record is fictional demo research.') : t('This record contains user-entered research and analyst assessments.')}</p><p>{t("Last edited:")} {isNaN(Date.parse(c.updatedAt)) ? t('Not recorded') : new Date(c.updatedAt).toLocaleDateString(getLanguage(), {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</p></div><Button variant="danger-quiet" icon={Trash2} onClick={() => onDelete(c)}>{t("Delete competitor")}</Button></aside></div>
    <Notice>{t("Customer needs, motivations, and buying behavior are qualitative research notes. Check the source before treating an assumption as a fact.")}</Notice>
  </div>;
}
