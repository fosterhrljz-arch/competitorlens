import { t } from "../lib/i18n.js";
import { useState } from 'react';
import { ArrowRight, FlaskConical, History } from 'lucide-react';
import { PageTitle, Badge, Button, Empty, Notice, SourceList } from './UI.jsx';
import { opportunities, changeOpportunity } from '../lib/model.js';
import { DemoNotice } from './Overview.jsx';
export default function Opportunities({
  project,
  update,
  view,
  selected,
  setSelected
}) {
  const [filter, setFilter] = useState('All'),
    [history, setHistory] = useState(false);
  const snapshots = opportunities(project, true),
    current = snapshots.filter(o => o.lifecycle === 'current');
  const all = history ? snapshots.filter(o => o.lifecycle !== 'current') : current;
  const items = filter === 'All' ? all : all.filter(o => o.status === filter);
  const active = items.find(o => o.id === selected) || items[0];
  const [noteDrafts, setNoteDrafts] = useState({});
  const change = (o, patch) => update(changeOpportunity(project, o.id, patch));
  function start(o) {
    change(o, {
      status: 'Investigating'
    });
    setFilter('All');
    setSelected(o.id);
    document.getElementById('validation-notes')?.focus();
  }
  return <><PageTitle title={t("Opportunities")} subtitle={t("Research questions and durable decisions. Every hypothesis keeps its context.")} /><DemoNotice demo={project.demo} />
    <div className="tabs page-tabs"><button className={!history ? 'active' : ''} onClick={() => {
        setHistory(false);
        setFilter('All');
      }}>{t("Current hypotheses")} <span>{current.length}</span></button><button className={history ? 'active' : ''} onClick={() => {
        setHistory(true);
        setFilter('All');
      }}><History size={15} />{t("History")} <span>{snapshots.length - current.length}</span></button></div>
    {history && <Notice>{t("Earlier snapshots remain here with their original notes and mapped evidence. Stale / Needs review means the research changed; it does not erase your previous decision.")}</Notice>}
    <div className="opportunity-status-summary" aria-label={t("Validation pipeline")}>{['To explore', 'Investigating', 'Validated', 'Dismissed'].map((status, i) => <button key={status} className={`pipeline-stage stage-${i}`} aria-label={t("Filter pipeline: {0}", {
        0: status
      })} aria-pressed={filter === status} onClick={() => setFilter(status)}><span>{t(status)}</span><strong>{all.filter(o => o.status === status).length}</strong><div className="pipeline-track"><i style={{
            width: `${all.length ? all.filter(o => o.status === status).length / all.length * 100 : 0}%`
          }} /></div></button>)}</div>
    <div className="tabs filter-tabs" aria-label={t("Opportunity status filters")}>{['All', 'To explore', 'Investigating', 'Validated', 'Dismissed'].map(s => <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{t(s)} <span>{s === 'All' ? all.length : all.filter(o => o.status === s).length}</span></button>)}</div>
    {items.length ? <div className="opportunity-workspace"><aside className="opportunity-list" aria-label={t("Hypotheses")}>{items.map(o => <button key={o.id} className={`opportunity-choice ${active?.id === o.id ? 'active' : ''}`} aria-pressed={active?.id === o.id} onClick={() => setSelected(o.id)}><div><span className="section-label">{t(o.category)}</span><Badge>{t(o.status)}</Badge></div><h2>{o.engine==='ai'&&!['reason','limitation'].includes('title')?o.title:t(o.title)}</h2><p>{o.engine==='ai'&&!['reason','limitation'].includes('short')?o.short:t(o.short)}</p><span className="small muted">{o.basis.length} {t("records \xB7")} {o.basis.reduce((n, b) => n + b.sources.length, 0)} {t("mapped sources")}</span>{o.lifecycle !== 'current' && <Badge>{t("Stale / Needs review")}</Badge>}</button>)}</aside>
      <article className="panel opportunity-detail"><div className="opportunity-header"><div className="horizontal"><span className="section-label">{t("Hypothesis \xB7 Revision")} {active.revision}</span><Badge>{active.demo ? t('Inferred · Demo evidence') : t('Inferred · Unverified research')}</Badge></div><h2>{active.engine==='ai'&&!['reason','limitation'].includes('title')?active.title:t(active.title)}</h2><p>{active.engine==='ai'&&!['reason','limitation'].includes('body')?active.body:t(active.body)}</p>{active.lifecycle !== 'current' && <Notice>{t("Stale / Needs review. This is an earlier research snapshot, not a current recommendation.")}</Notice>}<span className="chip">{['flexibility','research-depth'].includes(active.ruleKey)?t(active.audience):active.audience}</span></div>
      <section className="opportunity-section"><h3>{t("Why this was proposed")}</h3><p>{active.engine==='ai'&&!['reason','limitation'].includes('reason')?active.reason:t(active.reason)}</p><h3>{t("Recorded basis and mapped evidence")}</h3>{active.comparison && <div className="opportunity-comparison"><h4>{t("Competitor comparison")}</h4><p>{active.comparison}</p></div>}{active.recommendation && <div className="opportunity-recommendation"><h4>{t("Business recommendation")}</h4><p>{active.engine==='ai'&&!['reason','limitation'].includes('recommendation')?active.recommendation:t(active.recommendation)}</p></div>}{active.basis.map(b => <div className="evidence-line" key={b.competitorId}><h4>{b.name}</h4><p>{b.text}</p><p className="small muted">{t("One research record \xB7")} {b.sources.length} {t("mapped sources. Record wording alone is not a supporting source.")}</p>{b.sources.length > 0 && <details><summary>{t("Review snapshot evidence (")}{b.sources.length})</summary><SourceList competitor={{
                sources: b.sources,
                audienceResearch: []
              }} /></details>}{b.c && <button className="text-btn" onClick={() => view(b.c, 'Sources')}>{t("Open current competitor sources")} <ArrowRight size={14} /></button>}</div>)}</section>
      <section className="opportunity-section experiment"><h3><FlaskConical size={18} />{t("A practical validation step")}</h3><p>{active.engine==='ai'&&!['reason','limitation'].includes('experiment')?active.experiment:t(active.experiment)}</p><div className="assumption-limit"><strong>{t("What remains unknown")}</strong><p>{active.engine==='ai'&&!['reason','limitation'].includes('limitation')?active.limitation:t(active.limitation)}</p></div></section>
      <section className="opportunity-section validation"><div className="horizontal"><div><h3>{t("Your validation")}</h3><p className="muted">{t("Your assessment of this snapshot, not certification by the app.")}</p></div><select aria-label={t("Status for {0}", {
              0: active.title
            })} value={active.status} onChange={e => change(active, {
              status: e.target.value
            })}>{['To explore', 'Investigating', 'Validated', 'Dismissed'].map(s => <option key={s} value={s}>{t(s)}</option>)}</select></div><label className="field"><span>{t("Your validation notes")}</span><textarea id="validation-notes" rows={4} value={noteDrafts[active.id] ?? active.note} maxLength={5000} placeholder={t("Record your experiment, observations, and decision…")} onChange={e => {
              const note = e.target.value;
              setNoteDrafts(d => ({
                ...d,
                [active.id]: note
              }));
              change(active, {
                note
              });
            }} /><small>{t("Saved to this snapshot as you type. Check the workspace storage status.")}</small></label>{active.status === 'To explore' && active.lifecycle === 'current' && <Button variant="primary" icon={ArrowRight} onClick={() => start(active)}>{t("Start validation")}</Button>}</section></article>
    </div> : <Empty title={all.length ? t('No hypotheses in this status.') : history ? t('No earlier snapshots yet.') : t('Add evidence before looking for opportunities.')}>{history ? t('Validation work remains accessible here when research changes.') : t('Compare at least two records; gather evidence before making market claims.')}</Empty>}
    <Notice>{t("These transparent rules identify questions in your records. They do not establish demand, market share, or an underserved audience. History preserves decisions even after competitors or evidence are removed.")}</Notice>
  </>;
}
