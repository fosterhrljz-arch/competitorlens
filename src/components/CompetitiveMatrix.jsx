import { t } from "../lib/i18n.js";
import { useState } from 'react';
import { ArrowUpRight, Check, Minus, Link2 } from 'lucide-react';
import { PageTitle, Empty, Avatar, Notice, Button } from './UI.jsx';
import { priceLabel, sourceFor, audienceRecord } from '../lib/model.js';
import { seriesColor } from '../lib/analytics.js';
import { comparable, fieldStatus, audienceCell } from '../lib/research.js';
import { ScopeSelector } from './AudienceMatrix.jsx';
import { DemoNotice } from './Overview.jsx';
const ROWS = [['audiences', 'Target audiences'], ['positioning', 'Positioning'], ['products', 'Products & services'], ['pricing', 'Starting price'], ['needs', 'Competitor-wide needs'], ['behavior', 'Competitor-wide buying behavior']];
const valueFor = (c, key) => key === 'pricing' ? priceLabel(c) : Array.isArray(c[key]) ? c[key].join(', ') || 'Not recorded' : c[key] || 'Not recorded';
export default function Matrix({
  project,
  view,
  openReport
}) {
  const [selected, setSelected] = useState(project.competitors.map(c => c.id));
  const [featuresOnly, setFeaturesOnly] = useState(false),
    [differences, setDifferences] = useState(false),
    [heatmap, setHeatmap] = useState(true);
  const cs = project.competitors.filter(c => selected.includes(c.id));
  const differs = values => new Set(values.map(comparable)).size > 1;
  const rows = featuresOnly ? [] : ROWS.filter(([key]) => !differences || differs(cs.map(c => valueFor(c, key))));
  const features = [...new Set(cs.flatMap(c => c.features.map(f => f.toLowerCase())))].filter(f => !differences || differs(cs.map(c => c.features.some(x => x.toLowerCase() === f))));
  return <><PageTitle title={t("Competitive matrix")} subtitle={t("Compare the same questions across every competitor.")}><Button onClick={() => openReport(selected)}>{t("Export this comparison")}</Button></PageTitle><DemoNotice demo={project.demo} /><ScopeSelector competitors={project.competitors} selected={selected} onChange={setSelected} />
    <div className="comparison-tools"><div><label className="inline-check"><input type="checkbox" checked={differences} onChange={e => setDifferences(e.target.checked)} />{t("Differences only")}</label><label className="inline-check"><input type="checkbox" checked={featuresOnly} onChange={e => setFeaturesOnly(e.target.checked)} />{t("Features only")}</label><label className="inline-check"><input type="checkbox" checked={heatmap} onChange={e => setHeatmap(e.target.checked)} />{t("Evidence shading")}</label></div><span>{t("Headers and comparison labels stay visible as you scroll.")}</span></div>
    {cs.length < 2 ? <Empty title={t("Choose at least two competitors.")}>{t("Select 2\u20135 competitors above to build your comparison.")}</Empty> : <section className="panel matrix-panel"><div className="matrix-scroll competitive-scroll" role="region" aria-label={t("Competitive comparison table")} tabIndex={0}><table className={`matrix ${heatmap ? 'evidence-heatmap' : ''}`}><thead><tr><th scope="col">{t("Comparison")}</th>{cs.map((c, i) => <th key={c.id} scope="col" style={{
                '--series': seriesColor(c)
              }}><button className="brand-link" onClick={() => view(c)}><Avatar name={c.name} index={i} /><span>{c.name}<small>{c.demo ? t('Demo record') : t("{0} sources", {
                        0: c.sources.length
                      })}</small></span></button></th>)}</tr></thead><tbody>
      {rows.map(([key, label]) => <tr key={key}><th scope="row">{t(label)}</th>{cs.map(c => <td key={c.id} className={`evidence-${key === 'audiences' && c.audiences.length && c.audiences.every(a => audienceCell(c, a) === 'linked') ? 'linked' : fieldStatus(c, key)}`}>{key === 'audiences' && c.audiences.length ? <div className="matrix-audiences">{c.audiences.map(a => <button className="text-btn" key={a} onClick={() => view(c, 'Sources', 'audiences', audienceRecord(c, a)?.id || '__unmapped')} aria-label={t("{0}: {1} \xB7 Review audience evidence", {
                    0: c.name,
                    1: a
                  })}><span>{a}</span><small>{sourceFor(c, 'audiences', audienceRecord(c, a)?.id || '__unmapped').length} {t("segment sources")}</small></button>)}</div> : <><p className={valueFor(c, key) === 'Not recorded' ? 'muted' : ''}>{valueFor(c,key)==='Not recorded'?t('Not recorded'):key==='pricing'?t(priceLabel(c)):valueFor(c,key)}</p>{key === 'pricing' && <p className="small muted">{t("Pricing notes:")} {c.pricing || t('Not recorded')}</p>}<button className="matrix-source text-btn" onClick={() => view(c, 'Sources', key)}><Link2 size={11} />{sourceFor(c, key).length} {t("sources")}</button></>}</td>)}</tr>)}
      {features.length > 0 && <tr className="matrix-section"><th colSpan={cs.length + 1}>{t("Recorded features")}</th></tr>}{features.map(f => <tr key={f}><th scope="row" className="capitalize">{f}</th>{cs.map(c => <td key={c.id} className={c.features.some(x => x.toLowerCase() === f) ? 'feature-listed' : 'feature-unknown'}>{c.features.some(x => x.toLowerCase() === f) ? <button className="feature-state text-btn" onClick={() => view(c, 'Sources', 'features')} aria-label={t("{0}: {1} \xB7 Review feature evidence", {
                  0: c.name,
                  1: f
                })}><Check size={15} />{t("Listed \xB7")} {sourceFor(c, 'features').length} {t("field sources")}</button> : <span className="feature-state muted"><Minus size={15} />{t("Not recorded")}</span>}</td>)}</tr>)}
      {!rows.length && !features.length && <tr><td colSpan={cs.length + 1}>{t("No differences in the selected fields. Missing values are still unknown.")}</td></tr>}
      <tr><th scope="row">{t("Evidence library")}</th>{cs.map(c => <td key={c.id}><button className="text-btn" onClick={() => view(c, 'Sources')}>{t("View")} {c.sources.length} {t("sources")} <ArrowUpRight size={13} /></button></td>)}</tr>
    </tbody></table></div><div className="comparison-key"><span><i className="legend-dot green" />{t("Source-linked")}</span><span><i className="legend-dot orange" />{t("Recorded only")}</span><span><i className="legend-dot gray" />{t("Not recorded")}</span><span>{t("Feature cells show listed / unknown.")}</span></div><div className="scroll-hint">{t("Scroll horizontally to compare all columns \u2192")}</div></section>}
    <Notice>{t("\u201CNot recorded\u201D means unknown, not unavailable. Differences compare recorded wording; they are not an automated judgment of product quality. Prices are not normalized across currencies, package sizes, or billing periods.")}</Notice>
  </>;
}
