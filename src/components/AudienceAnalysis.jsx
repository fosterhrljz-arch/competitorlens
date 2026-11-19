import { t } from "../lib/i18n.js";
import ResearchFindings from './ResearchFindings.jsx';
import { useState } from 'react';
import { AudienceBars, InsightCoverage } from './Charts.jsx';
import { ArrowRight, ArrowUpRight, Search, Link2 } from 'lucide-react';
import { PageTitle, Empty, Badge, Notice, SourceList } from './UI.jsx';
import { audienceGroups, sourceFor, audienceRecord } from '../lib/model.js';
import AudienceMatrix from './AudienceMatrix.jsx';
import { DemoNotice } from './Overview.jsx';
export default function Audience({
  project,
  selected,
  setSelected,
  view,
  edit
}) {
  const [filter, setFilter] = useState('all'),
    [query, setQuery] = useState(''),
    [evidence, setEvidence] = useState(null);
  const cs = filter === 'all' ? project.competitors : project.competitors.filter(c => c.id === filter);
  const groups = audienceGroups(cs).filter(g => g.label.toLowerCase().includes(query.toLowerCase()));
  const active = groups.find(g => g.key === selected) || groups[0];
  function select(key) {
    setSelected(key);
    setEvidence(null);
  }
  return <><PageTitle title={t("Audience analysis")} subtitle={t("Understand the needs behind each segment—and the evidence behind each insight.")}><select aria-label={t("Filter audience by competitor")} value={filter} onChange={e => {
        setFilter(e.target.value);
        setEvidence(null);
      }}><option value="all">{t("All competitors")}</option>{project.competitors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></PageTitle><DemoNotice demo={project.demo} />
    <div className="audience-layout"><aside className="panel segment-list"><div className="panel-title"><h2>{t("Segments")}</h2><p>{groups.length} {t("in this view")}</p></div><label className="search-field segment-search"><Search size={15} /><input aria-label={t("Find audience segment")} placeholder={t("Find a segment")} value={query} onChange={e => {
            setQuery(e.target.value);
            setEvidence(null);
          }} /></label>{groups.map(g => <button className={`segment-item ${active?.key === g.key ? 'active' : ''}`} key={g.key} aria-pressed={active?.key === g.key} onClick={() => select(g.key)}><div><strong>{g.label}</strong><span>{g.competitors.length} {t("of")} {cs.length} {t("records mention it")}</span></div><ArrowRight size={15} /></button>)}</aside>
      {active ? <div className="segment-content"><section className="panel segment-summary"><div className="horizontal"><div><span className="section-label">{t("Selected segment")}</span><h2>{active.label}</h2></div><Badge>{project.demo ? t('Demo · Qualitative') : t('Recorded audience')}</Badge></div><p>{t("Recorded for")} {active.competitors.map(c => c.name).join(', ')}.</p><div className="audience-brands">{active.competitors.map(c => <button className="chip" key={c.id} onClick={() => view(c, 'Audience')}>{c.name}<ArrowUpRight size={12} /></button>)}</div><p className="small muted">{t("Coverage counts records in this project, not people or market share.")}</p></section>
      <div className="audience-visual-grid"><AudienceBars competitors={cs} onSelect={select} /><InsightCoverage competitors={active.competitors} segmentLabel={active.label} view={view} /></div><div className="insight-grid">{[['needs', 'Customer needs', 'What problem are they trying to solve?'], ['motivations', 'Motivations', 'What might influence their choice?'], ['interests', 'Interests', 'What do the research notes mention?'], ['behavior', 'Purchasing behavior', 'What is observed, and what is only offered?']].map(([key, label, question]) => <section className="panel customer-insight" key={key}><h3>{t(label)}</h3><p className="insight-question">{t(question)}</p>{active.competitors.map(c => {
              const a = audienceRecord(c, active.label);
              return <article key={c.id}><div className="horizontal"><strong>{c.name}</strong><Badge>{c.demo ? t('Demo · Audience-specific') : t('Audience-specific')}</Badge></div><p>{a?.[key] || t('Not recorded for this audience.')}</p><ResearchFindings competitor={c} segment={active.label} field={key} /><button className="text-btn" onClick={() => setEvidence({
                  c,
                  field: key,
                  segmentId: a?.id || '__unmapped'
                })}><Link2 size={14} />{sourceFor(c, key, a?.id || '__unmapped').length} {t("mapped sources")} <ArrowRight size={14} /></button>{edit && <button className="text-btn" onClick={() => edit(c, 'Audience', a?.id)}>{t("Edit this audience")}</button>}</article>;
            })}</section>)}</div>
      {evidence && <section className="panel section-pad segment-evidence" aria-live="polite"><div className="horizontal"><h2>{evidence.c.name} {t("\xB7 Supporting evidence")}</h2><button className="text-btn" onClick={() => setEvidence(null)}>{t("Close evidence")}</button></div><SourceList competitor={evidence.c} field={evidence.field} segmentId={evidence.segmentId} /></section>}
      <AudienceMatrix key={active.key} competitors={cs} groups={[active]} view={view} title={t("Compare this audience")} />
      <section className="panel section-pad legacy-notes"><h2>{t("Competitor-wide notes")}</h2><p>{t("Separate context, including unchanged legacy notes. These do not establish needs for the selected audience.")}</p>{active.competitors.map(c => <details key={c.id}><summary>{c.name} {t("\xB7 General research")}</summary>{[['needs', 'Needs'], ['motivations', 'Motivations'], ['interests', 'Interests'], ['behavior', 'Buying behavior']].map(([key, label]) => <div key={key}><h3>{t(label)}</h3><p>{c[key] || t('Not recorded')}</p></div>)}<button className="text-btn" onClick={() => view(c, 'Audience')}>{t("Open competitor-wide research")}</button></details>)}</section><Notice>{t("Audience-specific insights are analyst research, not measured audience size or independent verification. Review the mapped evidence and its collection method.")}</Notice>
      </div> : <Empty title={query ? t('No matching segments.') : t('Make the audience visible.')}>{query ? t('Try another segment name.') : t('Add audience labels and customer research to competitor records.')}</Empty>}
    </div>
  </>;
}
