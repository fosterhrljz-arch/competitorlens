import { t, getLanguage } from "../lib/i18n.js";
import { audienceRecord } from '../lib/model.js';
import { useState } from 'react';
import { Users, Layers, FileText, Lightbulb, ArrowRight, Clock3, Info } from 'lucide-react';
import { Empty } from './UI.jsx';
import { researchStatus, fieldStatus, CORE_FIELDS } from '../lib/research.js';
import { SERIES_COLORS, seriesColor, summaryMetrics, audienceSeries, priceGroups, researchActivity, insightCoverage } from '../lib/analytics.js';
export function ChartHeading({
  title,
  subtitle,
  children
}) {
  return <div className="chart-heading"><div><h2>{t(title)}</h2>{subtitle && <p>{t(subtitle)}</p>}</div>{children}</div>;
}
export function SummaryMetrics({
  project,
  competitors,
  onNavigate
}) {
  const m = summaryMetrics(project, competitors);
  const items = [['competitors', 'Competitors', m.competitors, 'In this comparison', Users, 'blue'], ['audience', 'Audience segments', m.audiences, 'Recorded labels, not people', Layers, 'green'], ['competitors', 'Evidence records', m.sources, 'Sources to review', FileText, 'purple'], ['opportunities', 'Open hypotheses', m.open, 'Project-wide · require validation', Lightbulb, 'orange']];
  return <div className="summary-metrics">{items.map(([page, label, value, hint, Icon, tone]) => <button key={label} className={`panel summary-metric ${tone}`} onClick={() => onNavigate?.(page)}><span className="metric-icon"><Icon size={23} /></span><span><strong>{value}</strong><b>{t(label)}</b><small>{t(hint)}</small></span></button>)}</div>;
}
export function AudienceBars({
  competitors,
  onSelect,
  compact = false
}) {
  const [mode, setMode] = useState('mentions');
  const groups = audienceSeries(competitors, mode === 'linked');
  return <section className={`panel audience-bars ${compact ? 'compact' : ''}`}>
    <ChartHeading title={t("Audience comparison")} subtitle={mode === 'linked' ? t('Records with a mapped audience source') : t('Competitor records mentioning each audience')}>
      {!compact && <select aria-label={t("Audience chart measure")} value={mode} onChange={e => setMode(e.target.value)}><option value="mentions">{t("All mentions")}</option><option value="linked">{t("Source-linked")}</option></select>}
    </ChartHeading>
    {groups.length ? <div className="bar-chart"><div className="bar-rows">{groups.map((g, i) => <button key={g.key} className="bar-row" onClick={() => onSelect?.(g.key)} aria-label={t("{0}: {1} of {2} records", {
          0: g.label,
          1: g.count,
          2: competitors.length
        })} style={{
          '--series': SERIES_COLORS[i % SERIES_COLORS.length]
        }}><span className="bar-label">{g.label}</span><span className="bar-track"><span className="bar-fill" style={{
              width: `${g.count / Math.max(1, competitors.length) * 100}%`
            }} /></span><strong>{g.count}</strong><span className="chart-tooltip">{g.label}: {g.count} {t("of")} {competitors.length} {t("records")}{mode === 'linked' ? t(' with an audience source') : t(' mention this audience')}{t(". Not audience size.")}</span></button>)}</div><div className="bar-axis"><span /><div>{Array.from({
            length: competitors.length + 1
          }, (_, n) => <span key={n}>{n}</span>)}</div><span /></div><p className="chart-caption">{t("Number of competitor records \xB7 Select a bar to explore")}</p></div> : <Empty title={t("No audiences recorded yet.")}>{t("Add audience labels to your competitor research.")}</Empty>}
  </section>;
}
export function PositioningChart({
  competitors,
  onSelect
}) {
  const [mode, setMode] = useState(competitors.some(c => c.breadth !== '' && c.tier !== '') ? 'position' : 'research');
  const research = mode === 'research',
    maxFeatures = Math.max(1, ...competitors.map(c => c.features.length)),
    maxAudiences = Math.max(1, ...competitors.map(c => c.audiences.length));
  const integerTicks = max => [...new Set([0, Math.round(max / 4), Math.round(max / 2), Math.round(max * .75), max])];
  const plotted = competitors.filter(c => research || c.breadth !== '' && (mode === 'evidence' || c.tier !== ''));
  const maxSources = Math.max(1, ...competitors.map(c => c.sources.length));
  const groups = new Map();
  for (const c of plotted) {
    const x = research ? c.features.length / maxFeatures * 100 : (Number(c.breadth) - 1) / 4 * 100;
    const y = research ? c.audiences.length / maxAudiences * 100 : mode === 'position' ? (Number(c.tier) - 1) / 4 * 100 : c.sources.length / maxSources * 100;
    const key = `${x}:${y}`;
    if (!groups.has(key)) groups.set(key, {
      key,
      x,
      y,
      records: []
    });
    groups.get(key).records.push(c);
  }
  const yTicks = research ? integerTicks(maxAudiences) : mode === 'position' ? [1, 2, 3, 4, 5] : Array.from({
    length: maxSources + 1
  }, (_, n) => n);
  // Large source libraries need only five tick labels, but never fractional source counts.
  const ticks = yTicks.length <= 6 ? yTicks : [...new Set([0, Math.round(maxSources / 4), Math.round(maxSources / 2), Math.round(maxSources * .75), maxSources])];
  return <section className="panel positioning-chart"><ChartHeading title={t("Competitor positioning")} subtitle={research ? t("Recorded feature and audience coverage") : t("Qualitative analyst assessments")}><select aria-label={t("Landscape axes")} value={mode} onChange={e => setMode(e.target.value)}><option value="research">{t("Features vs. audiences")}</option><option value="position">{t("Price vs. breadth")}</option><option value="evidence">{t("Evidence vs. breadth")}</option></select></ChartHeading>
    {plotted.length ? <><div className="scatter-chart"><span className="scatter-y-title">{research ? t('Recorded audiences') : mode === 'position' ? t('Price positioning') : t('Recorded sources')}</span><div className="scatter-grid">
      {[0, 25, 50, 75, 100].map(n => <div key={n} className="scatter-line vertical" style={{
            left: `${n}%`
          }} />)}
      {ticks.map(n => {
            const y = research ? n / maxAudiences * 100 : mode === 'position' ? (n - 1) / 4 * 100 : n / maxSources * 100;
            return <div key={n} className="scatter-line horizontal" style={{
              bottom: `${y}%`
            }}><span>{n}</span></div>;
          })}
      {(research ? integerTicks(maxFeatures) : [1, 2, 3, 4, 5]).map(n => <span key={n} className="scatter-x-tick" style={{
            left: `${research ? n / maxFeatures * 100 : (n - 1) / 4 * 100}%`
          }}>{n}</span>)}
      {[...groups.values()].map(g => <div key={g.key} className={`scatter-group ${g.x > 65 ? 'label-left' : ''} ${g.y < 45 ? 'labels-above' : ''}`} style={{
            left: `${g.x}%`,
            bottom: `${g.y}%`,
            '--series': seriesColor(g.records[0])
          }}><i /><div className="scatter-labels">{g.records.map(c => <button key={c.id} className="plot-point" onClick={() => onSelect?.(c)} aria-label={t("View {0} positioning", {
                0: c.name
              })} style={{
                color: seriesColor(c)
              }}><span>{c.name}</span><span className="chart-tooltip">{c.name} · {research ? t("{0} recorded features \xB7 {1} recorded audiences", {
                    0: c.features.length,
                    1: c.audiences.length
                  }) : t("Breadth {0}/5 \xB7 {1}", {
                    0: c.breadth,
                    1: mode === 'position' ? `Price positioning ${c.tier}/5` : `${c.sources.length} sources`
                  })}</span></button>)}</div></div>)}
    </div><span className="scatter-x-title">{research ? t('Recorded features · not product quality') : t('Offering breadth · focused → broad')}</span></div><p className="chart-caption"><span className="y-label top">{research ? t('Coverage of this research set') : mode === 'evidence' ? t("{0} sources", {
            0: maxSources
          }) : t('Price: 1 accessible → 5 premium')}</span> {t("\xB7 Not traffic or market share.")}{plotted.length < competitors.length ? t(" {0} unassessed.", {
          0: competitors.length - plotted.length
        }) : ''}</p></> : <Empty title={t("Positioning is not assessed yet.")}>{t("Add breadth and price assessments to place a competitor on the map.")}</Empty>}
  </section>;
}
export function ResearchDonut({
  competitors,
  view
}) {
  const status = researchStatus(competitors),
    [selected, setSelected] = useState(null);
  const slices = [{
    key: 'linked',
    label: 'Linked',
    count: status.linked,
    color: '#2563eb'
  }, {
    key: 'recorded',
    label: 'Recorded only',
    count: status.recorded - status.linked,
    color: '#ed8a32'
  }, {
    key: 'missing',
    label: 'Missing',
    count: status.total - status.recorded,
    color: '#cbd5e1'
  }];
  let offset = 0;
  return <section className="panel research-status"><ChartHeading title={t("Research coverage")} subtitle={t("Six core fields per competitor")} /><div className="coverage-donut-layout"><svg className="coverage-donut" viewBox="0 0 140 140" role="img" aria-label={t("{0} of {1} core fields have linked sources", {
        0: status.linked,
        1: status.total
      })}><circle cx="70" cy="70" r="51" fill="none" stroke="#e9edf4" strokeWidth="14" />{slices.map(s => {
          const amount = status.total ? s.count / status.total * 320.442 : 0;
          const start = offset;
          offset += amount;
          return <circle key={s.key} cx="70" cy="70" r="51" fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${amount} ${320.442 - amount}`} strokeDashoffset={-start} transform="rotate(-90 70 70)"><title>{t(s.label)}: {s.count} {t("core fields")}</title></circle>;
        })}<text x="70" y="72" textAnchor="middle" className="donut-value">{status.linked}/{status.total}</text><text x="70" y="89" textAnchor="middle" className="donut-label">{t("source-linked")}</text></svg><div className="donut-legend">{slices.map(s => <button key={s.key} aria-pressed={selected === s.key} onClick={() => setSelected(selected === s.key ? null : s.key)}><i style={{
            background: s.color
          }} /><span>{t(s.label)}</span><strong>{s.count}</strong></button>)}</div></div><p className="chart-caption">{t("Linked does not mean verified. Select a status to inspect.")}</p>{selected && <div className="coverage-drilldown">{competitors.filter(c => CORE_FIELDS.some(([key]) => fieldStatus(c, key) === selected)).map(c => <button key={c.id} onClick={() => view?.(c, 'Sources')}><span>{c.name}</span><strong>{CORE_FIELDS.filter(([key]) => fieldStatus(c, key) === selected).length} {t("fields")}</strong><ArrowRight size={13} /></button>)}{!competitors.some(c => CORE_FIELDS.some(([key]) => fieldStatus(c, key) === selected)) && <p>{t("No fields with this status.")}</p>}</div>}</section>;
}
export function PriceComparison({
  competitors,
  view
}) {
  const groups = priceGroups(competitors),
    [selected, setSelected] = useState('');
  const group = groups.find(g => g.key === selected) || groups[0];
  const max = Math.max(1, ...(group?.records.map(c => Number(c.priceAmount)) || []));
  return <section className="panel price-comparison"><ChartHeading title={t("Recorded pricing")} subtitle={t("Compare starting amounts with matching currency and units")}>{groups.length > 0 && <select aria-label={t("Price comparison unit")} value={group.key} onChange={e => setSelected(e.target.value)}>{groups.map(g => <option key={g.key} value={g.key}>{g.currency} / {g.unit} · {g.records.length} {t("records")}</option>)}</select>}</ChartHeading>
    {group ? <><div className="bar-chart">{group.records.map(c => <button className="bar-row price-bar" key={c.id} style={{
          '--series': seriesColor(c)
        }} onClick={() => view(c, 'Sources', 'pricing')} aria-label={t("{0}: {1} {2} per {3}", {
          0: c.name,
          1: c.priceAmount,
          2: group.currency,
          3: group.unit
        })}><span className="bar-label">{c.name}</span><span className="bar-track"><span className="bar-fill" style={{
              width: `${Number(c.priceAmount) / max * 100}%`
            }} /></span><strong>{Number(c.priceAmount).toLocaleString(getLanguage())}</strong><span className="chart-tooltip">{c.name}: {c.priceAmount} {group.currency} / {group.unit}{t(". Select to review pricing evidence.")}</span></button>)}<p className="chart-caption">{group.currency} {t("per")} {group.unit} {t("\xB7 Baseline 0 \xB7 No currency or package conversion")}</p></div><div className="chart-note"><Info size={15} /><span>{competitors.length - group.records.length} {t("records outside this unit group or without numeric pricing. Unresolved or incomplete prices are excluded. Recorded amounts may have different conditions; review sources before comparing.")}</span></div></> : <Empty title={t("Numeric pricing is not recorded.")}>{t("Add starting amounts, currencies, and units. Written pricing summaries remain available in each profile.")}</Empty>}
  </section>;
}
export function InsightCoverage({
  competitors,
  view,
  segmentLabel
}) {
  return <section className="panel insight-coverage"><ChartHeading title={t("Customer insight coverage")} subtitle={t("Audience-specific needs, motivations, interests, behavior")} /><div className="bar-chart">{competitors.map(c => {
        const counts = insightCoverage(c, audienceRecord(c, segmentLabel || '') || {
          id: '__unmapped'
        });
        return <button key={c.id} className="bar-row" onClick={() => view(c, 'Audience', '', audienceRecord(c, segmentLabel || '')?.id)} aria-label={t("{0}: {1} linked, {2} recorded only, {3} missing insight fields", {
          0: c.name,
          1: counts.linked,
          2: counts.recorded,
          3: counts.missing
        })}><span className="bar-label">{c.name}</span><span className="bar-track stacked"><span style={{
              width: `${counts.linked * 25}%`,
              background: '#12a77b'
            }} /><span style={{
              width: `${counts.recorded * 25}%`,
              background: '#ed8a32'
            }} /></span><strong>{counts.linked + counts.recorded}/4</strong><span className="chart-tooltip">{counts.linked} {t("fields with linked sources \xB7")} {counts.recorded} {t("recorded only \xB7")} {counts.missing} {t("missing. Coverage is not verification.")}</span></button>;
      })}<p className="chart-caption"><i className="legend-dot green" />{t("Source-linked")} <i className="legend-dot orange" />{t("Recorded only")} <i className="legend-dot gray" />{t("Missing")}</p></div></section>;
}
export function RecentActivity({
  competitors,
  view
}) {
  const [type, setType] = useState('all');
  const items = researchActivity(competitors, type).slice(0, 5);
  return <section className="panel recent-activity"><ChartHeading title={t("Recent research activity")} subtitle={t("Recorded timestamps, not a complete audit log")}><select aria-label={t("Research activity type")} value={type} onChange={e => setType(e.target.value)}><option value="all">{t("All activity")}</option><option value="profile">{t("Profiles")}</option><option value="source">{t("Sources")}</option></select></ChartHeading><div className="activity-list">{items.length ? items.map(item => <button key={item.id} onClick={() => view(item.c, item.type === 'source' ? 'Sources' : 'Overview')}><span className={`activity-icon ${item.type}`}>{item.type === 'source' ? <FileText size={15} /> : <Clock3 size={15} />}</span><span><strong>{item.c.name}</strong><small>{item.type==='profile'?t(item.title):item.title}</small></span><time dateTime={item.date}>{new Date(item.date).toLocaleDateString(getLanguage(), {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}</time></button>) : <p className="chart-caption">{t("No dated records in this view.")}</p>}</div></section>;
}
