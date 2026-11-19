import { validateFindings, validateResearchHistory, validateAIOpportunities } from './researchData.js';
import { numericPriceLabel, pricingStatus } from './pricing.js';
import { sourceMethod, isDemoSource, SOURCE_METHODS } from './provenance.js';
import { reconcileOpportunities } from './history.js';
export { opportunities, changeOpportunity, reconcileOpportunities } from './history.js';
export const SCHEMA_VERSION = 4;
export const emptyWorkspace = () => ({version:4, activeId:'', projects:[]});
export const STORAGE_KEY = 'competitorlens.v1';
export const uid = () => globalThis.crypto?.randomUUID?.() || `cl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const splitList = value => [...new Set(String(value || '').split('|').map(x => x.trim()).filter(Boolean))];
export const FIELD_LABELS = { positioning:'Positioning', products:'Products', pricing:'Pricing', features:'Features', audiences:'Audiences', needs:'Needs', motivations:'Motivations', interests:'Interests', behavior:'Buying behavior', scores:'Positioning scores', notes:'Notes', advantages:'Competitive advantages' };
export const blankCompetitor = () => ({ id:uid(), name:'', url:'', positioning:'', products:'', pricing:'', priceAmount:'', currency:'USD', priceUnit:'', features:[], audiences:[], needs:'', motivations:'', interests:'', behavior:'', notes:'', advantages:'', breadth:'', tier:'', sources:[], audienceResearch:[], researchFindings:[], seriesIndex:-1, priceNoteReview:null, demo:false, updatedAt:new Date().toISOString() });
export function safeURL(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  if (/^[a-z][a-z\d+.-]*:/i.test(s) && !/^https?:\/\//i.test(s)) throw new Error('Use a public http:// or https:// website URL.');
  let url;
  try { url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { throw new Error('Enter a valid website URL, such as example.com.'); }
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) throw new Error('Enter a public website URL without login details.');
  return url.href;
}
export const domain = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Manual research'; } };
export const segmentKey = label => label.trim().toLowerCase();
export const audienceRecord = (c, label) => c.audienceResearch?.find(a => segmentKey(a.label) === segmentKey(label));
export const sourceFor = (c, field, segmentId = '') => c.sources.filter(s => segmentId ? s.segmentMappings?.some(m => m.segmentId === segmentId && (!field || m.fields.includes(field))) : (!field || s.fields.includes(field)));
export function ensureAudienceResearch(c) {
  const records = (c.audienceResearch || []).map(a => ({...a}));
  for (const label of c.audiences.filter(a=>a.trim())) if (!records.some(a => segmentKey(a.label) === segmentKey(label))) {
    let n = records.length + 1; while (records.some(a => a.id === `segment-${n}`)) n++;
    records.push({id:`segment-${n}`,label:label.trim(),needs:'',motivations:'',interests:'',behavior:''});
  }
  return {...c,audienceResearch:records};
}
export function prepareProject(project) {
  const used = new Set();
  const competitors = project.competitors.map(c => {
    let index = c.seriesIndex;
    if (!Number.isInteger(index) || index < 0 || index > 4 || used.has(index)) index = [0,1,2,3,4].find(i=>!used.has(i));
    used.add(index);
    return {...ensureAudienceResearch(c),advantages:c.advantages||'',researchFindings:c.researchFindings||[],seriesIndex:index};
  });
  return reconcileOpportunities({...project,researchHistory:project.researchHistory||[],aiOpportunities:project.aiOpportunities||[],competitors});
}

export const evidenceLabel = c => c.demo ? 'Demo evidence' : c.sources.length ? 'Recorded sources' : 'Manual input';
export const priceLabel = numericPriceLabel;
export function assertCompetitor(c, existing = [], strictPricing = false) {
  if (!c.name.trim()) throw new Error('A competitor name is required.');
  if (c.name.length > 100) throw new Error('Keep the name under 100 characters.');
  for (const key of ['url','positioning','products','pricing','currency','priceUnit','needs','motivations','interests','behavior','notes','advantages']) if (String(c[key]).length > 10000) throw new Error('Each research field must be under 10,000 characters.');
  for (const s of c.sources) if (s.title.length > 300 || s.excerpt.length > 20000 || s.url.length > 10000) throw new Error('Source titles must be under 300 characters and excerpts under 20,000.');
  if (c.features.length > 30 || c.audiences.length > 30) throw new Error('Use up to 30 features or audience labels.');
  if ([...c.features,...c.audiences].some(x=>x.length>200)) throw new Error('Keep feature and audience labels under 200 characters.');
  if (c.url) safeURL(c.url);
  if (c.priceAmount !== '' && (!Number.isFinite(Number(c.priceAmount)) || Number(c.priceAmount) < 0)) throw new Error('Price must be a positive number or zero.');
  if (strictPricing && c.priceAmount !== '' && !pricingStatus(c).valid) throw new Error([...pricingStatus(c).issues,...pricingStatus(c).conflicts].join(' '));
  if ((c.audienceResearch || []).length > 100) throw new Error('Keep no more than 100 active or retained audience research records per competitor.');
  for (const a of c.audienceResearch || []) for (const k of ['needs','motivations','interests','behavior']) if (typeof a[k] !== 'string' || a[k].length > 10000) throw new Error('Each audience insight must be text under 10,000 characters.');
  for (const key of ['breadth','tier']) if (c[key] !== '' && (!Number.isInteger(Number(c[key])) || Number(c[key]) < 1 || Number(c[key]) > 5)) throw new Error('Positioning scores must be whole numbers from 1 to 5.');
  if (existing.some(x => x.id !== c.id && (x.name.trim().toLowerCase() === c.name.trim().toLowerCase() || (x.url && c.url && domain(x.url) === domain(c.url))))) throw new Error('This competitor name or website is already in the project.');
}
export function audienceGroups(competitors) {
  const map = new Map();
  for (const c of competitors) for (const label of c.audiences) {
    const key = label.trim().toLowerCase();
    if (!map.has(key)) map.set(key, { key, label, competitors:[] });
    if (!map.get(key).competitors.some(x => x.id === c.id)) map.get(key).competitors.push(c);
  }
  return [...map.values()].sort((a,b) => b.competitors.length - a.competitors.length || a.label.localeCompare(b.label));
}
const string = (v, max=10000) => { if (v == null) return ''; if(typeof v !== 'string' || v.length > max) throw new Error('The backup contains invalid or oversized text.'); return v; };
export function validateBackup(input) {
  if (!input || ![1,2,3,4].includes(input.version) || !Array.isArray(input.projects) || (input.version === 1 && input.projects.length < 1) || input.projects.length > 20) throw new Error('Choose a valid CompetitorLens V1–V1.5 backup (up to 20 projects).');
  const seen = new Set();
  const projects = input.projects.map(p => {
    if (!p || !Array.isArray(p.competitors) || p.competitors.length > 5) throw new Error('Each project may contain up to 5 competitors.');
    const id = string(p.id,100); if (!id || seen.has(id)) throw new Error('Project IDs must be unique.'); seen.add(id);
    const competitors = [];
    for (const value of p.competitors) {
      if (!value || !Array.isArray(value.sources) || value.sources.length > 50) throw new Error('Each competitor may contain up to 50 sources.');
      const c = blankCompetitor();
      for (const key of ['id','name','url','positioning','products','pricing','currency','priceUnit','needs','motivations','interests','behavior','notes','advantages','updatedAt']) c[key] = string(value[key],key==='id'?100:10000);
      if (!c.id || competitors.some(x=>x.id===c.id)) throw new Error('Competitor IDs must be unique.');
      c.url = safeURL(c.url); c.demo = value.demo === true;
      for (const k of ['priceAmount','breadth','tier']) { c[k] = value[k] ?? ''; if (!['number','string'].includes(typeof c[k])) throw new Error('Invalid numeric field.'); }
      for(const k of ['features','audiences']) { if (!Array.isArray(value[k]) || value[k].length > 30) throw new Error('Invalid feature or audience list.'); c[k] = [...new Set(value[k].map(x=>string(x,200)))].filter(Boolean); }
      c.seriesIndex = Number.isInteger(value.seriesIndex) ? value.seriesIndex : -1;
      const segmentIds = new Set(), segmentLabels = new Set();
      if (value.audienceResearch != null && (!Array.isArray(value.audienceResearch) || value.audienceResearch.length > 100)) throw new Error('Invalid audience research records.');
      c.audienceResearch = (value.audienceResearch || []).map(a => {
        const id = string(a.id,100), label = string(a.label,200);
        if (!id || !label.trim() || segmentIds.has(id) || segmentLabels.has(segmentKey(label))) throw new Error('Audience research IDs and labels must be unique.');
        segmentIds.add(id); segmentLabels.add(segmentKey(label));
        return {id,label,...Object.fromEntries(['needs','motivations','interests','behavior'].map(k=>[k,string(a[k])]))};
      });
      c.priceNoteReview = value.priceNoteReview ? {signature:string(value.priceNoteReview.signature,40000),reason:string(value.priceNoteReview.reason,3000)} : null;
      const sourceIds = new Set();
      c.sources = value.sources.map(s => {
        if(!s || !Array.isArray(s.fields)) throw new Error('Invalid source mapping.');
        const sid = string(s.id,100); if(!sid || sourceIds.has(sid)) throw new Error('Source IDs must be unique.'); sourceIds.add(sid);
        const method = sourceMethod(s); if (!Object.hasOwn(SOURCE_METHODS,method)) throw new Error('Unknown source collection method.');
        const segmentMappings = (s.segmentMappings || []).map(m => { if (!segmentIds.has(m.segmentId) || !Array.isArray(m.fields) || m.fields.some(f=>!Object.hasOwn(FIELD_LABELS,f))) throw new Error('Invalid source audience mapping.'); return {segmentId:m.segmentId,fields:[...m.fields]}; });
        if (s.fields.some(f=>!Object.hasOwn(FIELD_LABELS,f))) throw new Error('Invalid source field mapping.');
        return { id:sid,title:string(s.title,300),url:safeURL(s.url),excerpt:string(s.excerpt,20000),kind:string(s.kind,100),method,collectedAt:string(s.collectedAt,100),fields:[...s.fields],segmentMappings };
      });
      c.researchFindings = validateFindings(value.researchFindings || [], c.sources);
      if(c.sources.some(isDemoSource)) c.demo=true;
      assertCompetitor(c,competitors); competitors.push(c);
    }
    const opportunityState = {};
    for(const [key,v] of Object.entries(p.opportunityState || {})) if (!['__proto__','constructor','prototype'].includes(key) && v && ['To explore','Investigating','Validated','Dismissed'].includes(v.status)) opportunityState[key] = {status:v.status,note:string(v.note,5000)};
    const opportunityHistory = validateHistory(p.opportunityHistory);
    const researchHistory = validateResearchHistory(p.researchHistory || [], safeURL, c=>validateBackup({version:4,activeId:'previous',projects:[{id:'previous',name:'Previous record',competitors:[c],opportunityState:{}}]}).projects[0].competitors[0]);
    const aiOpportunities=validateAIOpportunities(p.aiOpportunities||[],safeURL);
    return prepareProject({id,opportunityHistory,researchHistory,aiOpportunities,name:string(p.name,100)||'Untitled project',industry:string(p.industry,200),demo:p.demo===true||competitors.some(c=>c.demo),competitors,opportunityState,createdAt:string(p.createdAt,100),updatedAt:string(p.updatedAt,100)});
  });
  if(projects.length ? !projects.some(p=>p.id===input.activeId) : input.activeId !== '') throw new Error('The backup is missing its active project.');
  return {version:4,projects,activeId:input.activeId};
}

function validateHistory(history = []) {
  if (!Array.isArray(history) || history.length > 10000) throw new Error('Invalid opportunity history.');
  const ids = new Set();
  return history.map(o => {
    if (!o || !['current','stale','archived'].includes(o.lifecycle) || !['To explore','Investigating','Validated','Dismissed'].includes(o.status)) throw new Error('Invalid opportunity snapshot.');
    const item = Object.fromEntries(['id','ruleKey','fingerprint','createdAt','title','short','category','audience','reason','body','experiment','limitation','note'].map(k=>[k,string(o[k],k==='note'?5000:20000)]));
    for(const k of ['recommendation','comparison','engine','confidence'])if(o[k]!=null)item[k]=string(o[k],3000);
    if (!item.id || ids.has(item.id)) throw new Error('Opportunity history IDs must be unique.'); ids.add(item.id);
    if (!Number.isInteger(o.revision) || o.revision < 1) throw new Error('Invalid opportunity revision.');
    if (!Array.isArray(o.basis) || o.basis.length > 5) throw new Error('Invalid opportunity basis.');
    item.basis = o.basis.map(b => {
      if (!Array.isArray(b.sources) || b.sources.length > 50) throw new Error('Invalid historical evidence.');
      const sources = b.sources.map(s => {
        if (!Array.isArray(s.fields) || !Array.isArray(s.segmentMappings || [])) throw new Error('Invalid historical mapping.');
        return {id:string(s.id,100),title:string(s.title,300),url:safeURL(s.url),excerpt:string(s.excerpt,20000),kind:string(s.kind,100),method:sourceMethod(s),collectedAt:string(s.collectedAt,100),fields:s.fields.map(f=>string(f,100)),segmentMappings:(s.segmentMappings || []).map(m=>({segmentId:string(m.segmentId,100),fields:m.fields.map(f=>string(f,100))}))};
      });
      return {competitorId:string(b.competitorId,100),name:string(b.name,100),text:string(b.text,20000),sources};
    });
    return {...item,revision:o.revision,lifecycle:o.lifecycle,status:o.status,demo:o.demo===true};
  });
}
