import { t, getLanguage } from "../lib/i18n.js";
import { useEffect, useRef, useState } from 'react';
import { Search, Globe, Download, Upload, ArrowRight, RefreshCw, Square, CheckCircle2, FileText } from 'lucide-react';
import { Button, PageTitle, Notice, Field, Badge, Empty, Modal } from './UI.jsx';
import { uid, safeURL, domain } from '../lib/model.js';
import { download } from '../lib/io.js';
import { useLocalService, serviceRequest, checkService } from '../lib/localService.js';
import { prepareAIInput } from '../lib/aiSchema.js';
import { reviewResearchChanges, approveChanges } from '../lib/researchUpdates.js';
import { UsageInfo } from './AISettings.jsx';
import { sourceLabel } from '../lib/provenance.js';
import { analyzeWebsite, parseResearchPage, parseManualContent, discoverPages, applyResearch, FINDING_FIELDS, CONFIDENCE, evidenceBrief, validateSuggestions } from '../lib/automatedResearch.js';
export async function collectPage(url, signal) {
  const service = window.__COMPETITORLENS_SERVICE__;
  if (!service) throw new Error('Open CompetitorLens.exe from the Windows package for automated collection, or use manual content import below.');
  let response;
  try {
    response = await fetch(service.origin + '/api/page', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-CompetitorLens-Token': service.token
      },
      body: JSON.stringify({
        url
      })
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('The local research service is not available. Reopen the launcher, or import website text manually.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Page collection failed.');
  return result;
}
export function FindingList({
  findings,
  pages,
  readOnly = false,
  onChange
}) {
  return <div className="finding-list">{findings.map(f => {
      const source = pages.find(p => p.source.id === f.sourceId)?.source;
      return <article className={`finding-card ${f.selected ? 'selected' : ''}`} key={f.id}>
    <div className="finding-heading">{!readOnly && <label className="finding-select"><input type="checkbox" aria-label={t("Include {0}: {1}", {
              0: FINDING_FIELDS[f.field],
              1: f.text.slice(0, 60)
            })} checked={f.selected} onChange={e => onChange(f.id, {
              selected: e.target.checked
            })} /><span>{t(FINDING_FIELDS[f.field])}</span></label>}{readOnly && <strong>{t(FINDING_FIELDS[f.field])} · {f.selected && f.change?.action!=='skip' ? t('Accepted') : t('Not applied')}</strong>}<Badge tone={f.kind === 'statement' ? 'green' : 'purple'}>{f.kind === 'statement' ? t('Website statement') : f.kind === 'analyst' ? t('Analyst-edited interpretation') : t('Inferred insight')}</Badge></div>
    {f.engine === 'ai' && <Badge tone="purple">{t("AI-assisted \xB7 review required")}</Badge>}{f.change && <div className={`finding-diff ${f.change.type}`}><Badge tone={f.change.type === 'conflict' ? 'orange' : 'neutral'}>{t({
              new: 'New information',
              unchanged: 'Unchanged claim',
              modified: 'Modified claim',
              conflict: 'Potential pricing conflict'
            }[f.change.type])}</Badge>{f.change.before && f.change.type !== 'unchanged' && <details><summary>{t("Before / after comparison")}</summary><div className="diff-columns"><div><strong>{t("Before")}</strong><p>{f.change.before}</p></div><div><strong>{t("After")}</strong><p>{f.text}</p></div></div></details>}{!readOnly && ['modified', 'conflict'].includes(f.change.type) && <label>{t("Update decision")}<select aria-label={t("Update decision {0}", {
              0: f.id
            })} value={f.change.action} onChange={e => onChange(f.id, {
              change: {
                ...f.change,
                action: e.target.value
              }
            })}><option value="pending">{t("Choose how to apply this change")}</option><option value="append">{t("Keep existing and append")}</option><option value="replace">{t("Replace this field; retain history")}</option><option value="skip">{t("Do not apply this claim")}</option></select></label>}</div>}{f.segment && <p className="finding-segment">{t("Audience:")} <strong>{f.segment}</strong></p>}
    {readOnly ? <p>{f.text}</p> : <textarea aria-label={t("Finding text {0}", {
          0: f.id
        })} value={f.text} maxLength={1600} rows={2} onChange={e => onChange(f.id, {
          text: e.target.value,
          kind: 'analyst',
          confidence: 'low',
          reason: 'Edited by the analyst. Review whether the quotation still supports this interpretation.'
        })} />}
    <div className={`confidence ${f.confidence}`}><span>{t(CONFIDENCE[f.confidence])}</span><p>{f.engine==='ai'&&f.kind!=='analyst'?f.reason:t(f.reason)}</p></div>
    <details className="finding-evidence"><summary>{t("Review exact quotation \xB7")} {source?.title || t('Source unavailable')}</summary><blockquote>{f.quote}</blockquote>{source && <><a href={source.url} target="_blank" rel="noreferrer">{source.url}</a><p>{t(sourceLabel(source))} · {new Date(source.collectedAt).toLocaleString(getLanguage())}</p></>}</details>
    {!readOnly && f.price && <label className="check-line"><input type="checkbox" checked={!!f.applyPrice} onChange={e => onChange(f.id, {
            applyPrice: e.target.checked
          })} />{t("Use")} {f.price.currency} {f.price.amount} / {f.price.unit} {t("if numeric pricing is empty")}</label>}
  </article>;
    })}</div>;
}
export default function AutomatedResearch({
  project,
  onSave,
  onDirty,
  onDone
}) {
  const [urls, setUrls] = useState(project.competitors.filter(c => c.url && !c.demo).map(c => c.url).join('\n'));
  const [tab, setTab] = useState('new'),
    [run, setRun] = useState(null),
    [busy, setBusy] = useState(false),
    [active, setActive] = useState(0),
    [view, setView] = useState('profile'),
    [filter, setFilter] = useState('all'),
    [error, setError] = useState(''),
    [reviewed, setReviewed] = useState(false);
  const [manual, setManual] = useState(''),
    [manualURL, setManualURL] = useState(''),
    [ai, setAI] = useState(''),
    [historyId, setHistoryId] = useState(''),
    [resetDraft, setResetDraft] = useState(false);
  const controller = useRef(),
    file = useRef();
  const health = useLocalService(),
    connected = health.status === 'online';
  const [analysisMode, setAnalysisMode] = useState(() => {
      try {
        return localStorage.getItem('competitorlens.researchMode') === 'ai' ? 'ai' : 'rules';
      } catch {
        return 'rules';
      }
    }),
    [aiConsent, setAIConsent] = useState(false),
    [aiBusy, setAIBusy] = useState(false);
  function chooseMode(mode) {
    setAnalysisMode(mode);
    try {
      localStorage.setItem('competitorlens.researchMode', mode);
    } catch {/* This preference is optional; no project data is affected. */}
  }
  const annotate = draft => ({
    ...draft,
    analysisMode,
    results: draft.results.map(r => reviewResearchChanges(project, r))
  });
  async function analyzeDraft(draft = run) {
    setError('');
    if (!aiConsent) {
      setError('Confirm that selected website content may be sent to your configured AI provider.');
      return;
    }
    controller.current = new AbortController();
    setBusy(true);
    setAIBusy(true);
    setReviewed(false);
    try {
      const input = prepareAIInput(draft.results),
        reply = await serviceRequest('/api/ai/analyze', input, controller.current.signal);
      const next = {
        ...draft,
        analysisMode: 'ai',
        aiUsage: reply.usage,
        aiOpportunities: [...(draft.aiOpportunities || []), ...reply.opportunities.map(o => ({
          ...o,
          id: uid(),
          selected: false
        }))],
        results: draft.results.map(r => ({
          ...r,
          findings: [...r.findings, ...reply.findings.filter(f => f.competitorUrl === r.url).map(({
            competitorUrl,
            ...f
          }) => ({
            ...f,
            id: uid(),
            selected: true,
            price: null,
            engine: 'ai'
          }))]
        }))
      };
      if (next.results.some(r => r.findings.length > 150)) throw new Error('This review exceeds 150 proposals per competitor. Save or start a new run before another AI request.');
      setRun(annotate({
        ...next,
        aiCoverage: reply.coverage
      }));
    } catch (e) {
      if (e.usage) setRun(r => ({
        ...r,
        aiUsage: e.usage
      }));
      setError(e.name === 'AbortError' ? 'AI request cancelled. Collected content and earlier review decisions are preserved.' : e.message);
    } finally {
      setBusy(false);
      setAIBusy(false);
    }
  }
  function useRules() {
    setError('');
    try {
      const results = run.results.map(v => {
        const extra = analyzeWebsite(v.url, v.pages).findings.filter(f => !v.findings.some(x => x.field === f.field && x.text === f.text && x.sourceId === f.sourceId && x.segment === f.segment));
        if (v.findings.length + extra.length > 150) throw new Error('Keep at most 150 proposals per competitor in one review.');
        return {
          ...v,
          findings: [...v.findings, ...extra]
        };
      });
      setRun(annotate({
        ...run,
        analysisMode: 'rules',
        results
      }));
      setReviewed(false);
    } catch (e) {
      setError(e.message);
    }
  }
  const dirty = !!run;
  useEffect(() => {
    onDirty(dirty);
    const before = e => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty, onDirty]);
  useEffect(() => () => controller.current?.abort(), []);
  const result = run?.results[active],
    history = project.researchHistory || [],
    past = history.find(h => h.id === historyId) || history.at(-1);
  function makeRun() {
    const values = urls.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!values.length || values.length > 5) throw new Error('Enter one to five competitor URLs, one per line. Use two to five for a comparison.');
    const valid = values.map(safeURL);
    if (new Set(valid.map(domain)).size !== valid.length) throw new Error('Use one starting URL per competitor website. Relevant pages are discovered automatically.');
    const newCount = valid.filter(u => !project.competitors.some(c => c.url && domain(c.url) === domain(u))).length;
    if (project.competitors.length + newCount > 5) throw new Error('These URLs would exceed this project’s five-competitor limit. Use existing URLs for updates or create a new project.');
    return {
      id: uid(),
      analysisMode,
      startedAt: new Date().toISOString(),
      events: [],
      results: valid.map(url => ({
        url,
        name: project.competitors.find(c => c.url && domain(c.url) === domain(url))?.name || domain(url),
        include: true,
        pages: [],
        findings: []
      }))
    };
  }
  function prepareManual() {
    setError('');
    try {
      setRun(makeRun());
      setActive(0);
      setView('import');
      setReviewed(false);
    } catch (e) {
      setError(e.message);
    }
  }
  async function collect() {
    setError('');
    let draft;
    try {
      draft = makeRun();
    } catch (e) {
      setError(e.message);
      return;
    }
    controller.current = new AbortController();
    const signal = controller.current.signal;
    setRun(draft);
    setBusy(true);
    setReviewed(false);
    setActive(0);
    setView('profile');
    const event = (url, category, status, message) => {
      draft.events.push({
        url,
        category,
        status,
        message,
        at: new Date().toISOString()
      });
      setRun(structuredClone(draft));
    };
    try {
      for (const [index, item] of draft.results.entries()) {
        signal.throwIfAborted();
        const pages = [],
          queue = [{
            url: item.url,
            category: 'Home'
          }],
          visited = new Set();
        for (let i = 0; i < queue.length && i < 6; i++) {
          signal.throwIfAborted();
          const target = queue[i];
          if (visited.has(target.url)) continue;
          visited.add(target.url);
          event(target.url, target.category, 'collecting', 'Collecting public content…');
          try {
            const collected = await collectPage(target.url, signal);
            if (visited.has(collected.url) && collected.url !== target.url) continue;
            visited.add(collected.url);
            const parsed = parseResearchPage(collected.html, collected.url, {
              method: 'fetched',
              collectedAt: collected.collectedAt,
              category: target.category
            });
            pages.push(parsed);
            if (i === 0) queue.push(...discoverPages(collected.html, collected.url).filter(p => !visited.has(p.url)));
            event(target.url, target.category, 'collected', `${parsed.source.excerpt.length.toLocaleString(getLanguage())} characters retained${collected.url !== target.url ? ' · redirected to ' + collected.url : ''}`);
          } catch (e) {
            if (signal.aborted) throw e;
            event(target.url, target.category, 'failed', e.message);
          }
          const analyzed = analyzeWebsite(item.url, pages);
          draft.results[index] = {
            ...analyzed,
            ...(analysisMode === 'ai' ? {
              findings: []
            } : {}),
            name: project.competitors.find(c => c.url && domain(c.url) === domain(item.url))?.name || analyzed.name,
            include: true
          };
          setRun(structuredClone(draft));
        }
        event(item.url, 'Analysis', 'analyzed', `${draft.results[index].findings.length} evidence-linked proposals ready for review.`);
      }
    } catch (e) {
      if (signal.aborted) setError('Collection cancelled. Completed pages remain available for review; nothing has been saved.');else setError(e.message);
    } finally {
      setBusy(false);
      setRun(annotate(structuredClone(draft)));
    }
    if (analysisMode === 'ai' && !signal.aborted && draft.results.some(r => r.pages.length)) await analyzeDraft(draft);
  }
  async function retryCurrent(targetURL) {
    setError('');
    setBusy(true);
    setReviewed(false);
    controller.current = new AbortController();
    const signal = controller.current.signal,
      draft = structuredClone(run),
      index = targetURL ? draft.results.findIndex(r => domain(r.url) === domain(targetURL)) : active,
      item = draft.results[index];
    setActive(index);
    const event = (url, category, status, message) => {
      draft.events.push({
        url,
        category,
        status,
        message,
        at: new Date().toISOString()
      });
      setRun(structuredClone(draft));
    };
    try {
      const queue = targetURL ? [{
        url: targetURL,
        category: run.events.find(e => e.url === targetURL)?.category || 'Page'
      }] : [...new Map(draft.events.filter(e => e.status === 'failed' && domain(e.url) === domain(item.url)).map(e => [e.url, {
        url: e.url,
        category: e.category
      }])).values()];
      if (!queue.length) queue.push({
        url: item.url,
        category: 'Home'
      });
      for (let i = 0; i < queue.length && i < 6; i++) {
        signal.throwIfAborted();
        const target = queue[i];
        if (item.pages.some(p => p.source.url === target.url)) continue;
        if (item.pages.length >= 12 || draft.events.length >= 98) throw new Error('This draft reached its page or event limit. Save it and start another run.');
        event(target.url, target.category, 'collecting', 'Retrying public collection…');
        try {
          const response = await collectPage(target.url, signal),
            p = parseResearchPage(response.html, response.url, {
              collectedAt: response.collectedAt,
              category: target.category
            });
          if (i === 0 && !targetURL) queue.push(...discoverPages(response.html, response.url));
          const added = analyzeWebsite(item.url, [p]);
          if (!item.pages.length && item.name === domain(item.url)) item.name = added.name;
          if (item.findings.length + added.findings.length > 150) throw new Error('This review reached 150 proposals. Save it before collecting more.');
          item.pages.push(p);
          if (analysisMode !== 'ai') item.findings.push(...added.findings);
          event(target.url, target.category, 'collected', 'Retry collected successfully. Earlier review decisions were preserved.');
        } catch (e) {
          if (signal.aborted) throw e;
          event(target.url, target.category, 'failed', e.message);
        }
      }
    } catch (e) {
      setError(signal.aborted ? 'Retry cancelled. Completed content remains available.' : e.message);
    } finally {
      setRun(annotate(structuredClone(draft)));
      setBusy(false);
    }
  }
  function changeResult(patch) {
    setRun(r => ({
      ...r,
      results: r.results.map((v, i) => i === active ? reviewResearchChanges(project, {
        ...v,
        ...patch
      }) : v)
    }));
    setReviewed(false);
  }
  function changeReviewedPrice(patch) {
    changeResult({
      reviewedPrice: {
        amount: '',
        currency: '',
        unit: '',
        findingId: '',
        reason: '',
        ...result.reviewedPrice,
        ...patch
      }
    });
  }
  function changeFinding(id, patch) {
    changeResult({
      findings: result.findings.map(f => f.id === id ? {
        ...f,
        ...patch
      } : f)
    });
  }
  function importContent(text = manual, title) {
    setError('');
    try {
      if (result.pages.length >= 12) throw new Error('A research run supports up to 12 collected/imported pages per competitor.');
      const page = parseManualContent(text, manualURL || result.url, title);
      if (domain(page.source.url) !== domain(result.url)) throw new Error('Import content from this competitor’s domain. Use another competitor result for a different website.');
      const added = analyzeWebsite(result.url, [page]);
      if (result.findings.length + added.findings.length > 150) throw new Error('This review would exceed 150 proposals. Save this run first, then collect more research.');
      changeResult({
        pages: [...result.pages, page],
        findings: [...result.findings, ...(analysisMode === 'ai' ? [] : added.findings)]
      });
      setManual('');
      setManualURL('');
      setView('profile');
    } catch (e) {
      setError(e.message);
    }
  }
  async function readFile(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 2_000_000) {
      setError('Choose a text or HTML file under 2 MB.');
      return;
    }
    try {
      importContent(await f.text(), f.name);
    } catch (e) {
      setError(e.message);
    }
  }
  function save() {
    setError('');
    try {
      if (!reviewed) throw new Error('Confirm that you reviewed selected findings and pricing before saving.');
      const next = applyResearch(project, run);
      if (onSave(next)) {
        onDirty(false);
        onDone('matrix');
      }
    } catch (e) {
      setError(e.message);
    }
  }
  const visibleFindings = result?.findings.filter(f => view === 'audience' ? !!f.segment || f.field === 'audiences' : !f.segment && f.field !== 'audiences').filter(f => filter === 'all' || f.kind === filter) || [];
  const selectedCount = run?.results.filter(r => r.include !== false).reduce((n, r) => n + r.findings.filter(f => f.selected && f.change?.action!=='skip').length, 0) || 0;
  return <><PageTitle title={t("Automated research")} subtitle={t("From public website content to a comparison you can trace and review.")}><Badge tone={connected ? 'green' : 'orange'}>{connected ? t('Local collection ready') : health.status === 'checking' ? t('Checking local service…') : health.status === 'offline' ? t('Local service offline') : t('Manual / offline mode')}</Badge><Button onClick={checkService}>{t("Check service")}</Button></PageTitle>
    <section className="panel research-mode"><Field label={t("Analysis mode")}><select value={analysisMode} disabled={busy} onChange={e => chooseMode(e.target.value)}><option value="rules">{t("Rule-based \xB7 no API key")}</option><option value="ai">{t("AI-assisted \xB7 configured provider")}</option></select></Field>{analysisMode === 'ai' && <label className="check-line"><input type="checkbox" checked={aiConsent} onChange={e => setAIConsent(e.target.checked)} />{t("Send selected website content to my configured AI provider when I start analysis. Provider charges may apply.")}</label>}</section><div className="tabs page-tabs research-tabs"><button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>{t("Research workspace")}</button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>{t("Research history (")}{history.length})</button></div>
    {error && <div className="error" role="alert">{t(error)}</div>}
    {tab === 'history' ? <section className="panel section-pad research-history"><h2>{t("Collected research, preserved")}</h2><p>{t("Runs keep their pages, rejected proposals, errors, and accepted findings. Updating research appends evidence; earlier snapshots stay here.")}</p>{history.length ? <><Field label={t("Research run")}><select value={past.id} onChange={e => setHistoryId(e.target.value)}>{[...history].reverse().map(h => <option key={h.id} value={h.id}>{new Date(h.savedAt).toLocaleString(getLanguage())} · {h.results.length} {t("competitors")}</option>)}</select></Field>{past.results.map(r => <details key={r.url} className="history-result"><summary>{r.name} · {r.pages.length} {t("pages \xB7")} {r.findings.filter(f => f.selected && f.change?.action!=='skip').length} {t("accepted findings")}</summary><p>{r.url}</p>{r.previousRecord && <details><summary>{t("Record before this update")}</summary><dl>{['positioning', 'products', 'pricing', 'advantages', 'notes'].map(k => <div key={k}><dt>{t(FINDING_FIELDS[k])}</dt><dd>{r.previousRecord[k] || t('Not recorded')}</dd></div>)}<dt>{t("Features")}</dt><dd>{r.previousRecord.features.join(' · ')}</dd><dt>{t("Audiences")}</dt><dd>{r.previousRecord.audiences.join(' · ')}</dd></dl></details>}<FindingList findings={r.findings} pages={r.pages} readOnly /></details>)}<details><summary>{t("Collection log")}</summary><ul className="research-log">{past.events.map((e, i) => <li key={i}><strong>{t(e.status)} · {t(e.category)}</strong><span>{e.url}</span><p>{t(e.message)}</p></li>)}</ul></details><Button icon={RefreshCw} disabled={!!run} onClick={() => {
          setUrls(past.results.map(r => r.url).join('\n'));
          setTab('new');
        }}>{t("Research these websites again")}</Button></> : <Empty title={t("No saved research runs yet.")}>{t("Collect or import website content, review the findings, then save your comparison.")}</Empty>}</section> : <>
    <ol className="research-steps" aria-label={t("Research workflow")}>{['Enter URLs', 'Collect content', 'Review audiences', 'Compare', 'Report'].map((s, i) => <li key={s} className={i === (busy ? 1 : run ? 2 : 0) ? 'active' : ''}><span>{i + 1}</span>{t(s)}</li>)}</ol>
    {!run && <section className="panel section-pad research-start"><div><h2>{t("Start with your competitors")}</h2><p>{t("Enter two to five websites for a comparison. Existing domains are updated without replacing your notes. Collection reads up to six linked Home, About, Products, Pricing, Features, and audience pages per website.")}</p><Field label={t("Competitor website URLs")} hint={t("One website per line. Public pages only; no login or API key required.")}><textarea rows={5} value={urls} onChange={e => setUrls(e.target.value)} placeholder={t('https://competitor-one.com\nhttps://competitor-two.com')} /></Field><div className="actions"><Button variant="primary" icon={Search} disabled={!connected || analysisMode === 'ai' && !aiConsent} onClick={collect}>{t("Collect & analyze websites")}</Button><Button icon={Upload} onClick={prepareManual}>{t("Import website content")}</Button></div></div><aside><Globe size={28} /><h3>{t("Evidence first. Review always.")}</h3><ul><li>{t("Website statements keep their exact quotations.")}</li><li>{t("Audience interpretations are explicitly inferred.")}</li><li>{t("No traffic, demographic or market-share estimates.")}</li><li>{t("Only reviewed results enter your saved project.")}</li></ul>{!connected && <Notice>{t("For automated collection on Windows, extract the complete package and double-click")} <strong>{t("CompetitorLens.exe")}</strong>{t(". To move existing file-based research, export its full backup and restore it in the launched workspace.")}</Notice>}</aside></section>}
    {run && <><section className="panel section-pad research-progress" aria-live="polite"><div className="horizontal"><div><h2>{aiBusy ? t('Analyzing evidence with AI…') : busy ? t('Collecting and analyzing…') : t('Collection ready for review')}</h2><p>{run.results.reduce((n, r) => n + r.pages.length, 0)} {t("pages retained \xB7")} {run.results.reduce((n, r) => n + r.findings.length, 0)} {t("proposals \xB7")} {run.events.filter(e => e.status === 'failed').length} {t("failed attempts")}</p></div>{!busy && <Button onClick={() => setResetDraft(true)}>{t("Start over")}</Button>}{busy && <Button icon={Square} onClick={() => controller.current?.abort()}>{t("Cancel collection")}</Button>}</div><div className={`research-progress-track ${busy ? 'running' : ''}`}><span style={{
              width: busy ? `${Math.max(5, run.results.filter(r => r.pages.length).length / run.results.length * 90)}%` : '100%'
            }} /></div><details open={busy}><summary>{t("Inspect collection log")}</summary><ul className="research-log">{run.events.map((e, i) => <li className={e.status} key={i}><strong>{t(e.category)} · {t(e.status)}</strong><span>{e.url}</span><p>{t(e.message)}</p>{e.status === 'failed' && !busy && connected && run.events.filter(x => x.url === e.url).at(-1)?.status === 'failed' && <Button onClick={() => retryCurrent(e.url)}>{t("Retry this page")}</Button>}</li>)}</ul></details></section>
      {!busy && <><section className="panel section-pad analysis-actions"><div><h2>{t("Analyze collected evidence")}</h2><p>{t("Review proposals before saving. AI suggestions are checked against the exact submitted source text.")}</p></div><div className="actions"><Button variant="primary" disabled={!connected || !aiConsent} onClick={() => analyzeDraft()}>{t("Analyze with AI")}</Button><Button onClick={useRules}>{t("Add rule-based analysis")}</Button></div>{<label className="check-line"><input type="checkbox" checked={aiConsent} onChange={e => setAIConsent(e.target.checked)} />{t("Allow sending selected website text to my configured AI provider. Charges may apply.")}</label>}<UsageInfo usage={run.aiUsage} />{run.aiCoverage && <p className="small muted">{run.aiCoverage.charactersSent} {t("characters sent across")} {run.aiCoverage.sourcesSent} {t("sources.")} {run.aiCoverage.truncated ? t('Some content was omitted due to input limits.') : t('All eligible source content was included.')}</p>}</section><div className="research-competitors" role="group" aria-label={t("Research competitor")}>{run.results.map((r, i) => <button key={r.url} className={active === i ? 'active' : ''} onClick={() => {
              setActive(i);
              setManual('');
              setManualURL('');
              setAI('');
              setFilter('all');
            }}>{r.name}<small>{r.pages.length} {t("pages \xB7")} {r.findings.filter(f => f.selected && f.change?.action!=='skip').length} {t("selected")}</small></button>)}</div>
      <section className="panel section-pad research-review"><div className="research-review-head"><Field label={t("Reviewed competitor name")}><input value={result.name} maxLength={100} onChange={e => changeResult({
                  name: e.target.value
                })} /></Field><label className="check-line"><input type="checkbox" checked={result.include !== false} onChange={e => changeResult({
                  include: e.target.checked
                })} />{t("Include this competitor")}</label></div><div className="actions">{connected && run.events.some(e => e.status === 'failed' && domain(e.url) === domain(result.url)) && <Button icon={RefreshCw} onClick={() => retryCurrent()}>{t("Retry this website")}</Button>}</div><p className="small muted">{result.url} {t("\xB7 Collected statements and interpretations require review. Confidence reflects extraction evidence, never independent truth.")}</p>
      <div className="tabs page-tabs">{[['profile', 'Profile & pricing'], ['audience', 'Audience insights'], ['sources', 'Collected pages'], ['import', 'Manual / optional AI']].map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{t(label)}</button>)}</div>
      {view === 'profile' && <details className="reviewed-price"><summary>{t("Optional numeric starting price for charts")}</summary><p>{t("Ambiguous $ symbols are not assigned a currency automatically. Review a selected pricing quotation, then confirm the amount, currency and billing/package unit. An existing numeric price is preserved; use Edit competitor to change it.")}</p><div className="form-grid">{[['amount', 'Reviewed starting amount'], ['currency', 'Reviewed currency code'], ['unit', 'Reviewed price unit']].map(([key, label]) => <Field label={label} key={key}><input value={result.reviewedPrice?.[key] || ''} type={key === 'amount' ? 'number' : 'text'} min={key === 'amount' ? '0' : undefined} step={key === 'amount' ? 'any' : undefined} placeholder={key === 'currency' ? t('USD, EUR, GBP…') : key === 'unit' ? t('month, seat per month…') : ''} onChange={e => changeReviewedPrice({
                    [key]: e.target.value
                  })} /></Field>)}<Field label={t("Pricing quotation")}><select value={result.reviewedPrice?.findingId || ''} onChange={e => changeReviewedPrice({
                    findingId: e.target.value
                  })}><option value="">{t("Choose a selected pricing statement")}</option>{result.findings.filter(f => f.field === 'pricing' && f.selected).map(f => <option key={f.id} value={f.id}>{f.text.slice(0, 100)}</option>)}</select></Field><Field label={t("Confirm price conditions")} hint={t("Explain the currency and applicable plan, billing period, seat or usage conditions.")} wide><textarea rows={2} maxLength={3000} value={result.reviewedPrice?.reason || ''} onChange={e => changeReviewedPrice({
                    reason: e.target.value
                  })} /></Field></div></details>}
      {['profile', 'audience'].includes(view) && <><div className="research-review-actions"><select aria-label={t("Finding classification")} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{t("All classifications")}</option><option value="statement">{t("Website statements")}</option><option value="inference">{t("Inferred insights")}</option><option value="analyst">{t("Analyst edits")}</option></select><Button onClick={() => changeResult({
                  findings: result.findings.map(f => visibleFindings.some(v => v.id === f.id) ? {
                    ...f,
                    selected: true
                  } : f)
                })}>{t("Select visible")}</Button><Button onClick={() => changeResult({
                  findings: result.findings.map(f => visibleFindings.some(v => v.id === f.id) ? {
                    ...f,
                    selected: false
                  } : f)
                })}>{t("Deselect visible")}</Button></div>{visibleFindings.length ? <FindingList findings={visibleFindings} pages={result.pages} onChange={changeFinding} /> : <Empty title={result.pages.length ? t('No proposals in this category.') : t('This website needs manual content.')}>{t("Import relevant text or HTML. Missing evidence stays unknown; it is never filled with invented claims.")}</Empty>}</>}
      {view === 'sources' && <div className="collected-pages">{result.pages.map(p => <details key={p.id || p.source.id}><summary>{p.category} · {p.source.title}</summary><Badge>{t(sourceLabel(p.source))}</Badge><a href={p.source.url} target="_blank" rel="noreferrer">{p.source.url}</a><p className="small muted">{t("Collected")} {new Date(p.source.collectedAt).toLocaleString(getLanguage())} · {p.source.excerpt.length} {t("characters retained (up to 20,000 per page)")}</p><pre>{p.source.excerpt}</pre></details>)}</div>}
      {view === 'import' && <div className="research-import-grid"><section><h3>{t("Import inaccessible pages")}</h3><p>{t("Paste public website text or import a saved .txt/.html file. It stays labeled user-supplied content. Page failures remain in this run\u2019s log.")}</p><Field label={t("Imported page URL")} hint={t("Use a page on this competitor’s website.")}><input value={manualURL} placeholder={result.url} onChange={e => setManualURL(e.target.value)} /></Field><Field label={t("Website content")}><textarea rows={8} value={manual} onChange={e => setManual(e.target.value)} placeholder={t("Paste the relevant page content here…")} /></Field><div className="actions"><Button variant="primary" onClick={() => importContent()}>{t("Analyze pasted content")}</Button><Button icon={Upload} onClick={() => file.current.click()}>{t("Choose text or HTML")}</Button></div><input ref={file} hidden type="file" accept=".txt,.html,.htm,text/plain,text/html" aria-label={t("Import website content file")} onChange={readFile} /></section><section><h3>{t("Optional AI-assisted review")}</h3><p>{t("The built-in analysis needs no API key. If you choose an external AI tool, download this evidence brief, ask it for proposals, then import the JSON here. Nothing is sent automatically. Imported proposals start deselected and inferred.")}</p><Button icon={Download} disabled={!result.pages.length} onClick={() => download('CompetitorLens-evidence-brief.json', evidenceBrief(result), 'application/json')}>{t("Download evidence brief")}</Button><Field label={t("Optional suggestion JSON")} hint={t("Every suggestion must include an exact quotation and a source ID from this run.")}><textarea rows={8} value={ai} onChange={e => setAI(e.target.value)} /></Field><Button disabled={!result.pages.length} onClick={() => {
                  setError('');
                  try {
                    const proposals = validateSuggestions(JSON.parse(ai), result);
                    if (result.findings.length + proposals.length > 150) throw new Error('Keep at most 150 proposals per competitor in one review.');
                    changeResult({
                      findings: [...result.findings, ...proposals]
                    });
                    setAI('');
                    setView('audience');
                  } catch (e) {
                    setError(e instanceof SyntaxError ? 'Suggestion input must be valid JSON.' : e.message);
                  }
                }}>{t("Validate & import suggestions")}</Button></section></div>}
      </section>{run.aiOpportunities?.length > 0 && <section className="panel section-pad ai-opportunity-review"><h2>{t("AI market opportunity hypotheses")}</h2><p>{t("Accept only hypotheses whose comparison and quotations you have reviewed. Existing validation history is preserved.")}</p>{run.aiOpportunities.map(o => <article key={o.id} className="finding-card"><label className="check-line"><input type="checkbox" checked={o.selected} onChange={e => {
                  setRun(r => ({
                    ...r,
                    aiOpportunities: r.aiOpportunities.map(x => x.id === o.id ? {
                      ...x,
                      selected: e.target.checked
                    } : x)
                  }));
                  setReviewed(false);
                }} />{t("Accept opportunity hypothesis")}</label><h3>{o.title}</h3><p><strong>{t("Target audience:")}</strong> {o.audience}</p><p><strong>{t("Competitor comparison:")}</strong> {o.comparison}</p><Field label={t("Business recommendation")}><textarea value={o.recommendation} maxLength={1600} onChange={e => {
                  setRun(r => ({
                    ...r,
                    aiOpportunities: r.aiOpportunities.map(x => x.id === o.id ? {
                      ...x,
                      recommendation: e.target.value
                    } : x)
                  }));
                  setReviewed(false);
                }} /></Field><p><strong>{t("Suggested validation:")}</strong> {o.validation}</p>{o.evidence.map((e, i) => <blockquote key={i}>{e.quote}<small>{e.competitorUrl}</small></blockquote>)}</article>)}</section>}<section className="panel section-pad research-save"><Button onClick={() => {
              setRun(r => ({
                ...r,
                results: r.results.map(v => approveChanges(v))
              }));
              setReviewed(false);
            }}>{t("Keep existing and append pending changes")}</Button><p>{t("Modified claims require an update decision. Missing claims are not treated as removals. Replaced fields keep their prior record in Research history.")}</p><Notice>{t("Saving appends evidence and selected findings to matching domains. Existing numeric prices and notes stay intact. Old research runs and opportunity decisions remain in History. Review any conflicting price notes in the competitor editor.")}</Notice><label className="check-line"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />{t("I reviewed the selected statements, inferred insights, and pricing conditions.")}</label><div className="horizontal"><p>{selectedCount} {t("selected findings \xB7")} {run.results.filter(r => r.include !== false && r.pages.length).length} {t("competitors with content")}</p><Button variant="primary" icon={ArrowRight} disabled={!reviewed} onClick={save}>{t("Save & compare")}</Button></div></section></>}
    </>}
    {!run && <Notice>{t("Blocked websites, missing pages, and JavaScript-only content may need manual import. No account access, background crawling, or automated requests occur until you start collection. The local service stops after 30 minutes without research requests.")}</Notice>}
    </>}
    {resetDraft && <Modal title={t("Discard this research draft?")} subtitle={t("Saved records and research history will stay intact.")} onClose={() => setResetDraft(false)}><div className="modal-body"><p>{t("Collected pages and review choices in this unsaved run will be discarded. Save the run first if you want to keep them.")}</p></div><footer className="modal-footer"><Button onClick={() => setResetDraft(false)}>{t("Keep reviewing")}</Button><Button variant="primary" onClick={() => {
          setRun(null);
          setResetDraft(false);
          setError('');
          setReviewed(false);
        }}>{t("Discard research draft")}</Button></footer></Modal>}
  </>;
}
