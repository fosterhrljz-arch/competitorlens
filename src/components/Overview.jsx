import { t } from "../lib/i18n.js";
import { useState } from 'react';
import { ArrowRight, Download, Plus, Info, Lightbulb } from 'lucide-react';
import { Button, PageTitle, Badge, Empty, Notice } from './UI.jsx';
import { opportunities } from '../lib/model.js';
import AudienceMatrix, { ScopeSelector } from './AudienceMatrix.jsx';
import { SummaryMetrics, AudienceBars, PositioningChart, ResearchDonut, RecentActivity, ChartHeading } from './Charts.jsx';
export const Landscape = PositioningChart;
export function ProgressRow({
  label,
  value,
  total
}) {
  return <div className="progress-row"><div><span>{t(label)}</span><strong>{value}/{total}</strong></div><progress max={total || 1} value={value} aria-label={label} /></div>;
}
export function DemoNotice({
  demo,
  onNew
}) {
  return demo ? <div className="demo-banner"><Info size={16} /><span><strong>{t("Demo project")}</strong> {t("\xB7 Fictional businesses and sample evidence.")}</span>{onNew && <button onClick={onNew}>{t("Create your project")} <ArrowRight size={14} /></button>}</div> : null;
}
export default function Overview({
  project,
  add,
  view,
  go,
  newProject,
  openOpportunity,
  openAudience,
  openReport,
  preview = false
}) {
  const [selected, setSelected] = useState(project.competitors.map(c => c.id));
  const cs = project.competitors.filter(c => selected.includes(c.id));
  const ops = opportunities(project),
    pending = ops.filter(o => !['Validated', 'Dismissed'].includes(o.status));
  const ordered = [...pending].sort((a, b) => Number(b.category === 'Audience research') - Number(a.category === 'Audience research'));
  return <div className="analytics-overview"><PageTitle title={t("Market overview")} subtitle={t("{0} \xB7 Turn competitor research into your next move.", {
      0: project.industry || 'Competitive research'
    })}>{!preview && <Button onClick={() => go('research')}>{t("Research websites")}</Button>}<Button icon={Download} onClick={() => openReport ? openReport(cs.map(c => c.id)) : go('reports')}>{t("Export report")}</Button><Button variant="primary" icon={Plus} onClick={add} disabled={project.competitors.length >= 5}>{t("Add competitor")}</Button></PageTitle>
    <DemoNotice demo={project.demo} onNew={preview ? undefined : newProject} />
    {!preview && !project.demo && (project.competitors.length < 2 || !project.competitors.some(c => c.audienceResearch?.some(a => a.needs || a.behavior))) && <section className="panel onboarding"><h2>{t("Build your first comparison")}</h2><p>{t("A URL starts a research record. It does not generate traffic statistics or verified audience data. Collect public website content with Automated Research, add reviewed notes, or import a CSV.")}</p><ol><li><strong>{project.competitors.length >= 2 ? '✓' : '1'} {t("\xB7 Add 2\u20135 competitors")}</strong><Button onClick={add} disabled={project.competitors.length >= 5}>{t("Add competitor")}</Button><Button onClick={() => go('research')}>{t("Research websites")}</Button><Button onClick={() => go('data')}>{t("Import CSV")}</Button></li><li><strong>{t("2 \xB7 Record audience-specific insights")}</strong><span>{t("Choose an audience in the editing workspace.")}</span></li><li><strong>{t("3 \xB7 Map evidence, compare, and validate")}</strong><span>{t("Fetch may be blocked by CORS or redirects. Manual paste works offline.")}</span></li></ol></section>}
    <ScopeSelector competitors={project.competitors} selected={selected} onChange={setSelected} />
    <SummaryMetrics project={project} competitors={cs} onNavigate={go} />
    {cs.length > 0 ? <><div className="analytics-chart-grid"><PositioningChart competitors={cs} onSelect={view} /><AudienceBars competitors={cs} onSelect={key => openAudience?.(key)} compact={preview} /></div>
    <AudienceMatrix competitors={cs} view={view} onExplore={() => go('audience')} title={t("Audience × Competitor heatmap")} /></> : <Empty title={t("Your project is ready for research.")} action={<Button onClick={add}>{t("Add your first competitor")}</Button>}>{t("Start with a name, URL, or CSV. Unknown data stays unknown.")}</Empty>}
    {!preview && <div className="analytics-bottom-grid"><section className="panel research-brief"><ChartHeading title={t("Key opportunities")} subtitle={t("Project-wide hypotheses, not proven market gaps")} /><div className="opportunity-digest">{ordered.length ? ordered.map((o, i) => <article key={o.id}><span className={`digest-icon ${i % 2 ? 'purple' : 'orange'}`}><Lightbulb size={18} /></span><div><h3>{o.engine==='ai'&&!['reason','limitation'].includes('title')?o.title:t(o.title)}</h3><p>{o.engine==='ai'&&!['reason','limitation'].includes('short')?o.short:t(o.short)}</p><Badge>{t("Inferred")}{project.demo ? t(' · Demo') : ''}</Badge></div><button className="text-btn" onClick={() => openOpportunity(o.id)} aria-label={i === 0 ? t('Review hypothesis') : t("Review {0}", {
              0: o.title
            })}>{t("Review")} <ArrowRight size={13} /></button></article>) : <div className="digest-empty"><h3>{ops.length ? t('Your hypotheses are reviewed.') : t('Start with a useful comparison.')}</h3><p>{ops.length ? t('Revisit your decisions as new evidence arrives.') : t('Add at least two competitors to generate evidence-led research questions.')}</p><Button onClick={() => project.competitors.length < 2 ? add() : go('opportunities')}>{project.competitors.length < 2 ? t('Add competitor') : t('Review opportunities')}</Button></div>}</div></section>
      <ResearchDonut competitors={cs} view={view} /><RecentActivity competitors={cs} view={view} /></div>}
    {!preview && <p className="credibility-note"><Info size={15} /><span>{t("Source-linked records are not independently verified. Hypotheses are inferred. Demo content is fictional. No traffic, demographic, or market-share estimates.")}</span></p>}
  </div>;
}
