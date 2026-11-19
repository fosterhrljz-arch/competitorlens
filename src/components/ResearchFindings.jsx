import { t } from "../lib/i18n.js";
import { FINDING_FIELDS, CONFIDENCE, findingCurrent } from '../lib/automatedResearch.js';
export default function ResearchFindings({
  competitor: c,
  segment = '',
  field = ''
}) {
  const findings = (c.researchFindings || []).filter(f => (!segment || f.segment.toLowerCase() === segment.toLowerCase()) && (!field || f.field === field));
  if (!findings.length) return null;
  return <details className="automated-confidence-panel"><summary>{t("Research traceability \xB7")} {findings.length} {t("reviewed findings")}</summary><p className="small muted">{t("Confidence describes the connection to website wording. It is not independent verification or a probability.")}</p><div className="research-findings-inline">{findings.map(f => {
        const source = c.sources.find(s => s.id === f.sourceId);
        return <article key={f.id}><strong>{t(FINDING_FIELDS[f.field])}{f.segment ? ' · ' + f.segment : ''}</strong><p>{f.text}</p><small>{f.kind === 'statement' ? t('Website statement') : f.kind === 'analyst' ? t('Analyst interpretation') : t('Inferred insight')} · {t(CONFIDENCE[f.confidence])}{!findingCurrent(c, f) ? t(' · Earlier finding; current record differs') : ''}</small><p className="small muted">{f.engine==='ai'?f.reason:t(f.reason)}</p><blockquote>{f.quote}</blockquote>{source ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : <p className="small muted">{t("Source removed from the current record. Consult Research history for the original page.")}</p>}</article>;
      })}</div></details>;
}
