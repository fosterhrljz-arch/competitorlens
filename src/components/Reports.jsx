import { t, getLanguage } from "../lib/i18n.js";
import { ScopeSelector } from './AudienceMatrix.jsx';
import { reportChartStyles } from '../lib/reportCharts.js';
import { useState } from 'react';
import { Download, Printer, RefreshCw, FileText } from 'lucide-react';
import { Button, PageTitle, Field, Notice } from './UI.jsx';
import { reportBody, reportHTML, reportResponsiveStyles } from '../lib/report.js';
import { download } from '../lib/io.js';
export default function Reports({
  project,
  initialScope
}) {
  const [options, setOptions] = useState({
    competitorIds: initialScope?.filter(id => project.competitors.some(c => c.id === id))?.length ? initialScope : project.competitors.map(c => c.id),
    title: '',
    language: getLanguage(),
    mode: 'concise',
    note: '',
    includeSources: true,
    includeOpportunities: true
  });
  const [snapshot, setSnapshot] = useState(null),
    [message, setMessage] = useState('');
  const body = snapshot?.body || reportBody(project, options);
  function generate() {
    setSnapshot({
      body: reportBody(project, options),
      html: reportHTML(project, options)
    });
    setMessage('Report generated from the current project. Ready to export.');
  }
  const change = (key, value) => {
    setOptions({
      ...options,
      [key]: value
    });
    setSnapshot(null);
    setMessage('');
  };
  return <><style>{reportChartStyles + reportResponsiveStyles}</style><div className="no-print"><PageTitle title={t("Reports")} subtitle={t("A clear, source-aware report for your next business decision.")}><Button icon={Printer} onClick={() => window.print()}>{t("Print / Save PDF")}</Button><Button variant="primary" icon={Download} onClick={() => {
          download('CompetitorLens-report.html', snapshot?.html || reportHTML(project, options), 'text/html;charset=utf-8');
          setMessage('HTML report exported. Open it in a browser to read or print.');
        }}>{t("Export HTML")}</Button></PageTitle><ScopeSelector label={t("Report scope")} competitors={project.competitors} selected={options.competitorIds} onChange={ids => change('competitorIds', ids)} /><Notice>{t("Comparison tables and charts use this selected scope. Opportunity snapshots and validation history remain project-wide and are labeled in the report.")}</Notice><div className="report-layout"><section className="panel report-settings"><div className="panel-title"><h2>{t("Make it yours")}</h2><p>{t("Set the scope. Keep the context.")}</p></div><Field label={t("Report language")}><select value={options.language} onChange={e => change('language', e.target.value)}><option value="en-US">{t("English")}</option><option value="zh-CN">简体中文</option></select></Field><Field label={t("Report detail")}><select value={options.mode} onChange={e => change('mode', e.target.value)}><option value="concise">{t("Concise report")}</option><option value="detailed">{t("Detailed report")}</option></select></Field><Field label={t("Report title")} hint={t("Leave blank for a localized default title.")}><input value={options.title} maxLength={150} onChange={e => change('title', e.target.value)} /></Field><Field label={t("Executive commentary")} hint={t("Your interpretation. Keep observations and assumptions distinct.")}><textarea rows={5} value={options.note} maxLength={10000} placeholder={t("Add context, priorities, or a recommendation…")} onChange={e => change('note', e.target.value)} /></Field><label className="inline-check"><input type="checkbox" checked={options.includeOpportunities} onChange={e => change('includeOpportunities', e.target.checked)} />{t("Opportunity hypotheses")}</label><label className="inline-check"><input type="checkbox" checked={options.includeSources} onChange={e => change('includeSources', e.target.checked)} />{t("Full evidence appendix")}</label><Button icon={RefreshCw} variant="primary" onClick={generate}>{t("Generate report")}</Button>{message && <p className="small" role="status">{t(message)}</p>}<Notice>{t("To save a PDF, choose \u201CSave as PDF\u201D in your browser\u2019s print dialog. The report follows your selected report language; original research and quotations are unchanged.")}</Notice></section><section className="report-preview-wrap"><div className="report-preview-label"><FileText size={15} /><span>{t("Live report preview")}</span><BadgeText demo={project.demo} /></div><div className="report-preview" dangerouslySetInnerHTML={{
            __html: body
          }} /></section></div></div><div className="print-report" dangerouslySetInnerHTML={{
      __html: body
    }} /></>;
}
function BadgeText({
  demo
}) {
  return <span className="muted small">{demo ? t('Fictional demo data') : t('Current project records')}</span>;
}
