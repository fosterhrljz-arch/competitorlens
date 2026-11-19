import { t } from "../lib/i18n.js";
import { pricingStatus, pricingSignature } from '../lib/pricing.js';
import { sourceLabel } from '../lib/provenance.js';
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Globe, Loader2, ArrowUpRight, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { Field, Button, Notice, Badge, PageTitle } from './UI.jsx';
import { blankCompetitor, splitList, safeURL, assertCompetitor, uid, FIELD_LABELS, domain, ensureAudienceResearch } from '../lib/model.js';
import { fetchPublicPage } from '../lib/io.js';
import { researchStatus, CORE_FIELDS, fieldStatus } from '../lib/research.js';
import { ProgressRow } from './Overview.jsx';
export default function CompetitorEditor({
  competitor,
  project,
  onSave,
  onClose,
  onDirty,
  initialStep = 'Profile',
  initialAudience = ''
}) {
  const [draft, setDraft] = useState(() => structuredClone(competitor || blankCompetitor()));
  const [tab, setTab] = useState(initialStep),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [fetchMessage, setFetchMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = e => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const emptySource = () => ({
    title: '',
    url: '',
    excerpt: '',
    fields: [],
    scope: '',
    method: 'manual'
  });
  const [source, setSource] = useState(emptySource),
    [audienceScope, setAudienceScope] = useState(initialAudience);
  const research = ensureAudienceResearch(draft),
    activeSegment = research.audienceResearch.find(a => a.id === audienceScope);
  const pricing = pricingStatus(draft);
  function updateInsight(key, value) {
    markDirty();
    setDraft(d => {
      const next = ensureAudienceResearch(d);
      return {
        ...next,
        audienceResearch: next.audienceResearch.map(a => a.id === audienceScope ? {
          ...a,
          [key]: value
        } : a)
      };
    });
  }
  const markDirty = () => {
    setDirty(true);
    onDirty(true);
  };
  const update = (k, v) => {
    markDirty();
    setDraft(d => ({
      ...d,
      [k]: v
    }));
  };
  const updateSource = patch => {
    markDirty();
    setSource(s => ({
      ...s,
      ...patch,
      ...(('url' in patch || 'excerpt' in patch) && patch.method !== 'fetched' ? {
        method: patch.url ?? s.url ? 'pasted' : 'manual'
      } : {})
    }));
  };
  const steps = ['Profile', 'Audience', 'Evidence'],
    step = steps.indexOf(tab),
    coverage = researchStatus([draft]);
  function switchStep(next) {
    setTab(next);
    setError('');
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }
  const field = (k, label, opts = {}) => <Field label={label} hint={opts.hint} wide={opts.wide}>{opts.area ? <textarea rows={opts.rows || 2} value={draft[k]} maxLength={5000} onChange={e => update(k, e.target.value)} /> : <input value={draft[k]} maxLength={opts.max || 300} type={opts.type || 'text'} min={opts.type === 'number' ? 0 : undefined} step={opts.type === 'number' ? 'any' : undefined} placeholder={opts.placeholder || ''} onChange={e => update(k, e.target.value)} />}</Field>;
  function save(e) {
    e.preventDefault();
    try {
      if (busy) throw new Error('Wait for page collection to finish before saving.');
      if (source.title.trim() || source.url.trim() || source.excerpt.trim() || source.fields.length || source.scope) {
        setTab('Evidence');
        throw new Error('Attach your pending source before saving, or choose Clear source draft. URLs and field selections are part of the pending source.');
      }
      const url = safeURL(draft.url);
      const c = {
        ...ensureAudienceResearch(draft),
        name: draft.name.trim() || (url ? domain(url) : ''),
        url,
        features: splitList(draft.features.join('|')),
        audiences: splitList(draft.audiences.join('|')),
        updatedAt: new Date().toISOString()
      };
      assertCompetitor(c, project.competitors, true);
      onSave(c);
    } catch (e) {
      setError(e.message);
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    }
  }
  function addSource() {
    try {
      if (!source.title.trim() || !source.excerpt.trim()) throw new Error('Add a source title and an excerpt before attaching it.');
      if (draft.sources.length >= 50) throw new Error('A competitor can have up to 50 sources.');
      const url = safeURL(source.url),
        method = draft.demo ? 'demo' : source.method === 'fetched' ? 'fetched' : url ? 'pasted' : 'manual';
      const entry = {
        id: uid(),
        url,
        title: source.title.trim(),
        excerpt: source.excerpt.trim(),
        kind: draft.demo ? 'Demo' : method === 'fetched' ? 'Fetched page text' : url ? 'User-supplied excerpt' : 'Manual note',
        method,
        collectedAt: new Date().toISOString(),
        fields: source.scope ? [] : source.fields,
        segmentMappings: source.scope ? [{
          segmentId: source.scope,
          fields: source.fields
        }] : []
      };
      markDirty();
      setDraft(d => ({
        ...ensureAudienceResearch(d),
        sources: [...d.sources, entry]
      }));
      setSource(emptySource());
      setError('');
      setFetchMessage('Source attached to this draft. Save the competitor to keep it.');
    } catch (e) {
      setError(e.message);
    }
  }
  async function collect() {
    setBusy(true);
    setError('');
    setFetchMessage('');
    try {
      const url = safeURL(source.url || draft.url);
      if (!url) throw new Error('Enter a website URL first.');
      const result = await fetchPublicPage(url);
      if (!alive.current) return;
      updateSource({
        ...result,
        url,
        method: 'fetched'
      });
      setFetchMessage('Page text collected. Review the excerpt, select the fields it supports, then attach it.');
    } catch (e) {
      if (!alive.current) return;
      setFetchMessage(`Could not read this page. ${e.name === 'AbortError' ? 'The request timed out.' : e.message === 'Failed to fetch' ? 'The site may block browser access or redirects.' : e.message} Open the website and paste a relevant excerpt below.`);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return <div className="editor-workspace"><PageTitle title={competitor ? t("Edit {0}", {
      0: competitor.name
    }) : t('Add a competitor')} subtitle={t("Keep the profile clear. Keep the evidence close.")}><Button type="button" onClick={onClose}>{t("Cancel")}</Button><Button type="submit" form="competitor-form" variant="primary">{t("Save competitor")}</Button></PageTitle>
    {draft.demo && <div className="demo-banner">{t("Demo record \xB7 Changes stay in this fictional project.")}</div>}
    <form id="competitor-form" onSubmit={save}><div className="editor-layout"><nav className="editor-steps" aria-label={t("Editing steps")}>{steps.map((name, i) => <button key={name} type="button" aria-label={name === 'Profile' ? t('Profile & positioning') : t(name)} aria-current={tab === name ? 'step' : undefined} className={tab === name ? 'active' : ''} onClick={() => switchStep(name)}><span>{i + 1}</span><strong>{name === 'Profile' ? <><span className="step-desktop">{t("Profile & positioning")}</span><span className="step-mobile">{t("Profile")}</span></> : t(name)}</strong></button>)}<p>{dirty ? t('Unsaved changes') : t('Draft workspace')}<br />{t("Changes are saved only when you save the competitor.")}</p></nav>
    <section className="panel editor-panel"><div className="editor-title"><h2>{tab === 'Profile' ? t('Profile & positioning') : tab === 'Audience' ? t('Audience insights') : t('Supporting evidence')}</h2><p>{tab === 'Profile' ? t('A website URL starts a manual record. It does not generate traffic or verified audience intelligence.') : tab === 'Audience' ? t('Separate what you know from what you suspect.') : t('Connect each claim to context you can review.')}</p></div><div className="editor-body">{error && <div className="error" role="alert">{t(error)}</div>}
    {tab === 'Profile' && <><div className="form-grid">{field('name', 'Competitor name', {
                  placeholder: 'e.g. Northstar Coffee',
                  max: 100,
                  hint: 'Leave blank to use the website domain.'
                })}{field('url', 'Website URL', {
                  placeholder: 'https://example.com'
                })}{field('positioning', 'Positioning statement', {
                  wide: true,
                  area: true,
                  placeholder: 'Who is it for, and what makes it different?'
                })}{field('products', 'Products & services', {
                  wide: true,
                  area: true
                })}{field('pricing', 'Pricing notes', {
                  wide: true,
                  area: true,
                  hint: 'Context and conditions only. Charts and tables use the validated numeric amount below.'
                })}{field('priceAmount', 'Starting price amount', {
                  type: 'number'
                })}<Field label={t("Currency")}><select value={draft.currency} onChange={e => update('currency', e.target.value)}>{[...new Set([draft.currency, 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'])].map(x => <option key={x} value={x}>{x}</option>)}</select></Field>{field('priceUnit', 'Price unit', {
                  placeholder: '250 g bag, month, seat per month…'
                })}
    {(pricing.issues.length > 0 || pricing.conflicts.length > 0) && <div className="span-2 pricing-review"><Notice>{[...pricing.issues, ...pricing.conflicts].map(v=>t(v)).join(' ')} {t("Numeric charts exclude unresolved pricing.")}</Notice>{pricing.conflicts.length > 0 && <Field label={t("Explain pricing difference")} hint={t("Correct the price/notes, or explain why the notes refer to a different price. This explanation is included in reports.")}><textarea value={draft.priceNoteReview?.reason || ''} maxLength={3000} onChange={e => update('priceNoteReview', {
                      signature: pricingSignature(draft),
                      reason: e.target.value
                    })} /></Field>}</div>}
    <Field label={t("Features")} hint={t("Separate items with | (a vertical bar).")}><input value={draft.features.join('|')} maxLength={3000} onChange={e => update('features', e.target.value.split('|'))} /></Field>
    <div className="span-2 form-section"><h3>{t("Qualitative positioning")}</h3><p>{t("Your assessment, not a measured market metric. Leave blank when unknown.")}</p></div>
    <Field label={t("Offering breadth")}><select value={draft.breadth} onChange={e => update('breadth', e.target.value)}><option value="">{t("Not assessed")}</option>{['1 · Very focused', '2 · Focused', '3 · Balanced', '4 · Broad', '5 · Very broad'].map((s, i) => <option key={s} value={i + 1}>{t(s)}</option>)}</select></Field><Field label={t("Price positioning")}><select value={draft.tier} onChange={e => update('tier', e.target.value)}><option value="">{t("Not assessed")}</option>{['1 · Accessible', '2 · Value-oriented', '3 · Midrange', '4 · Premium', '5 · Luxury'].map((s, i) => <option key={s} value={i + 1}>{t(s)}</option>)}</select></Field>{field('advantages', 'Competitive advantages', {wide:true,area:true})}{field('notes', 'Research notes', {
                  wide: true,
                  area: true
                })}</div><Notice>{t("Profile values are analyst entries. Link the relevant excerpts in Evidence; a source link alone does not verify a claim.")}</Notice></>}
    {tab === 'Audience' && <div className="form-grid"><Field label={t("Audience segments")} wide hint={t("Separate labels with |. Removing a label retains its research and evidence below.")}><input value={draft.audiences.join('|')} maxLength={3000} onChange={e => update('audiences', e.target.value.split('|'))} /></Field>
    <Field label={t("Research scope")} wide><select value={audienceScope} onChange={e => setAudienceScope(e.target.value)}><option value="">{t("Competitor-wide notes (including legacy research)")}</option>{research.audienceResearch.map(a => <option key={a.id} value={a.id}>{a.label}{draft.audiences.some(x => x.trim().toLowerCase() === a.label.toLowerCase()) ? '' : t(' · retained, not currently listed')}</option>)}</select></Field>
    <div className="span-2"><Notice>{activeSegment ? t("Audience-specific research for {0}. No competitor-wide notes are copied here.", {
                    0: activeSegment.label
                  }) : t('These notes describe the competitor generally. Legacy text is preserved exactly; it is not evidence for every audience.')}</Notice></div>
    {['needs', 'motivations', 'interests', 'behavior'].map((key, i) => activeSegment ? <Field key={key} label={['Customer needs', 'Motivations', 'Interests', 'Purchasing behavior'][i]} wide><textarea rows={3} maxLength={10000} value={activeSegment[key]} onChange={e => updateInsight(key, e.target.value)} /></Field> : <div className="span-2" key={key}>{field(key, ['Customer needs', 'Motivations', 'Interests', 'Purchasing behavior'][i], {
                  area: true,
                  wide: true
                })}</div>)}
    {activeSegment && <div className="span-2"><Button type="button" onClick={() => {
                  updateSource({
                    scope: activeSegment.id
                  });
                  switchStep('Evidence');
                }}>{t("Link evidence for this audience")}</Button></div>}</div>}
    {tab === 'Evidence' && <><div className="collection-box"><h3>{t("Collect from a public page")}</h3><p>{t("Read an accessible page, or paste text you have reviewed. Fetching contacts only the entered website, without account credentials. Many sites block direct browser requests.")}</p><div className="input-action"><input aria-label={t("Source URL")} value={source.url} placeholder={t("https://example.com/pricing")} maxLength={2000} onChange={e => updateSource({
                    url: e.target.value
                  })} /><Button type="button" icon={busy ? Loader2 : Globe} disabled={busy} onClick={collect}>{busy ? t('Reading…') : t('Fetch page')}</Button></div>{(source.url || draft.url) && <button type="button" className="text-btn small" onClick={() => {
                  try {
                    const url = safeURL(source.url || draft.url);
                    window.open(url, '_blank', 'noopener,noreferrer');
                  } catch (e) {
                    setError(e.message);
                  }
                }}>{t("Open website")} <ArrowUpRight size={13} /></button>}{fetchMessage && <p className="fetch-message" role="status">{t(fetchMessage)}</p>}</div>
    <div className="form-grid"><Field label={t("Evidence scope")} wide><select value={source.scope} onChange={e => updateSource({
                    scope: e.target.value,
                    fields: []
                  })}><option value="">{t("Competitor-wide fields")}</option>{research.audienceResearch.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></Field><Field label={t("Source title")} wide><input value={source.title} maxLength={300} placeholder={t("Pricing page, customer interview, product listing…")} onChange={e => updateSource({
                    title: e.target.value
                  })} /></Field><Field label={t("Supporting excerpt or research note")} wide hint={t("Paste the relevant wording. It stays on your device.")}><textarea rows={5} value={source.excerpt} maxLength={20000} onChange={e => updateSource({
                    excerpt: e.target.value
                  })} /></Field><div className="span-2"><div className="label">{t("Which fields does this evidence support?")}</div><div className="check-grid">{Object.entries(FIELD_LABELS).filter(([key]) => !source.scope || ['audiences', 'needs', 'motivations', 'interests', 'behavior'].includes(key)).map(([key, label]) => <label key={key}><input type="checkbox" checked={source.fields.includes(key)} onChange={e => updateSource({
                        fields: e.target.checked ? [...source.fields, key] : source.fields.filter(x => x !== key)
                      })} />{t(label)}</label>)}</div></div></div><div className="actions"><Button type="button" icon={Plus} onClick={addSource}>{t("Attach source")}</Button><Button type="button" onClick={() => {
                  setSource(emptySource());
                  setError('');
                  setFetchMessage('Source draft cleared. Attached sources are unchanged.');
                }}>{t("Clear source draft")}</Button></div><p className="small muted">{t("Collection method:")} {draft.demo ? t('Demo source') : source.method === 'fetched' ? t('Fetched page text') : source.url ? t('User-supplied excerpt (URL provided)') : t('Manual research note')}{t(". Linked evidence is not independently verified.")}</p><div className="attached-sources"><h3>{t("Attached sources")} <span className="muted">{draft.sources.length}</span></h3>{draft.sources.length === 0 ? <p className="muted small">{t("No sources yet. You can save manual research and add evidence later.")}</p> : draft.sources.map(s => <div className="attached-source" key={s.id}><div><strong>{s.title}</strong> <Badge>{t(sourceLabel(s))}</Badge><p>{s.excerpt}</p><small>{t("Supports:")} {s.fields.map(f => t(FIELD_LABELS[f])).join(', ') || t('No competitor-wide mapping')}{s.segmentMappings?.map(m => <span key={m.segmentId}> · {research.audienceResearch.find(a => a.id === m.segmentId)?.label}: {m.fields.map(f => t(FIELD_LABELS[f])).join(', ')}</span>)}</small></div><button type="button" className="icon-btn" aria-label={t("Remove source {0}", {
                    0: s.title
                  })} onClick={() => update('sources', draft.sources.filter(x => x.id !== s.id))}><Trash2 size={16} /></button></div>)}</div></>}
    </div><footer className="editor-footer"><span className="muted small">{t("Step")} {step + 1} {t("of 3")}</span><div className="actions">{step > 0 && <Button type="button" icon={ArrowLeft} onClick={() => switchStep(steps[step - 1])}>{t("Back")}</Button>}{step < 2 ? <Button key="continue" type="button" variant="primary" icon={ArrowRight} onClick={e => {
                e.preventDefault();
                switchStep(steps[step + 1]);
              }}>{t("Continue to")} {steps[step + 1].toLowerCase()}</Button> : <Button key="finish" type="submit" variant="primary">{t("Save & finish")}</Button>}</div></footer></section>
    <aside className="context-rail editor-guidance"><h2>{tab === 'Profile' ? t('Build a useful profile') : tab === 'Audience' ? t('Make the audience concrete') : t('Keep evidence traceable')}</h2><ul>{(tab === 'Profile' ? ['Use the wording your competitor uses.', 'Include package size and billing terms.', 'Leave unknown information blank.'] : tab === 'Audience' ? ['Use consistent segment names across competitors.', 'Keep motivations and needs tied to evidence.', 'An available offer is not observed customer behavior.'] : ['Capture the relevant excerpt, not just a link.', 'Select the fields each source supports.', 'A source may need interpretation or further validation.']).map(itemLabel => <li key={itemLabel}>{t(itemLabel)}</li>)}</ul><div className="context-section"><h2>{t("Research coverage")}</h2><ProgressRow label={t("Core fields linked")} value={coverage.linked} total={coverage.total} /><div className="coverage-checks">{CORE_FIELDS.map(([key, label]) => <div key={key}><span className={`status-symbol ${fieldStatus(draft, key)}`}>{fieldStatus(draft, key) === 'missing' ? '—' : ''}</span><span>{t(label)}</span></div>)}</div><p><FileText size={14} /> {draft.sources.length} {t("attached sources")}</p><Button type="button" onClick={() => switchStep('Evidence')} icon={ArrowRight}>{t("Review evidence")}</Button></div></aside>
    </div></form></div>;
}
