// Durable research snapshots. Signatures detect changes; they are not scores or confidence estimates.
const keyOf = label => label.trim().toLowerCase();
function signature(value) {
  const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,canonical(v[k])])) : v;
  const text = JSON.stringify(canonical(value)); let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return `${text.length}:${a >>> 0}:${b >>> 0}`;
}
const snapshotRecord = (c, text, sources) => ({ competitorId: c.id, name: c.name, text, sources: structuredClone(sources) });
export function researchSignature(project){
  const research=project.competitors.map(({updatedAt,seriesIndex,researchFindings,advantages,...c})=>({...c,...(advantages?{advantages}:{})}));
  return signature(research);
}
function candidates(project) {
  const cs = project.competitors; if (cs.length < 2) return [];
  const all = [], groups = new Map(), words = /\b(subscription|subscribe|commitment|cancel|flexible)\b|订阅|续费|承诺|取消|灵活/i;
  for (const c of cs) for (const label of c.audiences) { const key = keyOf(label); if (!groups.has(key)) groups.set(key, { key, label, records: [] }); if (!groups.get(key).records.includes(c)) groups.get(key).records.push(c); }
  const plans = cs.filter(c => words.test([c.products, c.pricing, ...c.features].join(' ')) || c.sources.some(s => s.fields.some(f => ['products','pricing','behavior'].includes(f)) && words.test(s.excerpt)));
  if (plans.length >= 2) all.push({ ruleKey: 'flexibility', title: 'Better choice. Less commitment.', short: 'Investigate purchase flexibility.', category: 'Product differentiation', audience: 'Commitment-conscious buyers', reason: 'Offer wording or mapped excerpts in at least two records match subscription or commitment terms. This is a keyword signal, not evidence of customer frustration.', body: 'Compare the actual plan terms and ask customers whether a smaller trial or flexible purchase option would help. Offered terms are not observed purchasing behavior.', basis: plans.map(c => { const sources = c.sources.filter(s => s.fields.some(f => ['products','pricing','behavior'].includes(f)) && words.test(s.excerpt)); return snapshotRecord(c, sources[0]?.excerpt || c.products || c.pricing || c.features.join(', '), sources); }), experiment: 'Review plan terms, then interview 5–10 prospective customers about actual purchase barriers before testing a flexible offer.', limitation: 'Keyword matches and plan language do not establish an unmet need or market demand.' });
  for (const g of [...groups.values()].sort((a,b) => a.records.length-b.records.length || a.label.localeCompare(b.label))) {
    if (g.records.length === cs.length || all.length >= 3) continue;
    all.push({ ruleKey: `audience:${g.key}`, title: `Take a closer look at ${g.label.toLowerCase()}.`, short: `${g.records.length} of ${cs.length} records mention this audience.`, category: 'Audience research', audience: g.label, reason: 'This audience label is missing from some research records. That is a documentation gap, not proof that competitors do not serve it.', body: `Investigate ${g.label.toLowerCase()} before considering a specific offer. Missing mentions cannot establish an underserved market.`, basis: g.records.map(c => { const segment = c.audienceResearch?.find(a => keyOf(a.label) === g.key); const sources = c.sources.filter(s => s.segmentMappings?.some(m => m.segmentId === segment?.id && m.fields.includes('audiences'))); return snapshotRecord(c, `Recorded audience: ${g.label}. ${segment?.needs || 'Segment-specific needs are not recorded.'}`, sources); }), experiment: `Check competitor evidence and interview prospective ${g.label.toLowerCase()} about their alternatives and unmet needs. Record what would disprove this hypothesis.`, limitation: 'Recorded mentions describe this research set, not market coverage, audience size, or demand.' });
  }
  for(const g of groups.values()){
    if(all.length>=6)break;
    const scoped=g.records.map(c=>({c,a:c.audienceResearch?.find(a=>keyOf(a.label)===g.key)})).filter(({c,a})=>a?.needs&&c.sources.some(s=>s.segmentMappings?.some(m=>m.segmentId===a.id&&m.fields.includes('needs'))));
    if(!scoped.length)continue;
    const featureSets=cs.map(c=>c.features.join(' | ')),offers=cs.map(c=>c.pricing||'Not recorded');
    if(new Set(featureSets).size<2&&new Set(offers).size<2)continue;
    const comparisons=cs.map(c=>`${c.name}: ${c.features.length?c.features.slice(0,5).join(', '):'Features not recorded'}. ${c.pricing?c.pricing.slice(0,220):'Pricing not recorded.'}`);
    all.push({ruleKey:`needs:${g.key}`,title:`Test a focused offer for ${g.label.toLowerCase()}.`,short:'Connect a documented need with differences in recorded offers.',category:'Needs and offer differentiation',audience:g.label,reason:'Audience-specific needs have mapped evidence, while recorded feature or pricing descriptions differ. These differences suggest a testable positioning question, not proof of unmet demand.',body:`Compare whether a focused offer could address ${g.label.toLowerCase()} more clearly. Validate the need and which existing alternatives already satisfy it.`,recommendation:`Build a small prototype or offer statement around the documented need, then compare it against the recorded alternatives before investing.`,comparison:comparisons.join('\n'),basis:scoped.map(({c,a})=>snapshotRecord(c,a.needs,c.sources.filter(s=>s.segmentMappings?.some(m=>m.segmentId===a.id&&m.fields.includes('needs'))))),experiment:`Ask prospective ${g.label.toLowerCase()} to evaluate the need, compare at least two existing offers, and explain whether the proposed difference would change their decision.`,limitation:'Feature and pricing differences may reflect incomplete research. Customer willingness to pay, adoption, and underserved demand are unverified.'});
  }
  const fingerprint=researchSignature(project);
  for(const o of project.aiOpportunities||[]){
    if(!o.selected||o.researchSignature!==fingerprint)continue;
    const run=project.researchHistory?.find(r=>r.id===o.runId);
    const basis=[];
    for(const e of o.evidence){const result=run?.results.find(r=>r.url===e.competitorUrl),source=result?.pages.find(p=>p.source.id===e.sourceId)?.source,c=cs.find(c=>c.id===result?.competitorId);if(!c||!source||!source.excerpt.includes(e.quote))continue;const old=basis.find(b=>b.competitorId===c.id);if(old){old.text+='\n'+e.quote;if(!old.sources.some(s=>s.id===source.id))old.sources.push(structuredClone(source));}else basis.push(snapshotRecord(c,e.quote,[source]));}
    if(!basis.length)continue;
    all.push({ruleKey:`ai:${o.id}`,title:o.title,short:o.recommendation.slice(0,180),category:'AI opportunity hypothesis',audience:o.audience,reason:'AI-assisted interpretation grounded in the quoted research. Confidence is qualitative; review the comparison and validate demand.',body:o.recommendation,recommendation:o.recommendation,comparison:o.comparison,basis,experiment:o.validation,limitation:'AI interpretation may be incomplete or incorrect. Source quotations do not independently verify demand or competitive advantage.',engine:'ai',confidence:o.confidence});
  }
  if (!all.length) all.push({ ruleKey: 'research-depth', title: 'Find the difference behind similar offers.', short: 'Gather stronger customer evidence.', category: 'Research opportunity', audience: 'Recorded audiences', reason: 'Current records provide no differentiated signal under these limited rules.', body: 'The current records do not establish a distinctive audience gap. Explore interviews and product evidence before choosing a direction.', basis: cs.map(c => snapshotRecord(c, c.positioning || 'Positioning not recorded.', c.sources.filter(s => s.fields.includes('positioning')))), experiment: 'Interview customers of at least two competitors and map each finding to its audience and source.', limitation: 'There is insufficient evidence to claim an underserved market.' });
  return all;
}
export function reconcileOpportunities(project) {
  const existing = project.opportunityHistory || [], now = project.updatedAt || project.createdAt || '';
  const fingerprint = researchSignature(project), proposed = candidates(project);
  const history = existing.map(o => ({ ...o }));
  // Legacy decisions lack a dated evidence snapshot. Recover them as history,
  // never silently apply an old validation status to today's proposed evidence.
  for (const [id, state] of Object.entries(project.opportunityState || {})) if (!history.some(o => o.id === id)) history.push({ id, ruleKey: id, revision: 1, fingerprint: '', lifecycle: 'stale', createdAt: '', demo: project.demo, title: `Recovered validation: ${id}`, short: 'Preserved from a legacy workspace.', category: 'Legacy history', audience: 'Original scope unavailable', reason: 'The old application retained a status and note without a historical evidence snapshot.', body: 'The original hypothesis and evidence cannot be reconstructed reliably. Your validation work is preserved below.', basis: [], experiment: 'Review current research before reusing this decision.', limitation: 'Historical inputs and dates were not stored by the previous version.', status: state.status, note: state.note });
  for (const old of history) if (old.lifecycle === 'current' && (old.fingerprint !== fingerprint || !proposed.some(n => n.ruleKey === old.ruleKey))) old.lifecycle = 'stale';
  for (const candidate of proposed) {
    if (history.some(o => o.lifecycle === 'current' && o.ruleKey === candidate.ruleKey)) continue;
    const revisions = history.filter(o => o.ruleKey === candidate.ruleKey);
    let revision = Math.max(0,...revisions.map(o=>o.revision)) + 1;
    const idFor = n => n === 1 ? candidate.ruleKey : `${candidate.ruleKey}::${n}`;
    while(history.some(o=>o.id===idFor(revision))) revision++;
    history.push({ ...candidate, id: idFor(revision), revision, fingerprint, lifecycle: 'current', createdAt: now, demo: project.competitors.some(c => c.demo), status: 'To explore', note: '' });
  }
  return { ...project, opportunityHistory: history };
}
export function opportunities(project, includeHistory = false) {
  const p = reconcileOpportunities(project);
  return p.opportunityHistory.filter(o => includeHistory || o.lifecycle === 'current').map(o => ({ ...o, basis: o.basis.map(b => ({ ...b, c: project.competitors.find(c => c.id === b.competitorId) || null })) }));
}
export function changeOpportunity(project, id, patch) {
  const p = reconcileOpportunities(project);
  return { ...p, opportunityHistory: p.opportunityHistory.map(o => o.id === id ? { ...o, ...patch } : o), opportunityState: { ...p.opportunityState, [id]: { status: patch.status ?? p.opportunityHistory.find(o => o.id === id)?.status ?? 'To explore', note: patch.note ?? p.opportunityHistory.find(o => o.id === id)?.note ?? '' } } };
}
