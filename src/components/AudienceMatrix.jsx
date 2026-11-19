import { t } from "../lib/i18n.js";
import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { seriesColor } from '../lib/analytics.js';
import { audienceGroups, audienceRecord } from '../lib/model.js';
import { audienceCell, STATUS_LABEL } from '../lib/research.js';
import { Avatar, Badge, Button, Empty, SourceList } from './UI.jsx';
export function ScopeSelector({
  competitors,
  selected,
  onChange,
  label = 'Comparing'
}) {
  return <div className="scope-selector" aria-label={t("Comparison scope")}><strong>{t(label)}</strong><div className="scope-options">{competitors.map((c, i) => <button key={c.id} style={{
        '--series': seriesColor(c)
      }} className={`scope-chip ${selected.includes(c.id) ? 'selected' : ''}`} disabled={selected.length === 1 && selected.includes(c.id)} title={selected.length === 1 && selected.includes(c.id) ? t('Keep at least one competitor selected') : undefined} aria-pressed={selected.includes(c.id)} aria-label={t("Include {0}", {
        0: c.name
      })} onClick={() => onChange(selected.includes(c.id) ? selected.filter(id => id !== c.id) : [...selected, c.id])}><span className="scope-check" aria-hidden="true">{selected.includes(c.id) ? '✓' : ''}</span><i className="series-dot" style={{
          background: seriesColor(c)
        }} /><span>{c.name}</span></button>)}</div><span className="scope-count">{selected.length} {t("selected")}<span className="scope-snapshot"> {t("\xB7 Current research snapshot")}</span></span>{selected.length !== competitors.length && <button className="text-btn" onClick={() => onChange(competitors.map(c => c.id))}>{t("Reset")}</button>}</div>;
}
export default function AudienceMatrix({
  competitors,
  view,
  onExplore,
  groups: suppliedGroups,
  title = 'Audience × Competitor'
}) {
  const [selection, setSelection] = useState(null);
  const groups = suppliedGroups || audienceGroups(competitors);
  const activeC = competitors.find(c => c.id === selection?.competitorId),
    activeGroup = groups.find(g => g.key === selection?.key);
  const activeStatus = activeC && activeGroup ? audienceCell(activeC, activeGroup.key) : null;
  return <section className="panel audience-matrix-panel"><div className="panel-title horizontal"><div><h2>{t(title)}</h2><p>{t("Where audiences are mentioned\u2014and what supports each claim.")}</p></div>{onExplore && <button className="text-btn" onClick={onExplore}>{t("Explore audiences")} <ArrowRight size={15} /></button>}</div>
    {groups.length && competitors.length ? <><div className="matrix-scroll" role="region" aria-label={t("Audience comparison table")} tabIndex={0}><table className="audience-matrix"><thead><tr><th scope="col">{t("Audience")}</th>{competitors.map(c => <th key={c.id} scope="col"><button className="text-btn" onClick={() => view(c)}><i className="series-dot" style={{
                    background: seriesColor(c)
                  }} />{c.name}</button></th>)}</tr></thead><tbody>{groups.map(g => <tr key={g.key}><th scope="row">{g.label}<small>{g.competitors.filter(c => competitors.some(x => x.id === c.id)).length} {t("of")} {competitors.length} {t("records")}</small></th>{competitors.map(c => {
                const status = audienceCell(c, g.key);
                return <td key={c.id}><button className={`audience-cell ${status} ${activeC?.id === c.id && activeGroup?.key === g.key ? 'selected' : ''}`} aria-label={t("{0} at {1}: {2}", {
                    0: g.label,
                    1: c.name,
                    2: STATUS_LABEL[status]
                  })} aria-pressed={activeC?.id === c.id && activeGroup?.key === g.key} onClick={() => setSelection({
                    key: g.key,
                    competitorId: c.id
                  })}><span className={`status-symbol ${status}`} aria-hidden="true">{status === 'missing' ? '—' : ''}</span><span>{t(STATUS_LABEL[status])}</span><ArrowRight size={13} /></button></td>;
              })}</tr>)}</tbody></table></div>
      <p className="scroll-hint">{t("Swipe or scroll horizontally \u2192 Column and audience headings stay visible.")}</p><div className="matrix-legend"><div>{Object.entries(STATUS_LABEL).map(([key, label]) => <span key={key}><i className={`status-symbol ${key}`}>{key === 'missing' ? '—' : ''}</i>{label === 'Linked' ? t('Linked source') : t(label)}</span>)}</div><p>{t("Research coverage, not audience size. Select a cell to inspect it.")}</p></div>
      {activeC && activeGroup && <div className="cell-inspector" aria-live="polite"><div className="horizontal"><div><span className="section-label">{t("Selected evidence")}</span><h3>{activeGroup.label} <span className="muted">/</span> {activeC.name}</h3></div><button className="icon-btn" onClick={() => setSelection(null)} aria-label={t("Close selected evidence")}><X size={18} /></button></div><div className="cell-inspector-body"><div><Badge>{activeC.demo ? t('Demo · ') : ''}{t(STATUS_LABEL[activeStatus])}</Badge><p>{activeStatus === 'missing' ? t('This audience is not listed in this competitor’s record. This does not establish that the competitor ignores it.') : activeStatus === 'recorded' ? t('The audience is recorded, but no source is mapped to this specific audience. Add evidence before relying on this claim.') : t('These sources are explicitly mapped to this segment. Review their provenance and context; they are not independently verified.')}</p><Button onClick={() => view(activeC, 'Sources', 'audiences', audienceRecord(activeC, activeGroup.label)?.id || '__unmapped')} icon={ArrowRight}>{t("Open competitor research")}</Button></div><div>{activeStatus === 'linked' ? <SourceList competitor={activeC} field="audiences" segmentId={audienceRecord(activeC, activeGroup.label)?.id || '__unmapped'} /> : <div className="evidence-placeholder">{activeStatus === 'missing' ? t('No audience claim to substantiate yet.') : t('No supporting audience source attached.')}<span>{t("Unknown information stays unknown.")}</span></div>}</div></div></div>}
    </> : <Empty title={competitors.length ? t('Add audiences to make the comparison useful.') : t('Select competitors to compare.')}>{t("Audience labels and their linked evidence will appear here.")}</Empty>}</section>;
}
