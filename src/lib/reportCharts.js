import { createT } from './i18n.js';
import { escapeHTML as e } from './io.js';
import { audienceSeries } from './analytics.js';
import { researchStatus } from './research.js';

// Shared by the live report preview, browser print, and standalone HTML export.
export const reportChartStyles = `
.report-analytics{display:grid;grid-template-columns:1.15fr 1fr;gap:22px;margin:26px 0;break-inside:avoid}
.report-chart{border:1px solid #dce5f1;border-radius:6px;padding:17px;background:#fff;min-width:0}
.report-chart h3{font-size:14px;color:#2c4b77;margin:0 0 7px;border:0}
.report-chart .report-muted{font-size:12px;line-height:1.6;margin:7px 0}
.report-bar-row{display:grid;grid-template-columns:112px minmax(0,1fr) 20px;gap:8px;align-items:center;font-size:12px;margin:12px 0;color:#486182}
.report-bar-row>span:first-child{overflow-wrap:anywhere}.report-bar-track{height:13px;background:#edf2f9;border-radius:2px;overflow:hidden}.report-bar-fill{height:100%;display:block;background:#4f79db;print-color-adjust:exact}
.report-coverage-total{font-size:30px;font-weight:700;color:#2563eb;margin:10px 0;line-height:1.2}
.report-coverage-track{display:flex;height:13px;border-radius:2px;overflow:hidden;background:#edf2f9}.report-coverage-track>span{display:block;height:100%;print-color-adjust:exact}
.report-coverage-legend{display:flex;flex-wrap:wrap;gap:7px 14px;font-size:12px;line-height:1.5;margin-top:10px;color:#526983}.report-coverage-legend i{display:inline-block;width:8px;height:8px;margin-right:4px;print-color-adjust:exact}
@media screen and (max-width:650px){.report-analytics{grid-template-columns:1fr}.report-bar-row{grid-template-columns:105px minmax(0,1fr) 20px}}
@media print{.report-analytics{grid-template-columns:1.15fr 1fr;gap:18px}.report-chart{break-inside:avoid}.report-bar-fill,.report-bar-track,.report-coverage-track{print-color-adjust:exact}}
`;

export function reportChartHTML(project, language='en-US') {
  const t=createT(language),tr=k=>e(t(k));
  const cs = project.competitors, rows = audienceSeries(cs), status = researchStatus(cs);
  const counts = [{ label: 'Linked', n: status.linked, color: '#2563eb' }, { label: 'Recorded only', n: status.recorded - status.linked, color: '#ed8a32' }, { label: 'Missing', n: status.total - status.recorded, color: '#cbd5e1' }];
  return `<div class="report-analytics"><section class="report-chart"><h3>${tr('Audience comparison')}</h3><p class="report-muted">${tr('Competitor records mentioning each segment. Not audience size.')}</p>${rows.length ? rows.map(row => `<div class="report-bar-row"><span>${e(row.label)}</span><span class="report-bar-track"><span class="report-bar-fill" style="width:${row.count / cs.length * 100}%"></span></span><strong>${row.count}</strong></div>`).join('') : `<p class="report-muted">${tr('No audience labels recorded.')}</p>`}<p class="report-muted">${e(t('Scale: 0–{0} competitor records',{0:cs.length}))}</p></section><section class="report-chart"><h3>${tr('Research coverage')}</h3><p class="report-muted">${tr('Six core fields per competitor. Linked sources are not independent verification.')}</p><div class="report-coverage-total">${status.linked}/${status.total}</div><p class="report-muted">${tr('Core fields with linked evidence')}</p><div class="report-coverage-track">${counts.map(s => `<span style="width:${status.total ? s.n / status.total * 100 : 0}%;background:${s.color}"></span>`).join('')}</div><div class="report-coverage-legend">${counts.map(s => `<span><i style="background:${s.color}"></i>${tr(s.label)}: ${s.n}</span>`).join('')}</div></section></div>`;
}
