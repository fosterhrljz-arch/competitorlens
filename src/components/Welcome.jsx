import { t } from "../lib/i18n.js";
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { audienceSeries } from '../lib/analytics.js';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Users, Layers, Lightbulb, Home, Grid2X2, FileText, CircleDot, BarChart3 } from 'lucide-react';
import Overview from './Overview.jsx';
import { Button } from './UI.jsx';
import { demoProject } from '../lib/demo.js';
export function Brand({
  tagline = true
}) {
  return <div className="product-brand"><span className="product-mark" aria-hidden="true"><i /><i /></span><div><strong>{t("CompetitorLens")}</strong>{tagline && <span>{t("Audience intelligence")}</span>}</div></div>;
}
export default function Welcome({
  onAISettings,
  onNew,
  onDemo,
  onContinue,
  onDocs,
  workspaceName,
  storageError,
  canResume,
  blocked
}) {
  const [demo] = useState(demoProject),
    [scale, setScale] = useState(1),
    previewRef = useRef(null);
  useEffect(() => {
    const node = previewRef.current;
    const observer = new ResizeObserver(entries => setScale(entries[0].contentRect.width / 1280));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const noop = () => {};
  return <div className="welcome-page"><header className="welcome-header"><Brand tagline={false} /><span className="welcome-descriptor">{t("Competitor audience intelligence")}</span><LanguageSwitcher /><button className="text-btn" onClick={onAISettings}>{t("AI Settings")}</button><button className="text-btn" onClick={onDocs}><BookOpen size={17} />{t("Documentation")}</button></header>
    <main className="welcome-main"><section className="welcome-hero"><h1>{t("A clearer view of your")}<br className="desktop-break" /> {t("competition.")}</h1><p>{t("Research competitor websites, understand their audiences, and turn evidence into opportunities.")}</p><div className="welcome-actions"><Button variant="primary" onClick={onNew}>{t("New Project")}</Button><Button variant="purple-outline" onClick={onDemo}>{t("Explore Demo")}</Button><Button onClick={onContinue} disabled={!canResume && !blocked}>{blocked ? t('Recover Workspace') : t('Resume Recent Project')}</Button></div><p className="welcome-local">{t("Your research stays on your device. No account required.")}</p>{storageError ? <p className="welcome-recovery" role="alert">{t("Saved data needs attention. Choose Recover Workspace to access recovery. The original data is preserved.")}</p> : <p className="welcome-resume">{canResume ? <>{t("Resume")} <strong>{workspaceName}</strong>.</> : t('No saved project yet. Start with New Project.')} {t("Explore Demo is temporary and stays out of your saved research.")}</p>}{window.__COMPETITORLENS_SERVICE__ && !canResume && <p className="welcome-resume launch-note">{t("Moving from the standalone file? Export its full backup, create a project here, then restore it in Data Management. File-based browser storage stays separate.")}</p>}</section>
      <figure className="welcome-preview desktop-preview"><div className="preview-viewport" ref={previewRef} role="img" aria-label={t("Preview of the actual CompetitorLens dashboard using the fictional Brew and Co. project")}><div className="preview-product" style={{
            transform: `scale(${scale})`
          }} inert aria-hidden="true"><aside className="preview-sidebar"><Brand />{[[Home, 'Overview'], [Users, 'Competitors'], [BarChart3, 'Audience Analysis'], [Grid2X2, 'Competitive Matrix'], [CircleDot, 'Opportunities'], [FileText, 'Reports']].map(([Icon, name], i) => <div key={name} className={i === 0 ? 'active' : ''}><Icon size={17} />{t(name)}</div>)}</aside><div className="preview-dashboard"><Overview project={demo} preview add={noop} view={noop} go={noop} openAudience={noop} /></div></div></div><figcaption>{t("Brew & Co. \xB7 Fictional demo project \xB7 Actual dashboard components")}</figcaption></figure>
      <section className="mobile-preview panel" aria-label={t("Responsive fictional dashboard preview")}><div className="panel-title"><BadgePreview /><h2>{t("Market overview")}</h2><p>{t("A preview using fictional demo records.")}</p></div><div className="preview-counts"><div><strong>{demo.competitors.length}</strong><span>{t("Competitor records")}</span></div><div><strong>{demo.competitors.reduce((n, c) => n + c.sources.length, 0)}</strong><span>{t("Sample sources")}</span></div></div><div className="mobile-preview-bars"><h3>{t("Recorded audience mentions")}</h3>{audienceSeries(demo.competitors).map(g => <div key={g.key}><div><span>{g.label}</span><strong>{g.count} / {demo.competitors.length}</strong></div><div className="preview-track"><i style={{
                width: `${g.count / demo.competitors.length * 100}%`
              }} /></div></div>)}<p>{t("Counts of competitor records, not audience size. Explore Demo to compare and inspect evidence.")}</p></div></section>
      <section className="welcome-features" aria-label={t("What you can explore")}><article className="purple"><Users size={30} /><div><h2>{t("Audience Intelligence")}</h2><p>{t("Understand needs and motivations, with evidence close by.")}</p></div></article><article className="blue"><Layers size={30} /><div><h2>{t("Competitor Comparison")}</h2><p>{t("Compare offers, pricing, positioning, and audiences.")}</p></div></article><article className="orange"><Lightbulb size={30} /><div><h2>{t("Opportunity Discovery")}</h2><p>{t("Turn research gaps into hypotheses you can validate.")}</p></div></article></section>
    </main><footer className="welcome-footer"><strong>{t("CompetitorLens V1.5")}</strong><span>{t("Local research, informed decisions.")}</span></footer></div>;
}
function BadgePreview() {
  return <span className="badge orange">{t("Fictional demo")}</span>;
}
